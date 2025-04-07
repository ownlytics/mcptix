/**
 * Ticket Editor module for mcptix
 * Handles editing tickets in a modal dialog
 */

import { Storage } from './storage.js';
import { TicketRenderer } from './ticketRenderer.js';
import { Comments } from './comments.js';
import { ComplexityEngine } from './complexityEngine.js';

// DOM elements
let sidebarOverlay;
let sidebar;
let titleInput;
let descriptionInput;
let prioritySelect;
let statusSelect;
let closeButton;
let deleteButton;
let commentsContainer;
let commentForm;
let commentContent;
let commentType;
let addCommentButton;
let ticketIdDisplay;
let ticketCreatedDisplay;
let ticketUpdatedDisplay;
let saveStatusDisplay;
let saveStatusToast;
let commentCountDisplay;

// Current ticket being edited
let currentTicket = null;

// Auto-save timer
let autoSaveTimer = null;
let isSaving = false;

// Debounce timer for complexity inputs
let complexityDebounceTimer = null;

/**
 * Initialize the ticket editor
 */
function initialize() {
  // Get DOM elements
  sidebarOverlay = document.getElementById('ticket-editor-overlay');
  sidebar = document.getElementById('ticket-editor');
  titleInput = document.getElementById('ticket-title');
  descriptionInput = document.getElementById('ticket-description');
  prioritySelect = document.getElementById('ticket-priority');
  statusSelect = document.getElementById('ticket-status');
  closeButton = document.getElementById('close-sidebar');
  deleteButton = document.getElementById('delete-ticket');
  commentsContainer = document.getElementById('comments-container');
  commentForm = document.getElementById('comment-form');
  commentContent = document.getElementById('comment-content');
  commentType = document.getElementById('comment-type');
  addCommentButton = document.getElementById('add-comment');
  ticketIdDisplay = document.getElementById('ticket-id');
  ticketCreatedDisplay = document.getElementById('ticket-created');
  ticketUpdatedDisplay = document.getElementById('ticket-updated');
  saveStatusDisplay = document.getElementById('save-status');
  commentCountDisplay = document.getElementById('comment-count');

  // Get toast notification element
  saveStatusToast = document.getElementById('save-status-toast');

  // Set up event listeners
  setupEventListeners();

  // Initialize the complexity engine
  ComplexityEngine.initialize();
}

/**
 * Queue a complexity update with debouncing
 * This ensures we don't send too many requests when the user is actively changing values
 */
function queueComplexityUpdate() {
  // Clear any existing timer
  if (complexityDebounceTimer) {
    clearTimeout(complexityDebounceTimer);
  }

  // Update save status to "Calculating..."
  updateSaveStatus('Calculating...', true);

  // Set a new timer with a longer delay for complexity updates
  complexityDebounceTimer = setTimeout(() => {
    saveTicket()
      .then(updatedTicket => {
        if (updatedTicket && updatedTicket.complexity_metadata) {
          console.log('Complexity update complete. New score:', updatedTicket.complexity_metadata.cie_score);
          // Update the score display with the server-calculated score
          ComplexityEngine.updateScoreDisplay(updatedTicket.complexity_metadata.cie_score);
        } else {
          console.warn('No updated ticket or complexity metadata returned');
        }
      })
      .catch(error => {
        console.error('Error updating complexity:', error);
      });
  }, 1500); // 1.5 second debounce for complexity updates
}

/**
 * Set up event listeners for the ticket editor
 */
function setupEventListeners() {
  // Close button
  if (closeButton) {
    closeButton.addEventListener('click', closeEditor);
  }

  // Copy ticket ID button
  const copyTicketIdButton = document.getElementById('copy-ticket-id');
  if (copyTicketIdButton) {
    copyTicketIdButton.addEventListener('click', copyTicketIdToClipboard);
  }

  // Delete button
  if (deleteButton) {
    deleteButton.addEventListener('click', handleDeleteClick);
  }

  // Comment form submission
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }

  // Toggle complexity section
  const toggleComplexity = document.getElementById('toggle-complexity');
  const complexityDetails = document.getElementById('complexity-details');

  if (toggleComplexity && complexityDetails) {
    toggleComplexity.addEventListener('click', () => {
      complexityDetails.classList.toggle('collapsed');
      const icon = toggleComplexity.querySelector('.toggle-icon');
      icon.textContent = complexityDetails.classList.contains('collapsed') ? '▼' : '▲';
    });
  }

  // Toggle comments section
  const toggleComments = document.getElementById('toggle-comments');
  const commentsDetails = document.getElementById('comments-details');

  if (toggleComments && commentsDetails) {
    toggleComments.addEventListener('click', () => {
      commentsDetails.classList.toggle('collapsed');
      const icon = toggleComments.querySelector('.toggle-icon');
      icon.textContent = commentsDetails.classList.contains('collapsed') ? '▼' : '▲';
    });
  }

  // Close sidebar when clicking outside
  sidebarOverlay.addEventListener('click', event => {
    if (event.target === sidebarOverlay) {
      closeEditor();
    }
  });

  // Set up auto-save for form fields
  if (titleInput) {
    titleInput.addEventListener('input', queueAutoSave);
  }

  if (descriptionInput) {
    descriptionInput.addEventListener('input', queueAutoSave);
  }

  if (prioritySelect) {
    prioritySelect.addEventListener('change', queueAutoSave);
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', queueAutoSave);
  }

  // Set up debounced auto-save for complexity fields
  const complexityInputs = document.querySelectorAll('.complexity-input');
  complexityInputs.forEach(input => {
    input.addEventListener('input', queueComplexityUpdate);
    input.addEventListener('change', queueComplexityUpdate);
  });

  // Add keyboard shortcut for closing (Escape key)
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebarOverlay.style.display === 'block') {
      closeEditor();
    }
  });
}

/**
 * Open the ticket editor
 * @param {object|null} ticket - The ticket to edit, or null for a new ticket
 * @returns {Promise} A promise that resolves when the editor is opened
 */
function openEditor(ticket) {
  return new Promise(resolve => {
    currentTicket = ticket;

    // Reset auto-save state
    clearTimeout(autoSaveTimer);
    isSaving = false;
    updateSaveStatus('Saved');

    if (ticket) {
      // Editing an existing ticket
      // Title is now in the header
      titleInput.value = ticket.title || '';
      descriptionInput.value = ticket.description || '';
      prioritySelect.value = ticket.priority || 'medium';
      statusSelect.value = ticket.status || 'backlog';

      // Update ticket metadata displays
      ticketIdDisplay.textContent = ticket.id || 'New Ticket';
      ticketCreatedDisplay.textContent = `Created: ${formatDate(ticket.created)}`;
      ticketUpdatedDisplay.textContent = `Updated: ${formatDate(ticket.updated)}`;

      // Load complexity metadata if available
      console.log('Ticket complexity metadata:', ticket.complexity_metadata);
      ComplexityEngine.loadComplexityData(ticket.complexity_metadata || {});

      // Update the score display with the server-calculated score
      if (ticket.complexity_metadata && ticket.complexity_metadata.cie_score !== undefined) {
        ComplexityEngine.updateScoreDisplay(ticket.complexity_metadata.cie_score);
      }

      // Load comments
      Comments.loadComments(commentsContainer, ticket).then(() => {
        // Update comment count
        const commentCount = ticket.comments ? ticket.comments.length : 0;
        commentCountDisplay.textContent = `(${commentCount})`;
      });

      // Get the sidebar content element
      const sidebarContent = document.querySelector('.sidebar-content');
      if (!sidebarContent) {
        console.error('Sidebar content element not found');
        return;
      }

      // Check if agent context section already exists
      let agentContextSection = document.getElementById('agent-context-section');

      // If it doesn't exist, create it and add it to sidebar content before the danger zone
      if (!agentContextSection) {
        // Create the agent context section
        agentContextSection = document.createElement('section');
        agentContextSection.id = 'agent-context-section';
        agentContextSection.className = 'sidebar-section agent-workspace-section';

        // Create the section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'section-header';
        sectionHeader.innerHTML = `
          <h3>Agent's Workspace</h3>
          <button type="button" class="toggle-btn" id="toggle-agent-context">
            <span class="toggle-icon">▼</span>
          </button>
        `;

        // Create the content container
        const sectionContent = document.createElement('div');
        sectionContent.className = 'section-content collapsed'; // Collapsed by default
        sectionContent.id = 'agent-context-content';

        // Add the header and content container to the section
        agentContextSection.appendChild(sectionHeader);
        agentContextSection.appendChild(sectionContent);

        // Find the danger section
        const dangerSection = sidebarContent.querySelector('.danger-section');

        // Insert the agent context section before the danger section if it exists
        // otherwise append it to the end of the sidebar content
        if (dangerSection) {
          sidebarContent.insertBefore(agentContextSection, dangerSection);
        } else {
          sidebarContent.appendChild(agentContextSection);
        }

        // Set up toggle behavior
        const toggleBtn = document.getElementById('toggle-agent-context');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', event => {
            // Stop event propagation to prevent it from bubbling up
            event.stopPropagation();

            sectionContent.classList.toggle('collapsed');
            const icon = toggleBtn.querySelector('.toggle-icon');
            icon.textContent = sectionContent.classList.contains('collapsed') ? '▼' : '▲';
          });
        }
      }

      // Update the content with the markdown rendered agent context
      const contentContainer = document.getElementById('agent-context-content');
      if (contentContainer) {
        if (ticket.agent_context) {
          // Render the markdown with mermaid support
          renderMarkdownWithMermaid(ticket.agent_context).then(renderedHtml => {
            contentContainer.innerHTML = `
              <div class="agent-context-display markdown-content">
                <button type="button" class="expand-btn context-expand-btn" id="expand-agent-context" title="Expand to full screen">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6"></path>
                    <path d="M9 21H3v-6"></path>
                    <path d="M21 3l-7 7"></path>
                    <path d="M3 21l7-7"></path>
                  </svg>
                </button>
                ${renderedHtml}
              </div>
            `;

            // Add event listener for expand button
            const expandBtn = document.getElementById('expand-agent-context');
            if (expandBtn) {
              expandBtn.addEventListener('click', event => {
                // Stop event propagation to prevent bubbling
                event.stopPropagation();

                // Show the overlay
                showAgentContextOverlay();
              });
            }

            // Initialize syntax highlighting for code blocks
            document.querySelectorAll('.agent-context-display pre code:not(.language-mermaid)').forEach(block => {
              hljs.highlightElement(block);
            });

            // Render Mermaid diagrams now that they're in the DOM
            renderMermaidDiagrams(contentContainer);
          });
        } else {
          // Show a message when no agent context is available
          contentContainer.innerHTML = `
            <div class="agent-context-display empty-state">
              <p>No agent workspace content yet. This area will be populated when the AI agent analyzes this ticket.</p>
            </div>
          `;
        }
      }

      // Show delete button
      deleteButton.style.display = 'block';
    } else {
      // Creating a new ticket
      // Title is now in the header
      titleInput.value = '';
      descriptionInput.value = '';
      prioritySelect.value = 'medium';
      statusSelect.value = 'backlog';

      // Update ticket metadata displays
      ticketIdDisplay.textContent = 'New Ticket';
      ticketCreatedDisplay.textContent = 'Created: Just now';
      ticketUpdatedDisplay.textContent = '';
      commentCountDisplay.textContent = '(0)';

      // Reset complexity metadata
      ComplexityEngine.resetComplexityData();

      // Clear comments
      Comments.clearComments(commentsContainer);

      // Hide delete button
      deleteButton.style.display = 'none';
    }

    // Show the sidebar
    sidebarOverlay.style.display = 'block';

    // Trigger animation in the next frame
    requestAnimationFrame(() => {
      sidebarOverlay.classList.add('active');

      // Focus on the title input after animation
      setTimeout(() => {
        titleInput.focus();
        resolve();
      }, 300);
    });
  });
}

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return date.toLocaleDateString();
  } else if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Close the ticket editor
 */
function closeEditor() {
  // Save any pending changes before closing
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    saveTicket();
  }

  // Hide the sidebar with animation
  sidebarOverlay.classList.remove('active');

  // After animation completes, hide the overlay
  setTimeout(() => {
    sidebarOverlay.style.display = 'none';
    currentTicket = null;
  }, 300);
}
/**
 * Queue an auto-save operation
 */
function queueAutoSave() {
  // Clear any existing timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  // Update save status to "Saving..."
  updateSaveStatus('Saving...', true);

  // Set a new timer
  autoSaveTimer = setTimeout(() => {
    saveTicket();
  }, 1000); // 1 second debounce
}

/**
 * Update the save status display
 * @param {string} status - The status text to display
 * @param {boolean} saving - Whether the status is "saving" or "saved"
 */
function updateSaveStatus(status, saving = false) {
  if (saveStatusDisplay) {
    saveStatusDisplay.textContent = status;
    if (saving) {
      saveStatusDisplay.classList.add('saving');
    } else {
      saveStatusDisplay.classList.remove('saving');
    }
  }

  // Show toast notification
  if (saveStatusToast) {
    // Clear any existing hide timer
    if (saveStatusToast.hideTimer) {
      clearTimeout(saveStatusToast.hideTimer);
      saveStatusToast.hideTimer = null;
    }

    // Update toast content and show it
    saveStatusToast.classList.add('show');
    saveStatusToast.classList.remove('hide');

    // Set a timer to hide the toast after 2 seconds
    saveStatusToast.hideTimer = setTimeout(() => {
      saveStatusToast.classList.remove('show');
      saveStatusToast.classList.add('hide');
    }, 2000);
  }
}

/**
 * Copy the ticket ID to clipboard
 */
function copyTicketIdToClipboard() {
  const ticketId = document.getElementById('ticket-id').textContent;

  if (!ticketId || ticketId === 'New Ticket') {
    return;
  }

  // Create a temporary textarea element to copy from
  const textarea = document.createElement('textarea');
  textarea.value = ticketId;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);

  // Select and copy the text
  textarea.select();
  document.execCommand('copy');

  // Remove the temporary element
  document.body.removeChild(textarea);

  // Visual feedback
  const copyButton = document.getElementById('copy-ticket-id');
  copyButton.classList.add('copied');

  // Reset after a short delay
  setTimeout(() => {
    copyButton.classList.remove('copied');
  }, 2000);
}

/**
 * Save the current ticket
 * @returns {Promise} A promise that resolves when the ticket is saved
 */
function saveTicket() {
  // Don't save if already saving
  if (isSaving) {
    return Promise.resolve();
  }

  // Set saving flag
  isSaving = true;

  // Get form values
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const priority = prioritySelect.value;
  const status = statusSelect.value;

  // Validate form
  if (!title) {
    updateSaveStatus('Error: Title required', false);
    isSaving = false;
    return Promise.resolve();
  }

  // Get complexity metadata
  const complexityMetadata = ComplexityEngine.getComplexityData();

  // Create or update ticket
  if (currentTicket) {
    // Update existing ticket
    const updatedTicket = {
      ...currentTicket,
      title,
      description,
      priority,
      status,
      updated: new Date().toISOString(),
      complexity_metadata: complexityMetadata,
      // Preserve agent_context field if it exists
      agent_context: currentTicket.agent_context,
    };

    // Queue the update
    Storage.queueChange('update', updatedTicket);
  } else {
    // Create new ticket
    const newTicket = {
      id: 'ticket-' + Date.now(),
      title,
      description,
      priority,
      status,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      complexity_metadata: complexityMetadata,
      agent_context: null, // Initialize agent_context as null for new tickets
      comments: [],
    };

    // Queue the addition
    Storage.queueChange('add', newTicket);

    // Update current ticket
    currentTicket = newTicket;

    // Update ticket ID display
    if (ticketIdDisplay) {
      ticketIdDisplay.textContent = newTicket.id;
    }
  }

  // Apply changes and render tickets
  return Storage.applyChanges()
    .then(() => {
      // Get the updated ticket directly from the server to ensure we have the latest data
      return fetch(`/api/tickets/${currentTicket.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to get updated ticket');
          }
          return response.json();
        })
        .then(updatedTicket => {
          // Update the current ticket with the server data
          currentTicket = updatedTicket;

          // Update the score display with the server-calculated score
          if (updatedTicket && updatedTicket.complexity_metadata) {
            console.log('Updating score display with server value:', updatedTicket.complexity_metadata.cie_score);
            ComplexityEngine.updateScoreDisplay(updatedTicket.complexity_metadata.cie_score);
          }

          return TicketRenderer.renderTickets();
        });
    })
    .then(() => {
      // Update save status
      updateSaveStatus('Saved', false);

      // Update ticket updated timestamp
      if (ticketUpdatedDisplay) {
        ticketUpdatedDisplay.textContent = `Updated: Just now`;
      }

      // Clear saving flag
      isSaving = false;

      // Return the updated ticket for further processing
      return currentTicket;
    })
    .catch(error => {
      console.error('Error saving ticket:', error);
      updateSaveStatus('Error saving', false);
      isSaving = false;
      return null;
    });
}

/**
 * Handle delete button click
 */
function handleDeleteClick() {
  if (!currentTicket) {
    return;
  }

  // Confirm deletion
  if (!confirm('Are you sure you want to delete this ticket?')) {
    return;
  }

  // Queue the deletion
  Storage.queueChange('delete', currentTicket);

  // Apply changes and render tickets
  Storage.applyChanges()
    .then(() => TicketRenderer.renderTickets())
    .then(() => {
      // Close the editor
      closeEditor();
    })
    .catch(error => {
      console.error('Error deleting ticket:', error);
      alert('Error deleting ticket');
    });
}

/**
 * Handle comment form submission
 * @param {Event} event - The form submission event
 */
function handleCommentSubmit(event) {
  event.preventDefault();

  if (!currentTicket) {
    return;
  }

  // Get form values
  const content = commentContent.value.trim();
  const type = commentType.value;

  // Validate form
  if (!content) {
    alert('Please enter a comment');
    commentContent.focus();
    return;
  }

  // Add the comment
  Comments.addComment(currentTicket.id, content, type)
    .then(() => {
      // Clear the form
      commentContent.value = '';

      // Reload comments
      return Comments.loadComments(commentsContainer, currentTicket);
    })
    .then(() => {
      // Update comment count
      const commentCount = currentTicket.comments ? currentTicket.comments.length : 0;
      commentCountDisplay.textContent = `(${commentCount})`;
    })
    .catch(error => {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    });
}
/**
 * Create the agent context overlay
 * @returns {HTMLElement} The overlay element
 */
function createAgentContextOverlay() {
  // Check if overlay already exists
  if (document.getElementById('agent-context-overlay')) {
    return document.getElementById('agent-context-overlay');
  }

  const overlay = document.createElement('div');
  overlay.id = 'agent-context-overlay';
  overlay.className = 'agent-context-overlay';

  overlay.innerHTML = `
    <div class="agent-context-overlay-content">
      <div class="overlay-header">
        <h2>Agent's Workspace</h2>
        <button type="button" id="collapse-agent-context" class="collapse-btn" title="Return to normal view">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14h6v6"></path>
            <path d="M20 10h-6V4"></path>
            <path d="M14 10l7-7"></path>
            <path d="M3 21l7-7"></path>
          </svg>
        </button>
      </div>
      <div id="agent-context-overlay-content" class="markdown-content agent-context-fullscreen">
        <!-- Content will be inserted here -->
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add event listener for collapse button
  const collapseButton = document.getElementById('collapse-agent-context');
  collapseButton.addEventListener('click', hideAgentContextOverlay);

  // Add event listener to close on Escape key
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('active')) {
      hideAgentContextOverlay();
    }
  });

  // Add event listener to close when clicking outside the content
  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      hideAgentContextOverlay();
    }
  });

  return overlay;
}

/**
 * Render markdown content with Mermaid diagram support
 * @param {string} content - The markdown content to render
 * @returns {Promise<string>} A promise that resolves to the rendered HTML
 */
function renderMarkdownWithMermaid(content) {
  return new Promise(resolve => {
    console.log('Rendering markdown with Mermaid support');

    // First pass: render markdown with marked
    const html = marked.parse(content);

    // Create a temporary div to hold the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all pre>code elements with language 'mermaid'
    const mermaidBlocks = tempDiv.querySelectorAll('pre code.language-mermaid');
    console.log(`Found ${mermaidBlocks.length} mermaid blocks`);

    // If no mermaid diagrams, return the HTML as is
    if (mermaidBlocks.length === 0) {
      resolve(html);
      return;
    }

    // Process each mermaid block
    mermaidBlocks.forEach((block, index) => {
      const mermaidCode = block.textContent;
      console.log(`Mermaid code ${index}:`, mermaidCode);

      // Replace the <pre><code> with a div for mermaid
      const preElement = block.parentElement;
      const mermaidContainer = document.createElement('div');
      mermaidContainer.className = 'mermaid-container';

      // Create a simple mermaid div that will be processed automatically
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = mermaidCode;

      mermaidContainer.appendChild(mermaidDiv);

      // Replace in the DOM
      preElement.parentElement.replaceChild(mermaidContainer, preElement);
    });

    // Return the modified HTML - mermaid will process these divs
    resolve(tempDiv.innerHTML);
  });
}

/**
 * Show the agent context overlay with content
 */
function showAgentContextOverlay() {
  // Create the overlay if it doesn't exist
  const overlay = createAgentContextOverlay();

  // Get content from the current ticket
  const content = currentTicket.agent_context || '';

  // Render the markdown with mermaid support
  const contentContainer = document.getElementById('agent-context-overlay-content');
  renderMarkdownWithMermaid(content).then(renderedHtml => {
    contentContainer.innerHTML = renderedHtml;

    // Initialize syntax highlighting for code blocks
    document.querySelectorAll('#agent-context-overlay-content pre code:not(.language-mermaid)').forEach(block => {
      hljs.highlightElement(block);
    });

    // Render Mermaid diagrams now that they're in the DOM
    renderMermaidDiagrams(contentContainer);
  });

  // Show the overlay with animation
  overlay.style.display = 'block';

  // Trigger animation in the next frame
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });
}

/**
 * Hide the agent context overlay
 */
function hideAgentContextOverlay() {
  const overlay = document.getElementById('agent-context-overlay');

  if (!overlay) return;

  // Remove active class to trigger animation
  overlay.classList.remove('active');

  // Hide overlay after animation completes
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 300); // Match the CSS transition duration
}

/**
 * Render any Mermaid diagrams in the container
 * @param {HTMLElement} container - The container element that contains mermaid diagrams
 */
function renderMermaidDiagrams(container) {
  console.log('Running renderMermaidDiagrams');

  try {
    // Find all mermaid diagrams
    const diagrams = container.querySelectorAll('.mermaid');
    console.log(`Found ${diagrams.length} mermaid diagrams to render`);

    if (diagrams.length === 0) return;

    // Give unique IDs to any diagrams without IDs
    diagrams.forEach((diagram, index) => {
      if (!diagram.id) {
        diagram.id = `mermaid-auto-${Date.now()}-${index}`;
      }

      // Skip if already rendered
      if (diagram.querySelector('svg')) {
        console.log(`Diagram ${diagram.id} already rendered, skipping`);
        return;
      }

      console.log(`Preparing to render diagram ${diagram.id}`);
    });

    // This will tell mermaid to process all diagrams in the container
    setTimeout(() => {
      console.log('Calling mermaid.run');
      mermaid
        .run({
          querySelector: '.mermaid',
          nodes: diagrams,
        })
        .catch(error => {
          console.error('Error running mermaid:', error);
        });
    }, 200); // Small delay to ensure DOM is ready
  } catch (error) {
    console.error('Error initializing mermaid diagrams:', error);
  }
}

// Export the module functions
export const TicketEditor = {
  initialize,
  openEditor,
  closeEditor,
};

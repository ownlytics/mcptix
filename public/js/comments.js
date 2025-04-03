/**
 * Comments module for the Epic Tracker
 * Handles rendering and managing comments on tickets
 */

import { Storage } from './storage.js';

// Comment types
const COMMENT_TYPES = {
  COMMENT: 'comment',
  REQUEST_CHANGES: 'request_changes',
  CHANGE_PROPOSAL: 'change_proposal'
};

// Comment statuses
const COMMENT_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  WONT_FIX: 'wont_fix'
};

// Comment authors
const COMMENT_AUTHORS = {
  DEVELOPER: 'developer',
  AGENT: 'agent'
};

/**
 * Load comments for a ticket
 * @param {HTMLElement} container - The container to render comments in
 * @param {object} ticket - The ticket to load comments for
 * @returns {Promise} A promise that resolves when comments are loaded
 */
function loadComments(container, ticket) {
  if (!container || !ticket) {
    return Promise.resolve();
  }
  
  // Clear the container
  container.innerHTML = '<div class="comments-loading">Loading comments...</div>';
  
  // Get comments from the API
  return Storage.getComments(ticket.id)
    .then(comments => {
      // Clear the container
      container.innerHTML = '';
      
      // Check if ticket has comments
      if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="comments-empty">No comments yet</div>';
        return;
      }
      
      // Sort comments by timestamp (oldest first)
      const sortedComments = [...comments].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      
      // Render each comment
      sortedComments.forEach(comment => {
        renderComment(container, comment);
      });
    })
    .catch(error => {
      console.error('Error loading comments:', error);
      container.innerHTML = '<div class="comments-error">Error loading comments</div>';
    });
}

/**
 * Clear comments from a container
 * @param {HTMLElement} container - The container to clear comments from
 */
function clearComments(container) {
  if (container) {
    container.innerHTML = '<div class="comments-empty">No comments yet</div>';
  }
}

/**
 * Render a single comment
 * @param {HTMLElement} container - The container to render the comment in
 * @param {object} comment - The comment to render
 */
function renderComment(container, comment) {
  // Create comment element
  const commentElement = document.createElement('div');
  commentElement.className = `comment comment-type-${comment.type} comment-author-${comment.author} comment-status-${comment.status}`;
  commentElement.dataset.id = comment.id;
  
  // Format timestamp
  const timestamp = new Date(comment.timestamp).toLocaleString();
  
  // Get comment type label
  let typeLabel = 'Comment';
  if (comment.type === COMMENT_TYPES.REQUEST_CHANGES) {
    typeLabel = 'Request Changes';
  } else if (comment.type === COMMENT_TYPES.CHANGE_PROPOSAL) {
    typeLabel = 'Change Proposal';
  }
  
  // Get comment status label
  let statusLabel = 'Open';
  
  if (comment.status === COMMENT_STATUSES.IN_PROGRESS) {
    statusLabel = 'In Progress';
  } else if (comment.status === COMMENT_STATUSES.RESOLVED) {
    statusLabel = 'Resolved';
  } else if (comment.status === COMMENT_STATUSES.WONT_FIX) {
    statusLabel = 'Won\'t Fix';
  }
  
  // Get author label
  const authorLabel = comment.author === COMMENT_AUTHORS.DEVELOPER ? 'Developer' : 'Agent';
  
  // Create comment header
  const headerHTML = `
    <div class="comment-header">
      <span class="comment-author-badge">${authorLabel}</span>
      <span class="comment-type-badge">${typeLabel}</span>
      <span class="comment-status-badge">${statusLabel}</span>
      <span class="comment-timestamp">${timestamp}</span>
    </div>
  `;
  
  // Create comment content based on author
  let contentHTML = '';
  
  if (comment.author === COMMENT_AUTHORS.DEVELOPER) {
    // Developer comment
    contentHTML = `<div class="comment-content">${comment.content || ''}</div>`;
  } else if (comment.author === COMMENT_AUTHORS.AGENT) {
    // Agent comment with markdown support
    const displayClass = comment.display === 'expanded' ? '' : 'collapsed';
    contentHTML = `
      <div class="comment-summary">${comment.summary || ''}</div>
      <div class="comment-full-text ${displayClass}">
        <div class="markdown-content"></div>
      </div>
      <button type="button" class="toggle-full-text-btn">
        ${comment.display === 'expanded' ? 'Show Less' : 'Show More'}
      </button>
    `;
  }
  
  // Create comment actions
  let actionsHTML = '';
  
  if (comment.status === COMMENT_STATUSES.OPEN) {
    actionsHTML = `
      <div class="comment-actions">
        <button type="button" class="status-btn in-progress-btn" data-status="${COMMENT_STATUSES.IN_PROGRESS}">Mark In Progress</button>
        <button type="button" class="status-btn resolve-btn" data-status="${COMMENT_STATUSES.RESOLVED}">Resolve</button>
        <button type="button" class="status-btn wont-fix-btn" data-status="${COMMENT_STATUSES.WONT_FIX}">Won't Fix</button>
      </div>
    `;
  } else if (comment.status === COMMENT_STATUSES.IN_PROGRESS) {
    actionsHTML = `
      <div class="comment-actions">
        <button type="button" class="status-btn resolve-btn" data-status="${COMMENT_STATUSES.RESOLVED}">Resolve</button>
        <button type="button" class="status-btn wont-fix-btn" data-status="${COMMENT_STATUSES.WONT_FIX}">Won't Fix</button>
      </div>
    `;
  }
  
  // Set comment HTML
  commentElement.innerHTML = headerHTML + contentHTML + actionsHTML;
  
  // Add to container
  container.appendChild(commentElement);
  
  // Render markdown for agent comments
  if (comment.author === COMMENT_AUTHORS.AGENT && comment.fullText) {
    const markdownContainer = commentElement.querySelector('.markdown-content');
    if (markdownContainer && typeof marked !== 'undefined') {
      try {
        markdownContainer.innerHTML = marked.parse(comment.fullText);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        markdownContainer.innerHTML = comment.fullText;
      }
    }
    
    // Add toggle button event listener
    const toggleButton = commentElement.querySelector('.toggle-full-text-btn');
    const fullTextContainer = commentElement.querySelector('.comment-full-text');
    
    if (toggleButton && fullTextContainer) {
      toggleButton.addEventListener('click', () => {
        const isCollapsed = fullTextContainer.classList.contains('collapsed');
        fullTextContainer.classList.toggle('collapsed');
        toggleButton.textContent = isCollapsed ? 'Show Less' : 'Show More';
        
        // Update comment display state
        updateCommentDisplay(comment.id, isCollapsed ? 'expanded' : 'collapsed');
      });
    }
  }
  
  // Add status button event listeners
  commentElement.querySelectorAll('.status-btn').forEach(button => {
    button.addEventListener('click', () => {
      const status = button.dataset.status;
      updateCommentStatus(comment.id, comment.ticket_id, status);
    });
  });
}

/**
 * Add a comment to a ticket
 * @param {string} ticketId - The ID of the ticket to add the comment to
 * @param {string} content - The content of the comment
 * @param {string} type - The type of comment
 * @returns {Promise} A promise that resolves when the comment is added
 */
function addComment(ticketId, content, type) {
  // Create the comment object
  const comment = {
    content,
    type: type || COMMENT_TYPES.COMMENT,
    author: COMMENT_AUTHORS.DEVELOPER,
    status: COMMENT_STATUSES.OPEN
  };
  
  // Add the comment using the Storage API
  return Storage.addComment(ticketId, comment);
}

/**
 * Update a comment's status
 * @param {string} commentId - The ID of the comment to update
 * @param {string} ticketId - The ID of the ticket the comment belongs to
 * @param {string} status - The new status
 */
function updateCommentStatus(commentId, ticketId, status) {
  // Get the ticket
  return Storage.getTicketById(ticketId)
    .then(ticket => {
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      // Find the comment
      const comment = ticket.comments?.find(c => c.id === commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }
      
      // Update the comment status
      comment.status = status;
      
      // Update the ticket
      return Storage.updateTicketOnServer(ticket);
    })
    .then(() => {
      // Reload comments
      const commentsContainer = document.getElementById('comments-container');
      const currentTicket = Storage.getTicketById(ticketId);
      return loadComments(commentsContainer, currentTicket);
    })
    .catch(error => {
      console.error('Error updating comment status:', error);
    });
}

/**
 * Update a comment's display state
 * @param {string} commentId - The ID of the comment to update
 * @param {string} display - The new display state ('expanded' or 'collapsed')
 */
function updateCommentDisplay(commentId, display) {
  // This is a client-side only change, no need to update the server
  // In a real application, you might want to persist this preference
  console.log(`Comment ${commentId} display set to ${display}`);
}

// Export the module functions and constants
export const Comments = {
  loadComments,
  clearComments,
  addComment,
  updateCommentStatus,
  updateCommentDisplay,
  COMMENT_TYPES,
  COMMENT_STATUSES,
  COMMENT_AUTHORS
};
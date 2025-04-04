/**
 * Ticket Renderer module for mcptix
 * Handles rendering tickets in the UI and drag-and-drop functionality
 */

import { Storage } from './storage.js';

// Cache for ticket data
let ticketsCache = null;

/**
 * Render all tickets in the board
 * @returns {Promise} A promise that resolves when the tickets are rendered
 */
function renderTickets() {
  // Show loading state
  document.querySelectorAll('.ticket-container').forEach(container => {
    container.innerHTML = '<div class="loading">Loading tickets...</div>';
  });

  // Load tickets from storage
  return Storage.loadTickets()
    .then(tickets => {
      ticketsCache = tickets;

      // Clear all ticket containers
      document.querySelectorAll('.ticket-container').forEach(container => {
        container.innerHTML = '';
      });

      // Render tickets for each column
      tickets.columns.forEach(column => {
        const container = document.querySelector(`#${column.id} .ticket-container`);
        if (!container) return;

        if (column.tickets.length === 0) {
          container.innerHTML = '<div class="empty-column">No tickets</div>';
          return;
        }

        column.tickets.forEach(ticket => {
          const ticketElement = createTicketElement(ticket);
          container.appendChild(ticketElement);
        });
      });

      // Set up drag and drop
      setupDragAndDrop();

      return tickets;
    })
    .catch(error => {
      console.error('Error rendering tickets:', error);

      // Show error state
      document.querySelectorAll('.ticket-container').forEach(container => {
        container.innerHTML = '<div class="error">Error loading tickets</div>';
      });
    });
}

/**
 * Create a ticket element
 * @param {Object} ticket - The ticket data
 * @returns {HTMLElement} The ticket element
 */
function createTicketElement(ticket) {
  const ticketElement = document.createElement('div');
  ticketElement.classList.add('ticket');
  ticketElement.setAttribute('data-id', ticket.id);
  ticketElement.setAttribute('draggable', 'true');

  // Add priority class if present
  if (ticket.priority) {
    ticketElement.classList.add(`priority-${ticket.priority}`);
  }

  // Create ticket content
  const titleElement = document.createElement('div');
  titleElement.classList.add('ticket-title');

  // Add CIE score badge if present
  if (ticket.complexity_metadata && ticket.complexity_metadata.cie_score !== undefined) {
    const scoreElement = document.createElement('div');
    scoreElement.classList.add('ticket-cie-score');

    // Set score class based on value
    if (ticket.complexity_metadata.cie_score >= 75) {
      scoreElement.classList.add('high');
    } else if (ticket.complexity_metadata.cie_score >= 50) {
      scoreElement.classList.add('medium');
    } else {
      scoreElement.classList.add('low');
    }

    scoreElement.textContent = `${ticket.complexity_metadata.cie_score.toFixed(1)}`;
    titleElement.appendChild(scoreElement);
  }

  // Add title text
  const titleText = document.createTextNode(ticket.title);
  titleElement.appendChild(titleText);

  const descriptionElement = document.createElement('div');
  descriptionElement.classList.add('ticket-description');
  descriptionElement.textContent = ticket.description;

  // Add elements to ticket
  ticketElement.appendChild(titleElement);
  ticketElement.appendChild(descriptionElement);

  // Add click event listener
  ticketElement.addEventListener('click', () => {
    openTicketEditor(ticket);
  });

  return ticketElement;
}

/**
 * Set up drag and drop functionality
 */
function setupDragAndDrop() {
  // Add drag start event to tickets
  document.querySelectorAll('.ticket').forEach(ticket => {
    ticket.addEventListener('dragstart', e => {
      // Store the ticket ID for drop handling
      e.dataTransfer.setData('text/plain', ticket.getAttribute('data-id'));

      // Hide the original ticket while dragging
      setTimeout(() => {
        ticket.style.visibility = 'hidden';
      }, 0);

      // Set a custom drag image with rotation
      if (e.dataTransfer.setDragImage) {
        // Create a clone of the ticket for the drag image
        const clone = ticket.cloneNode(true);

        // Get the computed style of the original ticket
        const computedStyle = window.getComputedStyle(ticket);
        const ticketWidth = computedStyle.getPropertyValue('width');

        // Apply the exact same width and other necessary styles
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        clone.style.width = ticketWidth; // Set the exact same width
        clone.style.maxWidth = ticketWidth; // Ensure it doesn't expand
        clone.style.boxSizing = 'border-box'; // Maintain the box model
        clone.style.transform = 'rotate(-5deg)'; // Rotate slightly to the left
        clone.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)'; // Enhanced shadow
        clone.classList.add('drag-ghost'); // Add the drag-ghost class for additional styling

        document.body.appendChild(clone);

        // Set the clone as the drag image
        e.dataTransfer.setDragImage(clone, e.offsetX, e.offsetY);

        // Remove the clone after a short delay
        setTimeout(() => {
          document.body.removeChild(clone);
        }, 0);
      }
    });

    // Add dragend event to show the ticket again when dragging ends
    ticket.addEventListener('dragend', () => {
      ticket.style.visibility = 'visible';
    });
  });

  // Add drop events to columns
  document.querySelectorAll('.ticket-container').forEach(container => {
    // Add visual feedback when dragging over a container
    container.addEventListener('dragenter', e => {
      e.preventDefault();
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', e => {
      e.preventDefault();
      container.classList.remove('drag-over');
    });

    // Allow dropping
    container.addEventListener('dragover', e => {
      e.preventDefault();
    });

    // Handle drop
    container.addEventListener('drop', e => {
      e.preventDefault();
      container.classList.remove('drag-over');

      const ticketId = e.dataTransfer.getData('text/plain');
      const newStatus = container.parentElement.id;

      moveTicket(ticketId, newStatus);
    });
  });
}

/**
 * Move a ticket to a new column
 * @param {string} ticketId - The ID of the ticket to move
 * @param {string} newStatus - The new status (column) for the ticket
 * @returns {Promise} A promise that resolves when the ticket is moved
 */
function moveTicket(ticketId, newStatus) {
  // Find the ticket in the cache
  let ticketToMove = null;

  for (const column of ticketsCache.columns) {
    const ticket = column.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticketToMove = { ...ticket };
      break;
    }
  }

  if (!ticketToMove) return Promise.resolve();

  // Update the ticket status
  ticketToMove.status = newStatus;

  // Queue the change
  Storage.queueChange('move', ticketToMove);

  // Apply the changes and re-render
  return Storage.applyChanges().then(() => renderTickets());
}

/**
 * Open the ticket editor for a ticket
 * @param {Object} ticket - The ticket to edit
 */
function openTicketEditor(ticket) {
  // Dispatch a custom event that the app.js can listen for
  const event = new CustomEvent('openTicketEditor', { detail: ticket });
  document.dispatchEvent(event);
}

/**
 * Get a ticket by ID
 * @param {string} ticketId - The ID of the ticket to get
 * @returns {Object|null} The ticket or null if not found
 */
function getTicketById(ticketId) {
  if (!ticketsCache) return null;

  for (const column of ticketsCache.columns) {
    const ticket = column.tickets.find(t => t.id === ticketId);
    if (ticket) {
      return ticket;
    }
  }

  return null;
}

// Export the module functions
export const TicketRenderer = {
  renderTickets,
  createTicketElement,
  setupDragAndDrop,
  moveTicket,
  openTicketEditor,
  getTicketById,
};

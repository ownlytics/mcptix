/**
 * Ticket Renderer module for mcptix
 * Handles rendering tickets in the UI and drag-and-drop functionality
 */

import { Storage } from './storage.js';

// Cache for ticket data
let ticketsCache = null;

// Reference to the currently dragged ticket and its original container
let draggedTicket = null;
let draggedTicketOriginalContainer = null;

// Reference to the drop indicator element
let dropIndicator = null;

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

        // Sort tickets by order_value (higher values at the top)
        const sortedTickets = [...column.tickets].sort((a, b) => {
          const orderA = a.order_value !== undefined ? a.order_value : 0;
          const orderB = b.order_value !== undefined ? b.order_value : 0;
          return orderB - orderA;
        });

        sortedTickets.forEach(ticket => {
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

      // Store reference to dragged ticket and its container
      draggedTicket = ticket;
      draggedTicketOriginalContainer = ticket.closest('.ticket-container');

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
      hideDropIndicator();
      draggedTicket = null;
      draggedTicketOriginalContainer = null;
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

    // Handle dragover for showing drop position indicator
    container.addEventListener('dragover', e => {
      e.preventDefault();

      if (!draggedTicket) return;

      // Find where the ticket would be inserted
      const insertionData = findInsertionPoint(container, e);

      // Position the drop indicator
      positionDropIndicator(insertionData, container);
    });

    // Handle drop
    container.addEventListener('drop', e => {
      e.preventDefault();
      container.classList.remove('drag-over');
      hideDropIndicator();

      if (!draggedTicket) return;

      const ticketId = e.dataTransfer.getData('text/plain');
      const newStatus = container.parentElement.id;
      const currentStatus = draggedTicketOriginalContainer.parentElement.id;

      if (newStatus !== currentStatus) {
        // Moving to a different column (status change)
        moveTicket(ticketId, newStatus);
      } else {
        // Reordering within the same column
        const insertionData = findInsertionPoint(container, e);
        const newOrderValue = calculateNewOrderValue(ticketId, insertionData, container);
        reorderTicket(ticketId, newOrderValue);
      }
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

/**
 * Create the drop indicator element
 * @returns {HTMLElement} The drop indicator element
 */
function createDropIndicator() {
  const indicator = document.createElement('div');
  indicator.classList.add('drop-indicator');
  indicator.style.height = '4px';
  indicator.style.backgroundColor = 'var(--primary-color)';
  indicator.style.borderRadius = '2px';
  indicator.style.margin = '0';
  indicator.style.transition = 'all 0.2s ease';
  indicator.style.boxShadow = '0 0 5px rgba(52, 152, 219, 0.5)';
  indicator.style.display = 'none';
  document.body.appendChild(indicator);
  return indicator;
}

/**
 * Find the insertion point within a container
 * @param {HTMLElement} container - The container element
 * @param {MouseEvent} e - The mouse event
 * @returns {Object} The insertion data { element: HTMLElement, position: 'before'|'after' }
 */
function findInsertionPoint(container, e) {
  const mouseY = e.clientY;
  const tickets = Array.from(container.querySelectorAll('.ticket'));

  // If container is empty, return null
  if (tickets.length === 0) {
    return { element: null, position: 'after' };
  }

  // Find the closest ticket to the mouse position
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];

    // Skip the dragged ticket
    if (draggedTicket && ticket.getAttribute('data-id') === draggedTicket.getAttribute('data-id')) {
      continue;
    }

    const rect = ticket.getBoundingClientRect();
    const ticketMiddle = rect.top + rect.height / 2;

    // If mouse is above the middle of this ticket, insert before it
    if (mouseY < ticketMiddle) {
      return { element: ticket, position: 'before' };
    }

    // If this is the last ticket and mouse is below it, insert after it
    if (i === tickets.length - 1) {
      return { element: ticket, position: 'after' };
    }
  }

  // Default to the end of the container
  return { element: tickets[tickets.length - 1], position: 'after' };
}

/**
 * Position the drop indicator
 * @param {Object} insertionData - Data from findInsertionPoint
 * @param {HTMLElement} container - The container element
 */
function positionDropIndicator(insertionData, container) {
  if (!dropIndicator) {
    dropIndicator = createDropIndicator();
  }

  // Show the indicator
  dropIndicator.style.display = 'block';

  if (insertionData.element === null) {
    // Position at the top of an empty container
    const rect = container.getBoundingClientRect();
    dropIndicator.style.width = `${rect.width - 32}px`; // Accounting for padding
    dropIndicator.style.left = `${rect.left + 16}px`; // Accounting for padding
    dropIndicator.style.top = `${rect.top + 16}px`; // Accounting for padding
    return;
  }

  const rect = insertionData.element.getBoundingClientRect();
  dropIndicator.style.width = `${rect.width}px`;
  dropIndicator.style.left = `${rect.left}px`;

  if (insertionData.position === 'before') {
    dropIndicator.style.top = `${rect.top - 2}px`;
  } else {
    dropIndicator.style.top = `${rect.bottom + 2}px`;
  }
}

/**
 * Hide the drop indicator
 */
function hideDropIndicator() {
  if (dropIndicator) {
    dropIndicator.style.display = 'none';
  }
}

/**
 * Calculate the new order value for a ticket
 * @param {string} ticketId - The ID of the ticket being moved
 * @param {Object} insertionData - Data from findInsertionPoint
 * @param {HTMLElement} container - The container element
 * @returns {number} The new order value
 */
function calculateNewOrderValue(ticketId, insertionData, container) {
  const columnId = container.parentElement.id;
  const column = ticketsCache.columns.find(col => col.id === columnId);

  if (!column || column.tickets.length === 0) {
    return 1000; // Default for empty column
  }

  // Sort tickets by order_value (descending)
  const sortedTickets = [...column.tickets].sort((a, b) => (b.order_value || 0) - (a.order_value || 0));

  // If there's no insertion point (empty container)
  if (insertionData.element === null) {
    // Use a value higher than the highest current value
    const highestValue = sortedTickets[0]?.order_value || 0;
    return highestValue + 1000;
  }

  // Get the reference ticket
  const refTicketId = insertionData.element.getAttribute('data-id');
  const refTicketIndex = sortedTickets.findIndex(t => t.id === refTicketId);

  if (refTicketIndex === -1) {
    // Fallback if reference ticket not found
    return sortedTickets[0]?.order_value + 1000 || 1000;
  }

  if (insertionData.position === 'before') {
    // Insert before the reference ticket
    const refTicket = sortedTickets[refTicketIndex];
    const nextTicket = sortedTickets[refTicketIndex - 1]; // The ticket above (higher order value)

    if (!nextTicket) {
      // If inserting at the top
      return (refTicket.order_value || 0) + 1000;
    }

    // Insert between refTicket and nextTicket
    return ((refTicket.order_value || 0) + (nextTicket.order_value || 0)) / 2;
  } else {
    // Insert after the reference ticket
    const refTicket = sortedTickets[refTicketIndex];
    const prevTicket = sortedTickets[refTicketIndex + 1]; // The ticket below (lower order value)

    if (!prevTicket) {
      // If inserting at the bottom
      return Math.max((refTicket.order_value || 0) - 1000, 1);
    }

    // Insert between refTicket and prevTicket
    return ((refTicket.order_value || 0) + (prevTicket.order_value || 0)) / 2;
  }
}

/**
 * Reorder a ticket within its column
 * @param {string} ticketId - The ID of the ticket to reorder
 * @param {number} newOrderValue - The new order value for the ticket
 * @returns {Promise} A promise that resolves when the ticket is reordered
 */
function reorderTicket(ticketId, newOrderValue) {
  return Storage.reorderTicket(ticketId, newOrderValue).then(() => renderTickets());
}

// Export the module functions
export const TicketRenderer = {
  renderTickets,
  createTicketElement,
  setupDragAndDrop,
  moveTicket,
  reorderTicket,
  openTicketEditor,
  getTicketById,
};

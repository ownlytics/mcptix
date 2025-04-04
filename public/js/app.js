/**
 * Main application module for mcptix
 * Initializes the application and handles the overall flow
 */

import { Storage } from './storage.js';
import { TicketRenderer } from './ticketRenderer.js';
import { TicketEditor } from './ticketEditor.js';
import { TicketCreator } from './ticketCreator.js';

/**
 * Initialize the application
 * @returns {Promise} A promise that resolves when the application is initialized
 */
function initialize() {
  // Initialize the ticket editor and creator
  TicketEditor.initialize();
  TicketCreator.initialize();

  // Show loading state
  document.querySelectorAll('.ticket-container').forEach(container => {
    container.innerHTML = '<div class="loading">Loading tickets...</div>';
  });

  // Set up event listeners
  setupEventListeners();

  // Render the initial tickets
  return TicketRenderer.renderTickets().catch(error => {
    console.error('Error initializing application:', error);
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // New ticket button - use the new TicketCreator for new tickets
  const newTicketBtn = document.getElementById('new-ticket-btn');
  if (newTicketBtn) {
    newTicketBtn.addEventListener('click', () => {
      TicketCreator.openCreator();
    });
  }

  // Listen for openTicketEditor events from the ticket renderer
  document.addEventListener('openTicketEditor', e => {
    TicketEditor.openEditor(e.detail);
  });
}

/**
 * Load initial tickets
 * This function populates the board with tickets if none exist
 * @returns {Promise} A promise that resolves when the initial tickets are loaded
 */
function loadInitialTickets() {
  // Show loading state
  document.querySelectorAll('.ticket-container').forEach(container => {
    container.innerHTML = '<div class="loading">Loading tickets...</div>';
  });

  // Check if we already have tickets
  return Storage.loadTickets()
    .then(existingTickets => {
      if (existingTickets.columns.some(col => col.tickets.length > 0)) {
        // We already have tickets, no need to load initial ones
        console.log('Using existing tickets');
        return TicketRenderer.renderTickets();
      }

      console.log('Loading initial tickets');

      // Create empty board - no initial tickets
      // If you want to add example tickets, you can do so here
      const tickets = [];

      // Add each ticket to the board if there are any
      tickets.forEach(ticket => {
        Storage.queueChange('add', ticket);
      });

      // Apply changes and render tickets
      return Storage.applyChanges().then(() => TicketRenderer.renderTickets());
    })
    .catch(error => {
      console.error('Error loading initial tickets:', error);

      // Show error state
      document.querySelectorAll('.ticket-container').forEach(container => {
        container.innerHTML = '<div class="error">Error loading tickets</div>';
      });
    });
}

// Export the module functions
export const App = {
  initialize,
  setupEventListeners,
  loadInitialTickets,
};

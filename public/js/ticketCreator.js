/**
 * Ticket Creator module for the Epic Tracker
 * Handles creating new tickets in a modal dialog
 */

import { Storage } from './storage.js';
import { TicketRenderer } from './ticketRenderer.js';

// DOM elements
let creatorOverlay;
let creatorSidebar;
let titleInput;
let descriptionInput;
let prioritySelect;
let statusSelect;
let closeButton;
let createButton;
let cancelButton;

/**
 * Initialize the ticket creator
 */
function initialize() {
  // Get DOM elements
  creatorOverlay = document.getElementById('ticket-creator-overlay');
  creatorSidebar = document.getElementById('ticket-creator');
  titleInput = document.getElementById('new-ticket-title');
  descriptionInput = document.getElementById('new-ticket-description');
  prioritySelect = document.getElementById('new-ticket-priority');
  statusSelect = document.getElementById('new-ticket-status');
  closeButton = document.getElementById('close-creator');
  createButton = document.getElementById('create-ticket');
  cancelButton = document.getElementById('cancel-create');
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Set up event listeners for the ticket creator
 */
function setupEventListeners() {
  // Close button
  if (closeButton) {
    closeButton.addEventListener('click', closeCreator);
  }
  
  // Create button
  if (createButton) {
    createButton.addEventListener('click', handleCreateClick);
  }
  
  // Cancel button
  if (cancelButton) {
    cancelButton.addEventListener('click', closeCreator);
  }
  
  // Close creator when clicking outside
  creatorOverlay.addEventListener('click', (event) => {
    if (event.target === creatorOverlay) {
      closeCreator();
    }
  });
  
  // Add keyboard shortcut for closing (Escape key)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && creatorOverlay.style.display === 'block') {
      closeCreator();
    }
  });
}

/**
 * Open the ticket creator
 * @returns {Promise} A promise that resolves when the creator is opened
 */
function openCreator() {
  return new Promise((resolve) => {
    // Reset form fields
    titleInput.value = '';
    descriptionInput.value = '';
    prioritySelect.value = 'medium';
    statusSelect.value = 'backlog';
    
    // Show the creator
    creatorOverlay.style.display = 'block';
    
    // Trigger animation in the next frame
    requestAnimationFrame(() => {
      creatorOverlay.classList.add('active');
      
      // Focus on the title input after animation
      setTimeout(() => {
        titleInput.focus();
        resolve();
      }, 300);
    });
  });
}

/**
 * Close the ticket creator
 */
function closeCreator() {
  // Hide the creator with animation
  creatorOverlay.classList.remove('active');
  
  // After animation completes, hide the overlay
  setTimeout(() => {
    creatorOverlay.style.display = 'none';
  }, 300);
}

/**
 * Handle create button click
 */
function handleCreateClick() {
  // Get form values
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const priority = prioritySelect.value;
  const status = statusSelect.value;
  
  // Validate form
  if (!title) {
    alert('Please enter a title for the ticket');
    titleInput.focus();
    return;
  }
  
  // Show loading state
  createButton.disabled = true;
  createButton.textContent = 'Creating...';
  
  // Create a basic ticket object to send to the server
  const ticketData = {
    title,
    description,
    priority,
    status
  };
  
  // Create the ticket on the server
  fetch('/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ticketData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }
    return response.json();
  })
  .then(serverTicket => {
    console.log('Ticket created on server:', serverTicket);
    
    // Close the creator
    closeCreator();
    
    // Force a complete refresh of the page
    // This is a brute force approach, but it ensures everything is in sync
    window.location.reload();
  })
  .catch(error => {
    console.error('Error creating ticket:', error);
    alert('Error creating ticket: ' + error.message);
  })
  .finally(() => {
    // Reset button state
    createButton.disabled = false;
    createButton.textContent = 'Create';
  });
}

// Export the module functions
export const TicketCreator = {
  initialize,
  openCreator,
  closeCreator
};
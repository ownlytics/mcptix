/**
 * Storage module for the Epic Tracker
 * Handles saving and loading tickets from the server
 */

// Queue of changes to be applied
let changeQueue = [];

// Current tickets data
let currentTickets = null;

/**
 * Queue a change to be applied
 * @param {string} type - The type of change (add, update, delete, move)
 * @param {object} ticket - The ticket to be changed
 */
function queueChange(type, ticket) {
  changeQueue.push({ type, ticket });
}

/**
 * Apply all queued changes
 * @returns {Promise} A promise that resolves when all changes are applied
 */
function applyChanges() {
  if (changeQueue.length === 0) {
    return Promise.resolve();
  }
  
  // Keep track of the last ticket for returning
  let lastTicket = null;
  let lastOperation = null;
  
  // Process all changes locally first
  const promises = changeQueue.map(change => {
    const { type, ticket } = change;
    
    // Keep track of the last ticket for returning
    lastTicket = ticket;
    lastOperation = type;
    
    // Apply the change to the local data
    switch (type) {
      case 'add':
        addTicket(ticket);
        // Send to server
        return createTicketOnServer(ticket);
      case 'update':
        updateTicket(ticket);
        // Send to server
        return updateTicketOnServer(ticket);
      case 'delete':
        deleteTicket(ticket.id);
        // Send to server
        return deleteTicketOnServer(ticket.id);
      case 'move':
        updateTicket(ticket); // Move is handled the same as update
        // Send to server
        return updateTicketOnServer(ticket);
    }
  });
  
  // Clear the queue
  changeQueue = [];
  
  // Wait for all server operations to complete
  return Promise.all(promises)
    .then(results => {
      // Save to localStorage as a backup
      saveToLocalStorage();
      
      // Return the updated ticket data from the server if available
      if (results && results.length > 0 && lastOperation !== 'delete') {
        const lastResult = results[results.length - 1];
        if (lastResult && lastResult.id) {
          // For add/update operations, the server returns the updated ticket
          return getTicketById(lastResult.id);
        }
      }
      
      return lastTicket;
    })
    .catch(error => {
      console.error('Error applying changes:', error);
      // Still save to localStorage even if server operations fail
      saveToLocalStorage();
      return lastTicket;
    });
}

/**
 * Save the current tickets to localStorage
 */
function saveToLocalStorage() {
  localStorage.setItem('epic-tickets-backup', JSON.stringify(currentTickets));
}

/**
 * Create a ticket on the server
 * @param {object} ticket - The ticket to create
 * @returns {Promise} A promise that resolves when the ticket is created
 */
function createTicketOnServer(ticket) {
  return fetch('/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority || 'medium',
      status: ticket.status || 'backlog',
      complexity_metadata: ticket.complexity_metadata
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }
    return response.json();
  })
  .then(data => {
    // If the server returned the full ticket, update our local copy
    if (data && data.id && data.complexity_metadata) {
      // Find the ticket in our local data
      for (const column of currentTickets.columns) {
        const index = column.tickets.findIndex(t => t.id === data.id);
        if (index !== -1) {
          // Update the ticket with the server data
          column.tickets[index] = data;
          break;
        }
      }
    }
    return data;
  });
}

/**
 * Update a ticket on the server
 * @param {object} ticket - The ticket to update
 * @returns {Promise} A promise that resolves when the ticket is updated
 */
function updateTicketOnServer(ticket) {
  return fetch(`/api/tickets/${ticket.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      complexity_metadata: ticket.complexity_metadata
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update ticket');
    }
    return response.json();
  })
  .then(data => {
    // If the server returned the full ticket, update our local copy
    if (data && data.id && data.complexity_metadata) {
      // Find the ticket in our local data
      for (const column of currentTickets.columns) {
        const index = column.tickets.findIndex(t => t.id === data.id);
        if (index !== -1) {
          // Update the ticket with the server data
          column.tickets[index] = data;
          break;
        }
      }
    }
    return data;
  });
}

/**
 * Delete a ticket on the server
 * @param {string} ticketId - The ID of the ticket to delete
 * @returns {Promise} A promise that resolves when the ticket is deleted
 */
function deleteTicketOnServer(ticketId) {
  return fetch(`/api/tickets/${ticketId}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to delete ticket');
    }
    return response.json();
  });
}

/**
 * Add a ticket to the current tickets
 * @param {object} ticket - The ticket to add
 */
function addTicket(ticket) {
  // Find the column for this ticket
  const column = currentTickets.columns.find(col => col.id === ticket.status);
  
  if (column) {
    // Add the ticket to the column
    column.tickets.push(ticket);
  }
}

/**
 * Update a ticket in the current tickets
 * @param {object} ticket - The ticket to update
 */
function updateTicket(ticket) {
  // Find the ticket in all columns
  for (const column of currentTickets.columns) {
    const index = column.tickets.findIndex(t => t.id === ticket.id);
    
    if (index !== -1) {
      // If the status has changed, move the ticket to the new column
      if (column.id !== ticket.status) {
        // Remove from current column
        column.tickets.splice(index, 1);
        
        // Add to new column
        const newColumn = currentTickets.columns.find(col => col.id === ticket.status);
        if (newColumn) {
          newColumn.tickets.push(ticket);
        }
      } else {
        // Update in place
        column.tickets[index] = ticket;
      }
      
      return;
    }
  }
}

/**
 * Delete a ticket from the current tickets
 * @param {string} ticketId - The ID of the ticket to delete
 */
function deleteTicket(ticketId) {
  // Find the ticket in all columns
  for (const column of currentTickets.columns) {
    const index = column.tickets.findIndex(t => t.id === ticketId);
    
    if (index !== -1) {
      // Remove from column
      column.tickets.splice(index, 1);
      return;
    }
  }
}

/**
 * Save tickets to the server
 * @param {object} tickets - The tickets to save
 * @returns {Promise} A promise that resolves when the tickets are saved
 */
function saveTickets(tickets) {
  // Save to localStorage as a backup
  localStorage.setItem('epic-tickets-backup', JSON.stringify(tickets));
  
  // In the new API, we don't save all tickets at once
  // Instead, we use individual endpoints for each operation
  // This function is kept for compatibility with the original code
  return Promise.resolve(tickets);
}

/**
 * Load tickets from the server
 * @returns {Promise} A promise that resolves with the loaded tickets
 */
function loadTickets() {
  // If we already have tickets, return them
  if (currentTickets) {
    return Promise.resolve(currentTickets);
  }
  
  // Load from the server
  return fetch('/api/tickets')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load tickets');
      }
      return response.json();
    })
    .then(data => {
      // Transform the API response to match the expected format
      const tickets = {
        columns: [
          {
            id: 'backlog',
            name: 'Backlog',
            tickets: []
          },
          {
            id: 'up-next',
            name: 'Up Next',
            tickets: []
          },
          {
            id: 'in-progress',
            name: 'In Progress',
            tickets: []
          },
          {
            id: 'in-review',
            name: 'In Review',
            tickets: []
          },
          {
            id: 'completed',
            name: 'Completed',
            tickets: []
          }
        ]
      };
      
      // Distribute tickets to their respective columns
      if (data.tickets && Array.isArray(data.tickets)) {
        data.tickets.forEach(ticket => {
          // Ensure complexity_metadata is properly initialized if missing
          if (!ticket.complexity_metadata) {
            ticket.complexity_metadata = {};
          }
          
          const column = tickets.columns.find(col => col.id === ticket.status);
          if (column) {
            column.tickets.push(ticket);
          }
        });
      }
      
      currentTickets = tickets;
      return tickets;
    })
    .catch(error => {
      console.error('Error loading tickets:', error);
      
      // Try to load from localStorage as a fallback
      try {
        const ticketsJson = localStorage.getItem('epic-tickets-backup');
        if (ticketsJson) {
          currentTickets = JSON.parse(ticketsJson);
          return currentTickets;
        }
      } catch (e) {
        console.error('Error loading tickets from localStorage:', e);
      }
      
      // Create empty tickets structure
      currentTickets = {
        columns: [
          {
            id: 'backlog',
            name: 'Backlog',
            tickets: []
          },
          {
            id: 'up-next',
            name: 'Up Next',
            tickets: []
          },
          {
            id: 'in-progress',
            name: 'In Progress',
            tickets: []
          },
          {
            id: 'in-review',
            name: 'In Review',
            tickets: []
          },
          {
            id: 'completed',
            name: 'Completed',
            tickets: []
          }
        ]
      };
      
      return currentTickets;
    });
}

/**
 * Get a ticket by ID
 * @param {string} ticketId - The ID of the ticket to get
 * @returns {object|null} The ticket, or null if not found
 */
function getTicketById(ticketId) {
  if (!currentTickets) {
    return null;
  }
  
  // Find the ticket in all columns
  for (const column of currentTickets.columns) {
    const ticket = column.tickets.find(t => t.id === ticketId);
    
    if (ticket) {
      // Ensure complexity_metadata is properly initialized if missing
      if (!ticket.complexity_metadata) {
        ticket.complexity_metadata = {};
      }
      return ticket;
    }
  }
  
  // If not found in local cache, try to fetch from server
  return fetch(`/api/tickets/${ticketId}`)
    .then(response => {
      if (!response.ok) {
        return null;
      }
      return response.json();
    })
    .then(ticket => {
      // Ensure complexity_metadata is properly initialized if missing
      if (ticket && !ticket.complexity_metadata) {
        ticket.complexity_metadata = {};
      }
      return ticket;
    })
    .catch(() => {
      return null;
    });
}

/**
 * Add a comment to a ticket
 * @param {string} ticketId - The ID of the ticket to add the comment to
 * @param {object} comment - The comment to add
 * @returns {Promise} A promise that resolves when the comment is added
 */
function addComment(ticketId, comment) {
  return fetch(`/api/tickets/${ticketId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: comment.content,
      type: comment.type || 'comment',
      author: comment.author || 'developer',
      status: comment.status || 'open'
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to add comment');
    }
    return response.json();
  });
}

/**
 * Get comments for a ticket
 * @param {string} ticketId - The ID of the ticket to get comments for
 * @returns {Promise} A promise that resolves with the comments
 */
function getComments(ticketId) {
  return fetch(`/api/tickets/${ticketId}/comments`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to get comments');
      }
      return response.json();
    })
    .then(data => {
      return data.comments || [];
    });
}

// Export the module functions
export const Storage = {
  queueChange,
  applyChanges,
  saveTickets,
  loadTickets,
  getTicketById,
  addComment,
  getComments
};
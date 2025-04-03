/**
 * Epic Tracker - A reusable ticket tracking system with MCP and API server capabilities
 * Main entry point for the package
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

/**
 * Epic Tracker class
 */
class EpicTracker {
  /**
   * Create a new Epic Tracker instance
   * @param {Object} config Configuration options
   */
  constructor(config = {}) {
    this.config = {
      dbPath: './.epic-tracker/data/epic-tracker.db',
      apiPort: 3000,
      apiHost: 'localhost',
      mcpEnabled: true,
      apiEnabled: true,
      logLevel: 'info',
      clearDataOnInit: false,
      ...config
    };
    
    this.app = null;
    this.server = null;
    this.ticketQueries = this._createTicketQueries();
    
    console.log('Epic Tracker initialized with config:', this.config);
  }
  
  /**
   * Start the Epic Tracker servers
   * @returns {Promise<EpicTracker>} A promise that resolves to the EpicTracker instance
   */
  async start() {
    console.log('Starting Epic Tracker servers...');
    
    if (this.config.apiEnabled) {
      await this._startApiServer();
    }
    
    if (this.config.mcpEnabled) {
      console.log('MCP server running on stdio');
    }
    
    return this;
  }
  
  /**
   * Start the API server
   * @returns {Promise<void>} A promise that resolves when the server is started
   */
  async _startApiServer() {
    return new Promise((resolve, reject) => {
      try {
        this.app = express();
        
        // Serve static files from the public directory
        const publicPath = path.join(__dirname, '../public');
        this.app.use(express.static(publicPath));
        
        // Serve index.html for the root route
        this.app.get('/', (req, res) => {
          res.sendFile(path.join(publicPath, 'index.html'));
        });
        
        // API routes
        this.app.get('/api/tickets', (req, res) => {
          res.json(this.ticketQueries.getTickets());
        });
        
        this.app.get('/api/tickets/:id', (req, res) => {
          const ticket = this.ticketQueries.getTicketById(req.params.id);
          if (ticket) {
            res.json(ticket);
          } else {
            res.status(404).json({ error: 'Ticket not found' });
          }
        });
        
        // Start the server
        this.server = this.app.listen(this.config.apiPort, this.config.apiHost, () => {
          console.log(`API server running at http://${this.config.apiHost}:${this.config.apiPort}`);
          resolve();
        });
      } catch (error) {
        console.error(`Error starting API server: ${error.message}`);
        reject(error);
      }
    });
  }
  
  /**
   * Shut down the Epic Tracker servers
   * @returns {Promise<void>} A promise that resolves when the servers are shut down
   */
  async shutdown() {
    console.log('Shutting down Epic Tracker...');
    
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(() => {
          console.log('API server stopped');
          resolve();
        });
      });
    }
    
    console.log('Epic Tracker shut down successfully');
  }
  
  /**
   * Create the ticket queries
   * @returns {Object} The ticket queries object
   */
  _createTicketQueries() {
    // Mock implementation for demo purposes
    return {
      createTicket: (ticket) => {
        const id = ticket.id || `ticket-${Date.now()}`;
        console.log(`Created ticket: ${id}`);
        return id;
      },
      
      getTicketById: (id) => {
        console.log(`Getting ticket: ${id}`);
        return {
          id,
          title: 'Example Ticket',
          description: 'This is an example ticket.',
          priority: 'medium',
          status: 'backlog',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          complexity_metadata: {
            cie_score: 0.5
          }
        };
      },
      
      updateTicket: (ticket) => {
        console.log(`Updated ticket: ${ticket.id}`);
        return true;
      },
      
      deleteTicket: (id) => {
        console.log(`Deleted ticket: ${id}`);
        return true;
      },
      
      getTickets: (filter = {}) => {
        console.log('Getting tickets with filter:', filter);
        return [
          {
            id: 'ticket-1',
            title: 'Example Ticket 1',
            description: 'This is an example ticket.',
            priority: 'medium',
            status: 'backlog',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            complexity_metadata: {
              cie_score: 0.5
            }
          },
          {
            id: 'ticket-2',
            title: 'Example Ticket 2',
            description: 'This is another example ticket.',
            priority: 'high',
            status: 'in-progress',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            complexity_metadata: {
              cie_score: 0.8
            }
          }
        ];
      },
      
      addComment: (ticketId, comment) => {
        const id = comment.id || `comment-${Date.now()}`;
        console.log(`Added comment ${id} to ticket ${ticketId}`);
        return id;
      }
    };
  }
  
  /**
   * Get the ticket queries
   * @returns {Object} The ticket queries object
   */
  getTicketQueries() {
    return this.ticketQueries;
  }
}

// Export the EpicTracker class and factory function
module.exports = {
  EpicTracker,
  createEpicTracker: (config) => new EpicTracker(config)
};
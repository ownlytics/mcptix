/**
 * API-only usage example for Epic Tracker
 * 
 * This example demonstrates how to:
 * 1. Create an Epic Tracker instance with only the API server enabled
 * 2. Start the API server
 * 3. Create and manage tickets via the API
 * 4. Shut down the server
 */

import { createEpicTracker, EpicTrackerConfig } from '../src';

async function runApiOnlyExample() {
  console.log('Starting Epic Tracker API-only example...');

  // Create a configuration with only API server enabled
  const config: EpicTrackerConfig = {
    dbPath: './examples/data/api-example.db',
    apiPort: 3001, // Use a different port to avoid conflicts
    apiHost: 'localhost',
    mcpEnabled: false, // Disable MCP server
    apiEnabled: true,  // Enable API server
    clearDataOnInit: true // Start with a clean database
  };

  // Create an Epic Tracker instance
  const epicTracker = createEpicTracker(config);
  
  try {
    // Start the server
    await epicTracker.start();
    console.log('Epic Tracker API server started successfully');
    
    // Get the ticket queries for programmatic access
    const ticketQueries = epicTracker.getTicketQueries();
    
    // Create a few tickets
    const tickets: string[] = [];
    
    for (let i = 1; i <= 3; i++) {
      const ticketId = ticketQueries.createTicket({
        id: `ticket-${Date.now()}-${i}`,
        title: `API Example Ticket ${i}`,
        description: `This is ticket ${i} created by the API-only example.`,
        priority: i === 1 ? 'high' : i === 2 ? 'medium' : 'low',
        status: i === 1 ? 'in-progress' : 'backlog',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });
      
      tickets.push(ticketId);
      console.log(`Created ticket ${i}: ${ticketId}`);
    }
    
    // Get tickets by status
    const backlogTickets = ticketQueries.getTickets({ status: 'backlog' });
    console.log(`Retrieved ${backlogTickets.length} backlog tickets`);
    
    const inProgressTickets = ticketQueries.getTickets({ status: 'in-progress' });
    console.log(`Retrieved ${inProgressTickets.length} in-progress tickets`);
    
    // Keep the server running for a while to allow manual testing
    console.log('\nAPI server is running at http://localhost:3001');
    console.log('You can use tools like curl or Postman to interact with the API:');
    console.log('- GET    /api/tickets       - List all tickets');
    console.log('- GET    /api/tickets/:id   - Get a specific ticket');
    console.log('- POST   /api/tickets       - Create a new ticket');
    console.log('- PUT    /api/tickets/:id   - Update a ticket');
    console.log('- DELETE /api/tickets/:id   - Delete a ticket');
    console.log('\nPress Ctrl+C to shut down...');
    
    // Wait for user to press Ctrl+C
    await new Promise((resolve) => {
      process.on('SIGINT', () => {
        resolve(undefined);
      });
    });
  } catch (error) {
    console.error('Error in example:', error);
  } finally {
    // Shut down Epic Tracker
    await epicTracker.shutdown();
    console.log('Epic Tracker shut down successfully');
  }
}

// Run the example
runApiOnlyExample().catch(console.error);
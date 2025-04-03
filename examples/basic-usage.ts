/**
 * Basic usage example for Epic Tracker
 * 
 * This example demonstrates how to:
 * 1. Create an Epic Tracker instance
 * 2. Start the servers
 * 3. Create and manage tickets
 * 4. Shut down the servers
 */

import { createEpicTracker, EpicTrackerConfig } from '../src';

async function runExample() {
  console.log('Starting Epic Tracker basic usage example...');

  // Create a configuration with custom settings
  const config: EpicTrackerConfig = {
    dbPath: './examples/data/example.db',
    apiPort: 3000,
    apiHost: 'localhost',
    mcpEnabled: true,
    apiEnabled: true,
    clearDataOnInit: true // Start with a clean database
  };

  // Create an Epic Tracker instance
  const epicTracker = createEpicTracker(config);
  
  try {
    // Start the servers
    await epicTracker.start();
    console.log('Epic Tracker servers started successfully');
    
    // Get the ticket queries for programmatic access
    const ticketQueries = epicTracker.getTicketQueries();
    
    // Create a ticket
    const ticketId = ticketQueries.createTicket({
      id: `ticket-${Date.now()}`,
      title: 'Example Ticket',
      description: 'This is an example ticket created by the basic usage example.',
      priority: 'medium',
      status: 'backlog',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      complexity_metadata: {
        ticket_id: '',
        files_touched: 5,
        modules_crossed: 2,
        stack_layers_involved: 1,
        dependencies: 3,
        shared_state_touches: 2,
        cascade_impact_zones: 1,
        subjectivity_rating: 0.5,
        loc_added: 100,
        loc_modified: 50,
        test_cases_written: 10,
        edge_cases: 3,
        mocking_complexity: 2,
        coordination_touchpoints: 1,
        review_rounds: 1,
        blockers_encountered: 0,
        cie_score: 0 // Will be calculated by the server
      }
    });
    
    console.log(`Created ticket: ${ticketId}`);
    
    // Get the ticket
    const ticket = ticketQueries.getTicketById(ticketId);
    console.log('Retrieved ticket:', ticket);
    
    // Add a comment
    const commentId = ticketQueries.addComment(ticketId, {
      id: `comment-${Date.now()}`,
      ticket_id: ticketId,
      content: 'This is an example comment.',
      type: 'comment',
      author: 'developer',
      status: 'open',
      timestamp: new Date().toISOString()
    });
    
    console.log(`Added comment: ${commentId}`);
    
    // Get the ticket with comment
    const updatedTicket = ticketQueries.getTicketById(ticketId);
    console.log('Retrieved ticket with comment:', updatedTicket);
    
    // Update the ticket (with null check)
    if (updatedTicket) {
      const updateSuccess = ticketQueries.updateTicket({
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description || '',
        priority: updatedTicket.priority,
        status: 'in-progress',
        created: updatedTicket.created,
        updated: new Date().toISOString(),
        complexity_metadata: updatedTicket.complexity_metadata
      });
      
      console.log(`Updated ticket status: ${updateSuccess}`);
    } else {
      console.error('Failed to retrieve ticket for update');
    }
    
    // Get all tickets
    const tickets = ticketQueries.getTickets();
    console.log(`Retrieved ${tickets.length} tickets`);
    
    // Keep the server running for a while to allow manual testing
    console.log('\nServers are running:');
    console.log('- API server: http://localhost:3000');
    console.log('- MCP server: running on stdio');
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
runExample().catch(console.error);
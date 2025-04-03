/**
 * MCP-only usage example for Epic Tracker
 * 
 * This example demonstrates how to:
 * 1. Create an Epic Tracker instance with only the MCP server enabled
 * 2. Start the MCP server
 * 3. Create and manage tickets programmatically
 * 4. Shut down the server
 * 
 * Note: This example doesn't actually call the MCP server directly,
 * as that would require a client implementation. Instead, it shows
 * how to set up the MCP server and use the programmatic API.
 */

import { createEpicTracker, EpicTrackerConfig } from '../src';

async function runMcpOnlyExample() {
  console.log('Starting Epic Tracker MCP-only example...');

  // Create a configuration with only MCP server enabled
  const config: EpicTrackerConfig = {
    dbPath: './examples/data/mcp-example.db',
    mcpEnabled: true,  // Enable MCP server
    apiEnabled: false, // Disable API server
    clearDataOnInit: true // Start with a clean database
  };

  // Create an Epic Tracker instance
  const epicTracker = createEpicTracker(config);
  
  try {
    // Start the server
    await epicTracker.start();
    console.log('Epic Tracker MCP server started successfully');
    
    // Get the ticket queries for programmatic access
    const ticketQueries = epicTracker.getTicketQueries();
    
    // Create a ticket
    const ticketId = ticketQueries.createTicket({
      id: `ticket-${Date.now()}`,
      title: 'MCP Example Ticket',
      description: 'This is a ticket created by the MCP-only example.',
      priority: 'medium',
      status: 'backlog',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      complexity_metadata: {
        ticket_id: '',
        files_touched: 3,
        modules_crossed: 1,
        stack_layers_involved: 2,
        dependencies: 2,
        shared_state_touches: 1,
        cascade_impact_zones: 0,
        subjectivity_rating: 0.3,
        loc_added: 50,
        loc_modified: 20,
        test_cases_written: 5,
        edge_cases: 2,
        mocking_complexity: 1,
        coordination_touchpoints: 0,
        review_rounds: 1,
        blockers_encountered: 0,
        cie_score: 0 // Will be calculated by the server
      }
    });
    
    console.log(`Created ticket: ${ticketId}`);
    
    // In a real application, an MCP client would connect to the MCP server
    // and use the tools and resources provided by the server.
    console.log('\nMCP server is running on stdio');
    console.log('In a real application, an MCP client would connect to this server');
    console.log('and use the following tools:');
    console.log('- list_tickets    - List tickets with optional filtering');
    console.log('- get_ticket      - Get a ticket by ID');
    console.log('- create_ticket   - Create a new ticket');
    console.log('- update_ticket   - Update an existing ticket');
    console.log('- delete_ticket   - Delete a ticket');
    console.log('- add_comment     - Add a comment to a ticket');
    console.log('- search_tickets  - Search for tickets');
    console.log('- get_stats       - Get statistics about tickets');
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
runMcpOnlyExample().catch(console.error);
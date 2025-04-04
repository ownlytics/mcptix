/**
 * Test script for epic-tracker-mcp package
 */

const { createEpicTracker } = require('epic-tracker-mcp');

async function testEpicTracker() {
  console.log('Testing Epic Tracker MCP package...');

  // Create a configuration with custom settings
  const config = {
    dbPath: './data/test.db',
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
      title: 'Test Ticket',
      description: 'This is a test ticket created by the npm link test.',
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
    
    console.log('\nServers are running:');
    console.log('- API server: http://localhost:3000');
    console.log('- MCP server: running on stdio');
    console.log('\nPress Ctrl+C to shut down...');
    
    // Keep the server running until user presses Ctrl+C
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await epicTracker.shutdown();
      console.log('Epic Tracker shut down successfully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

// Run the test
testEpicTracker().catch(console.error);
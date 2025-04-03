/**
 * Epic Tracker MCP Command
 * Starts only the MCP server for AI assistant integration
 */

const path = require('path');
const fs = require('fs');
const { loadConfig } = require('../utils/config');

/**
 * Start only the MCP server
 */
async function mcp() {
  console.log('Starting Epic Tracker MCP server...');

  try {
    // Check if Epic Tracker is initialized
    const configPath = path.resolve('./.epic-tracker/epic-tracker.config.js');
    if (!fs.existsSync(configPath)) {
      console.error('Epic Tracker is not initialized in this project.');
      console.error('Run `npx epic-tracker init` to initialize Epic Tracker.');
      process.exit(1);
    }

    // Load configuration
    const config = loadConfig();
    
    // Override config to enable MCP and disable API
    config.mcpEnabled = true;
    config.apiEnabled = false;

    // Import the Epic Tracker package
    const { createEpicTracker } = require(path.resolve(__dirname, '../../dist/index.js'));
    
    // Create and start Epic Tracker
    const epicTracker = createEpicTracker(config);
    await epicTracker.start();
    
    console.log('Epic Tracker MCP server running on stdio');
    console.log('Press Ctrl+C to stop');
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down Epic Tracker MCP server...');
      await epicTracker.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down Epic Tracker MCP server...');
      await epicTracker.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting Epic Tracker MCP server:', error.message);
    process.exit(1);
  }
}

module.exports = mcp;
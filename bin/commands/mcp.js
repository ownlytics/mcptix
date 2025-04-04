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
    const configPath = path.join(process.cwd(), '.epic-tracker', 'epic-tracker.config.js');
    if (!fs.existsSync(configPath)) {
      console.error('Epic Tracker is not initialized in this project.');
      console.error('Run `npx epic-tracker init` to initialize Epic Tracker.');
      process.exit(1);
    }

    // Load configuration
    const config = loadConfig();
    
    console.log('[MCP Command] Loaded configuration:', JSON.stringify(config, null, 2));
    console.log('[MCP Command] Current working directory:', process.cwd());
    
    // Check for db-config.json
    const dbConfigPath = path.join(process.cwd(), '.epic-tracker', 'db-config.json');
    if (fs.existsSync(dbConfigPath)) {
      try {
        const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
        console.log('[MCP Command] Found db-config.json with path:', dbConfig.dbPath);
      } catch (error) {
        console.warn('[MCP Command] Error reading db-config.json:', error.message);
      }
    } else {
      console.log('[MCP Command] No db-config.json found');
    }
    
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
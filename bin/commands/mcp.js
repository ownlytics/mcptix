/**
 * McpTix MCP Command
 * Starts only the MCP server for AI assistant integration
 */

const path = require('path');
const fs = require('fs');
const { loadConfig } = require('../utils/config');

/**
 * Start only the MCP server
 */
async function mcp() {
  console.log('Starting McpTix MCP server...');

  try {
    // Check if McpTix is initialized
    const configPath = path.join(process.cwd(), '.mcptix', 'mcptix.config.js');
    if (!fs.existsSync(configPath)) {
      console.error('McpTix is not initialized in this project.');
      console.error('Run `npx mcptix init` to initialize McpTix.');
      process.exit(1);
    }

    // Load configuration
    const config = loadConfig();

    console.log('[MCP Command] Loaded configuration:', JSON.stringify(config, null, 2));
    console.log('[MCP Command] Current working directory:', process.cwd());

    // Check for db-config.json
    const dbConfigPath = path.join(process.cwd(), '.mcptix', 'db-config.json');
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

    // Import the McpTix package
    const { createMcpTix } = require(path.resolve(__dirname, '../../dist/index.js'));

    // Create and start McpTix
    const mcpTix = createMcpTix(config);
    await mcpTix.start();

    console.log('McpTix MCP server running on stdio');
    console.log('Press Ctrl+C to stop');

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down McpTix MCP server...');
      await mcpTix.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down McpTix MCP server...');
      await mcpTix.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting McpTix MCP server:', error.message);
    process.exit(1);
  }
}

module.exports = mcp;

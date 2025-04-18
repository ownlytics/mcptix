/**
 * McpTix Configuration
 */

module.exports = {
  // Database configuration
  dbPath: './.mcptix/data/mcptix.db',

  // API server configuration
  apiPort: 3000,
  apiHost: 'localhost',

  // Server options
  mcpEnabled: false, // Disabled by default - MCP server should be started by the LLM agent
  apiEnabled: true,

  // Logging configuration
  logLevel: 'info',

  // Data management
  clearDataOnInit: false,
};

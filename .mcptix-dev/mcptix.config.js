/**
 * McpTix Development Configuration
 */

module.exports = {
  // Database configuration
  dbPath: '/Users/tim/src2/mcptix/.mcptix-dev/data/mcptix.db',

  // API server configuration
  apiPort: 3030, // Use different port to avoid conflicts
  apiHost: 'localhost',

  // Server options
  mcpEnabled: true,
  apiEnabled: true,

  // Logging configuration
  logLevel: 'debug',

  // Data management
  clearDataOnInit: false,
};

/**
 * Epic Tracker Configuration
 */

module.exports = {
  // Database configuration
  dbPath: './.epic-tracker/data/epic-tracker.db',
  
  // API server configuration
  apiPort: 3000,
  apiHost: 'localhost',
  
  // Server options
  mcpEnabled: true,
  apiEnabled: true,
  
  // Logging configuration
  logLevel: 'info',
  
  // Data management
  clearDataOnInit: false
};
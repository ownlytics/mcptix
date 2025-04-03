/**
 * Epic Tracker Configuration Utilities
 * Handles loading and creating configuration files
 */

const fs = require('fs');
const path = require('path');

/**
 * Default configuration
 */
const defaultConfig = {
  dbPath: './.epic-tracker/data/epic-tracker.db',
  apiPort: 3000,
  apiHost: 'localhost',
  mcpEnabled: true,
  apiEnabled: true,
  logLevel: 'info',
  clearDataOnInit: false
};

/**
 * Create the configuration file
 */
function createConfigFile() {
  const configPath = path.resolve('./.epic-tracker/epic-tracker.config.js');
  
  // Check if config file already exists
  if (fs.existsSync(configPath)) {
    console.log('Configuration file already exists');
    return;
  }
  
  // Get the template file path
  const templatePath = path.resolve(__dirname, '../../templates/config.js');
  
  // Read the template file
  const configContent = fs.readFileSync(templatePath, 'utf8');
  
  // Write the configuration file
  fs.writeFileSync(configPath, configContent);
  console.log('Created configuration file');
}

/**
 * Load the configuration
 * @returns {Object} The configuration object
 */
function loadConfig() {
  const configPath = path.resolve('./.epic-tracker/epic-tracker.config.js');
  
  try {
    // Clear require cache to ensure we get the latest version
    delete require.cache[configPath];
    
    // Load the configuration
    const userConfig = require(configPath);
    
    // Merge with defaults
    return { ...defaultConfig, ...userConfig };
  } catch (error) {
    console.error('Error loading configuration:', error.message);
    return defaultConfig;
  }
}

module.exports = {
  createConfigFile,
  loadConfig,
  defaultConfig
};
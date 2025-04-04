/**
 * McpTix Configuration Utilities
 * Handles loading and creating configuration files
 */

const fs = require('fs');
const path = require('path');

/**
 * Default configuration
 */
const defaultConfig = {
  dbPath: path.join(process.cwd(), '.mcptix', 'data', 'mcptix.db'),
  apiPort: 3000,
  apiHost: 'localhost',
  mcpEnabled: true,
  apiEnabled: true,
  logLevel: 'info',
  clearDataOnInit: false,
};

/**
 * Create the configuration file
 */
function createConfigFile() {
  const configPath = path.join(process.cwd(), '.mcptix', 'mcptix.config.js');

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
  const configPath = path.join(process.cwd(), '.mcptix', 'mcptix.config.js');
  const dbConfigPath = path.join(process.cwd(), '.mcptix', 'db-config.json');

  try {
    // First check if db-config.json exists
    let dbPath = defaultConfig.dbPath;
    if (fs.existsSync(dbConfigPath)) {
      try {
        const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
        if (dbConfig.dbPath) {
          console.log(`[Config] Using database path from db-config.json: ${dbConfig.dbPath}`);
          dbPath = dbConfig.dbPath;
        }
      } catch (dbError) {
        console.warn(`[Config] Error reading db-config.json: ${dbError.message}`);
      }
    }

    // Clear require cache to ensure we get the latest version
    if (require.cache[configPath]) {
      delete require.cache[configPath];
    }

    // Load the configuration
    let userConfig = {};
    if (fs.existsSync(configPath)) {
      userConfig = require(configPath);
    } else {
      console.warn('[Config] Configuration file not found, using defaults');
    }

    // Merge with defaults and override dbPath if found in db-config.json
    const mergedConfig = { ...defaultConfig, ...userConfig };
    mergedConfig.dbPath = dbPath; // Always use the dbPath from db-config.json if available

    return mergedConfig;
  } catch (error) {
    console.error('Error loading configuration:', error.message);
    return defaultConfig;
  }
}

module.exports = {
  createConfigFile,
  loadConfig,
  defaultConfig,
};

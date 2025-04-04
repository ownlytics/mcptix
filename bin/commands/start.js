/**
 * McpTix Start Command
 * Starts the McpTix UI
 */

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { loadConfig } = require('../utils/config');
const { openBrowser } = require('../utils/browser');

// Simple logger for CLI commands
const cliLogger = {
  info: (component, message) => {
    console.log(`${chalk.blue(`[${component}]`)} ${message}`);
  },
  success: (component, message) => {
    console.log(`${chalk.green(`[${component}]`)} ${message}`);
  },
  warn: (component, message) => {
    console.log(`${chalk.yellow(`[${component}]`)} ${message}`);
  },
  error: (component, message, error) => {
    console.error(`${chalk.red(`[${component}]`)} ${message}`);
    if (error) {
      console.error(chalk.red('  Error details:'), error.message || String(error));
    }
  },
  debug: (component, message) => {
    console.log(`${chalk.gray(`[${component}]`)} ${message}`);
  },
};

/**
 * Start the McpTix UI
 * @param {Object} options Command options
 */
async function start(options) {
  cliLogger.info('Start', 'Starting McpTix...');

  try {
    // Check if McpTix is initialized
    const configPath = path.join(process.cwd(), '.mcptix', 'mcptix.config.js');
    if (!fs.existsSync(configPath)) {
      cliLogger.error('Start', 'McpTix is not initialized in this project.');
      cliLogger.error('Start', 'Run `npx mcptix init` to initialize McpTix.');
      process.exit(1);
    }

    // Load configuration
    const config = loadConfig();

    cliLogger.info('Start', 'Loaded configuration');
    cliLogger.debug('Start', 'Current working directory: ' + process.cwd());

    // Check for db-config.json
    const dbConfigPath = path.join(process.cwd(), '.mcptix', 'db-config.json');
    if (fs.existsSync(dbConfigPath)) {
      try {
        const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
        cliLogger.info('Start', 'Found db-config.json with path: ' + dbConfig.dbPath);
      } catch (error) {
        cliLogger.warn('Start', 'Error reading db-config.json: ' + error.message);
      }
    } else {
      cliLogger.info('Start', 'No db-config.json found');
    }

    // Override config with command line options
    if (options.port) {
      config.apiPort = parseInt(options.port, 10);
    }

    if (options.host) {
      config.apiHost = options.host;
    }

    // Import the McpTix package
    const { createMcpTix } = require(path.resolve(__dirname, '../../dist/index.js'));

    // Override config to enable API and disable MCP
    config.apiEnabled = true;
    config.mcpEnabled = false; // MCP server should be started by the LLM agent
    // Create and start McpTix with API only
    const mcpTix = createMcpTix(config);
    await mcpTix.start();

    // Construct the URL
    const url = `http://${config.apiHost}:${config.apiPort}`;
    cliLogger.success('Start', `McpTix running at ${url}`);

    // Open browser if not disabled
    if (options.open !== false) {
      openBrowser(url);
    }

    cliLogger.info('Start', chalk.cyan('Press Ctrl+C to stop'));

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('');
      cliLogger.info('Start', 'Gracefully shutting down...');
      await mcpTix.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('');
      cliLogger.info('Start', 'Gracefully shutting down...');
      await mcpTix.shutdown();
      process.exit(0);
    });
  } catch (error) {
    cliLogger.error('Start', 'Error starting McpTix', error);
    process.exit(1);
  }
}

module.exports = start;

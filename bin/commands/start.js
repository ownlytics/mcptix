/**
 * Epic Tracker Start Command
 * Starts the Epic Tracker UI
 */

const path = require('path');
const fs = require('fs');
const { loadConfig } = require('../utils/config');
const { openBrowser } = require('../utils/browser');

/**
 * Start the Epic Tracker UI
 * @param {Object} options Command options
 */
async function start(options) {
  console.log('Starting Epic Tracker...');

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
    
    // Override config with command line options
    if (options.port) {
      config.apiPort = parseInt(options.port, 10);
    }
    
    if (options.host) {
      config.apiHost = options.host;
    }

    // Import the Epic Tracker package
    const { createEpicTracker } = require(path.resolve(__dirname, '../../dist/index.js'));
    
    // Create and start Epic Tracker
    const epicTracker = createEpicTracker(config);
    await epicTracker.start();
    
    // Construct the URL
    const url = `http://${config.apiHost}:${config.apiPort}`;
    console.log(`Epic Tracker running at ${url}`);
    
    // Open browser if not disabled
    if (options.open !== false) {
      openBrowser(url);
    }
    
    console.log('Press Ctrl+C to stop');
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down Epic Tracker...');
      await epicTracker.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nShutting down Epic Tracker...');
      await epicTracker.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting Epic Tracker:', error.message);
    process.exit(1);
  }
}

module.exports = start;
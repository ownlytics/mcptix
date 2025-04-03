/**
 * Epic Tracker Init Command
 * Initializes Epic Tracker in the user's project
 */

const fs = require('fs');
const path = require('path');
const { updatePackageJson } = require('../utils/package');
const { createConfigFile } = require('../utils/config');

/**
 * Initialize Epic Tracker in the user's project
 */
function init() {
  console.log('Initializing Epic Tracker...');

  try {
    // Create .epic-tracker directory
    const epicTrackerDir = path.resolve('./.epic-tracker');
    if (!fs.existsSync(epicTrackerDir)) {
      fs.mkdirSync(epicTrackerDir, { recursive: true });
      console.log('Created .epic-tracker directory');
    }

    // Create data directory
    const dataDir = path.resolve('./.epic-tracker/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    }

    // Create configuration file
    createConfigFile();

    // Update package.json
    updatePackageJson();

    console.log('\nEpic Tracker initialized successfully!');
    console.log('Run `npm run epic-tracker` to start the UI.');
  } catch (error) {
    console.error('Error initializing Epic Tracker:', error.message);
    process.exit(1);
  }
}

module.exports = init;
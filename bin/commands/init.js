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
    const epicTrackerDir = path.join(process.cwd(), '.epic-tracker');
    if (!fs.existsSync(epicTrackerDir)) {
      fs.mkdirSync(epicTrackerDir, { recursive: true });
      console.log('Created .epic-tracker directory');
    }

    // Create data directory
    const dataDir = path.join(process.cwd(), '.epic-tracker', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    }
    
    // Create db-config.json with absolute path
    const dbPath = path.resolve(path.join(dataDir, 'epic-tracker.db'));
    const dbConfig = { dbPath };
    fs.writeFileSync(
      path.join(process.cwd(), '.epic-tracker', 'db-config.json'),
      JSON.stringify(dbConfig, null, 2)
    );
    console.log(`Created database configuration with path: ${dbPath}`);

    // Create configuration file
    createConfigFile();

    // Create example MCP servers JSON file for Roo
    createMcpServersJsonFile(dbPath);

    // Update package.json
    updatePackageJson();

    console.log('\nEpic Tracker initialized successfully!');
    console.log('Run `npm run epic-tracker` to start the UI.');
  } catch (error) {
    console.error('Error initializing Epic Tracker:', error.message);
    process.exit(1);
  }
}

/**
 * Create a ready-to-use MCP servers configuration file
 */
function createMcpServersJsonFile(dbPath) {
  const epicTrackerDir = path.join(process.cwd(), '.epic-tracker');
  
  // The file will be placed in the .epic-tracker directory
  const mcpJsonPath = path.join(epicTrackerDir, 'mcp-server-config.json');
  
  // Skip if file already exists
  if (fs.existsSync(mcpJsonPath)) {
    console.log('MCP server configuration file already exists');
    return;
  }

  // Get the absolute path to the MCP server script
  const projectPath = process.cwd();
  const absoluteMcpServerPath = path.join(projectPath, 'node_modules', 'epic-tracker-mcp', 'dist', 'mcp', 'index.js');
  
  // Create the MCP servers JSON content with the absolute path and database path
  const mcpServersJson = {
    "mcpServers": {
      "epic-tracker": {
        "command": "node",
        "args": [absoluteMcpServerPath],
        "env": {
          "EPIC_TRACKER_DB_PATH": dbPath,
          "HOME": process.env.HOME || process.env.USERPROFILE // Cross-platform home directory
        },
        "disabled": false,
        "alwaysAllow": []
      }
    }
  };

  // Write the file
  fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpServersJson, null, 2));
  console.log('Created MCP server configuration file at .epic-tracker/mcp-server-config.json');
  console.log('You can use this file to configure your LLM agent to connect to the Epic Tracker MCP server.');
}

module.exports = init;
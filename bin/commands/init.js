/**
 * McpTix Init Command
 * Initializes McpTix in the user's project
 */

const fs = require('fs');
const path = require('path');
const { updatePackageJson } = require('../utils/package');
const { createConfigFile } = require('../utils/config');

/**
 * Initialize McpTix in the user's project
 */
function init() {
  console.log('Initializing McpTix...');

  try {
    // Create .mcptix directory
    const mcptixDir = path.join(process.cwd(), '.mcptix');
    if (!fs.existsSync(mcptixDir)) {
      fs.mkdirSync(mcptixDir, { recursive: true });
      console.log('Created .mcptix directory');
    }

    // Create data directory
    const dataDir = path.join(process.cwd(), '.mcptix', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    }

    // Create db-config.json with absolute path
    const dbPath = path.resolve(path.join(dataDir, 'mcptix.db'));
    const dbConfig = { dbPath };
    fs.writeFileSync(
      path.join(process.cwd(), '.mcptix', 'db-config.json'),
      JSON.stringify(dbConfig, null, 2),
    );
    console.log(`Created database configuration with path: ${dbPath}`);

    // Create configuration file
    createConfigFile();

    // Create example MCP servers JSON file for Roo
    createMcpServersJsonFile(dbPath);

    // Update package.json
    updatePackageJson();

    console.log('\nMcpTix initialized successfully!');
    console.log('Run `npm run mcptix` to start the UI.');
  } catch (error) {
    console.error('Error initializing McpTix:', error.message);
    process.exit(1);
  }
}

/**
 * Create a ready-to-use MCP servers configuration file
 */
function createMcpServersJsonFile(dbPath) {
  const mcptixDir = path.join(process.cwd(), '.mcptix');

  // The file will be placed in the .mcptix directory
  const mcpJsonPath = path.join(mcptixDir, 'mcp-server-config.json');

  // Skip if file already exists
  if (fs.existsSync(mcpJsonPath)) {
    console.log('MCP server configuration file already exists');
    return;
  }

  // Get the absolute path to the MCP server script
  const projectPath = process.cwd();
  const absoluteMcpServerPath = path.join(
    projectPath,
    'node_modules',
    '@ownlytics/mcptix',
    'dist',
    'mcp',
    'index.js',
  );

  // Create the MCP servers JSON content with the absolute path and database path
  const mcpServersJson = {
    mcpServers: {
      mcptix: {
        command: 'node',
        args: [absoluteMcpServerPath],
        env: {
          MCPTIX_DB_PATH: dbPath,
          HOME: process.env.HOME || process.env.USERPROFILE, // Cross-platform home directory
        },
        disabled: false,
        alwaysAllow: [],
      },
    },
  };

  // Add a comment at the top of the file
  const mcpServersJsonWithComment = `// McpTix MCP Server Configuration
// This file is used by LLM agents (like Roo) to connect to the McpTix MCP server.
// Copy this file to your LLM agent's configuration directory.
// For Roo, this would typically be .roo/mcp.json in your project root.
//
// IMPORTANT: The MCP server is started by the LLM agent, not by McpTix.
// You only need to run 'npx mcptix start' to start the UI.

${JSON.stringify(mcpServersJson, null, 2)}`;

  // Write the file
  fs.writeFileSync(mcpJsonPath, mcpServersJsonWithComment);
  console.log('Created MCP server configuration file at .mcptix/mcp-server-config.json');
  console.log("IMPORTANT: Copy this file to your LLM agent's configuration directory.");
  console.log('For Roo, this would typically be .roo/mcp.json in your project root.');
}

module.exports = init;

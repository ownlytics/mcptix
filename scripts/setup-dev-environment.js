#!/usr/bin/env node

/**
 * mcptix Development Environment Setup Script
 *
 * This script sets up a development environment for mcptix that:
 * 1. Creates a dedicated .mcptix-dev directory for development
 * 2. Initializes a development database
 * 3. Creates development configuration files
 * 4. Sets up a .roo directory with MCP configuration for the AI assistant
 *
 * IMPORTANT: The MCP server should ONLY be started by the LLM agent (Roo),
 * never manually. This is consistent with the production workflow.
 *
 * Usage: npm run dev:setup
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Constants
const PROJECT_ROOT = process.cwd();
const DEV_DIR = path.join(PROJECT_ROOT, '.mcptix-dev');
const DEV_DATA_DIR = path.join(DEV_DIR, 'data');
const ROO_DIR = path.join(PROJECT_ROOT, '.roo');

// Simple logger
const logger = {
  info: message => console.log(chalk.blue(`[INFO] ${message}`)),
  success: message => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warn: message => console.log(chalk.yellow(`[WARN] ${message}`)),
  error: message => console.log(chalk.red(`[ERROR] ${message}`)),
};

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.success(`Created directory: ${dir}`);
  } else {
    logger.info(`Directory already exists: ${dir}`);
  }
}

/**
 * Create development directory structure
 */
function createDevDirectories() {
  logger.info('Creating development directory structure...');
  ensureDirectoryExists(DEV_DIR);
  ensureDirectoryExists(DEV_DATA_DIR);
  ensureDirectoryExists(ROO_DIR);
}

/**
 * Create development database configuration
 */
function createDevDbConfig() {
  const dbConfigPath = path.join(DEV_DIR, 'db-config.json');
  const dbPath = path.resolve(path.join(DEV_DATA_DIR, 'mcptix.db'));

  const dbConfig = {
    dbPath,
  };

  fs.writeFileSync(dbConfigPath, JSON.stringify(dbConfig, null, 2));
  logger.success(`Created database configuration at: ${dbConfigPath}`);
  logger.info(`Development database path: ${dbPath}`);
}

/**
 * Create development configuration file
 */
function createDevConfig() {
  const configPath = path.join(DEV_DIR, 'mcptix.config.js');

  const configContent = `/**
 * McpTix Development Configuration
 */

module.exports = {
  // Database configuration
  dbPath: '${path.join(DEV_DIR, 'data', 'mcptix.db').replace(/\\/g, '\\\\')}',

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
`;

  fs.writeFileSync(configPath, configContent);
  logger.success(`Created development configuration at: ${configPath}`);
}

/**
 * Create Roo MCP configuration
 */
function createRooMcpConfig() {
  const mcpConfigPath = path.join(ROO_DIR, 'mcp.json');

  // Get absolute paths for configuration
  // We need to use node instead of ts-node for the MCP server
  // because Roo expects to execute node, not ts-node
  const nodePath = 'node'; // Use system node

  // For development, we need to use a script that will compile and run the TypeScript code
  const mcpDevScript = path.resolve(path.join(PROJECT_ROOT, 'scripts', 'mcp-entry.js'));

  // Ensure the mcp-entry.js script exists
  if (!fs.existsSync(mcpDevScript)) {
    createMcpEntryScript(mcpDevScript);
  }

  const dbPath = path.resolve(path.join(DEV_DATA_DIR, 'mcptix.db'));

  const mcpConfig = {
    mcpServers: {
      'mcptix-dev': {
        command: nodePath,
        args: [mcpDevScript],
        env: {
          MCPTIX_DB_PATH: dbPath,
          MCPTIX_DEV_MODE: 'true',
          HOME: process.env.HOME || process.env.USERPROFILE,
        },
        disabled: false,
        alwaysAllow: [],
      },
    },
  };

  // Check if the file exists
  const fileExists = fs.existsSync(mcpConfigPath);

  if (fileExists) {
    try {
      // Read existing configuration
      const existingConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

      // Merge configurations, preserving other servers
      existingConfig.mcpServers = {
        ...existingConfig.mcpServers,
        'mcptix-dev': mcpConfig.mcpServers['mcptix-dev'],
      };

      fs.writeFileSync(mcpConfigPath, JSON.stringify(existingConfig, null, 2));
      logger.success(`Updated Roo MCP configuration at: ${mcpConfigPath}`);
    } catch (error) {
      logger.warn(`Error updating existing Roo MCP configuration: ${error.message}`);
      logger.info('Creating new Roo MCP configuration...');
      fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
      logger.success(`Created new Roo MCP configuration at: ${mcpConfigPath}`);
    }
  } else {
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    logger.success(`Created Roo MCP configuration at: ${mcpConfigPath}`);
  }
}

/**
 * Create development README with instructions
 */
function createDevReadme() {
  const readmePath = path.join(DEV_DIR, 'README.md');

  const readmeContent = `# mcptix Development Environment

This directory contains the development configuration for mcptix.

## Development Workflow

### 1. Starting the Development Environment

Run the API server:
\`\`\`bash
npm run dev:api
\`\`\`

### 2. Using Roo with the Development MCP Server

When using Roo in this project, it will automatically use the development MCP server
configuration from \`.roo/mcp.json\`. The MCP server will be started by Roo when needed,
not manually.

IMPORTANT: The MCP server should ONLY be started by the LLM agent (Roo), never manually.
This ensures the development workflow matches the production workflow.

### 3. Testing the Complete Workflow

1. Start the API server:
\`\`\`bash
npm run dev:api
\`\`\`

2. Use Roo in this project, which will automatically start the MCP server when needed.

3. Verify that both servers can access the same database.

### 4. Reset Development Database

To reset the development database:
\`\`\`bash
rm ${path.join(DEV_DATA_DIR, 'mcptix.db')}
npm run dev:setup
\`\`\`

## Configuration Files

- \`mcptix.config.js\`: Development configuration for mcptix
- \`db-config.json\`: Database configuration for development
- \`.roo/mcp.json\`: Roo MCP server configuration

## Database Location

The development database is located at:
\`\`\`
${path.join(DEV_DATA_DIR, 'mcptix.db')}
\`\`\`
`;

  fs.writeFileSync(readmePath, readmeContent);
  logger.success(`Created development README at: ${readmePath}`);
}

/**
 * Main setup function
 */
function setup() {
  logger.info('Setting up mcptix development environment...');

  try {
    createDevDirectories();
    createDevDbConfig();
    createDevConfig();
    createRooMcpConfig();
    createDevReadme();

    logger.success('Development environment setup complete!');
    logger.info(`Development environment: ${DEV_DIR}`);
    logger.info(`Roo configuration: ${path.join(ROO_DIR, 'mcp.json')}`);
    logger.info('');
    logger.info('To start the development API server:');
    logger.info('  npm run dev:api');
    logger.info('');
    logger.info('To use with Roo:');
    logger.info('  Use Roo normally in this project, it will use the development MCP server');
  } catch (error) {
    logger.error(`Failed to set up development environment: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create an MCP entry script that will be used by Roo to start the MCP server
 * This script compiles and runs the TypeScript code
 */
function createMcpEntryScript(scriptPath) {
  logger.info(`Creating MCP entry script at ${scriptPath}...`);

  const scriptContent = `#!/usr/bin/env node

/**
 * mcptix MCP Development Entry Script
 *
 * This script is used by Roo to start the MCP server in development mode.
 * It compiles and runs the TypeScript code.
 *
 * IMPORTANT: This script should ONLY be executed by the LLM agent (Roo),
 * never manually.
 */

// Require ts-node to register TypeScript
require('ts-node/register');

// Get the absolute path to the MCP index file
const path = require('path');
const mcpIndexPath = path.resolve(__dirname, '../src/mcp/index.ts');

// Set development mode environment variable
process.env.MCPTIX_DEV_MODE = 'true';

// Run the MCP server
require(mcpIndexPath);
`;

  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755'); // Make executable
  logger.success(`Created MCP entry script at: ${scriptPath}`);
}

// Run setup
setup();

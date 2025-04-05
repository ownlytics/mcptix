#!/usr/bin/env node

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

// Log startup information
console.log('=== MCPTIX MCP DEVELOPMENT SERVER STARTING ===');
console.log(`Process ID: ${process.pid}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`MCP index path: ${mcpIndexPath}`);
console.log(`Development mode: ${process.env.MCPTIX_DEV_MODE}`);
console.log(`Database path: ${process.env.MCPTIX_DB_PATH || 'Not set - will use default'}`);

// Run the MCP server
require(mcpIndexPath);

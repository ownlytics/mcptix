#!/usr/bin/env node

/**
 * Epic Tracker CLI
 * Command-line interface for Epic Tracker
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');

// Import commands
const init = require('./commands/init');
const start = require('./commands/start');
const mcp = require('./commands/mcp');

// Set up the CLI program
program
  .name('epic-tracker')
  .description('Epic Tracker - A reusable ticket tracking system')
  .version(packageJson.version);

// Init command
program
  .command('init')
  .description('Initialize Epic Tracker in your project')
  .action(init);

// Start command
program
  .command('start')
  .description('Start the Epic Tracker UI (API server only)')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-h, --host <host>', 'Host to run the server on', 'localhost')
  .option('--no-open', 'Do not open the browser automatically')
  .action(start);

// MCP command
program
  .command('mcp')
  .description('Start only the MCP server (for development/testing purposes)')
  .action(mcp);

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
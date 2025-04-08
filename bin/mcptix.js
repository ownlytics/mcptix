#!/usr/bin/env node

/**
 * McpTix CLI
 * Command-line interface for McpTix
 */

import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Create a require function for loading JSON
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Print a colorful banner
console.log(
  chalk.cyan(`
 ███╗   ███╗ ██████╗██████╗ ████████╗██╗██╗  ██╗
 ████╗ ████║██╔════╝██╔══██╗╚══██╔══╝██║╚██╗██╔╝
 ██╔████╔██║██║     ██████╔╝   ██║   ██║ ╚███╔╝ 
 ██║╚██╔╝██║██║     ██╔═══╝    ██║   ██║ ██╔██╗ 
 ██║ ╚═╝ ██║╚██████╗██║        ██║   ██║██╔╝ ██╗
 ╚═╝     ╚═╝ ╚═════╝╚═╝        ╚═╝   ╚═╝╚═╝  ╚═╝
                                     v${packageJson.version}
`),
);

// Import commands
const init = require('./commands/init');
const start = require('./commands/start');
const mcp = require('./commands/mcp');

// Set up the CLI program
program.name('mcptix').description('McpTix - A reusable ticket tracking system').version(packageJson.version);

// Init command
program.command('init').description('Initialize McpTix in your project').action(init);

// Start command
program
  .command('start')
  .description('Start the McpTix UI (API server only)')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('-h, --host <host>', 'Host to run the server on', 'localhost')
  .option('--no-open', 'Do not open the browser automatically')
  .action(start);

// MCP command
program.command('mcp').description('Start only the MCP server (for development/testing purposes)').action(mcp);

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

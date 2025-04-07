/**
 * Standalone MCP server for McpTix
 * This file is designed to be executed directly by Node.js or by Roo
 * It initializes the database, creates a TicketQueries instance,
 * and starts the MCP server.
 *
 * SIMPLIFIED VERSION: This assumes the MCP server will only be started
 * through this entry point directly.
 */

// Set MCP mode environment variable to ensure proper logging behavior
// CRITICAL: This must be set before any imports to ensure the Logger
// initializes correctly with MCP mode enabled
process.env.MCPTIX_MCP_MODE = 'true';

import fs from 'fs';
import path from 'path';

import { McpTixConfig, ensureHomeDirectory, mergeConfig } from '../config';
import { TicketQueries } from '../db/queries';
import { DatabaseService } from '../db/service';
import { Logger } from '../utils/logger';

import { McpTixServer } from './server';

// Initialize the configuration with environment variables

// Get configuration from environment variables or use defaults
const userConfig: Partial<McpTixConfig> = {
  homeDir: process.env.MCPTIX_HOME_DIR || path.join(process.cwd(), '.mcptix'),
  apiPort: process.env.MCPTIX_API_PORT ? parseInt(process.env.MCPTIX_API_PORT, 10) : undefined,
  apiHost: process.env.MCPTIX_API_HOST,
  dbPath: process.env.MCPTIX_DB_PATH,
  mcpEnabled: true,
  apiEnabled: false,
  logLevel: (process.env.MCPTIX_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  clearDataOnInit: false,
};

// Merge with defaults and resolve derived paths
const config = mergeConfig(userConfig);

// Ensure the home directory and required subdirectories exist
ensureHomeDirectory(config);

// Configure the logger with the home directory
Logger.setBaseDirectory(config.homeDir!);

// Log the configuration
Logger.info('McpServer', `Using home directory: ${config.homeDir}`);
Logger.info('McpServer', `Using database: ${config.dbPath}`);
Logger.info('McpServer', `Using log directory: ${config.logDir}`);

// Initialize database with the resolved configuration
const dbService = DatabaseService.getInstance();
const db = dbService.initialize(config);

// Log database initialization
Logger.info('McpServer', `Database initialized at absolute path: ${db.name}`);

// Verify database is accessible
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  Logger.info('McpServer', `Database tables: ${tables.map((t: any) => t.name).join(', ')}`);

  // Check if tickets table exists and has data
  if (tables.some((t: any) => t.name === 'tickets')) {
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as {
      count: number;
    };
    Logger.info('McpServer', `Found ${ticketCount.count} tickets in database`);
  }
} catch (error) {
  Logger.error('McpServer', 'Error accessing database', error);
}

// Initialize ticket queries
const ticketQueries = new TicketQueries(db);

// Create and start MCP server
Logger.info('McpServer', 'Starting MCP server...');
const server = new McpTixServer(ticketQueries, config);

// Handle shutdown
process.on('SIGINT', async () => {
  Logger.info('McpServer', 'Shutting down MCP server...');
  await server.close();
  dbService.close();
  Logger.info('McpServer', 'MCP server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('McpServer', 'Shutting down MCP server...');
  await server.close();
  dbService.close();
  Logger.info('McpServer', 'MCP server shutdown complete');
  process.exit(0);
});

// Run the server
server.run().catch(error => {
  Logger.error('McpServer', 'Failed to start MCP server', error);
  process.exit(1);
});

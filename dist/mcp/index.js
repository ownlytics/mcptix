"use strict";
/**
 * Standalone MCP server for McpTix
 * This file is designed to be executed directly by Node.js or by Roo
 * It initializes the database, creates a TicketQueries instance,
 * and starts the MCP server.
 *
 * SIMPLIFIED VERSION: This assumes the MCP server will only be started
 * through this entry point directly.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Set MCP mode environment variable to ensure proper logging behavior
// CRITICAL: This must be set before any imports to ensure the Logger
// initializes correctly with MCP mode enabled
process.env.MCPTIX_MCP_MODE = 'true';
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const queries_1 = require("../db/queries");
const service_1 = require("../db/service");
const logger_1 = require("../utils/logger");
const server_1 = require("./server");
// Initialize the configuration with environment variables
// Get configuration from environment variables or use defaults
const userConfig = {
    homeDir: process.env.MCPTIX_HOME_DIR || path_1.default.join(process.cwd(), '.mcptix'),
    apiPort: process.env.MCPTIX_API_PORT ? parseInt(process.env.MCPTIX_API_PORT, 10) : undefined,
    apiHost: process.env.MCPTIX_API_HOST,
    dbPath: process.env.MCPTIX_DB_PATH,
    mcpEnabled: true,
    apiEnabled: false,
    logLevel: process.env.MCPTIX_LOG_LEVEL || 'info',
    clearDataOnInit: false,
};
// Merge with defaults and resolve derived paths
const config = (0, config_1.mergeConfig)(userConfig);
// Ensure the home directory and required subdirectories exist
(0, config_1.ensureHomeDirectory)(config);
// Configure the logger with the home directory
logger_1.Logger.setBaseDirectory(config.homeDir);
// Log the configuration
logger_1.Logger.info('McpServer', `Using home directory: ${config.homeDir}`);
logger_1.Logger.info('McpServer', `Using database: ${config.dbPath}`);
logger_1.Logger.info('McpServer', `Using log directory: ${config.logDir}`);
// Initialize database with the resolved configuration
const dbService = service_1.DatabaseService.getInstance();
const db = dbService.initialize(config);
// Log database initialization
logger_1.Logger.info('McpServer', `Database initialized at absolute path: ${db.name}`);
// Verify database is accessible
try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    logger_1.Logger.info('McpServer', `Database tables: ${tables.map((t) => t.name).join(', ')}`);
    // Check if tickets table exists and has data
    if (tables.some((t) => t.name === 'tickets')) {
        const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
        logger_1.Logger.info('McpServer', `Found ${ticketCount.count} tickets in database`);
    }
}
catch (error) {
    logger_1.Logger.error('McpServer', 'Error accessing database', error);
}
// Initialize ticket queries
const ticketQueries = new queries_1.TicketQueries(db);
// Create and start MCP server
logger_1.Logger.info('McpServer', 'Starting MCP server...');
const server = new server_1.McpTixServer(ticketQueries, config);
// Handle shutdown
process.on('SIGINT', async () => {
    logger_1.Logger.info('McpServer', 'Shutting down MCP server...');
    await server.close();
    dbService.close();
    logger_1.Logger.info('McpServer', 'MCP server shutdown complete');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.Logger.info('McpServer', 'Shutting down MCP server...');
    await server.close();
    dbService.close();
    logger_1.Logger.info('McpServer', 'MCP server shutdown complete');
    process.exit(0);
});
// Run the server
server.run().catch(error => {
    logger_1.Logger.error('McpServer', 'Failed to start MCP server', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
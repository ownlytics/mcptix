"use strict";
/**
 * McpTix - A reusable ticket tracking system with MCP and API server capabilities
 * Main entry point for the package
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpTix = void 0;
exports.createMcpTix = createMcpTix;
const server_1 = require("./api/server");
const config_1 = require("./config");
const queries_1 = require("./db/queries");
const schema_1 = require("./db/schema");
const service_1 = require("./db/service");
const server_2 = require("./mcp/server");
const logger_1 = require("./utils/logger");
// Export all types and configuration for users
__exportStar(require("./types"), exports);
__exportStar(require("./config"), exports);
/**
 * Main class for McpTix
 * Provides a unified interface for managing the McpTix system
 */
class McpTix {
    /**
     * Create a new McpTix instance
     * @param userConfig Configuration options
     */
    constructor(userConfig = {}) {
        // Merge and validate configuration
        this.config = (0, config_1.mergeConfig)(userConfig);
        (0, config_1.validateConfig)(this.config);
        // Initialize database using the singleton service
        this.dbService = service_1.DatabaseService.getInstance();
        this.db = this.dbService.initialize(this.config, this.config.clearDataOnInit);
        logger_1.Logger.info('McpTix', `Database initialized at absolute path: ${this.db.name}`);
        this.ticketQueries = new queries_1.TicketQueries(this.db);
        // Set up cleanup on process exit
        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
    }
    /**
     * Start the McpTix servers
     * @returns A promise that resolves to the McpTix instance
     */
    async start() {
        try {
            // Start API server if enabled
            if (this.config.apiEnabled) {
                this.apiServer = new server_1.ApiServer(this.ticketQueries);
                await this.apiServer.start(this.config.apiPort, this.config.apiHost);
            }
            // Start MCP server if enabled
            if (this.config.mcpEnabled) {
                this.mcpServer = new server_2.McpTixServer(this.ticketQueries, this.config);
                await this.mcpServer.run();
            }
            return this;
        }
        catch (error) {
            // Clean up on error
            await this.shutdown();
            throw error;
        }
    }
    /**
     * Gracefully shut down McpTix
     * @returns A promise that resolves when shutdown is complete
     */
    async shutdown() {
        // Prevent duplicate shutdown messages
        if (McpTix.isShuttingDown) {
            return Promise.resolve();
        }
        McpTix.isShuttingDown = true;
        logger_1.Logger.info('McpTix', 'Gracefully shutting down...');
        try {
            // Stop MCP server if running
            if (this.mcpServer) {
                await this.mcpServer.close();
                this.mcpServer = undefined;
            }
            // Stop API server if running
            if (this.apiServer) {
                await this.apiServer.stop();
                this.apiServer = undefined;
            }
            // Close database connection
            if (this.db) {
                this.dbService.close();
                this.db = null;
            }
            logger_1.Logger.success('McpTix', 'Shut down successfully');
        }
        catch (error) {
            logger_1.Logger.error('McpTix', 'Error during shutdown', error);
            throw error;
        }
    }
    /**
     * Clear all data from the database
     * @returns A promise that resolves when the data is cleared
     */
    async clearData() {
        try {
            if (this.db) {
                (0, schema_1.clearDatabase)(this.db);
            }
            return Promise.resolve();
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    /**
     * Get the ticket queries instance for programmatic access
     * @returns The TicketQueries instance
     */
    getTicketQueries() {
        return this.ticketQueries;
    }
}
exports.McpTix = McpTix;
McpTix.isShuttingDown = false;
/**
 * Factory function for creating a McpTix instance
 * @param config Configuration options
 * @returns A new McpTix instance
 */
function createMcpTix(config) {
    return new McpTix(config);
}
// If this file is run directly, start the servers based on command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    const runApi = args.includes('--api');
    const runMcp = args.includes('--mcp');
    // Default to API only if no specific flags are provided
    const config = {
        apiEnabled: runApi || !runMcp, // Enable API if --api flag is present or --mcp is not present
        mcpEnabled: runMcp, // Enable MCP only if --mcp flag is present
    };
    logger_1.Logger.info('McpTix', `Starting with configuration:
  - API server: ${config.apiEnabled ? 'enabled' : 'disabled'}
  - MCP server: ${config.mcpEnabled ? 'enabled' : 'disabled'}`);
    const mcpTix = createMcpTix(config);
    mcpTix.start().catch(error => {
        logger_1.Logger.error('McpTix', 'Failed to start', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map
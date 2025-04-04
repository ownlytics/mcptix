"use strict";
/**
 * Epic Tracker - A reusable ticket tracking system with MCP and API server capabilities
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
exports.EpicTracker = void 0;
exports.createEpicTracker = createEpicTracker;
const config_1 = require("./config");
const schema_1 = require("./db/schema");
const service_1 = require("./db/service");
const queries_1 = require("./db/queries");
const server_1 = require("./api/server");
const server_2 = require("./mcp/server");
// Export all types and configuration for users
__exportStar(require("./types"), exports);
__exportStar(require("./config"), exports);
/**
 * Main class for Epic Tracker
 * Provides a unified interface for managing the Epic Tracker system
 */
class EpicTracker {
    /**
     * Create a new Epic Tracker instance
     * @param userConfig Configuration options
     */
    constructor(userConfig = {}) {
        // Merge and validate configuration
        this.config = (0, config_1.mergeConfig)(userConfig);
        (0, config_1.validateConfig)(this.config);
        // Initialize database using the singleton service
        this.dbService = service_1.DatabaseService.getInstance();
        this.db = this.dbService.initialize(this.config, this.config.clearDataOnInit);
        console.log(`[EpicTracker] Database initialized at absolute path: ${this.db.name}`);
        this.ticketQueries = new queries_1.TicketQueries(this.db);
        // Set up cleanup on process exit
        process.on('SIGINT', this.shutdown.bind(this));
        process.on('SIGTERM', this.shutdown.bind(this));
    }
    /**
     * Start the Epic Tracker servers
     * @returns A promise that resolves to the EpicTracker instance
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
                this.mcpServer = new server_2.EpicTrackerMcpServer(this.ticketQueries, this.config);
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
     * Gracefully shut down Epic Tracker
     * @returns A promise that resolves when shutdown is complete
     */
    async shutdown() {
        console.log('Shutting down Epic Tracker...');
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
            console.log('Epic Tracker shut down successfully');
        }
        catch (error) {
            console.error(`Error during shutdown: ${error instanceof Error ? error.message : String(error)}`);
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
exports.EpicTracker = EpicTracker;
/**
 * Factory function for creating an Epic Tracker instance
 * @param config Configuration options
 * @returns A new Epic Tracker instance
 */
function createEpicTracker(config) {
    return new EpicTracker(config);
}
// If this file is run directly, start the servers
if (require.main === module) {
    const args = process.argv.slice(2);
    const runApi = args.includes('--api');
    const runMcp = args.includes('--mcp');
    const config = {
        apiEnabled: runApi || (!runApi && !runMcp),
        mcpEnabled: runMcp || (!runApi && !runMcp)
    };
    const epicTracker = createEpicTracker(config);
    epicTracker.start().catch((error) => {
        console.error('Failed to start Epic Tracker:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpicTrackerMcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const tools_1 = require("./tools");
const resources_1 = require("./resources");
const debug_logger_1 = require("./debug-logger");
/**
 * Epic Tracker MCP Server
 * Provides Model Context Protocol functionality for Epic Tracker
 */
class EpicTrackerMcpServer {
    /**
     * Create a new Epic Tracker MCP Server
     * @param ticketQueries The TicketQueries instance to use
     * @param config Configuration options
     */
    constructor(ticketQueries, config) {
        this.isRunning = false;
        this.ticketQueries = ticketQueries;
        this.config = config;
        this.logger = debug_logger_1.DebugLogger.getInstance();
        // Log database path for debugging
        const dbPath = config.dbPath;
        const actualDbPath = ticketQueries['db'].name;
        const cwd = process.cwd();
        console.log('[MCP Server] Database path from config:', dbPath);
        console.log('[MCP Server] Actual database file path:', actualDbPath);
        console.log('[MCP Server] Current working directory:', cwd);
        // Write to debug log
        this.logger.log('MCP Server initialized');
        this.logger.log(`Database path from config: ${dbPath}`);
        this.logger.log(`Actual database file path: ${actualDbPath}`);
        this.logger.log(`Current working directory: ${cwd}`);
        this.logger.log(`Debug log path: ${this.logger.getLogPath()}`);
        // Create MCP server
        this.server = new index_js_1.Server({
            name: 'epic-tracker',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        // Setup tool handlers
        (0, tools_1.setupToolHandlers)(this.server, this.ticketQueries);
        // Setup resource handlers
        (0, resources_1.setupResourceHandlers)(this.server, this.ticketQueries);
        // Error handling
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
            this.logger.log(`MCP Error: ${error instanceof Error ? error.message : String(error)}`);
        };
        // Log server initialization
        this.logger.log('MCP Server fully initialized');
    }
    /**
     * Start the MCP server
     * @returns A promise that resolves when the server is started
     */
    async run() {
        if (this.isRunning) {
            console.log('MCP server is already running');
            return this;
        }
        try {
            const transport = new stdio_js_1.StdioServerTransport();
            await this.server.connect(transport);
            this.isRunning = true;
            console.log('Epic Tracker MCP server running on stdio');
            this.logger.log('Epic Tracker MCP server running on stdio');
            return this;
        }
        catch (error) {
            const errorMsg = `Error starting MCP server: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            this.logger.log(errorMsg);
            throw error;
        }
    }
    /**
     * Check if the server is running
     * @returns True if the server is running, false otherwise
     */
    isServerRunning() {
        return this.isRunning;
    }
    /**
     * Close the MCP server
     * @returns A promise that resolves when the server is closed
     */
    async close() {
        if (!this.isRunning) {
            console.log('MCP server is not running');
            return;
        }
        try {
            await this.server.close();
            this.isRunning = false;
            console.log('MCP server closed');
            this.logger.log('MCP server closed');
        }
        catch (error) {
            const errorMsg = `Error closing MCP server: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            this.logger.log(errorMsg);
            throw error;
        }
    }
}
exports.EpicTrackerMcpServer = EpicTrackerMcpServer;
//# sourceMappingURL=server.js.map
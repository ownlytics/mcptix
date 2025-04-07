"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpTixServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const logger_1 = require("../utils/logger");
const resources_1 = require("./resources");
const tools_1 = require("./tools");
/**
 * McpTix MCP Server
 * Provides Model Context Protocol functionality for McpTix
 */
class McpTixServer {
    /**
     * Create a new McpTix MCP Server
     * @param ticketQueries The TicketQueries instance to use
     * @param config Configuration options
     */
    constructor(ticketQueries, config) {
        this.isRunning = false;
        this.ticketQueries = ticketQueries;
        this.config = config;
        // Log initialization
        logger_1.Logger.info('McpServer', `Initializing server with configuration: ${this.config.dbPath}`);
        logger_1.Logger.debug('McpServer', `Current working directory: ${process.cwd()}`);
        // Create MCP server
        this.server = new index_js_1.Server({
            name: 'mcptix',
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
        this.server.onerror = error => {
            // Log error to file in MCP mode
            logger_1.Logger.error('McpServer', 'MCP Error', error);
        };
    }
    /**
     * Start the MCP server
     * @returns A promise that resolves when the server is started
     */
    async run() {
        if (this.isRunning) {
            logger_1.Logger.info('McpServer', 'Server is already running');
            return this;
        }
        try {
            const transport = new stdio_js_1.StdioServerTransport();
            await this.server.connect(transport);
            this.isRunning = true;
            logger_1.Logger.success('McpServer', 'Server running on stdio');
            return this;
        }
        catch (error) {
            const errorMsg = `Error starting MCP server: ${error instanceof Error ? error.message : String(error)}`;
            logger_1.Logger.error('McpServer', errorMsg);
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
            logger_1.Logger.info('McpServer', 'Server is not running');
            return;
        }
        try {
            await this.server.close();
            this.isRunning = false;
            logger_1.Logger.success('McpServer', 'Server closed');
        }
        catch (error) {
            const errorMsg = `Error closing MCP server: ${error instanceof Error ? error.message : String(error)}`;
            logger_1.Logger.error('McpServer', errorMsg);
            throw error;
        }
    }
}
exports.McpTixServer = McpTixServer;
//# sourceMappingURL=server.js.map
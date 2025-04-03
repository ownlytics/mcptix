"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpicTrackerMcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const schema_1 = require("../db/schema");
const queries_1 = require("../db/queries");
const tools_1 = require("./tools");
const resources_1 = require("./resources");
class EpicTrackerMcpServer {
    constructor() {
        // Initialize database
        this.db = (0, schema_1.initializeDatabase)();
        this.ticketQueries = new queries_1.TicketQueries(this.db);
        // Create MCP server
        this.server = new index_js_1.Server({
            name: 'epic-tracker-mcp',
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
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('Epic Tracker MCP server running on stdio');
    }
}
exports.EpicTrackerMcpServer = EpicTrackerMcpServer;
//# sourceMappingURL=server.js.map
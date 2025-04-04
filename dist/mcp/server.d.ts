import { McpTixConfig } from '../config';
import { TicketQueries } from '../db/queries';
/**
 * McpTix MCP Server
 * Provides Model Context Protocol functionality for McpTix
 */
export declare class McpTixServer {
    private server;
    private ticketQueries;
    private isRunning;
    private config;
    private logger;
    /**
     * Create a new McpTix MCP Server
     * @param ticketQueries The TicketQueries instance to use
     * @param config Configuration options
     */
    constructor(ticketQueries: TicketQueries, config: McpTixConfig);
    /**
     * Start the MCP server
     * @returns A promise that resolves when the server is started
     */
    run(): Promise<McpTixServer>;
    /**
     * Check if the server is running
     * @returns True if the server is running, false otherwise
     */
    isServerRunning(): boolean;
    /**
     * Close the MCP server
     * @returns A promise that resolves when the server is closed
     */
    close(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map
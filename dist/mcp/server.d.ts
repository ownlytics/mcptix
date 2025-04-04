import { TicketQueries } from '../db/queries';
import { EpicTrackerConfig } from '../config';
/**
 * Epic Tracker MCP Server
 * Provides Model Context Protocol functionality for Epic Tracker
 */
export declare class EpicTrackerMcpServer {
    private server;
    private ticketQueries;
    private isRunning;
    private config;
    private logger;
    /**
     * Create a new Epic Tracker MCP Server
     * @param ticketQueries The TicketQueries instance to use
     * @param config Configuration options
     */
    constructor(ticketQueries: TicketQueries, config: EpicTrackerConfig);
    /**
     * Start the MCP server
     * @returns A promise that resolves when the server is started
     */
    run(): Promise<EpicTrackerMcpServer>;
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
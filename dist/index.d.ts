/**
 * McpTix - A reusable ticket tracking system with MCP and API server capabilities
 * Main entry point for the package
 */
import { McpTixConfig } from './config';
import { TicketQueries } from './db/queries';
export * from './types';
export * from './config';
/**
 * Main class for McpTix
 * Provides a unified interface for managing the McpTix system
 */
export declare class McpTix {
    private static isShuttingDown;
    private config;
    private dbService;
    private db;
    private ticketQueries;
    private apiServer?;
    private mcpServer?;
    /**
     * Create a new McpTix instance
     * @param userConfig Configuration options
     */
    constructor(userConfig?: Partial<McpTixConfig>);
    /**
     * Start the McpTix servers
     * @returns A promise that resolves to the McpTix instance
     */
    start(): Promise<McpTix>;
    /**
     * Gracefully shut down McpTix
     * @returns A promise that resolves when shutdown is complete
     */
    shutdown(): Promise<void>;
    /**
     * Clear all data from the database
     * @returns A promise that resolves when the data is cleared
     */
    clearData(): Promise<void>;
    /**
     * Get the ticket queries instance for programmatic access
     * @returns The TicketQueries instance
     */
    getTicketQueries(): TicketQueries;
}
/**
 * Factory function for creating a McpTix instance
 * @param config Configuration options
 * @returns A new McpTix instance
 */
export declare function createMcpTix(config?: Partial<McpTixConfig>): McpTix;
//# sourceMappingURL=index.d.ts.map
/**
 * Epic Tracker - A reusable ticket tracking system with MCP and API server capabilities
 * Main entry point for the package
 */
import { EpicTrackerConfig } from './config';
import { TicketQueries } from './db/queries';
export * from './types';
export * from './config';
/**
 * Main class for Epic Tracker
 * Provides a unified interface for managing the Epic Tracker system
 */
export declare class EpicTracker {
    private config;
    private dbService;
    private db;
    private ticketQueries;
    private apiServer?;
    private mcpServer?;
    /**
     * Create a new Epic Tracker instance
     * @param userConfig Configuration options
     */
    constructor(userConfig?: Partial<EpicTrackerConfig>);
    /**
     * Start the Epic Tracker servers
     * @returns A promise that resolves to the EpicTracker instance
     */
    start(): Promise<EpicTracker>;
    /**
     * Gracefully shut down Epic Tracker
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
 * Factory function for creating an Epic Tracker instance
 * @param config Configuration options
 * @returns A new Epic Tracker instance
 */
export declare function createEpicTracker(config?: Partial<EpicTrackerConfig>): EpicTracker;
//# sourceMappingURL=index.d.ts.map
import express from 'express';
import { TicketQueries } from '../db/queries';
/**
 * API Server class for the mcptix MCP
 */
export declare class ApiServer {
    private app;
    private server;
    private ticketQueries;
    /**
     * Creates a new API server instance
     * @param ticketQueries The TicketQueries instance to use
     */
    constructor(ticketQueries: TicketQueries);
    /**
     * Get the Express application instance
     * @returns The Express application
     */
    getApp(): express.Application;
    /**
     * Check if the server is running
     * @returns True if the server is running, false otherwise
     */
    isRunning(): boolean;
    /**
     * Start the API server
     * @param port The port to listen on (default: 3000)
     * @returns A promise that resolves when the server is started
     */
    /**
     * Start the API server
     * @param port The port to listen on (default: 3000)
     * @param host The host to listen on (default: 'localhost')
     * @returns A promise that resolves when the server is started
     */
    start(port?: number, host?: string): Promise<void>;
    /**
     * Stop the API server
     * @returns A promise that resolves when the server is stopped
     */
    /**
     * Stop the API server
     * @returns A promise that resolves when the server is stopped
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map
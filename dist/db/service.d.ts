import Database from 'better-sqlite3';
import { EpicTrackerConfig } from '../config';
/**
 * Singleton service for managing database connections
 * Ensures consistent database access across all components
 *
 * SIMPLIFIED VERSION: This assumes a more direct approach to database path resolution
 */
export declare class DatabaseService {
    private static instance;
    private db;
    private dbPath;
    private constructor();
    /**
     * Get the singleton instance of the DatabaseService
     */
    static getInstance(): DatabaseService;
    /**
     * Initialize the database with the given configuration
     * @param config The configuration object or path to the database
     * @param clearData Whether to clear existing data
     * @returns The database connection
     */
    initialize(config: EpicTrackerConfig | string, clearData?: boolean): Database.Database;
    /**
     * Get the database connection
     * @returns The database connection
     * @throws Error if the database is not initialized
     */
    getDatabase(): Database.Database;
    /**
     * Close the database connection
     */
    close(): void;
    /**
     * Initialize the database
     * @param dbPath Path to the database file
     * @param clearData Whether to clear existing data
     * @returns The database connection
     */
    private initializeDatabase;
}
//# sourceMappingURL=service.d.ts.map
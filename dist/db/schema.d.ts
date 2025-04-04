import Database from 'better-sqlite3';
/**
 * Ensure the data directory exists for the given database path
 * @param dbPath Path to the database file
 * @returns The directory where the database file will be stored
 */
export declare function ensureDataDirectory(dbPath: string): string;
/**
 * Get the default database path
 * @returns The default database path
 */
export declare function getDefaultDbPath(): string;
export declare const DB_PATH: string;
/**
 * Initialize the database
 * @param dbPath Path to the database file (default: DB_PATH)
 * @param clearData Whether to clear existing data (default: false)
 * @returns The database connection
 */
export declare function initializeDatabase(dbPath?: string, clearData?: boolean): Database.Database;
/**
 * Close the database connection
 * @param db The database connection to close
 */
export declare function closeDatabase(db: Database.Database): void;
/**
 * Clear all data from the database
 * @param db The database connection
 */
export declare function clearDatabase(db: Database.Database): void;
//# sourceMappingURL=schema.d.ts.map
import Database from 'better-sqlite3';
export declare const CURRENT_SCHEMA_VERSION = 2;
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
 * Migrate database to the latest schema version
 * @param db Database connection
 */
export declare function migrateDatabase(db: Database.Database): void;
/**
 * Initialize database with the latest schema
 * @param dbPath Path to the database file
 * @param clearData Whether to clear existing data
 * @returns Database connection
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
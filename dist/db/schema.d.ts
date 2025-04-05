import Database from 'better-sqlite3';
/**
 * SQLite Column Dropping Note:
 *
 * As of SQLite version 3.35.0 (released March 2021), SQLite supports directly dropping columns with:
 * ALTER TABLE table_name DROP COLUMN column_name;
 *
 * For older SQLite versions, column dropping requires a workaround:
 * 1. Create a new table without the column
 * 2. Copy data from the old table to the new one
 * 3. Drop the old table
 * 4. Rename the new table to the original name
 *
 * Our migration system attempts to detect SQLite version and use the appropriate method.
 */
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
 * Get all available migrations with their versions
 * Used for testing and debugging
 * @returns Array of available migration versions
 */
export declare function getAvailableMigrations(): {
    version: number;
    name: string;
}[];
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
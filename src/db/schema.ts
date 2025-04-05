import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { Logger } from '../utils/logger';

import { applyMigrations, getMigrations } from './migrations';

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

// Schema version constants - this should match the highest migration version
export const CURRENT_SCHEMA_VERSION = 3; // Increment this when schema changes

/**
 * Ensure the data directory exists for the given database path
 * @param dbPath Path to the database file
 * @returns The directory where the database file will be stored
 */
export function ensureDataDirectory(dbPath: string): string {
  // Extract the directory from the database path
  const dbDir = path.dirname(dbPath);

  // Handle problematic paths
  if (dbDir === '.' || dbDir === './data' || dbDir === '/.mcptix/data') {
    // Get the current working directory, ensuring it's not '/'
    let cwd = process.cwd();
    if (cwd === '/') {
      // If cwd is root, use the home directory instead
      cwd = process.env.HOME || process.env.USERPROFILE || '/tmp';
    }

    // Use an absolute path based on the safe cwd
    const absoluteDir = path.join(cwd, '.mcptix', 'data');

    console.log(`Using safe data directory: ${absoluteDir}`);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    return absoluteDir;
  }

  // Normal case - create the directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return dbDir;
}

/**
 * Get the default database path
 * @returns The default database path
 */
export function getDefaultDbPath(): string {
  // Use process.cwd() to get the current working directory (user's project)
  // instead of __dirname which points to the package's directory
  const projectRoot = process.cwd();
  const dataDir = path.join(projectRoot, '.mcptix', 'data');
  return path.join(dataDir, 'mcptix.db');
}

// Default database file path
export const DB_PATH = getDefaultDbPath();

/**
 * Migrate database to the latest schema version
 * @param db Database connection
 */
export function migrateDatabase(db: Database.Database): void {
  try {
    // Create schema version table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL
      );
    `);

    // Get current schema version
    let stmt = db.prepare('SELECT version FROM schema_version WHERE id = 1');
    let result = stmt.get() as { version: number } | undefined;

    const currentVersion = result ? result.version : 0;

    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      Logger.info(
        'Schema',
        `Migrating database from version ${currentVersion} to ${CURRENT_SCHEMA_VERSION}`,
      );

      // If this is a fresh database, insert the schema version record
      if (currentVersion === 0) {
        db.prepare('INSERT INTO schema_version (id, version) VALUES (1, 0)').run();
      }

      // Load and apply migrations
      applyMigrations(db, currentVersion, CURRENT_SCHEMA_VERSION);

      Logger.success('Schema', `Database migrated to version ${CURRENT_SCHEMA_VERSION}`);
    } else {
      Logger.info('Schema', `Database schema is up to date (version ${currentVersion})`);
    }
  } catch (error) {
    Logger.error('Schema', 'Error migrating database', error);
    throw error;
  }
}

/**
 * Get all available migrations with their versions
 * Used for testing and debugging
 * @returns Array of available migration versions
 */
export function getAvailableMigrations(): { version: number; name: string }[] {
  const migrations = getMigrations();
  return migrations.map(m => ({ version: m.version, name: m.name }));
}

/**
 * Initialize database with the latest schema
 * @param dbPath Path to the database file
 * @param clearData Whether to clear existing data
 * @returns Database connection
 */
export function initializeDatabase(
  dbPath: string = DB_PATH,
  clearData: boolean = false,
): Database.Database {
  try {
    console.log(`[initializeDatabase] Called with dbPath: ${dbPath}`);
    console.log(`[initializeDatabase] Current working directory: ${process.cwd()}`);
    console.log(`[initializeDatabase] Default DB_PATH: ${DB_PATH}`);

    // Ensure the data directory exists
    const dataDir = ensureDataDirectory(dbPath);
    console.log(`Database directory: ${dataDir}`);

    // Make sure we're using an absolute path for the database file
    let absoluteDbPath = dbPath;
    if (!path.isAbsolute(dbPath)) {
      // If the path is not absolute, make it absolute
      absoluteDbPath = path.join(dataDir, path.basename(dbPath));
      console.log(`Using absolute database path: ${absoluteDbPath}`);
    }

    // If clearData is true and the database file exists, delete it
    if (clearData && fs.existsSync(absoluteDbPath)) {
      console.log(`Clearing existing database at ${absoluteDbPath}`);
      fs.unlinkSync(absoluteDbPath);
    }

    // Create or open the database
    const db = new Database(absoluteDbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Instead of directly creating tables, run migrations
    migrateDatabase(db);

    console.log(`Database initialized at ${dbPath}`);
    return db;
  } catch (error) {
    console.error(
      `Error initializing database: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/**
 * Close the database connection
 * @param db The database connection to close
 */
export function closeDatabase(db: Database.Database): void {
  try {
    db.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error(
      `Error closing database: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Clear all data from the database
 * @param db The database connection
 */
export function clearDatabase(db: Database.Database): void {
  try {
    // Start a transaction
    db.exec('BEGIN TRANSACTION;');

    // Delete all data from tables
    db.exec('DELETE FROM comments;');
    db.exec('DELETE FROM complexity;');
    db.exec('DELETE FROM tickets;');

    // Commit the transaction
    db.exec('COMMIT;');

    console.log('Database cleared');
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK;');
    console.error(
      `Error clearing database: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

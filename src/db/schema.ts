import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { Logger } from '../utils/logger';

// Schema version constants
export const CURRENT_SCHEMA_VERSION = 2; // Increment this when schema changes

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

      // Run migrations based on current version
      if (currentVersion < 1) {
        // Migration to version 1 (base schema)
        applyBaseSchema(db);
      }

      if (currentVersion < 2) {
        // Migration to version 2 (add agent_context column)
        addAgentContextColumn(db);
      }

      // Update schema version
      if (currentVersion === 0) {
        db.prepare('INSERT INTO schema_version (id, version) VALUES (1, ?)').run(
          CURRENT_SCHEMA_VERSION,
        );
      } else {
        db.prepare('UPDATE schema_version SET version = ? WHERE id = 1').run(
          CURRENT_SCHEMA_VERSION,
        );
      }

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
 * Apply base schema (version 1)
 * @param db Database connection
 */
function applyBaseSchema(db: Database.Database): void {
  db.exec(`
    -- Tickets table
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
      status TEXT CHECK(status IN ('backlog', 'up-next', 'in-progress', 'in-review', 'completed')),
      created TEXT NOT NULL,
      updated TEXT NOT NULL
    );

    -- Complexity metrics table
    CREATE TABLE IF NOT EXISTS complexity (
      ticket_id TEXT PRIMARY KEY,
      files_touched INTEGER DEFAULT 0,
      modules_crossed INTEGER DEFAULT 0,
      stack_layers_involved INTEGER DEFAULT 0,
      dependencies INTEGER DEFAULT 0,
      shared_state_touches INTEGER DEFAULT 0,
      cascade_impact_zones INTEGER DEFAULT 0,
      subjectivity_rating REAL DEFAULT 0,
      loc_added INTEGER DEFAULT 0,
      loc_modified INTEGER DEFAULT 0,
      test_cases_written INTEGER DEFAULT 0,
      edge_cases INTEGER DEFAULT 0,
      mocking_complexity INTEGER DEFAULT 0,
      coordination_touchpoints INTEGER DEFAULT 0,
      review_rounds INTEGER DEFAULT 0,
      blockers_encountered INTEGER DEFAULT 0,
      cie_score REAL DEFAULT 0,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    -- Comments table
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      content TEXT,
      type TEXT CHECK(type IN ('comment', 'request_changes', 'change_proposal')),
      author TEXT CHECK(author IN ('developer', 'agent')),
      status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
      timestamp TEXT NOT NULL,
      summary TEXT,
      full_text TEXT,
      display TEXT CHECK(display IN ('expanded', 'collapsed')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_complexity_cie_score ON complexity(cie_score);
  `);

  Logger.info('Schema', 'Applied base schema (version 1)');
}

/**
 * Add agent_context column migration (version 2)
 * @param db Database connection
 */
function addAgentContextColumn(db: Database.Database): void {
  try {
    // Check if the column already exists
    const tableInfo = db.prepare('PRAGMA table_info(tickets)').all() as Array<{ name: string }>;
    const hasAgentContext = tableInfo.some(col => col.name === 'agent_context');

    if (!hasAgentContext) {
      db.exec(`ALTER TABLE tickets ADD COLUMN agent_context TEXT;`);
      Logger.info('Schema', 'Added agent_context column to tickets table');
    } else {
      Logger.info('Schema', 'agent_context column already exists');
    }
  } catch (error) {
    Logger.error('Schema', 'Error adding agent_context column', error);
    throw error;
  }
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

import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

/**
 * Ensure the data directory exists for the given database path
 * @param dbPath Path to the database file
 * @returns The directory where the database file will be stored
 */
export function ensureDataDirectory(dbPath: string): string {
  // Extract the directory from the database path
  const dbDir = path.dirname(dbPath);

  // Handle problematic paths
  if (dbDir === '.' || dbDir === './data' || dbDir === '/.epic-tracker/data') {
    // Get the current working directory, ensuring it's not '/'
    let cwd = process.cwd();
    if (cwd === '/') {
      // If cwd is root, use the home directory instead
      cwd = process.env.HOME || process.env.USERPROFILE || '/tmp';
    }

    // Use an absolute path based on the safe cwd
    const absoluteDir = path.join(cwd, '.epic-tracker', 'data');

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
  const dataDir = path.join(projectRoot, '.epic-tracker', 'data');
  return path.join(dataDir, 'epic-tracker.db');
}

// Default database file path
export const DB_PATH = getDefaultDbPath();

/**
 * Initialize the database
 * @param dbPath Path to the database file (default: DB_PATH)
 * @param clearData Whether to clear existing data (default: false)
 * @returns The database connection
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

    // Create tables with proper constraints and indexes
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

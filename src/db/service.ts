import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { EpicTrackerConfig } from '../config';
import { getDefaultDbPath } from '../db/schema';

/**
 * Singleton service for managing database connections
 * Ensures consistent database access across all components
 *
 * SIMPLIFIED VERSION: This assumes a more direct approach to database path resolution
 */
export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Database.Database | null = null;
  private dbPath: string | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of the DatabaseService
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database with the given configuration
   * @param config The configuration object or path to the database
   * @param clearData Whether to clear existing data
   * @returns The database connection
   */
  public initialize(
    config: EpicTrackerConfig | string,
    clearData: boolean = false,
  ): Database.Database {
    // Log the stack trace to see who's calling this
    console.log('[DatabaseService] Initialize called from:');
    const stackLines = new Error().stack?.split('\n').slice(2, 5);
    if (stackLines) {
      stackLines.forEach(line => console.log(`  ${line.trim()}`));
    }

    // Get the database path from config
    const dbPath = typeof config === 'string' ? config : config.dbPath || getDefaultDbPath();
    console.log(`[DatabaseService] Initializing with path: ${dbPath}`);

    // If already initialized with the same path, return the existing connection
    if (this.db && this.dbPath === dbPath) {
      console.log(`[DatabaseService] Reusing existing database connection: ${this.dbPath}`);
      return this.db;
    }

    // Close existing connection if any
    this.close();

    // Store the database path - ENSURE it's safe
    if (path.isAbsolute(dbPath) && dbPath.startsWith('/') && path.dirname(dbPath) === '/') {
      // This is a dangerous path at the root - redirect to a safe location
      console.log(`[DatabaseService] WARNING: Unsafe path detected: ${dbPath}`);

      // Use home directory or current directory instead
      const safeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
      const safePath = path.join(safeDir, '.epic-tracker', 'data', 'epic-tracker.db');

      console.log(`[DatabaseService] Redirecting to safe path: ${safePath}`);
      this.dbPath = safePath;
    } else {
      this.dbPath = dbPath;
    }

    console.log(`[DatabaseService] Initializing database at: ${this.dbPath}`);
    console.log(`[DatabaseService] Current working directory: ${process.cwd()}`);

    // Ensure the directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`[DatabaseService] Created directory: ${dbDir}`);
      } catch (error) {
        console.error(
          `[DatabaseService] Failed to create directory: ${error instanceof Error ? error.message : String(error)}`,
        );

        // Fall back to a directory we know we can write to
        const fallbackDir = path.join(
          process.env.HOME || process.env.USERPROFILE || process.cwd(),
          '.epic-tracker',
          'data',
        );
        console.log(`[DatabaseService] Falling back to: ${fallbackDir}`);

        // Create the fallback directory
        fs.mkdirSync(fallbackDir, { recursive: true });

        // Update the database path
        this.dbPath = path.join(fallbackDir, 'epic-tracker.db');
        console.log(`[DatabaseService] Using fallback path: ${this.dbPath}`);
      }
    }

    // Initialize the database
    this.db = this.initializeDatabase(this.dbPath, clearData);
    return this.db;
  }

  /**
   * Get the database connection
   * @returns The database connection
   * @throws Error if the database is not initialized
   */
  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPath = null;
      console.log('[DatabaseService] Database connection closed');
    }
  }

  /**
   * Initialize the database
   * @param dbPath Path to the database file
   * @param clearData Whether to clear existing data
   * @returns The database connection
   */
  private initializeDatabase(dbPath: string, clearData: boolean = false): Database.Database {
    try {
      // If clearData is true and the database file exists, delete it
      if (clearData && fs.existsSync(dbPath)) {
        console.log(`[DatabaseService] Clearing existing database at ${dbPath}`);
        fs.unlinkSync(dbPath);
      }

      // Create or open the database
      const db = new Database(dbPath);

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

      console.log(`[DatabaseService] Database initialized at ${dbPath}`);
      return db;
    } catch (error) {
      console.error(
        `[DatabaseService] Error initializing database: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}

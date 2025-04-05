"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_PATH = exports.CURRENT_SCHEMA_VERSION = void 0;
exports.ensureDataDirectory = ensureDataDirectory;
exports.getDefaultDbPath = getDefaultDbPath;
exports.migrateDatabase = migrateDatabase;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
exports.clearDatabase = clearDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const logger_1 = require("../utils/logger");
// Schema version constants
exports.CURRENT_SCHEMA_VERSION = 2; // Increment this when schema changes
/**
 * Ensure the data directory exists for the given database path
 * @param dbPath Path to the database file
 * @returns The directory where the database file will be stored
 */
function ensureDataDirectory(dbPath) {
    // Extract the directory from the database path
    const dbDir = path_1.default.dirname(dbPath);
    // Handle problematic paths
    if (dbDir === '.' || dbDir === './data' || dbDir === '/.mcptix/data') {
        // Get the current working directory, ensuring it's not '/'
        let cwd = process.cwd();
        if (cwd === '/') {
            // If cwd is root, use the home directory instead
            cwd = process.env.HOME || process.env.USERPROFILE || '/tmp';
        }
        // Use an absolute path based on the safe cwd
        const absoluteDir = path_1.default.join(cwd, '.mcptix', 'data');
        console.log(`Using safe data directory: ${absoluteDir}`);
        // Create the directory if it doesn't exist
        if (!fs_1.default.existsSync(absoluteDir)) {
            fs_1.default.mkdirSync(absoluteDir, { recursive: true });
        }
        return absoluteDir;
    }
    // Normal case - create the directory if it doesn't exist
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    return dbDir;
}
/**
 * Get the default database path
 * @returns The default database path
 */
function getDefaultDbPath() {
    // Use process.cwd() to get the current working directory (user's project)
    // instead of __dirname which points to the package's directory
    const projectRoot = process.cwd();
    const dataDir = path_1.default.join(projectRoot, '.mcptix', 'data');
    return path_1.default.join(dataDir, 'mcptix.db');
}
// Default database file path
exports.DB_PATH = getDefaultDbPath();
/**
 * Migrate database to the latest schema version
 * @param db Database connection
 */
function migrateDatabase(db) {
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
        let result = stmt.get();
        const currentVersion = result ? result.version : 0;
        if (currentVersion < exports.CURRENT_SCHEMA_VERSION) {
            logger_1.Logger.info('Schema', `Migrating database from version ${currentVersion} to ${exports.CURRENT_SCHEMA_VERSION}`);
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
                db.prepare('INSERT INTO schema_version (id, version) VALUES (1, ?)').run(exports.CURRENT_SCHEMA_VERSION);
            }
            else {
                db.prepare('UPDATE schema_version SET version = ? WHERE id = 1').run(exports.CURRENT_SCHEMA_VERSION);
            }
            logger_1.Logger.success('Schema', `Database migrated to version ${exports.CURRENT_SCHEMA_VERSION}`);
        }
        else {
            logger_1.Logger.info('Schema', `Database schema is up to date (version ${currentVersion})`);
        }
    }
    catch (error) {
        logger_1.Logger.error('Schema', 'Error migrating database', error);
        throw error;
    }
}
/**
 * Apply base schema (version 1)
 * @param db Database connection
 */
function applyBaseSchema(db) {
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
    logger_1.Logger.info('Schema', 'Applied base schema (version 1)');
}
/**
 * Add agent_context column migration (version 2)
 * @param db Database connection
 */
function addAgentContextColumn(db) {
    try {
        // Check if the column already exists
        const tableInfo = db.prepare('PRAGMA table_info(tickets)').all();
        const hasAgentContext = tableInfo.some(col => col.name === 'agent_context');
        if (!hasAgentContext) {
            db.exec(`ALTER TABLE tickets ADD COLUMN agent_context TEXT;`);
            logger_1.Logger.info('Schema', 'Added agent_context column to tickets table');
        }
        else {
            logger_1.Logger.info('Schema', 'agent_context column already exists');
        }
    }
    catch (error) {
        logger_1.Logger.error('Schema', 'Error adding agent_context column', error);
        throw error;
    }
}
/**
 * Initialize database with the latest schema
 * @param dbPath Path to the database file
 * @param clearData Whether to clear existing data
 * @returns Database connection
 */
function initializeDatabase(dbPath = exports.DB_PATH, clearData = false) {
    try {
        console.log(`[initializeDatabase] Called with dbPath: ${dbPath}`);
        console.log(`[initializeDatabase] Current working directory: ${process.cwd()}`);
        console.log(`[initializeDatabase] Default DB_PATH: ${exports.DB_PATH}`);
        // Ensure the data directory exists
        const dataDir = ensureDataDirectory(dbPath);
        console.log(`Database directory: ${dataDir}`);
        // Make sure we're using an absolute path for the database file
        let absoluteDbPath = dbPath;
        if (!path_1.default.isAbsolute(dbPath)) {
            // If the path is not absolute, make it absolute
            absoluteDbPath = path_1.default.join(dataDir, path_1.default.basename(dbPath));
            console.log(`Using absolute database path: ${absoluteDbPath}`);
        }
        // If clearData is true and the database file exists, delete it
        if (clearData && fs_1.default.existsSync(absoluteDbPath)) {
            console.log(`Clearing existing database at ${absoluteDbPath}`);
            fs_1.default.unlinkSync(absoluteDbPath);
        }
        // Create or open the database
        const db = new better_sqlite3_1.default(absoluteDbPath);
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        // Instead of directly creating tables, run migrations
        migrateDatabase(db);
        console.log(`Database initialized at ${dbPath}`);
        return db;
    }
    catch (error) {
        console.error(`Error initializing database: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
/**
 * Close the database connection
 * @param db The database connection to close
 */
function closeDatabase(db) {
    try {
        db.close();
        console.log('Database connection closed');
    }
    catch (error) {
        console.error(`Error closing database: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Clear all data from the database
 * @param db The database connection
 */
function clearDatabase(db) {
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
    }
    catch (error) {
        // Rollback on error
        db.exec('ROLLBACK;');
        console.error(`Error clearing database: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
//# sourceMappingURL=schema.js.map
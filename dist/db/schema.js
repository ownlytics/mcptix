"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_PATH = exports.CURRENT_SCHEMA_VERSION = void 0;
exports.ensureDataDirectory = ensureDataDirectory;
exports.getDefaultDbPath = getDefaultDbPath;
exports.migrateDatabase = migrateDatabase;
exports.getAvailableMigrations = getAvailableMigrations;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
exports.clearDatabase = clearDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const logger_1 = require("../utils/logger");
const migrations_1 = require("./migrations");
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
exports.CURRENT_SCHEMA_VERSION = 4; // Increment this when schema changes
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
        logger_1.Logger.info('Database', `Using safe data directory: ${absoluteDir}`);
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
            // If this is a fresh database, insert the schema version record
            if (currentVersion === 0) {
                db.prepare('INSERT INTO schema_version (id, version) VALUES (1, 0)').run();
            }
            // Load and apply migrations
            (0, migrations_1.applyMigrations)(db, currentVersion, exports.CURRENT_SCHEMA_VERSION);
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
 * Get all available migrations with their versions
 * Used for testing and debugging
 * @returns Array of available migration versions
 */
function getAvailableMigrations() {
    const migrations = (0, migrations_1.getMigrations)();
    return migrations.map(m => ({ version: m.version, name: m.name }));
}
/**
 * Initialize database with the latest schema
 * @param dbPath Path to the database file
 * @param clearData Whether to clear existing data
 * @returns Database connection
 */
function initializeDatabase(dbPath = exports.DB_PATH, clearData = false) {
    try {
        logger_1.Logger.info('Database', `initializeDatabase called with dbPath: ${dbPath}`);
        logger_1.Logger.info('Database', `Current working directory: ${process.cwd()}`);
        logger_1.Logger.info('Database', `Default DB_PATH: ${exports.DB_PATH}`);
        // Ensure the data directory exists
        const dataDir = ensureDataDirectory(dbPath);
        logger_1.Logger.info('Database', `Database directory: ${dataDir}`);
        // Make sure we're using an absolute path for the database file
        let absoluteDbPath = dbPath;
        if (!path_1.default.isAbsolute(dbPath)) {
            // If the path is not absolute, make it absolute
            absoluteDbPath = path_1.default.join(dataDir, path_1.default.basename(dbPath));
            logger_1.Logger.info('Database', `Using absolute database path: ${absoluteDbPath}`);
        }
        // If clearData is true and the database file exists, delete it
        if (clearData && fs_1.default.existsSync(absoluteDbPath)) {
            logger_1.Logger.info('Database', `Clearing existing database at ${absoluteDbPath}`);
            fs_1.default.unlinkSync(absoluteDbPath);
        }
        // Create or open the database
        const db = new better_sqlite3_1.default(absoluteDbPath);
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        // Instead of directly creating tables, run migrations
        migrateDatabase(db);
        logger_1.Logger.info('Database', `Database initialized at ${dbPath}`);
        return db;
    }
    catch (error) {
        logger_1.Logger.error('Database', 'Error initializing database', error);
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
        logger_1.Logger.info('Database', 'Database connection closed');
    }
    catch (error) {
        logger_1.Logger.error('Database', 'Error closing database', error);
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
        logger_1.Logger.info('Database', 'Database cleared');
    }
    catch (error) {
        // Rollback on error
        db.exec('ROLLBACK;');
        logger_1.Logger.error('Database', 'Error clearing database', error);
        throw error;
    }
}
//# sourceMappingURL=schema.js.map
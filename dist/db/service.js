"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const schema_1 = require("../db/schema");
const logger_1 = require("../utils/logger");
/**
 * Singleton service for managing database connections
 * Ensures consistent database access across all components
 *
 * SIMPLIFIED VERSION: This assumes a more direct approach to database path resolution
 */
class DatabaseService {
    constructor() {
        this.db = null;
        this.dbPath = null;
    }
    /**
     * Get the singleton instance of the DatabaseService
     */
    static getInstance() {
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
    initialize(config, clearData = false) {
        // Log the stack trace to see who's calling this
        logger_1.Logger.debug('DatabaseService', 'Initialize called from:');
        const stackLines = new Error().stack?.split('\n').slice(2, 5);
        if (stackLines) {
            stackLines.forEach(line => logger_1.Logger.debug('DatabaseService', `  ${line.trim()}`));
        }
        // Get the database path from config
        const dbPath = typeof config === 'string' ? config : config.dbPath || (0, schema_1.getDefaultDbPath)();
        logger_1.Logger.info('DatabaseService', `Initializing with path: ${dbPath}`);
        // If already initialized with the same path, return the existing connection
        if (this.db && this.dbPath === dbPath) {
            logger_1.Logger.info('DatabaseService', `Reusing existing database connection: ${this.dbPath}`);
            return this.db;
        }
        // Close existing connection if any
        this.close();
        // Store the database path - ENSURE it's safe
        if (path_1.default.isAbsolute(dbPath) && dbPath.startsWith('/') && path_1.default.dirname(dbPath) === '/') {
            // This is a dangerous path at the root - redirect to a safe location
            logger_1.Logger.warn('DatabaseService', `Unsafe path detected: ${dbPath}`);
            // Use home directory or current directory instead
            const safeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
            const safePath = path_1.default.join(safeDir, '.epic-tracker', 'data', 'epic-tracker.db');
            logger_1.Logger.info('DatabaseService', `Redirecting to safe path: ${safePath}`);
            console.log(`[DatabaseService] Redirecting to safe path: ${safePath}`);
            this.dbPath = safePath;
        }
        else {
            this.dbPath = dbPath;
        }
        logger_1.Logger.info('DatabaseService', `Initializing database at: ${this.dbPath}`);
        logger_1.Logger.debug('DatabaseService', `Current working directory: ${process.cwd()}`);
        // Ensure the directory exists
        const dbDir = path_1.default.dirname(this.dbPath);
        if (!fs_1.default.existsSync(dbDir)) {
            try {
                fs_1.default.mkdirSync(dbDir, { recursive: true });
                logger_1.Logger.info('DatabaseService', `Created directory: ${dbDir}`);
            }
            catch (error) {
                logger_1.Logger.error('DatabaseService', `Failed to create directory: ${dbDir}`, error);
                // Fall back to a directory we know we can write to
                const fallbackDir = path_1.default.join(process.env.HOME || process.env.USERPROFILE || process.cwd(), '.epic-tracker', 'data');
                logger_1.Logger.info('DatabaseService', `Falling back to: ${fallbackDir}`);
                // Create the fallback directory
                fs_1.default.mkdirSync(fallbackDir, { recursive: true });
                // Update the database path
                this.dbPath = path_1.default.join(fallbackDir, 'epic-tracker.db');
                logger_1.Logger.info('DatabaseService', `Using fallback path: ${this.dbPath}`);
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
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }
    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.dbPath = null;
            logger_1.Logger.info('DatabaseService', 'Database connection closed');
        }
    }
    /**
     * Initialize the database
     * @param dbPath Path to the database file
     * @param clearData Whether to clear existing data
     * @returns The database connection
     */
    initializeDatabase(dbPath, clearData = false) {
        try {
            // If clearData is true and the database file exists, delete it
            if (clearData && fs_1.default.existsSync(dbPath)) {
                logger_1.Logger.info('DatabaseService', `Clearing existing database at ${dbPath}`);
                fs_1.default.unlinkSync(dbPath);
            }
            // Create or open the database
            const db = new better_sqlite3_1.default(dbPath);
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
            logger_1.Logger.success('DatabaseService', `Database initialized at ${dbPath}`);
            return db;
        }
        catch (error) {
            logger_1.Logger.error('DatabaseService', 'Error initializing database', error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
DatabaseService.instance = null;
//# sourceMappingURL=service.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_PATH = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure the data directory exists
// Use __dirname to get the directory of the current file
// Then navigate up to the project root and create a data directory there
const projectRoot = path_1.default.resolve(__dirname, '..', '..');
const dataDir = path_1.default.join(projectRoot, 'data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
// Log the data directory path for debugging
console.log(`Data directory: ${dataDir}`);
// Database file path
exports.DB_PATH = path_1.default.join(dataDir, 'epic-tracker.db');
function initializeDatabase(dbPath = exports.DB_PATH) {
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
    return db;
}
// Close the database connection
function closeDatabase(db) {
    db.close();
}
//# sourceMappingURL=schema.js.map
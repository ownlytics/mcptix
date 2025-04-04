"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTestDatabase = initTestDatabase;
exports.cleanupTestDatabase = cleanupTestDatabase;
exports.resetTestDatabase = resetTestDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const queries_1 = require("../../db/queries");
const schema_1 = require("../../db/schema");
// Use a separate test database
const TEST_DB_PATH = path_1.default.join(__dirname, '../../../data/test-epic-tracker.db');
// Initialize test database
function initTestDatabase() {
    // Ensure the data directory exists
    const dataDir = path_1.default.dirname(TEST_DB_PATH);
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    // Remove existing test database if it exists
    if (fs_1.default.existsSync(TEST_DB_PATH)) {
        fs_1.default.unlinkSync(TEST_DB_PATH);
    }
    // Create a new database with write permissions
    const db = new better_sqlite3_1.default(TEST_DB_PATH, { fileMustExist: false });
    // Initialize the schema
    db.pragma('foreign_keys = ON');
    // Create tables
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
    const ticketQueries = new queries_1.TicketQueries(db);
    return { db, ticketQueries };
}
// Clean up test database
function cleanupTestDatabase(db) {
    (0, schema_1.closeDatabase)(db);
    // Optionally remove the test database file
    if (fs_1.default.existsSync(TEST_DB_PATH)) {
        fs_1.default.unlinkSync(TEST_DB_PATH);
    }
}
// Reset database between tests
function resetTestDatabase(db) {
    db.exec('DELETE FROM comments');
    db.exec('DELETE FROM complexity');
    db.exec('DELETE FROM tickets');
}
//# sourceMappingURL=test-utils.js.map
import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { TicketQueries } from '../../db/queries';
import { initializeDatabase, closeDatabase } from '../../db/schema';

// Use a separate test database
const TEST_DB_PATH = path.join(__dirname, '../../../data/test-mcptix.db');

// Initialize test database
export function initTestDatabase(): { db: Database.Database; ticketQueries: TicketQueries } {
  // Always use in-memory database for tests to avoid file permission issues
  console.log('[TEST] Creating new in-memory database for tests');
  const db = new Database(':memory:', { readonly: false });

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
      updated TEXT NOT NULL,
      agent_context TEXT,
      order_value REAL DEFAULT 0
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
    CREATE INDEX IF NOT EXISTS idx_tickets_order_value ON tickets(order_value);
  `);
  const ticketQueries = new TicketQueries(db);
  return { db, ticketQueries };
}

// Clean up test database
export function cleanupTestDatabase(db: Database.Database): void {
  // In-memory databases are automatically cleaned up when closed
  db.close();
}

// Reset database between tests
export function resetTestDatabase(db: Database.Database): void {
  try {
    // Use a transaction to ensure all deletes happen or none
    db.exec('BEGIN TRANSACTION;');
    db.exec('DELETE FROM comments;');
    db.exec('DELETE FROM complexity;');
    db.exec('DELETE FROM tickets;');
    db.exec('COMMIT;');
  } catch (error) {
    console.error('Error resetting test database:', error);
    // Try to rollback if possible
    try {
      db.exec('ROLLBACK;');
    } catch (rollbackError) {
      // Ignore rollback errors
    }

    // If we can't delete data, let's recreate the in-memory tables
    try {
      // Drop and recreate tables
      db.exec('DROP TABLE IF EXISTS comments;');
      db.exec('DROP TABLE IF EXISTS complexity;');
      db.exec('DROP TABLE IF EXISTS tickets;');

      // Recreate tables
      db.exec(`
        -- Tickets table
        CREATE TABLE IF NOT EXISTS tickets (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
          status TEXT CHECK(status IN ('backlog', 'up-next', 'in-progress', 'in-review', 'completed')),
          created TEXT NOT NULL,
          updated TEXT NOT NULL,
          agent_context TEXT,
          order_value REAL DEFAULT 0
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
        
        -- Index for order_value
        CREATE INDEX IF NOT EXISTS idx_tickets_order_value ON tickets(order_value);
      `);
    } catch (recreateError) {
      console.error('Failed to recreate tables:', recreateError);
      // At this point, we've done our best to handle the error
    }
  }
}

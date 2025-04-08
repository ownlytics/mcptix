import Database from 'better-sqlite3';
import { Logger } from '../../utils/logger';
import { Migration } from './index';

/**
 * Migration 1: Base schema
 *
 * Implements the initial database schema with:
 * - tickets table
 * - complexity table
 * - comments table
 * - necessary indexes
 */
const migration: Migration = {
  version: 1,
  name: 'Base Schema',

  up: (db: Database.Database): void => {
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

    Logger.info('Migration', 'Applied base schema (version 1)');
  },

  down: (db: Database.Database): void => {
    // Drop tables and indexes in reverse order of dependencies
    db.exec(`
      -- Drop indexes
      DROP INDEX IF EXISTS idx_complexity_cie_score;
      DROP INDEX IF EXISTS idx_comments_ticket_id;
      DROP INDEX IF EXISTS idx_tickets_priority;
      DROP INDEX IF EXISTS idx_tickets_status;
      
      -- Drop tables
      DROP TABLE IF EXISTS comments;
      DROP TABLE IF EXISTS complexity;
      DROP TABLE IF EXISTS tickets;
    `);

    Logger.info('Migration', 'Rolled back base schema (version 1)');
  },
};

export default migration;

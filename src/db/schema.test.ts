import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { initializeDatabase, closeDatabase, CURRENT_SCHEMA_VERSION } from './schema';

describe('Database Schema', () => {
  const testDbPath = path.join(process.cwd(), 'test.db');

  // Clean up test database before and after tests
  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should create database with required tables', () => {
    const db = initializeDatabase(testDbPath);

    // Check if tables exist
    const tables = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('tickets', 'complexity', 'comments')
    `,
      )
      .all();

    expect(tables.length).toBe(3);

    // Check if indexes exist
    const indexes = db
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='index' 
      AND name IN (
        'idx_tickets_status', 
        'idx_tickets_priority', 
        'idx_comments_ticket_id', 
        'idx_complexity_cie_score'
      )
    `,
      )
      .all();

    expect(indexes.length).toBe(4);

    closeDatabase(db);
  });

  test('should enforce foreign key constraints', () => {
    const db = initializeDatabase(testDbPath);

    // Insert a ticket
    db.prepare(
      `
      INSERT INTO tickets (id, title, priority, status, created, updated)
      VALUES ('test-ticket', 'Test Ticket', 'medium', 'backlog', '2023-01-01', '2023-01-01')
    `,
    ).run();

    // Insert a comment with valid ticket_id
    const validInsert = () => {
      db.prepare(
        `
        INSERT INTO comments (id, ticket_id, type, author, status, timestamp)
        VALUES ('test-comment', 'test-ticket', 'comment', 'developer', 'open', '2023-01-01')
      `,
      ).run();
    };

    expect(validInsert).not.toThrow();

    // Try to insert a comment with invalid ticket_id
    const invalidInsert = () => {
      db.prepare(
        `
        INSERT INTO comments (id, ticket_id, type, author, status, timestamp)
        VALUES ('test-comment-2', 'non-existent-ticket', 'comment', 'developer', 'open', '2023-01-01')
      `,
      ).run();
    };

    expect(invalidInsert).toThrow();

    closeDatabase(db);
  });

  test('should set correct schema version', () => {
    const db = initializeDatabase(testDbPath);

    // Check if schema_version table exists and has the correct version
    const versionResult = db.prepare('SELECT version FROM schema_version WHERE id = 1').get() as
      | { version: number }
      | undefined;

    expect(versionResult).toBeDefined();
    expect(versionResult?.version).toBe(CURRENT_SCHEMA_VERSION);

    closeDatabase(db);
  });

  test('should include agent_context column in tickets table', () => {
    const db = initializeDatabase(testDbPath);

    // Check if the agent_context column exists in the tickets table
    const tableInfo = db.prepare('PRAGMA table_info(tickets)').all() as Array<{ name: string }>;
    const hasAgentContext = tableInfo.some(col => col.name === 'agent_context');

    expect(hasAgentContext).toBe(true);

    closeDatabase(db);
  });

  test('should migrate from older schema version', () => {
    // Create a database with an older schema (version 1)
    const db = new Database(testDbPath);

    // Create schema_version table with version 1
    db.exec(`
      CREATE TABLE schema_version (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL
      );
      INSERT INTO schema_version (id, version) VALUES (1, 1);
    `);

    // Create tickets table without agent_context column (version 1 schema)
    db.exec(`
      CREATE TABLE tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
        status TEXT CHECK(status IN ('backlog', 'up-next', 'in-progress', 'in-review', 'completed')),
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      );
    `);

    db.close();

    // Now initialize the database again, which should trigger migration
    const migratedDb = initializeDatabase(testDbPath, false);

    // Check that the schema version was updated
    const versionResult = migratedDb
      .prepare('SELECT version FROM schema_version WHERE id = 1')
      .get() as { version: number } | undefined;

    expect(versionResult?.version).toBe(CURRENT_SCHEMA_VERSION);

    // Check that the agent_context column was added
    const tableInfo = migratedDb.prepare('PRAGMA table_info(tickets)').all() as Array<{
      name: string;
    }>;
    const hasAgentContext = tableInfo.some(col => col.name === 'agent_context');

    expect(hasAgentContext).toBe(true);

    closeDatabase(migratedDb);
  });
});

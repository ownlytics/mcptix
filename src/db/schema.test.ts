import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Logger } from '../utils/logger';
import { initializeDatabase, closeDatabase, CURRENT_SCHEMA_VERSION, getAvailableMigrations } from './schema';

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
        INSERT INTO comments (id, ticket_id, content, author, timestamp)
        VALUES ('test-comment', 'test-ticket', 'Test comment', 'developer', '2023-01-01')
      `,
      ).run();
    };

    expect(validInsert).not.toThrow();

    // Try to insert a comment with invalid ticket_id
    const invalidInsert = () => {
      db.prepare(
        `
        INSERT INTO comments (id, ticket_id, content, author, timestamp)
        VALUES ('test-comment-2', 'non-existent-ticket', 'Test comment', 'developer', '2023-01-01')
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

  test('should load available migrations', () => {
    // This test verifies that migrations are properly loaded
    const migrations = getAvailableMigrations();

    // We should have at least four migrations
    expect(migrations.length).toBeGreaterThanOrEqual(4);

    // Verify that the migrations have the expected versions and are sorted
    expect(migrations[0].version).toBe(1);
    expect(migrations[1].version).toBe(2);
    expect(migrations[2].version).toBe(3);
    expect(migrations[3].version).toBe(4);

    // Verify that migration names are meaningful
    expect(migrations[0].name).toMatch(/base|schema/i);
    expect(migrations[1].name).toMatch(/agent|context/i);
    expect(migrations[3].name).toMatch(/simplify|comments/i);
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
      
      -- Create a basic comments table with all columns needed for migration
      CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        content TEXT,
        type TEXT DEFAULT 'comment',
        author TEXT CHECK(author IN ('developer', 'agent')),
        status TEXT DEFAULT 'open',
        timestamp TEXT NOT NULL,
        summary TEXT,
        full_text TEXT,
        display TEXT DEFAULT 'collapsed',
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );
    `);

    db.close();

    // Now initialize the database again, which should trigger migration
    const migratedDb = initializeDatabase(testDbPath, false);

    // Check that the schema version was updated
    const versionResult = migratedDb.prepare('SELECT version FROM schema_version WHERE id = 1').get() as
      | { version: number }
      | undefined;

    expect(versionResult?.version).toBe(CURRENT_SCHEMA_VERSION);

    // Check that the agent_context column was added
    const tableInfo = migratedDb.prepare('PRAGMA table_info(tickets)').all() as Array<{
      name: string;
    }>;
    const hasAgentContext = tableInfo.some(col => col.name === 'agent_context');

    expect(hasAgentContext).toBe(true);

    closeDatabase(migratedDb);
  });

  test('should handle column dropping based on SQLite version', () => {
    const db = initializeDatabase(testDbPath);

    // First, create a test table with columns we'll try to drop
    db.exec(`
      CREATE TABLE test_column_drop (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        to_drop1 TEXT,
        to_drop2 TEXT
      );
    `);

    // Get the SQLite version
    const versionResult = db.prepare('SELECT sqlite_version() as version').get() as {
      version: string;
    };
    const sqliteVersion = versionResult.version;
    const [major, minor, patch] = sqliteVersion.split('.').map(Number);

    // SQLite 3.35.0 and newer support direct column dropping
    const supportsDropColumn = major > 3 || (major === 3 && minor >= 35);

    if (supportsDropColumn) {
      // Test direct column dropping for modern SQLite
      expect(() => {
        db.exec(`ALTER TABLE test_column_drop DROP COLUMN to_drop1;`);
      }).not.toThrow();

      // Verify column was dropped
      const tableInfo = db.prepare('PRAGMA table_info(test_column_drop)').all() as Array<{
        name: string;
      }>;
      const columnNames = tableInfo.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).not.toContain('to_drop1');
    } else {
      // Test workaround for older SQLite versions
      // This is the approach used in our migration system
      expect(() => {
        // Create temp table without the column
        db.exec(`
          CREATE TABLE temp_table (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            to_drop2 TEXT
          );
          
          -- Copy data excluding dropped column
          INSERT INTO temp_table (id, name, description, to_drop2)
          SELECT id, name, description, to_drop2
          FROM test_column_drop;
          
          -- Drop original table
          DROP TABLE test_column_drop;
          
          -- Rename temp table
          ALTER TABLE temp_table RENAME TO test_column_drop;
        `);
      }).not.toThrow();

      // Verify column was dropped
      const tableInfo = db.prepare('PRAGMA table_info(test_column_drop)').all() as Array<{
        name: string;
      }>;
      const columnNames = tableInfo.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).not.toContain('to_drop1');
    }

    // Log which approach was used
    Logger.info(
      'Database',
      `SQLite ${sqliteVersion} - Used ${supportsDropColumn ? 'direct DROP COLUMN' : 'table recreation'} approach`,
    );

    closeDatabase(db);
  });
});

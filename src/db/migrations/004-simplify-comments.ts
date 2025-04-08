import Database from 'better-sqlite3';
import { Logger } from '../../utils/logger';
import { Migration } from './index';

/**
 * Migration 4: Simplify Comments Table
 *
 * This migration:
 * 1. Consolidates content/summary/full_text into a single content field
 * 2. Removes unused columns (type, status, summary, full_text, display)
 */
const migration: Migration = {
  version: 4,
  name: 'Simplify Comments',

  up: (db: Database.Database): void => {
    // Check SQLite version to determine approach
    const versionRow = db.prepare('SELECT sqlite_version() as version').get() as { version: string };
    const sqliteVersion = versionRow.version;
    const canUseDropColumn = compareVersions(sqliteVersion, '3.35.0') >= 0;

    Logger.info('Migration', `SQLite version: ${sqliteVersion}, can use DROP COLUMN: ${canUseDropColumn}`);

    // Don't start a transaction - the migration system already handles transactions

    // 1. First consolidate content from potentially multiple fields
    db.exec(`
        -- Update comments where content is empty but full_text exists
        UPDATE comments 
        SET content = full_text 
        WHERE (content IS NULL OR content = '') 
        AND full_text IS NOT NULL 
        AND full_text != '';
        
        -- Update comments where content is still empty but summary exists
        UPDATE comments 
        SET content = summary 
        WHERE (content IS NULL OR content = '') 
        AND summary IS NOT NULL 
        AND summary != '';
        
        -- Ensure content is at least an empty string (not NULL)
        UPDATE comments 
        SET content = '' 
        WHERE content IS NULL;
      `);

    // 2. Modify the table structure based on SQLite version capability
    if (canUseDropColumn) {
      // Modern SQLite approach - directly drop columns
      db.exec(`
          -- Drop unused columns
          ALTER TABLE comments DROP COLUMN type;
          ALTER TABLE comments DROP COLUMN status;
          ALTER TABLE comments DROP COLUMN summary;
          ALTER TABLE comments DROP COLUMN full_text;
          ALTER TABLE comments DROP COLUMN display;
          
          -- Make content NOT NULL
          ALTER TABLE comments RENAME TO comments_old;
          CREATE TABLE comments (
            id TEXT PRIMARY KEY,
            ticket_id TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT CHECK(author IN ('developer', 'agent')),
            timestamp TEXT NOT NULL,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
          );
          INSERT INTO comments 
          SELECT id, ticket_id, content, author, timestamp 
          FROM comments_old;
          DROP TABLE comments_old;
        `);
    } else {
      // Legacy SQLite approach - create new table and copy data
      db.exec(`
          -- Create new simplified table
          CREATE TABLE comments_new (
            id TEXT PRIMARY KEY,
            ticket_id TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT CHECK(author IN ('developer', 'agent')),
            timestamp TEXT NOT NULL,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
          );
          
          -- Copy data to new table
          INSERT INTO comments_new (id, ticket_id, content, author, timestamp)
          SELECT id, ticket_id, content, author, timestamp
          FROM comments;
          
          -- Drop old table and rename new one
          DROP TABLE comments;
          ALTER TABLE comments_new RENAME TO comments;
        `);
    }

    // 3. Recreate index
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
      `);

    Logger.info('Migration', 'Successfully simplified comments table (version 4)');
  },

  down: (db: Database.Database): void => {
    // Don't start a transaction - the migration system already handles transactions

    // Add back the columns with defaults
    db.exec(`
        -- Create new table with original structure
        CREATE TABLE comments_new (
          id TEXT PRIMARY KEY,
          ticket_id TEXT NOT NULL,
          content TEXT,
          type TEXT DEFAULT 'comment' CHECK(type IN ('comment', 'request_changes', 'change_proposal')),
          author TEXT CHECK(author IN ('developer', 'agent')),
          status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
          timestamp TEXT NOT NULL,
          summary TEXT,
          full_text TEXT,
          display TEXT DEFAULT 'collapsed' CHECK(display IN ('expanded', 'collapsed')),
          FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        );
        
        -- Copy data to new table
        INSERT INTO comments_new (id, ticket_id, content, author, timestamp)
        SELECT id, ticket_id, content, author, timestamp
        FROM comments;
        
        -- Drop old table and rename new one
        DROP TABLE comments;
        ALTER TABLE comments_new RENAME TO comments;
        
        -- Recreate index
        CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
      `);

    Logger.info('Migration', 'Successfully rolled back comments table simplification (version 4)');
  },
};

/**
 * Compare two version strings (e.g., "3.35.0" vs "3.34.1")
 * Returns:
 *  1 if version1 > version2
 *  0 if version1 = version2
 * -1 if version1 < version2
 */
function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

export default migration;

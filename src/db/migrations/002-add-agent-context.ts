import Database from 'better-sqlite3';

import { Logger } from '../../utils/logger';

import { Migration } from './index';

/**
 * Migration 2: Add agent_context column to tickets table
 *
 * Adds a new column to store AI agent's context information
 */
const migration: Migration = {
  version: 2,
  name: 'Add Agent Context Column',

  up: (db: Database.Database): void => {
    try {
      // Check if the column already exists
      const tableInfo = db.prepare('PRAGMA table_info(tickets)').all() as Array<{ name: string }>;
      const hasAgentContext = tableInfo.some(col => col.name === 'agent_context');

      if (!hasAgentContext) {
        db.exec(`ALTER TABLE tickets ADD COLUMN agent_context TEXT;`);
        Logger.info('Migration', 'Added agent_context column to tickets table');
      } else {
        Logger.info('Migration', 'agent_context column already exists');
      }
    } catch (error) {
      Logger.error('Migration', 'Error adding agent_context column', error);
      throw error;
    }
  },

  down: (db: Database.Database): void => {
    try {
      // Check SQLite version to see if direct column dropping is supported
      const versionResult = db.prepare('SELECT sqlite_version() as version').get() as {
        version: string;
      };
      const sqliteVersion = versionResult.version;
      const [major, minor] = sqliteVersion.split('.').map(Number); // add patch level if needed

      // SQLite 3.35.0 and newer support ALTER TABLE DROP COLUMN
      const supportsDropColumn = major > 3 || (major === 3 && minor >= 35);

      if (supportsDropColumn) {
        // Modern SQLite version - use direct column dropping
        db.exec(`ALTER TABLE tickets DROP COLUMN agent_context;`);
        Logger.info(
          'Migration',
          `Removed agent_context column using direct DROP COLUMN (SQLite ${sqliteVersion})`,
        );
      } else {
        // Older SQLite version - use workaround
        Logger.info('Migration', `Using workaround for dropping column (SQLite ${sqliteVersion})`);

        db.exec(`
          -- Create a temporary table without agent_context column
          CREATE TABLE tickets_temp (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
            status TEXT CHECK(status IN ('backlog', 'up-next', 'in-progress', 'in-review', 'completed')),
            created TEXT NOT NULL,
            updated TEXT NOT NULL
          );
          
          -- Copy data from tickets to tickets_temp
          INSERT INTO tickets_temp
            (id, title, description, priority, status, created, updated)
          SELECT
            id, title, description, priority, status, created, updated
          FROM tickets;
          
          -- Drop the original table
          DROP TABLE tickets;
          
          -- Rename the temp table to tickets
          ALTER TABLE tickets_temp RENAME TO tickets;
          
          -- Recreate the indexes
          CREATE INDEX idx_tickets_status ON tickets(status);
          CREATE INDEX idx_tickets_priority ON tickets(priority);
        `);

        Logger.info(
          'Migration',
          'Removed agent_context column from tickets table using recreation method',
        );
      }
    } catch (error) {
      Logger.error('Migration', 'Error removing agent_context column', error);
      throw error;
    }
  },
};

export default migration;

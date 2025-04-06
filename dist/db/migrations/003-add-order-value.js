"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../utils/logger");
/**
 * Migration 3: Add order_value column to tickets table
 *
 * Adds a new column to store ticket ordering within status columns
 * and populates it with initial values for existing tickets
 */
const migration = {
    version: 3,
    name: 'Add Order Value Column',
    up: (db) => {
        // Check if the column already exists
        const tableInfo = db.prepare('PRAGMA table_info(tickets)').all();
        const hasOrderValue = tableInfo.some(col => col.name === 'order_value');
        if (!hasOrderValue) {
            // Add the column with a default value of 0
            db.exec(`ALTER TABLE tickets ADD COLUMN order_value REAL DEFAULT 0;`);
            logger_1.Logger.info('Migration', 'Added order_value column to tickets table');
            // Get all statuses that have tickets
            const statuses = db
                .prepare(`
        SELECT DISTINCT status FROM tickets
      `)
                .all();
            // For each status, update the order_value for its tickets
            for (const { status } of statuses) {
                // Get all tickets for this status, ordered by updated timestamp (newest first)
                const tickets = db
                    .prepare(`
          SELECT id FROM tickets
          WHERE status = ?
          ORDER BY updated DESC
        `)
                    .all(status);
                // Assign order values in descending order (1000, 2000, 3000, ...)
                // This ensures the most recently updated ticket has the highest value (at the top)
                // and new tickets will be added with lower values (at the bottom)
                let orderValue = tickets.length * 1000;
                for (const ticket of tickets) {
                    db.prepare(`
            UPDATE tickets
            SET order_value = ?
            WHERE id = ?
          `).run(orderValue, ticket.id);
                    orderValue -= 1000;
                }
            }
            logger_1.Logger.info('Migration', 'Populated order_value for existing tickets');
        }
        else {
            logger_1.Logger.info('Migration', 'order_value column already exists');
        }
    },
    down: (db) => {
        // Check SQLite version to see if direct column dropping is supported
        const versionResult = db.prepare('SELECT sqlite_version() as version').get();
        const sqliteVersion = versionResult.version;
        const [major, minor] = sqliteVersion.split('.').map(Number);
        // SQLite 3.35.0 and newer support ALTER TABLE DROP COLUMN
        const supportsDropColumn = major > 3 || (major === 3 && minor >= 35);
        if (supportsDropColumn) {
            // Modern SQLite version - use direct column dropping
            db.exec(`ALTER TABLE tickets DROP COLUMN order_value;`);
            logger_1.Logger.info('Migration', `Removed order_value column using direct DROP COLUMN (SQLite ${sqliteVersion})`);
        }
        else {
            // Older SQLite version - use workaround
            logger_1.Logger.info('Migration', `Using workaround for dropping column (SQLite ${sqliteVersion})`);
            db.exec(`
        -- Create a temporary table without order_value column
        CREATE TABLE tickets_temp (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
          status TEXT CHECK(status IN ('backlog', 'up-next', 'in-progress', 'in-review', 'completed')),
          created TEXT NOT NULL,
          updated TEXT NOT NULL,
          agent_context TEXT
        );
        
        -- Copy data from tickets to tickets_temp
        INSERT INTO tickets_temp
          (id, title, description, priority, status, created, updated, agent_context)
        SELECT
          id, title, description, priority, status, created, updated, agent_context
        FROM tickets;
        
        -- Drop the original table
        DROP TABLE tickets;
        
        -- Rename the temp table to tickets
        ALTER TABLE tickets_temp RENAME TO tickets;
        
        -- Recreate the indexes
        CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
        CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
      `);
            logger_1.Logger.info('Migration', 'Removed order_value column from tickets table using recreation method');
        }
    },
};
exports.default = migration;
//# sourceMappingURL=003-add-order-value.js.map
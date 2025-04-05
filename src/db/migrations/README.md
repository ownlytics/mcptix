# Database Migration System

This directory contains the database migration system for mcptix. The migrations are designed to be modular, maintainable, and LLM-friendly.

## Overview

The migration system allows database schema changes to be applied incrementally and in a controlled manner:

- Each migration is stored in a separate file
- Migrations are versioned and applied in sequence
- The system keeps track of the current database version
- Migrations can be rolled back if needed

## How It Works

1. When the database is initialized, the system checks the current schema version
2. It then loads all available migrations from this directory
3. Any migrations with a version higher than the current schema version are applied in sequence
4. The schema version is updated after each successful migration

## Migration File Structure

Each migration file follows this pattern:

```typescript
import Database from 'better-sqlite3';
import { Migration } from './index';
import { Logger } from '../../utils/logger';

const migration: Migration = {
  // Version number (must be unique and sequential)
  version: 3,

  // Descriptive name of the migration
  name: 'Add New Feature Table',

  // Function to apply the migration
  up: (db: Database.Database): void => {
    db.exec(`
      -- Your SQL statements here
      CREATE TABLE IF NOT EXISTS new_feature (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    Logger.info('Migration', 'Added new_feature table');
  },

  // Optional function to roll back the migration
  down: (db: Database.Database): void => {
    db.exec(`DROP TABLE IF EXISTS new_feature;`);
    Logger.info('Migration', 'Removed new_feature table');
  },
};

export default migration;
```

## Creating a New Migration

To add a new database schema change:

1. Create a new file in this directory with a name that describes the migration

   - Example: `003-add-user-table.ts`
   - Use sequential numbering to make it clear which migrations come first

2. Copy the template above and modify it as needed:

   - Update the `version` number (must be higher than any existing migration)
   - Provide a descriptive `name`
   - Implement the `up` function with your schema changes
   - Optionally implement the `down` function for rollback support

3. Update the `CURRENT_SCHEMA_VERSION` constant in `src/db/schema.ts` to match your new migration version

## Best Practices

- Keep migrations small and focused on a single concern
- Always test migrations both forwards and backwards
- Include comments in your SQL to explain complex changes
- Consider data migration needs, not just schema changes
- Remember that SQLite version matters:
  - SQLite 3.35.0+ supports `ALTER TABLE DROP COLUMN` directly
  - Older versions require a workaround (create new table, copy data, drop old table, rename new table)
  - See `002-add-agent-context.ts` for an example of handling both scenarios
- Ensure each migration is idempotent when possible (can be applied multiple times without error)
- Use `IF NOT EXISTS` and similar guards in your SQL

## Existing Migrations

1. **Base Schema (v1)** - Initial database structure with tickets, complexity, and comments tables
2. **Add Agent Context (v2)** - Adds the agent_context column to the tickets table

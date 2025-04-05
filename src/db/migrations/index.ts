import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { Logger } from '../../utils/logger';

/**
 * Migration interface defining the structure of a database migration
 */
export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void; // Optional rollback function
}

/**
 * Get all available migrations sorted by version
 */
export function getMigrations(): Migration[] {
  const migrationsDir = path.join(__dirname);

  // Ensure the migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return [];
  }

  try {
    // Get all .js and .ts files in the migrations directory, excluding index files
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => {
      const isJsOrTs = file.endsWith('.js') || file.endsWith('.ts');
      const isNotIndex = !file.startsWith('index.');
      return isJsOrTs && isNotIndex;
    });

    // Load and sort migrations
    const migrations: Migration[] = [];

    for (const file of migrationFiles) {
      try {
        // Use synchronous require instead of async import for Jest compatibility
        const migrationPath = path.join(migrationsDir, file);

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const migration = require(migrationPath);

        // Skip files that don't export a valid migration
        if (!migration.default || typeof migration.default.version !== 'number') {
          Logger.warn('Migrations', `Skipping invalid migration file: ${file}`);
          continue;
        }

        migrations.push(migration.default);
      } catch (error) {
        Logger.error('Migrations', `Error loading migration ${file}:`, error);
      }
    }

    // Sort migrations by version
    return migrations.sort((a, b) => a.version - b.version);
  } catch (error) {
    Logger.error('Migrations', 'Error loading migrations:', error);
    return [];
  }
}

/**
 * Apply pending migrations to bring the database to the target version
 */
export function applyMigrations(
  db: Database.Database,
  currentVersion: number,
  targetVersion: number,
): void {
  const migrations = getMigrations();

  // Filter migrations that need to be applied
  const pendingMigrations = migrations.filter(
    m => m.version > currentVersion && m.version <= targetVersion,
  );

  if (pendingMigrations.length === 0) {
    Logger.info(
      'Migrations',
      `No migrations to apply (current: ${currentVersion}, target: ${targetVersion})`,
    );
    return;
  }

  Logger.info('Migrations', `Applying ${pendingMigrations.length} migrations`);

  // Begin a transaction for all migrations
  db.exec('BEGIN TRANSACTION;');

  try {
    // Apply each migration in order
    for (const migration of pendingMigrations) {
      Logger.info('Migrations', `Applying migration v${migration.version}: ${migration.name}`);
      migration.up(db);

      // Update the schema version after each successful migration
      db.prepare('UPDATE schema_version SET version = ? WHERE id = 1').run(migration.version);

      Logger.success('Migrations', `Applied migration v${migration.version}`);
    }

    // Commit the transaction
    db.exec('COMMIT;');
    Logger.success(
      'Migrations',
      `Database migrated from version ${currentVersion} to ${targetVersion}`,
    );
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK;');
    Logger.error('Migrations', 'Migration failed, rolling back:', error);
    throw error;
  }
}

/**
 * Rollback migrations to go back to a previous version
 */
export function rollbackMigrations(
  db: Database.Database,
  currentVersion: number,
  targetVersion: number,
): void {
  if (targetVersion >= currentVersion) {
    Logger.warn(
      'Migrations',
      `Cannot rollback: target version ${targetVersion} is not lower than current version ${currentVersion}`,
    );
    return;
  }

  const migrations = getMigrations();

  // Filter migrations that need to be rolled back (in reverse order)
  const migrationsToRollback = migrations
    .filter(m => m.version <= currentVersion && m.version > targetVersion)
    .sort((a, b) => b.version - a.version); // Sort in descending order

  if (migrationsToRollback.length === 0) {
    Logger.info('Migrations', `No migrations to roll back`);
    return;
  }

  // Check if all migrations have down functions
  const missingDownMigrations = migrationsToRollback.filter(m => !m.down);
  if (missingDownMigrations.length > 0) {
    const versions = missingDownMigrations.map(m => m.version).join(', ');
    Logger.error(
      'Migrations',
      `Cannot rollback: migrations ${versions} do not have down functions`,
    );
    throw new Error(`Cannot rollback: some migrations do not have down functions`);
  }

  Logger.info('Migrations', `Rolling back ${migrationsToRollback.length} migrations`);

  // Begin a transaction for all rollbacks
  db.exec('BEGIN TRANSACTION;');

  try {
    // Roll back each migration in reverse order
    for (const migration of migrationsToRollback) {
      Logger.info('Migrations', `Rolling back migration v${migration.version}: ${migration.name}`);
      migration.down!(db); // We've already checked that down exists

      // Update the schema version after each successful rollback
      // Set the version to the previous migration or 0 if no more
      const previousMigration = migrations
        .filter(m => m.version < migration.version)
        .sort((a, b) => b.version - a.version)[0]; // Get the highest previous version

      const newVersion = previousMigration ? previousMigration.version : 0;

      db.prepare('UPDATE schema_version SET version = ? WHERE id = 1').run(newVersion);

      Logger.success('Migrations', `Rolled back migration v${migration.version}`);
    }

    // Commit the transaction
    db.exec('COMMIT;');
    Logger.success(
      'Migrations',
      `Database rolled back from version ${currentVersion} to ${targetVersion}`,
    );
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK;');
    Logger.error('Migrations', 'Rollback failed:', error);
    throw error;
  }
}

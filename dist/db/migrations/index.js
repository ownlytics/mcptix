"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrations = getMigrations;
exports.applyMigrations = applyMigrations;
exports.rollbackMigrations = rollbackMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../utils/logger");
/**
 * Get all available migrations sorted by version
 */
function getMigrations() {
    const migrationsDir = path_1.default.join(__dirname);
    // Ensure the migrations directory exists
    if (!fs_1.default.existsSync(migrationsDir)) {
        fs_1.default.mkdirSync(migrationsDir, { recursive: true });
        return [];
    }
    try {
        // Get all .js and .ts files in the migrations directory, excluding index and test files
        const migrationFiles = fs_1.default.readdirSync(migrationsDir).filter(file => {
            const isJsOrTs = file.endsWith('.js') || file.endsWith('.ts');
            const isNotIndex = !file.startsWith('index.');
            const isNotTest = !file.includes('.test.') && !file.includes('.spec.');
            return isJsOrTs && isNotIndex && isNotTest;
        });
        // Load and sort migrations
        const migrations = [];
        for (const file of migrationFiles) {
            try {
                // Use synchronous require instead of async import for Jest compatibility
                const migrationPath = path_1.default.join(migrationsDir, file);
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const migration = require(migrationPath);
                // Skip files that don't export a valid migration
                if (!migration.default || typeof migration.default.version !== 'number') {
                    logger_1.Logger.warn('Migrations', `Skipping invalid migration file: ${file}`);
                    continue;
                }
                migrations.push(migration.default);
            }
            catch (error) {
                logger_1.Logger.error('Migrations', `Error loading migration ${file}:`, error);
            }
        }
        // Sort migrations by version
        return migrations.sort((a, b) => a.version - b.version);
    }
    catch (error) {
        logger_1.Logger.error('Migrations', 'Error loading migrations:', error);
        return [];
    }
}
/**
 * Apply pending migrations to bring the database to the target version
 */
function applyMigrations(db, currentVersion, targetVersion) {
    const migrations = getMigrations();
    let transactionStarted = false;
    // Filter migrations that need to be applied
    const pendingMigrations = migrations.filter(m => m.version > currentVersion && m.version <= targetVersion);
    if (pendingMigrations.length === 0) {
        logger_1.Logger.info('Migrations', `No migrations to apply (current: ${currentVersion}, target: ${targetVersion})`);
        return;
    }
    logger_1.Logger.info('Migrations', `Applying ${pendingMigrations.length} migrations`);
    try {
        // Begin a transaction for all migrations
        db.exec('BEGIN TRANSACTION;');
        transactionStarted = true;
        // Apply each migration in order
        for (const migration of pendingMigrations) {
            logger_1.Logger.info('Migrations', `Applying migration v${migration.version}: ${migration.name}`);
            migration.up(db);
            // Update the schema version after each successful migration
            db.prepare('UPDATE schema_version SET version = ? WHERE id = 1').run(migration.version);
            logger_1.Logger.success('Migrations', `Applied migration v${migration.version}`);
        }
        // Commit the transaction
        db.exec('COMMIT;');
        transactionStarted = false;
        logger_1.Logger.success('Migrations', `Database migrated from version ${currentVersion} to ${targetVersion}`);
    }
    catch (error) {
        // Rollback on error only if transaction was started
        if (transactionStarted) {
            try {
                db.exec('ROLLBACK;');
            }
            catch (rollbackError) {
                logger_1.Logger.error('Migrations', 'Rollback failed:', rollbackError);
            }
        }
        logger_1.Logger.error('Migrations', 'Migration failed, rolling back:', error);
        throw error;
    }
}
/**
 * Rollback migrations to go back to a previous version
 */
function rollbackMigrations(db, currentVersion, targetVersion) {
    if (targetVersion >= currentVersion) {
        logger_1.Logger.warn('Migrations', `Cannot rollback: target version ${targetVersion} is not lower than current version ${currentVersion}`);
        return;
    }
    const migrations = getMigrations();
    // Filter migrations that need to be rolled back (in reverse order)
    const migrationsToRollback = migrations
        .filter(m => m.version <= currentVersion && m.version > targetVersion)
        .sort((a, b) => b.version - a.version); // Sort in descending order
    if (migrationsToRollback.length === 0) {
        logger_1.Logger.info('Migrations', `No migrations to roll back`);
        return;
    }
    // Check if all migrations have down functions
    const missingDownMigrations = migrationsToRollback.filter(m => !m.down);
    if (missingDownMigrations.length > 0) {
        const versions = missingDownMigrations.map(m => m.version).join(', ');
        logger_1.Logger.error('Migrations', `Cannot rollback: migrations ${versions} do not have down functions`);
        throw new Error(`Cannot rollback: some migrations do not have down functions`);
    }
    logger_1.Logger.info('Migrations', `Rolling back ${migrationsToRollback.length} migrations`);
    let transactionStarted = false;
    try {
        // Begin a transaction for all rollbacks
        db.exec('BEGIN TRANSACTION;');
        transactionStarted = true;
        // Roll back each migration in reverse order
        for (const migration of migrationsToRollback) {
            logger_1.Logger.info('Migrations', `Rolling back migration v${migration.version}: ${migration.name}`);
            migration.down(db); // We've already checked that down exists
            // Update the schema version after each successful rollback
            // Set the version to the previous migration or 0 if no more
            const previousMigration = migrations
                .filter(m => m.version < migration.version)
                .sort((a, b) => b.version - a.version)[0]; // Get the highest previous version
            const newVersion = previousMigration ? previousMigration.version : 0;
            db.prepare('UPDATE schema_version SET version = ? WHERE id = 1').run(newVersion);
            logger_1.Logger.success('Migrations', `Rolled back migration v${migration.version}`);
        }
        // Commit the transaction
        db.exec('COMMIT;');
        transactionStarted = false;
        logger_1.Logger.success('Migrations', `Database rolled back from version ${currentVersion} to ${targetVersion}`);
    }
    catch (error) {
        // Rollback on error only if transaction was started
        if (transactionStarted) {
            try {
                db.exec('ROLLBACK;');
            }
            catch (rollbackError) {
                logger_1.Logger.error('Migrations', 'Rollback failed:', rollbackError);
            }
        }
        logger_1.Logger.error('Migrations', 'Rollback failed:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map
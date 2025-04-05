import Database from 'better-sqlite3';
/**
 * Migration interface defining the structure of a database migration
 */
export interface Migration {
    version: number;
    name: string;
    up: (db: Database.Database) => void;
    down?: (db: Database.Database) => void;
}
/**
 * Get all available migrations sorted by version
 */
export declare function getMigrations(): Migration[];
/**
 * Apply pending migrations to bring the database to the target version
 */
export declare function applyMigrations(db: Database.Database, currentVersion: number, targetVersion: number): void;
/**
 * Rollback migrations to go back to a previous version
 */
export declare function rollbackMigrations(db: Database.Database, currentVersion: number, targetVersion: number): void;
//# sourceMappingURL=index.d.ts.map
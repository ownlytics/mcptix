import Database from 'better-sqlite3';
export declare const DB_PATH: string;
export declare function initializeDatabase(dbPath?: string): Database.Database;
export declare function closeDatabase(db: Database.Database): void;

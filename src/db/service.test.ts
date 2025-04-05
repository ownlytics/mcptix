import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { McpTixConfig } from '../config';
import { getDefaultDbPath, initializeDatabase as initDb } from '../db/schema';
import { Logger } from '../utils/logger';

import { DatabaseService } from './service';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('better-sqlite3');
jest.mock('../utils/logger');
jest.mock('../db/schema');

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockDb: jest.Mocked<Database.Database>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset singleton
    (DatabaseService as any).instance = null;

    // Mock better-sqlite3
    mockDb = {
      pragma: jest.fn(),
      exec: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.Mocked<Database.Database>;
    (Database as unknown as jest.Mock).mockImplementation(() => mockDb);

    // Mock the centralized schema initialization function
    (initDb as jest.Mock).mockImplementation(dbPath => {
      // Return the mockDb to simulate successful database initialization
      return mockDb;
    });

    // Mock path functions
    (path.isAbsolute as jest.Mock).mockImplementation((p: string) => p.startsWith('/'));
    (path.dirname as jest.Mock).mockImplementation((p: string) => {
      const parts = p.split('/');
      parts.pop();
      return parts.join('/') || '/';
    });
    (path.join as jest.Mock).mockImplementation((...parts: string[]) => parts.join('/'));

    // Mock fs functions
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.unlinkSync as jest.Mock).mockImplementation(() => undefined);

    // Mock getDefaultDbPath
    (getDefaultDbPath as jest.Mock).mockReturnValue('/default/path/mcptix.db');

    // Mock process.env and process.cwd
    process.env.HOME = '/home/user';
    process.env.USERPROFILE = '/home/user';
    jest.spyOn(process, 'cwd').mockReturnValue('/current/dir');

    // Get instance
    dbService = DatabaseService.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    test('should initialize database with path string', () => {
      const result = dbService.initialize('/test/path.db');

      expect(result).toBe(mockDb);
      expect(Database as unknown as jest.Mock).toHaveBeenCalledWith('/test/path.db');
      expect(Logger.info).toHaveBeenCalledWith(
        'DatabaseService',
        'Initializing with path: /test/path.db',
      );
      expect(Logger.success).toHaveBeenCalledWith(
        'DatabaseService',
        'Database initialized at /test/path.db',
      );
    });

    test('should initialize database with config object', () => {
      const config: McpTixConfig = { dbPath: '/config/path.db' };
      const result = dbService.initialize(config);

      expect(result).toBe(mockDb);
      expect(Database as unknown as jest.Mock).toHaveBeenCalledWith('/config/path.db');
      expect(Logger.info).toHaveBeenCalledWith(
        'DatabaseService',
        'Initializing with path: /config/path.db',
      );
    });

    test('should use default path if not provided in config', () => {
      const config: McpTixConfig = {};
      const result = dbService.initialize(config);

      expect(result).toBe(mockDb);
      expect(getDefaultDbPath as unknown as jest.Mock).toHaveBeenCalled();
      expect(Database as unknown as jest.Mock).toHaveBeenCalledWith('/default/path/mcptix.db');
    });

    test('should reuse existing connection if path is the same', () => {
      // First initialization
      dbService.initialize('/test/path.db');

      // Reset mock to check if it's called again
      (Database as unknown as jest.Mock).mockClear();

      // Second initialization with same path
      const result = dbService.initialize('/test/path.db');

      expect(result).toBe(mockDb);
      expect(Database).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith(
        'DatabaseService',
        'Reusing existing database connection: /test/path.db',
      );
    });

    test('should close existing connection if path is different', () => {
      // First initialization
      dbService.initialize('/test/path1.db');

      // Second initialization with different path
      dbService.initialize('/test/path2.db');

      expect(mockDb.close).toHaveBeenCalled();
      expect(Database as unknown as jest.Mock).toHaveBeenCalledTimes(2);
      expect(Database as unknown as jest.Mock).toHaveBeenNthCalledWith(2, '/test/path2.db');
    });

    test('should redirect unsafe root paths to safe location', () => {
      // Mock path.dirname to return root for the specific test path
      (path.dirname as jest.Mock).mockImplementationOnce(() => '/');

      const result = dbService.initialize('/unsafe.db');

      expect(result).toBe(mockDb);
      expect(Logger.warn).toHaveBeenCalledWith(
        'DatabaseService',
        'Unsafe path detected: /unsafe.db',
      );
      expect(Database as unknown as jest.Mock).toHaveBeenCalledWith(
        '/home/user/.mcptix/data/mcptix.db',
      );
    });

    test('should create directory if it does not exist', () => {
      // Mock directory does not exist
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      dbService.initialize('/test/path.db');

      expect(fs.mkdirSync).toHaveBeenCalledWith('/test', { recursive: true });
    });

    test('should fall back to home directory if directory creation fails', () => {
      // Mock directory does not exist and mkdir fails
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      (fs.mkdirSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const result = dbService.initialize('/test/path.db');

      expect(result).toBe(mockDb);
      expect(Logger.error).toHaveBeenCalledWith(
        'DatabaseService',
        'Failed to create directory: /test',
        expect.any(Error),
      );
      expect(fs.mkdirSync).toHaveBeenCalledWith('/home/user/.mcptix/data', { recursive: true });
      expect(Database as unknown as jest.Mock).toHaveBeenCalledWith(
        '/home/user/.mcptix/data/mcptix.db',
      );
    });

    test('should clear existing database if clearData is true', () => {
      dbService.initialize('/test/path.db', true);

      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/path.db');
      expect(Logger.info).toHaveBeenCalledWith(
        'DatabaseService',
        'Clearing existing database at /test/path.db',
      );
    });

    test('should enable foreign keys and create tables', () => {
      dbService.initialize('/test/path.db');

      expect(mockDb.pragma).toHaveBeenCalledWith('foreign_keys = ON');
      expect(mockDb.exec).toHaveBeenCalled();
    });

    test('should handle errors during database initialization', () => {
      // Mock Database constructor to throw
      (Database as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      expect(() => dbService.initialize('/test/path.db')).toThrow('Database error');
      expect(Logger.error).toHaveBeenCalledWith(
        'DatabaseService',
        'Error initializing database',
        expect.any(Error),
      );
    });
  });

  describe('getDatabase', () => {
    test('should return database if initialized', () => {
      // Initialize first
      dbService.initialize('/test/path.db');

      const result = dbService.getDatabase();

      expect(result).toBe(mockDb);
    });

    test('should throw error if database not initialized', () => {
      expect(() => dbService.getDatabase()).toThrow(
        'Database not initialized. Call initialize() first.',
      );
    });
  });

  describe('close', () => {
    test('should close database connection if open', () => {
      // Initialize first
      dbService.initialize('/test/path.db');

      dbService.close();

      expect(mockDb.close).toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith('DatabaseService', 'Database connection closed');
    });

    test('should do nothing if no connection exists', () => {
      dbService.close();

      expect(mockDb.close).not.toHaveBeenCalled();
    });
  });
});

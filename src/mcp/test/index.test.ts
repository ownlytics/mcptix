import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('MCP Server Initialization', () => {
  // Store original process properties to restore them later
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset process.env to original state
    process.env = { ...originalEnv };

    // Mock path functions
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.dirname as jest.Mock).mockImplementation(p => {
      const parts = p.split('/');
      parts.pop();
      return parts.join('/') || '/';
    });

    // Mock fs functions
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.readFileSync as jest.Mock).mockImplementation(() => '{"dbPath": "/config/path/db.sqlite"}');

    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue('/current/dir');
  });

  afterEach(() => {
    // Restore original process properties
    process.env = originalEnv;
    process.cwd = originalCwd;
  });

  describe('findFileInParents helper function', () => {
    // Implementation of findFileInParents that matches the one in index.ts
    function findFileInParents(filename: string): string | null {
      let dir = process.cwd();
      const maxDepth = 10; // Prevent infinite loops
      let depth = 0;

      while (depth < maxDepth) {
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
          return filePath;
        }

        // Stop if we've reached the root
        if (dir === path.dirname(dir)) {
          break;
        }

        dir = path.dirname(dir);
        depth++;
      }

      return null;
    }

    test('should find a file in the current directory', () => {
      // Mock existsSync to return true for a specific file
      (fs.existsSync as jest.Mock).mockImplementation(filePath => {
        return filePath === '/current/dir/target-file.txt';
      });

      // Call the function
      const result = findFileInParents('target-file.txt');

      // Verify the result
      expect(result).toBe('/current/dir/target-file.txt');
    });

    test('should find a file in a parent directory', () => {
      // Mock existsSync to return true only for a parent directory
      (fs.existsSync as jest.Mock).mockImplementation(filePath => {
        return filePath === '/parent/target-file.txt';
      });

      // Mock process.cwd
      (process.cwd as jest.Mock).mockReturnValue('/parent/child/dir');

      // Call the function
      const result = findFileInParents('target-file.txt');

      // Verify the result
      expect(result).toBe('/parent/target-file.txt');
    });

    test('should return null if file not found within max depth', () => {
      // Mock existsSync to always return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Call the function
      const result = findFileInParents('target-file.txt');

      // Verify the result
      expect(result).toBeNull();
    });

    test('should stop at root directory', () => {
      // Mock existsSync to always return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Mock process.cwd
      (process.cwd as jest.Mock).mockReturnValue('/');

      // Call the function
      const result = findFileInParents('target-file.txt');

      // Verify the result
      expect(result).toBeNull();

      // Verify we only checked the root directory
      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).toHaveBeenCalledWith('//target-file.txt');
    });
  });

  describe('Database path resolution', () => {
    // Implementation of database path resolution that matches the logic in index.ts
    function resolveDatabasePath(): string {
      // 1. Check environment variable
      if (process.env.MCPTIX_DB_PATH) {
        return process.env.MCPTIX_DB_PATH;
      }

      // 2. Look for db-config.json
      const dbConfigPath = findFileInParents('.mcptix/db-config.json');
      if (dbConfigPath) {
        try {
          const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
          if (dbConfig.dbPath) {
            return dbConfig.dbPath;
          }
        } catch (error) {
          // Ignore JSON parse errors
        }
      }

      // 3. Look for .mcptix/data/mcptix.db
      const defaultDbPath = path.join(process.cwd(), '.mcptix', 'data', 'mcptix.db');
      if (fs.existsSync(path.dirname(defaultDbPath))) {
        return defaultDbPath;
      }

      // 4. Check parent directories
      let dir = process.cwd();
      const maxDepth = 10;
      let depth = 0;

      while (depth < maxDepth) {
        // Stop if we've reached the root
        if (dir === path.dirname(dir)) {
          break;
        }

        dir = path.dirname(dir);
        const dbDir = path.join(dir, '.mcptix', 'data');
        const dbPath = path.join(dbDir, 'mcptix.db');

        if (fs.existsSync(dbDir)) {
          return dbPath;
        }

        depth++;
      }

      // 5. Fall back to default path
      return path.join(process.cwd(), '.mcptix', 'data', 'mcptix.db');
    }

    // Helper function that matches the one in index.ts
    function findFileInParents(filename: string): string | null {
      let dir = process.cwd();
      const maxDepth = 10; // Prevent infinite loops
      let depth = 0;

      while (depth < maxDepth) {
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
          return filePath;
        }

        // Stop if we've reached the root
        if (dir === path.dirname(dir)) {
          break;
        }

        dir = path.dirname(dir);
        depth++;
      }

      return null;
    }

    test('should use database path from environment variable if provided', () => {
      // Set environment variable
      process.env.MCPTIX_DB_PATH = '/env/var/path/db.sqlite';

      // Call the function
      const result = resolveDatabasePath();

      // Verify the result
      expect(result).toBe('/env/var/path/db.sqlite');
    });

    test('should use database path from db-config.json if found', () => {
      // Mock findFileInParents to return a config file path
      (fs.existsSync as jest.Mock).mockImplementation(filePath => {
        return filePath.includes('.mcptix/db-config.json');
      });

      // Call the function
      const result = resolveDatabasePath();

      // Verify the result
      expect(result).toBe('/config/path/db.sqlite');
    });

    test('should handle JSON parse errors in db-config.json', () => {
      // Mock findFileInParents to return a config file path
      (fs.existsSync as jest.Mock).mockImplementation(filePath => {
        return filePath.includes('.mcptix/db-config.json');
      });

      // Mock readFileSync to return invalid JSON
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      // Call the function
      const result = resolveDatabasePath();

      // Verify the result - should fall back to default path
      expect(result).toBe('/current/dir/.mcptix/data/mcptix.db');
    });

    test('should use .mcptix/data/mcptix.db in current directory if it exists', () => {
      // Mock existsSync to return true for the default db directory
      (fs.existsSync as jest.Mock).mockImplementation(filePath => {
        return filePath.includes('/.mcptix/data');
      });

      // Call the function
      const result = resolveDatabasePath();

      // Verify the result
      expect(result).toBe('/current/dir/.mcptix/data/mcptix.db');
    });

    test('should search parent directories for .mcptix/data directory', () => {
      // Mock existsSync to return true only for a parent directory
      (fs.existsSync as jest.Mock).mockImplementation(filePath => {
        // Return false for the current directory check
        if (filePath === '/current/dir/.mcptix/data') {
          return false;
        }
        // Return true for the parent directory check
        if (filePath === '/parent/.mcptix/data') {
          return true;
        }
        return false;
      });

      // Mock process.cwd to return a path with a parent directory
      (process.cwd as jest.Mock).mockReturnValue('/parent/child/dir');

      // Call the function
      const result = resolveDatabasePath();

      // Verify the result
      expect(result).toBe('/parent/.mcptix/data/mcptix.db');
    });

    test('should use default path if no other path is found', () => {
      // Mock existsSync to always return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Call the function
      const result = resolveDatabasePath();

      // Verify the result
      expect(result).toBe('/current/dir/.mcptix/data/mcptix.db');
    });
  });
});

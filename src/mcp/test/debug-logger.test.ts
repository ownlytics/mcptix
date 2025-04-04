import fs from 'fs';
import path from 'path';

import { DebugLogger } from '../debug-logger';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('DebugLogger', () => {
  // Store original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset singleton
    (DebugLogger as any).instance = null;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Reset process.env
    process.env = { ...originalEnv };

    // Mock path.join to return predictable paths
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock path.dirname
    (path.dirname as jest.Mock).mockImplementation(p => {
      const parts = p.split('/');
      return parts.slice(0, -1).join('/') || '/';
    });

    // Mock fs.existsSync to return false by default
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    // Mock fs.mkdirSync
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);

    // Mock fs.writeFileSync
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

    // Mock fs.unlinkSync
    (fs.unlinkSync as jest.Mock).mockImplementation(() => undefined);

    // Mock fs.appendFileSync
    (fs.appendFileSync as jest.Mock).mockImplementation(() => undefined);

    // Set up default environment
    process.env.HOME = '/home/user';
    process.cwd = jest.fn().mockReturnValue('/project');
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = DebugLogger.getInstance();
      const instance2 = DebugLogger.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('constructor', () => {
    test('should find writable directory in project path', () => {
      // Make project directory writable
      (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

      const logger = DebugLogger.getInstance();

      expect(fs.mkdirSync).toHaveBeenCalledWith('/project/.mcptix/debug', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith('/project/.mcptix/debug/test.txt', 'test');
      expect(logger.getLogPath()).toBe('/project/.mcptix/debug/mcp-debug.log');
    });

    test('should try alternate locations if project directory is not writable', () => {
      // Make project directory not writable
      (fs.writeFileSync as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('Permission denied');
        })
        .mockImplementationOnce(() => undefined);

      const logger = DebugLogger.getInstance();

      // Should try home directory after project directory fails
      expect(fs.mkdirSync).toHaveBeenCalledWith('/home/user/.mcptix-debug', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith('/home/user/.mcptix-debug/test.txt', 'test');
      expect(logger.getLogPath()).toBe('/home/user/.mcptix-debug/mcp-debug.log');
    });

    test('should find parent directories', () => {
      // Create a logger instance
      const logger = DebugLogger.getInstance();

      // Access the private findParentDirectories method
      const findParentDirectories = (logger as any).findParentDirectories.bind(logger);

      // Test with a nested path
      const parents = findParentDirectories('/a/b/c/d');

      // Should return ['/a/b/c', '/a/b', '/a', '/']
      expect(parents).toEqual(['/a/b/c', '/a/b', '/a', '/']);

      // Test with a root path
      const rootParents = findParentDirectories('/');
      expect(rootParents).toEqual([]);
    });

    test('should disable logging if no writable directory found', () => {
      // Make all directories not writable
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const logger = DebugLogger.getInstance();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Could not find a writable location for debug logs'),
      );
      expect(logger.getLogPath()).toBe('');

      // Logging should be disabled
      logger.log('Test message');
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });

    test('should attempt to create directory in dev mode', () => {
      // Set dev mode
      process.env.EPIC_TRACKER_DEV_MODE = 'true';

      // First directory exists but is not writable
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      (fs.writeFileSync as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('Permission denied');
        }) // project dir
        .mockImplementationOnce(() => undefined); // test dir or home dir

      const logger = DebugLogger.getInstance();

      // Verify a log file was created
      expect(logger.getLogPath()).not.toBe('');
      expect(logger.getLogPath()).toContain('mcp-debug.log');

      // Verify logging is enabled
      (fs.appendFileSync as jest.Mock).mockClear();
      logger.log('Test message');
      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    test('should handle existing directories', () => {
      // Make directory exist
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const logger = DebugLogger.getInstance();

      // Should not try to create directory that already exists
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith('/project/.mcptix/debug/test.txt', 'test');
      expect(logger.getLogPath()).toBe('/project/.mcptix/debug/mcp-debug.log');
    });
  });

  describe('log', () => {
    test('should append message to log file', () => {
      // Make project directory writable
      (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

      const logger = DebugLogger.getInstance();
      const testMessage = 'Test log message';

      // Reset appendFileSync mock to clear constructor calls
      (fs.appendFileSync as jest.Mock).mockClear();

      logger.log(testMessage);

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        '/project/.mcptix/debug/mcp-debug.log',
        expect.stringContaining(testMessage),
      );
    });

    test('should handle errors when writing to log file', () => {
      // Make project directory writable for initialization
      (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

      const logger = DebugLogger.getInstance();

      // Reset console.error mock to clear constructor calls
      (console.error as jest.Mock).mockClear();

      // Make appendFileSync throw an error
      (fs.appendFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Disk full');
      });

      logger.log('Test message');

      expect(console.error).toHaveBeenCalledWith('Error writing to debug log:', expect.any(Error));

      // Second log should not try to write to file
      (fs.appendFileSync as jest.Mock).mockClear();
      logger.log('Another message');
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('getLogPath', () => {
    test('should return the log file path', () => {
      // Make project directory writable
      (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

      const logger = DebugLogger.getInstance();
      expect(logger.getLogPath()).toBe('/project/.mcptix/debug/mcp-debug.log');
    });
  });
});

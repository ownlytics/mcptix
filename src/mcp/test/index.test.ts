import fs from 'fs';
import path from 'path';

import { TicketQueries } from '../../db/queries';
import { DatabaseService } from '../../db/service';
import { McpTixServer } from '../server';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../db/service');
jest.mock('../../db/queries');
jest.mock('../server');

describe('MCP Server Initialization', () => {
  // Store original process properties
  const originalEnv = process.env;
  const originalCwd = process.cwd;
  const originalExit = process.exit;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  // Mock database and server
  let mockDb: any;
  let mockServer: jest.Mocked<McpTixServer>;
  let mockDbService: jest.Mocked<DatabaseService>;
  let processExitMock: jest.Mock;
  let processOnMock: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock process.env
    process.env = { ...originalEnv };

    // Mock process.cwd
    process.cwd = jest.fn().mockReturnValue('/test/project');

    // Mock process.exit
    processExitMock = jest.fn();
    process.exit = processExitMock as any;

    // Mock process.on
    processOnMock = jest.spyOn(process, 'on');

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock path.join to return predictable paths
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Mock path.dirname
    (path.dirname as jest.Mock).mockImplementation(p => {
      const parts = p.split('/');
      return parts.slice(0, -1).join('/') || '/';
    });

    // Mock fs.existsSync to return false by default
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockImplementation(() => '{"dbPath": "/test/config/db.db"}');

    // Mock fs.mkdirSync
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);

    // Setup mock database
    mockDb = {
      name: '/test/db/mcptix.db',
      prepare: jest.fn().mockReturnValue({
        all: jest.fn().mockReturnValue([{ name: 'tickets' }, { name: 'comments' }]),
        get: jest.fn().mockReturnValue({ count: 5 }),
      }),
    };

    // Setup mock DatabaseService
    mockDbService = {
      getInstance: jest.fn(),
      initialize: jest.fn().mockReturnValue(mockDb),
      close: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDbService);

    // Setup mock McpTixServer
    mockServer = {
      run: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<McpTixServer>;
    (McpTixServer as jest.Mock).mockImplementation(() => mockServer);
  });

  afterEach(() => {
    // Restore original process properties
    process.env = originalEnv;
    process.cwd = originalCwd;
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    // Restore process.on
    processOnMock.mockRestore();
  });

  describe('Database Path Resolution', () => {
    test('should use database path from environment variable', async () => {
      // Set environment variable
      process.env.MCPTIX_DB_PATH = '/env/var/path/db.db';

      // Import the module (which runs the code)
      await import('../index');

      // Verify the database path was used
      expect(mockDbService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          dbPath: '/env/var/path/db.db',
        }),
        expect.anything(),
      );
    });

    test('should find database path from db-config.json', async () => {
      // Mock findFileInParents to return a config file path
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true) // For the .mcptix/db-config.json file
        .mockReturnValue(false);

      // Import the module (which runs the code)
      await import('../index');

      // Verify the database path from config was used
      expect(mockDbService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          dbPath: '/test/config/db.db',
        }),
        expect.anything(),
      );
    });

    test('should use default path in current directory if no config found', async () => {
      // Mock that the .mcptix/data directory exists in the current directory
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false) // For db-config.json
        .mockReturnValueOnce(true) // For .mcptix/data directory
        .mockReturnValue(false);

      // Import the module (which runs the code)
      await import('../index');

      // Verify the default path was used
      expect(mockDbService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          dbPath: '/test/project/.mcptix/data/mcptix.db',
        }),
        expect.anything(),
      );
    });

    test('should search parent directories for .mcptix/data directory', async () => {
      // Mock that the .mcptix/data directory doesn't exist in current dir but exists in parent
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false) // For db-config.json
        .mockReturnValueOnce(false) // For current dir .mcptix/data
        .mockReturnValueOnce(true) // For parent dir .mcptix/data
        .mockReturnValue(false);

      // Import the module (which runs the code)
      await import('../index');

      // Verify the parent directory path was used
      expect(mockDbService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          dbPath: '/test/.mcptix/data/mcptix.db',
        }),
        expect.anything(),
      );
    });

    test('should create directory for default path if no existing paths found', async () => {
      // Mock that no existing paths are found
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Import the module (which runs the code)
      await import('../index');

      // Verify directory was created
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/project/.mcptix/data', { recursive: true });

      // Verify the default path was used
      expect(mockDbService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          dbPath: '/test/project/.mcptix/data/mcptix.db',
        }),
        expect.anything(),
      );
    });

    test('should handle error when creating directory for default path', async () => {
      // Mock that no existing paths are found and directory creation fails
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Import the module (which runs the code)
      await import('../index');

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();

      // Verify the default path was still used (even though creation failed)
      expect(mockDbService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          dbPath: '/test/project/.mcptix/data/mcptix.db',
        }),
        expect.anything(),
      );
    });
  });

  describe('Database Initialization', () => {
    test('should initialize database with correct configuration', async () => {
      // Import the module (which runs the code)
      await import('../index');

      // Verify database was initialized
      expect(DatabaseService.getInstance).toHaveBeenCalled();
      expect(mockDbService.initialize).toHaveBeenCalled();

      // Verify database queries were executed to check tables
      expect(mockDb.prepare).toHaveBeenCalledWith(
        "SELECT name FROM sqlite_master WHERE type='table'",
      );
    });

    test('should check if tickets table exists and has data', async () => {
      // Import the module (which runs the code)
      await import('../index');

      // Verify ticket count query was executed
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM tickets');
    });

    test('should handle database access errors', async () => {
      // Mock database prepare to throw an error
      mockDb.prepare.mockImplementation(() => {
        throw new Error('Database access error');
      });

      // Import the module (which runs the code)
      await import('../index');

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('Error accessing database');
    });
  });

  describe('MCP Server Initialization', () => {
    test('should create and start MCP server', async () => {
      // Import the module (which runs the code)
      await import('../index');

      // Verify server was created with correct parameters
      expect(McpTixServer).toHaveBeenCalledWith(expect.any(TicketQueries), expect.any(Object));

      // Verify server was started
      expect(mockServer.run).toHaveBeenCalled();
    });

    test('should handle server startup errors', async () => {
      // Mock server.run to throw an error
      mockServer.run.mockRejectedValue(new Error('Server startup error'));

      // Import the module (which runs the code)
      try {
        await import('../index');
      } catch (error) {
        // This is expected
      }

      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
      expect((console.error as jest.Mock).mock.calls[0][0]).toContain('Failed to start MCP server');

      // Verify process.exit was called with error code
      expect(processExitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('Signal Handling', () => {
    test('should set up SIGINT handler for graceful shutdown', async () => {
      // Import the module (which runs the code)
      await import('../index');

      // Verify signal handler was registered
      expect(processOnMock).toHaveBeenCalledWith('SIGINT', expect.any(Function));

      // Get the handler function
      const sigintHandler = processOnMock.mock.calls.find(call => call[0] === 'SIGINT')?.[1];
      expect(sigintHandler).toBeDefined();

      // Call the handler
      if (sigintHandler) {
        await sigintHandler();
      }

      // Verify server was closed
      expect(mockServer.close).toHaveBeenCalled();

      // Verify database was closed
      expect(mockDbService.close).toHaveBeenCalled();

      // Verify process.exit was called
      expect(processExitMock).toHaveBeenCalledWith(0);
    });

    test('should set up SIGTERM handler for graceful shutdown', async () => {
      // Import the module (which runs the code)
      await import('../index');

      // Verify signal handler was registered
      expect(processOnMock).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      // Get the handler function
      const sigtermHandler = processOnMock.mock.calls.find(call => call[0] === 'SIGTERM')?.[1];
      expect(sigtermHandler).toBeDefined();

      // Call the handler
      if (sigtermHandler) {
        await sigtermHandler();
      }

      // Verify server was closed
      expect(mockServer.close).toHaveBeenCalled();

      // Verify database was closed
      expect(mockDbService.close).toHaveBeenCalled();

      // Verify process.exit was called
      expect(processExitMock).toHaveBeenCalledWith(0);
    });
  });

  describe('Helper Functions', () => {
    test('findFileInParents should find files in parent directories', async () => {
      // Mock fs.existsSync to return true for a specific path
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === '/test/parent/file.txt';
      });

      // We need to get the findFileInParents function from the module
      // Since it's not exported, we'll need to mock its usage and verify the result

      // Set up the environment to use a specific parent directory
      process.cwd = jest.fn().mockReturnValue('/test/parent/child/grandchild');

      // Import the module (which runs the code and uses findFileInParents)
      await import('../index');

      // Verify fs.existsSync was called with paths in parent directories
      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('/test/parent/child/grandchild/'),
      );
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/test/parent/child/'));
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('/test/parent/'));
    });
  });
});

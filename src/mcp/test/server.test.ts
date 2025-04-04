import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { McpTixConfig } from '../../config';
import { TicketQueries } from '../../db/queries';
import { Logger } from '../../utils/logger';
import { DebugLogger } from '../debug-logger';
import { setupResourceHandlers } from '../resources';
import { McpTixServer } from '../server';
import { setupToolHandlers } from '../tools';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('../../utils/logger');
jest.mock('../debug-logger');
jest.mock('../resources');
jest.mock('../tools');

describe('McpTixServer', () => {
  let mockServer: jest.Mocked<Server>;
  let mockTicketQueries: jest.Mocked<TicketQueries>;
  let mockLogger: jest.Mocked<DebugLogger>;
  let mockConfig: McpTixConfig;
  let mockTransport: jest.Mocked<StdioServerTransport>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock server
    mockServer = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      onerror: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    (Server as jest.Mock).mockImplementation(() => mockServer);

    // Setup mock transport
    mockTransport = {} as jest.Mocked<StdioServerTransport>;
    (StdioServerTransport as jest.Mock).mockImplementation(() => mockTransport);

    // Setup mock logger
    mockLogger = {
      log: jest.fn(),
      getLogPath: jest.fn().mockReturnValue('/path/to/debug.log'),
    } as unknown as jest.Mocked<DebugLogger>;
    (DebugLogger.getInstance as jest.Mock).mockReturnValue(mockLogger);

    // Setup mock ticket queries
    mockTicketQueries = {
      db: { name: '/path/to/test.db' },
    } as unknown as jest.Mocked<TicketQueries>;

    // Setup mock config
    mockConfig = {
      dbPath: '/path/to/test.db',
    };

    // Mock process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should initialize properties correctly', () => {
      const server = new McpTixServer(mockTicketQueries, mockConfig);

      expect(server['ticketQueries']).toBe(mockTicketQueries);
      expect(server['config']).toBe(mockConfig);
      expect(server['logger']).toBe(mockLogger);
      expect(server['isRunning']).toBe(false);
    });

    test('should create a Server instance with correct parameters', () => {
      new McpTixServer(mockTicketQueries, mockConfig);

      expect(Server).toHaveBeenCalledWith(
        {
          name: 'mcptix',
          version: '0.1.0',
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        },
      );
    });

    test('should set up tool and resource handlers', () => {
      new McpTixServer(mockTicketQueries, mockConfig);

      expect(setupToolHandlers).toHaveBeenCalledWith(mockServer, mockTicketQueries);
      expect(setupResourceHandlers).toHaveBeenCalledWith(mockServer, mockTicketQueries);
    });

    test('should set up error handling', () => {
      new McpTixServer(mockTicketQueries, mockConfig);

      expect(mockServer.onerror).toBeDefined();

      // Trigger the error handler
      const error = new Error('Test error');
      if (mockServer.onerror) {
        mockServer.onerror(error);
      }

      expect(Logger.error).toHaveBeenCalledWith('McpServer', 'MCP Error', error);
      expect(mockLogger.log).toHaveBeenCalledWith('MCP Error: Test error');
    });

    test('should log initialization information', () => {
      new McpTixServer(mockTicketQueries, mockConfig);

      expect(Logger.info).toHaveBeenCalledWith(
        'McpServer',
        'Database path from config: /path/to/test.db',
      );
      expect(Logger.info).toHaveBeenCalledWith(
        'McpServer',
        'Actual database file path: /path/to/test.db',
      );
      expect(Logger.debug).toHaveBeenCalledWith(
        'McpServer',
        'Current working directory: /mock/cwd',
      );

      expect(mockLogger.log).toHaveBeenCalledWith('MCP Server initialized');
      expect(mockLogger.log).toHaveBeenCalledWith('Database path from config: /path/to/test.db');
      expect(mockLogger.log).toHaveBeenCalledWith('Actual database file path: /path/to/test.db');
      expect(mockLogger.log).toHaveBeenCalledWith('Current working directory: /mock/cwd');
      expect(mockLogger.log).toHaveBeenCalledWith(`Debug log path: /path/to/debug.log`);
      expect(mockLogger.log).toHaveBeenCalledWith('MCP Server fully initialized');
    });

    test('should handle non-Error objects in error handler', () => {
      new McpTixServer(mockTicketQueries, mockConfig);

      // Trigger the error handler with a non-Error object
      const error = 'String error';
      if (mockServer.onerror) {
        // Cast to any to bypass TypeScript type checking
        mockServer.onerror(error as any);
      }

      expect(Logger.error).toHaveBeenCalledWith('McpServer', 'MCP Error', error);
      expect(mockLogger.log).toHaveBeenCalledWith('MCP Error: String error');
    });
  });

  describe('run', () => {
    test('should connect the server with a StdioServerTransport', async () => {
      const server = new McpTixServer(mockTicketQueries, mockConfig);

      await server.run();

      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
      expect(Logger.success).toHaveBeenCalledWith('McpServer', 'Server running on stdio');
      expect(mockLogger.log).toHaveBeenCalledWith('McpTix MCP server running on stdio');
      expect(server.isServerRunning()).toBe(true);
    });

    test('should return early if server is already running', async () => {
      const server = new McpTixServer(mockTicketQueries, mockConfig);

      // Set isRunning to true
      server['isRunning'] = true;

      await server.run();

      expect(StdioServerTransport).not.toHaveBeenCalled();
      expect(mockServer.connect).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Server is already running');
    });

    test('should throw and log error if connect fails', async () => {
      const error = new Error('Connection failed');
      mockServer.connect.mockRejectedValue(error);

      const server = new McpTixServer(mockTicketQueries, mockConfig);

      await expect(server.run()).rejects.toThrow('Connection failed');

      expect(Logger.error).toHaveBeenCalledWith(
        'McpServer',
        'Error starting MCP server: Connection failed',
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Error starting MCP server: Connection failed');
      expect(server.isServerRunning()).toBe(false);
    });

    test('should handle non-Error objects in run error', async () => {
      const error = 'String error';
      mockServer.connect.mockRejectedValue(error);

      const server = new McpTixServer(mockTicketQueries, mockConfig);

      await expect(server.run()).rejects.toBe(error);

      expect(Logger.error).toHaveBeenCalledWith(
        'McpServer',
        'Error starting MCP server: String error',
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Error starting MCP server: String error');
    });
  });

  describe('close', () => {
    test('should close the server', async () => {
      const server = new McpTixServer(mockTicketQueries, mockConfig);

      // Set isRunning to true
      server['isRunning'] = true;

      await server.close();

      expect(mockServer.close).toHaveBeenCalled();
      expect(Logger.success).toHaveBeenCalledWith('McpServer', 'Server closed');
      expect(mockLogger.log).toHaveBeenCalledWith('MCP server closed');
      expect(server.isServerRunning()).toBe(false);
    });

    test('should return early if server is not running', async () => {
      const server = new McpTixServer(mockTicketQueries, mockConfig);

      // Ensure isRunning is false
      server['isRunning'] = false;

      await server.close();

      expect(mockServer.close).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Server is not running');
    });

    test('should throw and log error if close fails', async () => {
      const error = new Error('Close failed');
      mockServer.close.mockRejectedValue(error);

      const server = new McpTixServer(mockTicketQueries, mockConfig);

      // Set isRunning to true
      server['isRunning'] = true;

      await expect(server.close()).rejects.toThrow('Close failed');

      expect(Logger.error).toHaveBeenCalledWith(
        'McpServer',
        'Error closing MCP server: Close failed',
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Error closing MCP server: Close failed');
      expect(server.isServerRunning()).toBe(true); // Should still be true since close failed
    });

    test('should handle non-Error objects in close error', async () => {
      const error = 'String error';
      mockServer.close.mockRejectedValue(error);

      const server = new McpTixServer(mockTicketQueries, mockConfig);

      // Set isRunning to true
      server['isRunning'] = true;

      await expect(server.close()).rejects.toBe(error);

      expect(Logger.error).toHaveBeenCalledWith(
        'McpServer',
        'Error closing MCP server: String error',
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Error closing MCP server: String error');
    });
  });

  describe('isServerRunning', () => {
    test('should return true if server is running', () => {
      const server = new McpTixServer(mockTicketQueries, mockConfig);

      // Set isRunning to true
      server['isRunning'] = true;

      expect(server.isServerRunning()).toBe(true);
    });

    test('should return false if server is not running', () => {
      const server = new McpTixServer(mockTicketQueries, mockConfig);

      // Ensure isRunning is false
      server['isRunning'] = false;

      expect(server.isServerRunning()).toBe(false);
    });
  });
});

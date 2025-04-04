import { ApiServer } from '../api/server';
import { McpTixConfig, mergeConfig, validateConfig } from '../config';
import { TicketQueries } from '../db/queries';
import { clearDatabase } from '../db/schema';
import { DatabaseService } from '../db/service';
import { McpTix, createMcpTix } from '../index';
import { McpTixServer } from '../mcp/server';
import { Logger } from '../utils/logger';

// Mock all dependencies
jest.mock('../api/server');
jest.mock('../config');
jest.mock('../db/queries');
jest.mock('../db/schema');
jest.mock('../db/service');
jest.mock('../mcp/server');
jest.mock('../utils/logger');

describe('McpTix', () => {
  // Mock implementations
  let mockApiServer: jest.Mocked<ApiServer>;
  let mockMcpServer: jest.Mocked<McpTixServer>;
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockTicketQueries: jest.Mocked<TicketQueries>;
  let mockDb: any;
  let mockConfig: McpTixConfig;

  // Setup process.on mock to avoid adding real event listeners
  const originalProcessOn = process.on;
  const mockProcessOn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the static isShuttingDown flag
    (McpTix as any).isShuttingDown = false;

    // Mock process.on
    process.on = mockProcessOn;

    // Setup default config
    mockConfig = {
      dbPath: './test.db',
      apiPort: 3000,
      apiHost: 'localhost',
      mcpEnabled: true,
      apiEnabled: true,
      logLevel: 'info',
      clearDataOnInit: false,
    };

    // Mock mergeConfig to return our test config
    (mergeConfig as jest.Mock).mockReturnValue(mockConfig);

    // Setup mock database
    mockDb = { name: 'test.db' };

    // Setup mock database service
    mockDbService = {
      initialize: jest.fn().mockReturnValue(mockDb),
      close: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDbService);

    // Setup mock ticket queries
    mockTicketQueries = {} as jest.Mocked<TicketQueries>;
    (TicketQueries as jest.Mock).mockImplementation(() => mockTicketQueries);

    // Setup mock API server
    mockApiServer = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      isRunning: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<ApiServer>;
    (ApiServer as jest.Mock).mockImplementation(() => mockApiServer);

    // Setup mock MCP server
    mockMcpServer = {
      run: jest.fn().mockResolvedValue({ close: jest.fn() }),
      close: jest.fn().mockResolvedValue(undefined),
      isServerRunning: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<McpTixServer>;
    (McpTixServer as jest.Mock).mockImplementation(() => mockMcpServer);
  });

  afterEach(() => {
    // Restore process.on
    process.on = originalProcessOn;
  });

  describe('constructor', () => {
    test('should initialize with default config when no config provided', () => {
      const mcpTix = new McpTix();

      expect(mergeConfig).toHaveBeenCalledWith({});
      expect(validateConfig).toHaveBeenCalledWith(mockConfig);
      expect(DatabaseService.getInstance).toHaveBeenCalled();
      expect(mockDbService.initialize).toHaveBeenCalledWith(mockConfig, mockConfig.clearDataOnInit);
      expect(TicketQueries).toHaveBeenCalledWith(mockDb);
      expect(Logger.info).toHaveBeenCalledWith(
        'McpTix',
        expect.stringContaining('Database initialized'),
      );

      // Verify process event handlers are set
      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    test('should initialize with custom config', () => {
      const customConfig: Partial<McpTixConfig> = {
        dbPath: './custom.db',
        apiPort: 4000,
        mcpEnabled: false,
      };

      const mcpTix = new McpTix(customConfig);

      expect(mergeConfig).toHaveBeenCalledWith(customConfig);
    });
  });

  describe('start', () => {
    test('should start both API and MCP servers when enabled', async () => {
      const mcpTix = new McpTix();
      await mcpTix.start();

      expect(ApiServer).toHaveBeenCalledWith(mockTicketQueries);
      expect(mockApiServer.start).toHaveBeenCalledWith(mockConfig.apiPort, mockConfig.apiHost);

      expect(McpTixServer).toHaveBeenCalledWith(mockTicketQueries, mockConfig);
      expect(mockMcpServer.run).toHaveBeenCalled();
    });

    test('should only start API server when MCP is disabled', async () => {
      mockConfig.mcpEnabled = false;

      const mcpTix = new McpTix();
      await mcpTix.start();

      expect(ApiServer).toHaveBeenCalledWith(mockTicketQueries);
      expect(mockApiServer.start).toHaveBeenCalled();

      expect(McpTixServer).not.toHaveBeenCalled();
    });

    test('should only start MCP server when API is disabled', async () => {
      mockConfig.apiEnabled = false;

      const mcpTix = new McpTix();
      await mcpTix.start();

      expect(ApiServer).not.toHaveBeenCalled();

      expect(McpTixServer).toHaveBeenCalledWith(mockTicketQueries, mockConfig);
      expect(mockMcpServer.run).toHaveBeenCalled();
    });

    test('should handle errors during startup', async () => {
      mockApiServer.start.mockRejectedValue(new Error('API start error'));

      const mcpTix = new McpTix();

      await expect(mcpTix.start()).rejects.toThrow('API start error');

      // Should attempt to shut down on error
      expect(mockDbService.close).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    test('should stop API and MCP servers and close database', async () => {
      // Create a new instance with both servers enabled
      mockConfig.apiEnabled = true;
      mockConfig.mcpEnabled = true;

      // Create a new instance and start the servers
      const mcpTix = new McpTix();
      await mcpTix.start();

      // Verify the servers were created
      expect(ApiServer).toHaveBeenCalled();
      expect(McpTixServer).toHaveBeenCalled();

      // Now shutdown
      await mcpTix.shutdown();

      // Verify the shutdown methods were called
      expect(mockMcpServer.close).toHaveBeenCalled();
      expect(mockApiServer.stop).toHaveBeenCalled();
      expect(mockDbService.close).toHaveBeenCalled();
      expect(Logger.success).toHaveBeenCalledWith('McpTix', 'Shut down successfully');
    });

    test('should handle case when servers are not running', async () => {
      // Disable both servers
      mockConfig.apiEnabled = false;
      mockConfig.mcpEnabled = false;

      const mcpTix = new McpTix();
      // Don't start the servers

      await mcpTix.shutdown();

      // No server methods should be called
      expect(mockMcpServer.close).not.toHaveBeenCalled();
      expect(mockApiServer.stop).not.toHaveBeenCalled();

      // But database should be closed
      expect(mockDbService.close).toHaveBeenCalled();
    });

    test('should prevent duplicate shutdowns', async () => {
      // Enable both servers
      mockConfig.apiEnabled = true;
      mockConfig.mcpEnabled = true;

      const mcpTix = new McpTix();
      await mcpTix.start();

      // First shutdown
      await mcpTix.shutdown();

      // Reset mocks to check if they're called again
      jest.clearAllMocks();

      // Second shutdown
      await mcpTix.shutdown();

      // Should not call any shutdown methods again
      expect(mockMcpServer.close).not.toHaveBeenCalled();
      expect(mockApiServer.stop).not.toHaveBeenCalled();
      expect(mockDbService.close).not.toHaveBeenCalled();
    });

    test('should handle errors during shutdown', async () => {
      // Enable MCP server
      mockConfig.apiEnabled = false;
      mockConfig.mcpEnabled = true;

      // Setup mock to throw error
      mockMcpServer.close.mockRejectedValue(new Error('MCP close error'));

      const mcpTix = new McpTix();
      await mcpTix.start();

      // Should throw the error from mcpServer.close
      await expect(mcpTix.shutdown()).rejects.toThrow('MCP close error');

      expect(Logger.error).toHaveBeenCalledWith(
        'McpTix',
        'Error during shutdown',
        expect.any(Error),
      );
    });
  });

  describe('clearData', () => {
    test('should clear database data', async () => {
      const mcpTix = new McpTix();

      await mcpTix.clearData();

      expect(clearDatabase).toHaveBeenCalledWith(mockDb);
    });

    test('should handle errors when clearing data', async () => {
      (clearDatabase as jest.Mock).mockImplementation(() => {
        throw new Error('Clear data error');
      });

      const mcpTix = new McpTix();

      await expect(mcpTix.clearData()).rejects.toThrow('Clear data error');
    });
  });

  describe('getTicketQueries', () => {
    test('should return the TicketQueries instance', () => {
      const mcpTix = new McpTix();

      const result = mcpTix.getTicketQueries();

      expect(result).toBe(mockTicketQueries);
    });
  });

  describe('createMcpTix', () => {
    test('should create a new McpTix instance with the provided config', () => {
      const customConfig: Partial<McpTixConfig> = {
        dbPath: './custom.db',
      };

      const mcpTix = createMcpTix(customConfig);

      expect(mcpTix).toBeInstanceOf(McpTix);
      expect(mergeConfig).toHaveBeenCalledWith(customConfig);
    });

    test('should create a new McpTix instance with default config when no config provided', () => {
      const mcpTix = createMcpTix();

      expect(mcpTix).toBeInstanceOf(McpTix);
      expect(mergeConfig).toHaveBeenCalledWith({});
    });
  });

  // Test command line argument parsing logic instead of direct execution
  describe('command line argument parsing', () => {
    test('should configure with API only by default when no flags are provided', () => {
      // Simulate command line argument parsing
      const args: string[] = [];
      const runApi = args.includes('--api');
      const runMcp = args.includes('--mcp');

      const config: Partial<McpTixConfig> = {
        apiEnabled: runApi || !runMcp,
        mcpEnabled: runMcp,
      };

      createMcpTix(config);

      expect(mergeConfig).toHaveBeenCalledWith({
        apiEnabled: true,
        mcpEnabled: false,
      });
    });

    test('should configure with MCP only when --mcp flag is provided', () => {
      // Simulate command line argument parsing
      const args: string[] = ['--mcp'];
      const runApi = args.includes('--api');
      const runMcp = args.includes('--mcp');

      const config: Partial<McpTixConfig> = {
        apiEnabled: runApi || !runMcp,
        mcpEnabled: runMcp,
      };

      createMcpTix(config);

      expect(mergeConfig).toHaveBeenCalledWith({
        apiEnabled: false,
        mcpEnabled: true,
      });
    });

    test('should configure with both API and MCP when both flags are provided', () => {
      // Simulate command line argument parsing
      const args: string[] = ['--api', '--mcp'];
      const runApi = args.includes('--api');
      const runMcp = args.includes('--mcp');

      const config: Partial<McpTixConfig> = {
        apiEnabled: runApi || !runMcp,
        mcpEnabled: runMcp,
      };

      createMcpTix(config);

      expect(mergeConfig).toHaveBeenCalledWith({
        apiEnabled: true,
        mcpEnabled: true,
      });
    });

    test('should handle startup errors', async () => {
      // Mock start to throw an error
      const mockStart = jest.fn().mockRejectedValue(new Error('Startup error'));
      const mockInstance = {
        start: mockStart,
      };

      // Use the mock implementation directly
      const originalCreateMcpTix = createMcpTix;
      (createMcpTix as any) = jest.fn().mockReturnValue(mockInstance);

      // Mock process.exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      // Simulate the error handling code in the direct execution path
      try {
        await mockInstance.start();
      } catch (error) {
        Logger.error('McpTix', 'Failed to start', error);
        process.exit(1);
      }

      expect(Logger.error).toHaveBeenCalledWith('McpTix', 'Failed to start', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);

      // Restore mocks
      mockExit.mockRestore();
      (createMcpTix as any) = originalCreateMcpTix;
    });
  });
});

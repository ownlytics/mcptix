/**
 * McpTix - A reusable ticket tracking system with MCP and API server capabilities
 * Main entry point for the package
 */

import { ApiServer } from './api/server';
import { McpTixConfig, mergeConfig, validateConfig } from './config';
import { TicketQueries } from './db/queries';
import { clearDatabase } from './db/schema';
import { DatabaseService } from './db/service';
import { McpTixServer } from './mcp/server';
import { Logger } from './utils/logger';

// Export all types and configuration for users
export * from './types';
export * from './config';

/**
 * Main class for McpTix
 * Provides a unified interface for managing the McpTix system
 */
export class McpTix {
  private static isShuttingDown = false;
  private config: McpTixConfig;
  private dbService: DatabaseService;
  private db: any;
  private ticketQueries: TicketQueries;
  private apiServer?: ApiServer;
  private mcpServer?: McpTixServer;

  /**
   * Create a new McpTix instance
   * @param userConfig Configuration options
   */
  constructor(userConfig: Partial<McpTixConfig> = {}) {
    // Merge and validate configuration
    this.config = mergeConfig(userConfig);
    validateConfig(this.config);

    // Initialize database using the singleton service
    this.dbService = DatabaseService.getInstance();
    this.db = this.dbService.initialize(this.config, this.config.clearDataOnInit);
    Logger.info('McpTix', `Database initialized at absolute path: ${this.db.name}`);
    this.ticketQueries = new TicketQueries(this.db);

    // Set up cleanup on process exit
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
  }

  /**
   * Start the McpTix servers
   * @returns A promise that resolves to the McpTix instance
   */
  async start(): Promise<McpTix> {
    try {
      // Start API server if enabled
      if (this.config.apiEnabled) {
        this.apiServer = new ApiServer(this.ticketQueries);
        await this.apiServer.start(this.config.apiPort, this.config.apiHost);
      }

      // Start MCP server if enabled
      if (this.config.mcpEnabled) {
        this.mcpServer = new McpTixServer(this.ticketQueries, this.config);
        await this.mcpServer.run();
      }

      return this;
    } catch (error) {
      // Clean up on error
      await this.shutdown();
      throw error;
    }
  }

  /**
   * Gracefully shut down McpTix
   * @returns A promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    // Prevent duplicate shutdown messages
    if (McpTix.isShuttingDown) {
      return Promise.resolve();
    }

    McpTix.isShuttingDown = true;
    Logger.info('McpTix', 'Gracefully shutting down...');

    try {
      // Stop MCP server if running
      if (this.mcpServer) {
        await this.mcpServer.close();
        this.mcpServer = undefined;
      }

      // Stop API server if running
      if (this.apiServer) {
        await this.apiServer.stop();
        this.apiServer = undefined;
      }
      // Close database connection
      if (this.db) {
        this.dbService.close();
        this.db = null;
      }

      Logger.success('McpTix', 'Shut down successfully');
    } catch (error) {
      Logger.error('McpTix', 'Error during shutdown', error);
      throw error;
    }
  }

  /**
   * Clear all data from the database
   * @returns A promise that resolves when the data is cleared
   */
  async clearData(): Promise<void> {
    try {
      if (this.db) {
        clearDatabase(this.db);
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the ticket queries instance for programmatic access
   * @returns The TicketQueries instance
   */
  getTicketQueries(): TicketQueries {
    return this.ticketQueries;
  }
}

/**
 * Factory function for creating a McpTix instance
 * @param config Configuration options
 * @returns A new McpTix instance
 */
export function createMcpTix(config?: Partial<McpTixConfig>): McpTix {
  return new McpTix(config);
}

// If this file is run directly, start the servers based on command line arguments
const isDirectlyExecuted = process.argv.length > 1 && process.argv[1] === __filename;
if (isDirectlyExecuted) {
  const args = process.argv.slice(2);
  const runApi = args.includes('--api');
  const runMcp = args.includes('--mcp');

  // Check for development mode and database path
  const isDevMode = process.env.MCPTIX_DEV_MODE === 'true';

  // Parse command line arguments
  let dbPath: string | undefined;
  let apiPort: number | undefined;
  let apiHost: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--db-path=')) {
      dbPath = arg.split('=')[1];
    } else if (arg.startsWith('--port=')) {
      apiPort = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--host=')) {
      apiHost = arg.split('=')[1];
    }
  }

  // Default to API only if no specific flags are provided
  const config: Partial<McpTixConfig> = {
    apiEnabled: runApi || !runMcp, // Enable API if --api flag is present or --mcp is not present
    mcpEnabled: runMcp, // Enable MCP only if --mcp flag is present
  };

  // Apply command line configuration
  if (dbPath) {
    config.dbPath = dbPath;
  }

  if (apiPort) {
    config.apiPort = apiPort;
  }

  if (apiHost) {
    config.apiHost = apiHost;
  }

  // If in development mode, set log level to debug
  if (isDevMode) {
    config.logLevel = 'debug';
  }

  Logger.info(
    'McpTix',
    `Starting with configuration:
  - API server: ${config.apiEnabled ? 'enabled' : 'disabled'}
  - MCP server: ${config.mcpEnabled ? 'enabled' : 'disabled'}
  - Database: ${config.dbPath || 'default'}
  - API port: ${config.apiPort || 'default'}
  - API host: ${config.apiHost || 'default'}`,
  );

  const mcpTix = createMcpTix(config);

  mcpTix.start().catch(error => {
    Logger.error('McpTix', 'Failed to start', error);
    process.exit(1);
  });
}

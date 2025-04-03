/**
 * Epic Tracker - A reusable ticket tracking system with MCP and API server capabilities
 * Main entry point for the package
 */

import { EpicTrackerConfig, mergeConfig, validateConfig } from './config';
import { initializeDatabase, closeDatabase, clearDatabase } from './db/schema';
import { TicketQueries } from './db/queries';
import { ApiServer } from './api/server';
import { EpicTrackerMcpServer } from './mcp/server';

// Export all types and configuration for users
export * from './types';
export * from './config';

/**
 * Main class for Epic Tracker
 * Provides a unified interface for managing the Epic Tracker system
 */
export class EpicTracker {
  private config: EpicTrackerConfig;
  private db: any;
  private ticketQueries: TicketQueries;
  private apiServer?: ApiServer;
  private mcpServer?: EpicTrackerMcpServer;

  /**
   * Create a new Epic Tracker instance
   * @param userConfig Configuration options
   */
  constructor(userConfig: Partial<EpicTrackerConfig> = {}) {
    // Merge and validate configuration
    this.config = mergeConfig(userConfig);
    validateConfig(this.config);
    
    // Initialize database
    this.db = initializeDatabase(this.config.dbPath, this.config.clearDataOnInit);
    this.ticketQueries = new TicketQueries(this.db);
    
    // Set up cleanup on process exit
    process.on('SIGINT', this.shutdown.bind(this));
    process.on('SIGTERM', this.shutdown.bind(this));
  }

  /**
   * Start the Epic Tracker servers
   * @returns A promise that resolves to the EpicTracker instance
   */
  async start(): Promise<EpicTracker> {
    try {
      // Start API server if enabled
      if (this.config.apiEnabled) {
        this.apiServer = new ApiServer(this.ticketQueries);
        await this.apiServer.start(this.config.apiPort, this.config.apiHost);
      }
      
      // Start MCP server if enabled
      if (this.config.mcpEnabled) {
        this.mcpServer = new EpicTrackerMcpServer(this.ticketQueries, this.config);
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
   * Gracefully shut down Epic Tracker
   * @returns A promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Epic Tracker...');
    
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
        closeDatabase(this.db);
        this.db = null;
      }
      
      console.log('Epic Tracker shut down successfully');
    } catch (error) {
      console.error(`Error during shutdown: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Clear all data from the database
   * @returns A promise that resolves when the data is cleared
   */
  async clearData(): Promise<void> {
    try {
      clearDatabase(this.db);
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
 * Factory function for creating an Epic Tracker instance
 * @param config Configuration options
 * @returns A new Epic Tracker instance
 */
export function createEpicTracker(config?: Partial<EpicTrackerConfig>): EpicTracker {
  return new EpicTracker(config);
}

// If this file is run directly, start the servers
if (require.main === module) {
  const args = process.argv.slice(2);
  const runApi = args.includes('--api');
  const runMcp = args.includes('--mcp');
  
  const config: Partial<EpicTrackerConfig> = {
    apiEnabled: runApi || (!runApi && !runMcp),
    mcpEnabled: runMcp || (!runApi && !runMcp)
  };
  
  const epicTracker = createEpicTracker(config);
  
  epicTracker.start().catch((error) => {
    console.error('Failed to start Epic Tracker:', error);
    process.exit(1);
  });
}
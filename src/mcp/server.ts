import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { McpTixConfig } from '../config';
import { TicketQueries } from '../db/queries';
import { Logger } from '../utils/logger';

import { setupResourceHandlers } from './resources';
import { setupToolHandlers } from './tools';

/**
 * McpTix MCP Server
 * Provides Model Context Protocol functionality for McpTix
 */
export class McpTixServer {
  private server: Server;
  private ticketQueries: TicketQueries;
  private isRunning: boolean = false;
  private config: McpTixConfig;

  /**
   * Create a new McpTix MCP Server
   * @param ticketQueries The TicketQueries instance to use
   * @param config Configuration options
   */
  constructor(ticketQueries: TicketQueries, config: McpTixConfig) {
    this.ticketQueries = ticketQueries;
    this.config = config;

    // Log initialization
    Logger.info('McpServer', `Initializing server with configuration: ${this.config.dbPath}`);
    Logger.debug('McpServer', `Current working directory: ${process.cwd()}`);

    // Create MCP server
    this.server = new Server(
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

    // Setup tool handlers
    setupToolHandlers(this.server, this.ticketQueries);

    // Setup resource handlers
    setupResourceHandlers(this.server, this.ticketQueries);

    // Error handling
    this.server.onerror = error => {
      // Log error to file in MCP mode
      Logger.error('McpServer', 'MCP Error', error);
    };
  }

  /**
   * Start the MCP server
   * @returns A promise that resolves when the server is started
   */
  async run(): Promise<McpTixServer> {
    if (this.isRunning) {
      Logger.info('McpServer', 'Server is already running');
      return this;
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.isRunning = true;
      Logger.success('McpServer', 'Server running on stdio');
      return this;
    } catch (error) {
      const errorMsg = `Error starting MCP server: ${error instanceof Error ? error.message : String(error)}`;
      Logger.error('McpServer', errorMsg);
      throw error;
    }
  }

  /**
   * Check if the server is running
   * @returns True if the server is running, false otherwise
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Close the MCP server
   * @returns A promise that resolves when the server is closed
   */
  async close(): Promise<void> {
    if (!this.isRunning) {
      Logger.info('McpServer', 'Server is not running');
      return;
    }

    try {
      await this.server.close();
      this.isRunning = false;
      Logger.success('McpServer', 'Server closed');
    } catch (error) {
      const errorMsg = `Error closing MCP server: ${error instanceof Error ? error.message : String(error)}`;
      Logger.error('McpServer', errorMsg);
      throw error;
    }
  }
}

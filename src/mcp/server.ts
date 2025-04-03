import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TicketQueries } from '../db/queries';
import { setupToolHandlers } from './tools';
import { setupResourceHandlers } from './resources';
import { EpicTrackerConfig } from '../config';

/**
 * Epic Tracker MCP Server
 * Provides Model Context Protocol functionality for Epic Tracker
 */
export class EpicTrackerMcpServer {
  private server: Server;
  private ticketQueries: TicketQueries;
  private isRunning: boolean = false;
  private config: EpicTrackerConfig;

  /**
   * Create a new Epic Tracker MCP Server
   * @param ticketQueries The TicketQueries instance to use
   * @param config Configuration options
   */
  constructor(ticketQueries: TicketQueries, config: EpicTrackerConfig) {
    this.ticketQueries = ticketQueries;
    this.config = config;

    // Create MCP server
    this.server = new Server(
      {
        name: 'epic-tracker',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Setup tool handlers
    setupToolHandlers(this.server, this.ticketQueries);
    
    // Setup resource handlers
    setupResourceHandlers(this.server, this.ticketQueries);

    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
  }

  /**
   * Start the MCP server
   * @returns A promise that resolves when the server is started
   */
  async run(): Promise<EpicTrackerMcpServer> {
    if (this.isRunning) {
      console.log('MCP server is already running');
      return this;
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.isRunning = true;
      console.log('Epic Tracker MCP server running on stdio');
      return this;
    } catch (error) {
      console.error(`Error starting MCP server: ${error instanceof Error ? error.message : String(error)}`);
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
      console.log('MCP server is not running');
      return;
    }

    try {
      await this.server.close();
      this.isRunning = false;
      console.log('MCP server closed');
    } catch (error) {
      console.error(`Error closing MCP server: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
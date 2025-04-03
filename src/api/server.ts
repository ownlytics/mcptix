import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Server as HttpServer } from 'http';
import path from 'path';
import { TicketQueries } from '../db/queries';
import { setupRoutes } from './routes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';
import { EpicTrackerConfig } from '../config';

/**
 * API Server class for the Epic Tracker MCP
 */
export class ApiServer {
  private app: express.Application;
  private server: HttpServer | null = null;
  private ticketQueries: TicketQueries;

  /**
   * Creates a new API server instance
   * @param ticketQueries The TicketQueries instance to use
   */
  constructor(ticketQueries: TicketQueries) {
    this.ticketQueries = ticketQueries;
    this.app = express();
    
    // Configure middleware
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(requestLogger);
    
    // Set up routes
    setupRoutes(this.app, this.ticketQueries);
    
    // Serve static files from the public directory
    const publicPath = path.join(__dirname, '../../public');
    this.app.use(express.static(publicPath));
    
    // Serve index.html for the root route
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
    
    // Error handling
    this.app.use(notFoundHandler as express.RequestHandler);
    this.app.use(errorHandler as express.ErrorRequestHandler);
  }

  /**
   * Get the Express application instance
   * @returns The Express application
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Check if the server is running
   * @returns True if the server is running, false otherwise
   */
  public isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Start the API server
   * @param port The port to listen on (default: 3000)
   * @returns A promise that resolves when the server is started
   */
  /**
   * Start the API server
   * @param port The port to listen on (default: 3000)
   * @param host The host to listen on (default: 'localhost')
   * @returns A promise that resolves when the server is started
   */
  public start(port: number = 3000, host: string = 'localhost'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, host, () => {
          console.log(`API server running at http://${host}:${port}`);
          resolve();
        });
      } catch (error) {
        console.error(`Error starting API server: ${error instanceof Error ? error.message : String(error)}`);
        reject(error);
      }
    });
  }

  /**
   * Stop the API server
   * @returns A promise that resolves when the server is stopped
   */
  /**
   * Stop the API server
   * @returns A promise that resolves when the server is stopped
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        console.log('API server is not running');
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          console.error(`Error stopping API server: ${err.message}`);
          reject(err);
        } else {
          this.server = null;
          console.log('API server stopped');
          resolve();
        }
      });
    });
  }
}
import { EpicTrackerMcpServer } from './server';
import { DatabaseService } from '../db/service';
import { TicketQueries } from '../db/queries';
import path from 'path';
import fs from 'fs';

/**
 * Standalone MCP server for Epic Tracker
 * This file is designed to be executed directly by Node.js or by Roo
 * It initializes the database, creates a TicketQueries instance,
 * and starts the MCP server.
 * 
 * SIMPLIFIED VERSION: This assumes the MCP server will only be started
 * through this entry point directly.
 */

console.log('=== EPIC TRACKER MCP SERVER STARTING ===');
console.log(`Process ID: ${process.pid}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`Module directory: ${__dirname}`);

// Configuration with sane defaults
const config = {
  dbPath: '',  // Will be set below
  apiPort: parseInt(process.env.EPIC_TRACKER_API_PORT || '3000', 10),
  apiHost: process.env.EPIC_TRACKER_API_HOST || 'localhost',
  mcpEnabled: true,
  apiEnabled: false,
  logLevel: (process.env.EPIC_TRACKER_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  clearDataOnInit: false
};

// DATABASE PATH RESOLUTION STRATEGY
// 1. Use environment variable if provided
// 2. Look for db-config.json in current directory and parents
// 3. Look for .epic-tracker/data/epic-tracker.db in current directory and parents
// 4. Fall back to default path in current directory

// 1. Check environment variable
if (process.env.EPIC_TRACKER_DB_PATH) {
  config.dbPath = process.env.EPIC_TRACKER_DB_PATH;
  console.log(`[MCP] Using database path from environment variable: ${config.dbPath}`);
}

// Helper function to find a file in current directory or parents
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

// 2. Look for db-config.json
if (!config.dbPath) {
  const dbConfigPath = findFileInParents('.epic-tracker/db-config.json');
  if (dbConfigPath) {
    try {
      const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
      if (dbConfig.dbPath) {
        config.dbPath = dbConfig.dbPath;
        console.log(`[MCP] Using database path from db-config.json: ${config.dbPath}`);
      }
    } catch (error) {
      console.warn(`[MCP] Error reading db-config.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 3. Look for .epic-tracker/data/epic-tracker.db
if (!config.dbPath) {
  // First check current directory
  const defaultDbPath = path.join(process.cwd(), '.epic-tracker', 'data', 'epic-tracker.db');
  if (fs.existsSync(path.dirname(defaultDbPath))) {
    config.dbPath = defaultDbPath;
    console.log(`[MCP] Using database path from current directory: ${config.dbPath}`);
  } else {
    // Then check parent directories
    let dir = process.cwd();
    const maxDepth = 10;
    let depth = 0;
    
    while (depth < maxDepth) {
      // Stop if we've reached the root
      if (dir === path.dirname(dir)) {
        break;
      }
      
      dir = path.dirname(dir);
      const dbDir = path.join(dir, '.epic-tracker', 'data');
      const dbPath = path.join(dbDir, 'epic-tracker.db');
      
      if (fs.existsSync(dbDir)) {
        config.dbPath = dbPath;
        console.log(`[MCP] Using database path from parent directory: ${config.dbPath}`);
        break;
      }
      
      depth++;
    }
  }
}

// 4. Fall back to default path
if (!config.dbPath) {
  config.dbPath = path.join(process.cwd(), '.epic-tracker', 'data', 'epic-tracker.db');
  console.log(`[MCP] Using default database path: ${config.dbPath}`);
  
  // Ensure the directory exists
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`[MCP] Created database directory: ${dbDir}`);
    } catch (error) {
      console.error(`[MCP] Failed to create database directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Log final configuration
console.log('[MCP] Final configuration:');
console.log(JSON.stringify(config, null, 2));

// Initialize database
console.log(`[MCP] Initializing database at: ${config.dbPath}`);
const dbService = DatabaseService.getInstance();
const db = dbService.initialize(config);
console.log(`[MCP] Database initialized at absolute path: ${db.name}`);

// Verify database is accessible
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`[MCP] Database tables: ${tables.map((t: any) => t.name).join(', ')}`);
  
  // Check if tickets table exists and has data
  if (tables.some((t: any) => t.name === 'tickets')) {
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number };
    console.log(`[MCP] Found ${ticketCount.count} tickets in database`);
  }
} catch (error) {
  console.error(`[MCP] Error accessing database: ${error instanceof Error ? error.message : String(error)}`);
}

// Initialize ticket queries
const ticketQueries = new TicketQueries(db);

// Create and start MCP server
console.log('[MCP] Starting Epic Tracker MCP server...');
const server = new EpicTrackerMcpServer(ticketQueries, config);

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n[MCP] Shutting down Epic Tracker MCP server...');
  await server.close();
  dbService.close();
  console.log('[MCP] MCP server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[MCP] Shutting down Epic Tracker MCP server...');
  await server.close();
  dbService.close();
  console.log('[MCP] MCP server shutdown complete');
  process.exit(0);
});

// Run the server
server.run().catch(error => {
  const errorMsg = `Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`;
  console.error(errorMsg);
  process.exit(1);
});
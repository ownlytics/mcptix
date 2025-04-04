/**
 * Test script for the simplified MCP server
 * This directly uses the compiled MCP server entry point
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Database = require('better-sqlite3');

// Configuration
const testDir = path.join(__dirname, 'test-data', `direct-test-${Date.now()}`);
const epicTrackerDir = path.join(testDir, '.epic-tracker');
const dataDir = path.join(epicTrackerDir, 'data');
const dbPath = path.join(dataDir, 'epic-tracker.db');
const dbConfigPath = path.join(epicTrackerDir, 'db-config.json');

// Create test directories
console.log(`Creating test directories in ${testDir}`);
fs.mkdirSync(dataDir, { recursive: true });

// Create db-config.json with absolute path
const dbConfig = { dbPath: path.resolve(dbPath) };
fs.writeFileSync(dbConfigPath, JSON.stringify(dbConfig, null, 2));
console.log(`Created db-config.json with path: ${dbPath}`);

// Create a test database with a ticket
console.log('Creating test database with a ticket');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
    status TEXT CHECK(status IN ('backlog', 'up-next', 'in-progress', 'in-review', 'completed')),
    created TEXT NOT NULL,
    updated TEXT NOT NULL
  );

  INSERT INTO tickets (id, title, description, priority, status, created, updated)
  VALUES (
    'ticket-direct-test',
    'Direct Test Ticket',
    'This ticket was created directly in the test database',
    'medium',
    'backlog',
    '${new Date().toISOString()}',
    '${new Date().toISOString()}'
  );
`);
db.close();
console.log('Test database created successfully');

// Start the MCP server
console.log('Starting MCP server...');
const mcpServer = spawn('node', [
  path.join(__dirname, 'dist', 'mcp', 'index.js')
], {
  cwd: testDir,
  env: {
    ...process.env,
    // Uncomment to override the database path
    // EPIC_TRACKER_DB_PATH: dbPath
  }
});

// Handle MCP server output
mcpServer.stdout.on('data', (data) => {
  console.log(`[MCP] ${data.toString().trim()}`);
});

mcpServer.stderr.on('data', (data) => {
  console.error(`[MCP Error] ${data.toString().trim()}`);
});

// Handle MCP server exit
mcpServer.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  mcpServer.kill();
  process.exit(0);
});

console.log('Test script running. Press Ctrl+C to exit.');
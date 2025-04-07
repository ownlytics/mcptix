# mcptix Development Workflow

This document describes the simplified development workflow for mcptix, focusing on how to develop and test locally without affecting the production experience for end customers.

## Overview

mcptix has a specific architecture with two main components:

1. **API/UI Server**: Provides the web interface and REST API for managing tickets
2. **MCP Server**: Provides Model Context Protocol functionality for AI assistants

The development workflow now uses pre-compiled JavaScript instead of on-the-fly TypeScript compilation, making it compatible with environments that can't run TypeScript directly (like Claude Desktop).

## Development Environment

### Initial Setup

If you haven't set up the development environment yet:

```bash
# Set up the development environment
npm run dev:setup
```

This creates:

- A `.mcptix-dev` directory with development configurations
- A development database in `.mcptix-dev/data/`

### Simplified Development Workflow

1. **Build the Development Code**:

   ```bash
   npm run build:dev
   ```

   This compiles all TypeScript code to JavaScript in the `dist-dev` directory.

2. **Start the API Server**:

   ```bash
   npm run start:dev:api
   ```

   This starts the API server using your compiled code, connecting to the development database.

   The API server will run on port 3030 (to avoid conflicts with the default port 3000).

   You can access the API server at: http://localhost:3030

3. **Configure Claude Desktop or Other LLM Assistants**:

   For Claude Desktop, configure the MCP server as follows:

   > **IMPORTANT**: The MCP server uses stdout for communication with Claude Desktop. All logging has been redirected to stderr to prevent interference with this communication channel.

   - **Command**: `node`
   - **Arguments**: `/path/to/mcptix/dist-dev/mcp/index.js`
   - **Environment Variables**:
     - `MCPTIX_DB_PATH=/path/to/mcptix/.mcptix-dev/data/mcptix.db`
     - `MCPTIX_MCP_MODE=true`

   > **Note**: The MCPTIX_MCP_MODE environment variable ensures all logging goes to stderr instead of stdout, which is essential for proper communication with Claude Desktop.

4. **Testing the Complete Workflow**:
   - Start the API server with `npm run start:dev:api`
   - Use Claude Desktop with the MCP server configuration above
   - Verify that both servers can access the same database

### Database Management

The development database is located at `.mcptix-dev/data/mcptix.db`.

To reset the database:

```bash
rm .mcptix-dev/data/mcptix.db
npm run dev:setup
```

## File Structure

```
.mcptix-dev/              # Development environment directory
├── data/                 # Development data directory
│   └── mcptix.db         # Development database
├── db-config.json        # Database configuration
└── mcptix.config.js      # Development configuration

dist-dev/                 # Compiled development code
├── api/                  # Compiled API server code
├── db/                   # Compiled database code
├── mcp/                  # Compiled MCP server code
└── index.js              # Main entry point

scripts/                  # Development scripts
└── build-dev.js          # Development build script
```

## Key Benefits

This simplified development workflow:

1. Works with environments that can't run TypeScript directly (like Claude Desktop)
2. Compiles all code to JavaScript for direct execution
3. Preserves the database configuration and path resolution logic
4. Maintains compatibility with existing tests
5. Doesn't affect the production code or customer experience

## Troubleshooting

### JSON Parsing Errors

If you see errors like these in Claude Desktop:

```
Expected ',' or ']' after array element in JSON at position X (line 1 column Y)
```

This indicates that something is writing to stdout, which interferes with the MCP communication protocol. All logging in the MCP server should go to stderr or to a file, never to stdout.

If you add any new code to the MCP server components, make sure to:

1. Use the `mcpLog`, `mcpWarn`, `mcpError`, etc. functions from `src/mcp/mcp-logger.ts`
2. Never use `console.log` directly in any MCP-related code
3. Set `MCPTIX_MCP_MODE=true` when running the MCP server with Claude Desktop

### Database Path Issues

If you're experiencing issues with database path resolution:

1. Make sure you're setting the `MCPTIX_DB_PATH` environment variable correctly
2. Verify the path to the database file is correct and absolute
3. Check the logs for any database-related errors

### Compilation Issues

If you encounter problems with TypeScript compilation:

1. Run `npm run clean:dev` to clean the dist-dev directory
2. Make sure all TypeScript dependencies are installed: `npm install`
3. Try running the build again: `npm run build:dev`

# mcptix Development Workflow

This document describes the development workflow for mcptix, focusing on how to develop and test locally without affecting the production experience for end customers.

## Overview

mcptix has a specific architecture with two main components:

1. **API/UI Server**: Provides the web interface and REST API for managing tickets
2. **MCP Server**: Provides Model Context Protocol functionality for AI assistants

In production, these components work as follows:

- End-customer installs the package with `npm install mcptix`
- End-customer runs `npx mcptix init` to set up configurations
- The AI assistant (e.g., Roo) starts the MCP server when needed
- End-customer runs `npx mcptix start` to start the API UI server
- Both servers access the same SQLite database

## Development Environment Setup

We've set up a development workflow that mimics this production flow while allowing you to work directly with your development code.

### Initial Setup

```bash
# Set up the development environment
npm run dev:setup
```

This creates:

- A `.mcptix-dev` directory with development configurations
- A development database in `.mcptix-dev/data/`
- A `.roo` directory with MCP server configuration for Roo

### Development Workflow

1. **Start the API Server**:

   ```bash
   npm run dev:api
   ```

   This starts the API server using your development code, connecting to the development database.

   This will start the API server on port 3030 (to avoid conflicts with the default port 3000).

   You can access the API server at: http://localhost:3030

2. **Use Roo in the Project**:
   When you use Roo in the project, it will automatically use the development MCP server configuration from `.roo/mcp.json`. This configuration points to your development code.

   **IMPORTANT**: The MCP server should ONLY be started by the LLM agent (Roo), never manually. This matches the production workflow.

3. **Testing the Complete Workflow**:
   - Start the API server with `npm run dev:api`
   - Use Roo in the project, which will start the MCP server when needed
   - Verify that both servers can access the same database by creating tickets through Roo and viewing them in the API UI

### How It Works

#### API Server Development

The `dev:api` script:

- Uses the development configuration from `.mcptix-dev`
- Starts the API server using `ts-node` for TypeScript compilation
- Points to the development database

#### MCP Server Development

For MCP server development, we've created:

- A special `mcp-entry.js` script that compiles and runs the TypeScript code
- A Roo configuration that points to this script
- An environment setup that ensures both servers use the same database

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
├── mcptix.config.js      # Development configuration
└── README.md             # Development instructions

.roo/                     # Roo configuration directory
└── mcp.json              # MCP server configuration for Roo

scripts/                  # Development scripts
├── dev-api.js            # API server development script
├── mcp-entry.js          # MCP server entry script for Roo
└── setup-dev-environment.js # Setup script
```

## Key Benefits

This development workflow:

1. Allows testing changes without publishing the package
2. Ensures both servers access the same database
3. Matches the production workflow where the AI assistant starts the MCP server
4. Doesn't affect the production code or customer experience

## Troubleshooting

### Database Synchronization Issues

If you're experiencing issues where the API server and MCP server aren't seeing the same data:

1. Verify both are using the same database path by checking the logs
2. Reset the development environment:
   ```bash
   rm -rf .mcptix-dev
   npm run dev:setup
   ```

### Roo Integration Issues

If Roo is not starting the MCP server correctly:

1. Check the Roo logs for any errors
2. Verify the `.roo/mcp.json` configuration
3. Reset the Roo configuration:
   ```bash
   rm .roo/mcp.json
   npm run dev:setup
   ```

# mcptix Development Environment

This directory contains the development configuration for mcptix.

## Development Workflow

### 1. Starting the Development Environment

Run the API server:
```bash
npm run dev:api
```

### 2. Using Roo with the Development MCP Server

When using Roo in this project, it will automatically use the development MCP server
configuration from `.roo/mcp.json`. The MCP server will be started by Roo when needed,
not manually.

IMPORTANT: The MCP server should ONLY be started by the LLM agent (Roo), never manually.
This ensures the development workflow matches the production workflow.

### 3. Testing the Complete Workflow

1. Start the API server:
```bash
npm run dev:api
```

2. Use Roo in this project, which will automatically start the MCP server when needed.

3. Verify that both servers can access the same database.

### 4. Reset Development Database

To reset the development database:
```bash
rm /Users/tim/src2/mcptix/.mcptix-dev/data/mcptix.db
npm run dev:setup
```

## Configuration Files

- `mcptix.config.js`: Development configuration for mcptix
- `db-config.json`: Database configuration for development
- `.roo/mcp.json`: Roo MCP server configuration

## Database Location

The development database is located at:
```
/Users/tim/src2/mcptix/.mcptix-dev/data/mcptix.db
```

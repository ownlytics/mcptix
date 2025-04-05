# mcptix [![Beta](https://img.shields.io/badge/status-beta-orange.svg)](https://github.com/mcptix/mcptix)

A simple, powerful ticket tracking system with AI assistant integration.

![Version](https://img.shields.io/badge/version-0.1.4-blue.svg) ![Status](https://img.shields.io/badge/status-beta-orange.svg)
[![npm version](https://img.shields.io/npm/v/@ownlytics/mcptix?color=cb0000&label=npm&logo=npm)](https://www.npmjs.com/package/@ownlytics/mcptix)

![mcptix Banner](./public/mcptix_banner.png)

## What is mcptix?

mcptix is a ticket tracking system that helps you manage tasks, bugs, and features for your projects. It's designed to be easy to use and integrates with AI assistants through the Model Context Protocol (MCP).

- 📋 **Track tickets** - Create, update, and manage tickets for your projects
- 🧠 **Measure complexity** - Track how complex your tickets are with the Complexity Intelligence Engine
- 💬 **Add comments** - Collaborate with comments on tickets
- 🤖 **AI integration** - Connect your AI assistants to mcptix

## Super Easy Setup (For Everyone)

### Step 1: Install mcptix

Open your terminal and run:

```bash
npm install @ownlytics/mcptix
```

### Step 2: Initialize mcptix in your project

```bash
npx mcptix init
```

This will:

- Create a `.mcptix` folder in your project
- Add configuration files
- Set up the necessary configuration files

### Step 3: Start mcptix

```bash
npx mcptix start
```

That's it! mcptix will start and open in your browser automatically.

## Using mcptix

### The Kanban Board

When you open mcptix, you'll see a Kanban board with columns for different ticket statuses:

- **Backlog** - Tickets that need to be worked on
- **Up Next** - Tickets that are ready to be worked on
- **In Progress** - Tickets that are currently being worked on
- **In Review** - Tickets that are being reviewed
- **Completed** - Tickets that are done

### Creating a Ticket

1. Click the "New Ticket" button in the top right
2. Fill in the ticket details:
   - Title
   - Description
   - Status
   - Priority
3. Click "Save"

### Updating a Ticket

1. Click on a ticket to open it
2. Edit the ticket details
3. Changes are saved automatically

### Adding Comments

1. Open a ticket
2. Scroll down to the Comments section
3. Type your comment
4. Click "Add Comment"

## Connecting AI Assistants (MCP Configuration)

mcptix includes an MCP server that allows AI assistants to interact with your tickets. The MCP server is designed to be started by your AI assistant, not by mcptix itself.

### 1. Install mcptix

If you haven't already, install Epic Tracker:

```bash
npm install mcptix
```

### 2. Initialize mcptix in your project

```bash
npx mcptix init
```

This will create a `.mcptix` directory in your project with all necessary configuration files, including an MCP server configuration file at `.mcptix/mcp-server-config.json`.

### 3. Configure your AI assistant to use the mcptix MCP server

Copy the MCP server configuration file to your AI assistant's configuration directory:

For Roo:

```bash
cp .mcptix/mcp-server-config.json .roo/mcp.json
```

For other AI assistants, consult their documentation on how to configure MCP servers.

The configuration file contains all the necessary information for your AI assistant to start and connect to the Epic Tracker MCP server.

#### mcptix MCP Server Configuration

This file is used by LLM agents (like Roo) to connect to the mcptix MCP server. Copy this file to your LLM agent's configuration directory. For Roo, this would typically be .roo/mcp.json in your project root.

IMPORTANT: _The MCP server should be started started by the LLM agent/extension, not by mcptix._ You only need to run 'npx mcptix start' to start the UI.

```json
{
  "mcpServers": {
    "mcptix": {
      "command": "node",
      "args": ["/absolute/path/to/node_modules/mcptix/dist/mcp/index.js"],
      "env": {
        "MCPTIX_DB_PATH": "/absolute/path/to/.mcptix/data/mcptix.db",
        "HOME": "/home/your-username"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

### 4. Start the mcptix UI

```bash
npx mcptix start
```

This will start only the mcptix UI (API server). The MCP server will be started by your AI assistant when needed.
This will start only the mcptix UI (API server). The MCP server will be started by your AI assistant when needed.

### 5. Use mcptix with your AI assistant

Once configured, your AI assistant will be able to:

- List, create, update, and delete tickets
- Add comments to tickets
- Search for tickets
- Get statistics about your tickets

The MCP server provides these capabilities through tools and resources that your AI assistant can use.

## Customizing mcptix

You can customize mcptix by editing the `.mcptix/mcptix.config.js` file in your project:

```javascript
module.exports = {
  // Database configuration
  dbPath: './.mcptix/data/mcptix.db',

  // API server configuration
  apiPort: 3000,
  apiHost: 'localhost',

  // Server options
  mcpEnabled: false, // Disabled by default - MCP server should be started by the LLM agent
  apiEnabled: true,

  // Logging configuration
  logLevel: 'info',

  // Data management
  clearDataOnInit: false,
};
```

### Common Customizations

- **Change the port**: If port 3000 is already in use, change `apiPort` to another number
- **Enable MCP for testing**: If you want to test the MCP server directly, set `mcpEnabled` to `true`
- **Change data location**: If you want to store data elsewhere, change `dbPath`

## Troubleshooting

### mcptix won't start

If mcptix won't start, check:

1. Is another application using port 3000? Change the port in the config file.
2. Do you have permission to write to the data directory? Check file permissions.
3. Is Node.js installed and up to date? mcptix requires Node.js 14 or higher.

### Can't connect AI assistant

If your AI assistant can't connect to mcptix:

1. Check that your MCP configuration file is correctly copied to your AI assistant's configuration directory
2. Verify that the paths in the MCP configuration file are correct
3. Ensure your AI assistant supports the Model Context Protocol
4. Make sure the database path is accessible to the MCP server

## Command Line Options

mcptix provides several command line options:

```bash
# Initialize mcptix in your project
npx mcptix init

# Start mcptix
npx mcptix start

# Start with custom port and host
npx mcptix start --port 3001 --host 0.0.0.0

# Start without opening the browser
npx mcptix start --no-open

# Start only the MCP server (for development/testing purposes)
npx mcptix mcp
```

## Important Note About MCP Server

The MCP server is designed to be started by your AI assistant, not by mcptix itself. This is why:

1. The `mcpEnabled` option is set to `false` by default
2. The `npx mcptix start` command only starts the UI (API server)
3. The MCP server configuration file is generated during initialization

The `npx mcptix mcp` command is provided for development and testing purposes only. In normal operation, you should not need to start the MCP server manually.

When your AI assistant needs to interact with mcptix, it will:

1. Read the MCP configuration file from its configuration directory
2. Start the MCP server as specified in the configuration
3. Connect to the MCP server
4. Use the tools and resources provided by the MCP server to interact with mcptix

This architecture ensures that:

1. The MCP server is only running when needed
2. The MCP server has access to the correct database
3. The MCP server is properly configured for your AI assistant

## For Advanced Users

If you're comfortable with code, you can also use mcptix programmatically:

```javascript
const { createMcpTix } = require('mcptix');

// Create a mcptix instance
const mcpTix = createMcpTix();

// Start the API server (UI)
// Note: MCP server is disabled by default
await mcpTix.start();

// Get the ticket queries for programmatic access
const ticketQueries = mcpTix.getTicketQueries();

// Create a ticket
const ticketId = ticketQueries.createTicket({
  title: 'Example Ticket',
  description: 'This is an example ticket.',
  priority: 'medium',
  status: 'backlog',
});

// Shut down when done
await mcpTix.shutdown();
```

## 🛡️ License & Usage

This project is licensed under the **Business Source License 1.1 (BSL 1.1)**.

You are welcome to use, modify, and explore this software for **non-commercial** purposes, including internal evaluation, experimentation, or research.

**Commercial use — including in production, paid services, or enterprise environments — requires a commercial license from Tesseract Labs, LLC.**

We’re happy to support teams looking to integrate or scale with this tool. Please reach out to us for licensing or consulting:

📧 [tim@ownlytics.ai](mailto:tim@ownlytics.ai)  
📄 [View full license terms](./LICENSE.md)

_Respecting this license helps support ongoing development and innovation._

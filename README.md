# mcptix [![Beta](https://img.shields.io/badge/status-beta-orange.svg)](https://github.com/ownlytics/mcptix)

A simple, powerful ticket tracking system with AI assistant integration.

![Version](https://img.shields.io/badge/version-0.1.18-purple.svg) ![Status](https://img.shields.io/badge/status-beta-orange.svg) [![npm version](https://img.shields.io/npm/v/@ownlytics/mcptix?color=cb0000&label=npm&logo=npm)](https://www.npmjs.com/package/@ownlytics/mcptix) [![License](https://img.shields.io/badge/License-BSL_1.1-blue.svg)](https://mariadb.com/bsl11/) ![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg) ![Jest](https://img.shields.io/badge/Jest-passing-brightgreen.svg)

![mcptix Banner](./public/mcptix_banner.png)

## What is mcptix?

mcptix is a ticket tracking system that helps you manage tasks, bugs, and features for your projects. It's designed to be easy to use and integrates with AI assistants through the Model Context Protocol (MCP).

- 📋 **Track tickets** - Create, update, and manage tickets for your projects
- 🧠 **Measure complexity** - Track how complex your tickets are with the Complexity Intelligence Engine
- 💬 **Add comments** - Collaborate with comments on tickets
- 🤖 **AI integration** - Connect your AI assistants to mcptix for enhanced planning and coding

## Quick Start Guide

For those who want to get up and running quickly with basic features:

```bash
# Install mcptix
npm install @ownlytics/mcptix

# Initialize mcptix in your project
npx mcptix init

# Start mcptix
npx mcptix start
```

That's it for basic usage! For AI assistant integration, see the [AI Integration Guide](#ai-integration-guide) below.

## Complete Installation Guide

### Prerequisites

- Node.js 14 or higher
- npm or yarn
- An AI assistant that supports MCP (Claude Desktop, Roo, etc.)

### Step 1: Install mcptix

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
- Set up the database structure

### Step 3: Start the mcptix UI

```bash
npx mcptix start
```

This will start only the mcptix UI (API server). The MCP server will be started by your AI assistant when needed.

## AI Integration Guide

One of mcptix's most powerful features is its integration with AI assistants through the Model Context Protocol (MCP). This allows AI assistants to help with project planning, task decomposition, and more.

### Understanding the mcptix AI Integration

When properly configured, mcptix enables your AI assistant to:

1. Create, read, update, and delete tickets
2. Add comments to tickets
3. Store detailed planning information in the `agent_context` field
4. Break down complex tasks into manageable tickets
5. Track complexity metrics

The `agent_context` field is especially powerful - it gives AI assistants a place to store extensive planning documents using Markdown, without cluttering the conversation.

---

## 💡⚡️ Cost-Effective Development with mcptix

Having an API-connected LLM agent continuously planning, executing code, handling errors, and debugging can quickly become expensive. API costs add up when your agent needs to repeatedly process the same context and maintain state across interactions.

**A more cost-effective approach:** Configure Claude Desktop (with a Pro account running Claude 3.7 Sonnet) with mcptix and filesystem access. This local setup dramatically reduces API usage while maintaining powerful AI assistance.

By storing comprehensive plans in the `agent_context` field—complete with filenames, line numbers, method names, and other reference points organized into logical, workable chunks—you can reduce API usage by up to 80%.

mcptix acts as a next-generation memory bank for LLM coding agents, allowing them to offload detailed planning and context into a persistent storage system that they can reference as needed, rather than keeping everything in their limited context window.

What makes this system particularly powerful is that both your coding agent (like Roo/Cline) and Claude Desktop access the same underlying mcptix database. This creates a seamless collaborative environment where Claude Desktop can create comprehensive plans and store them in tickets, while your coding agent can retrieve these tickets and execute the plans precisely. They effectively communicate through the shared ticket system—Claude Desktop breaking down complex tasks into executable chunks, and your coding agent implementing them without needing to regenerate the context each time.

---

### Configuration for Different AI Assistants

#### For Roo

1. **Copy the MCP configuration**:

   When you run `npx mcptix init`, an MCP server configuration file is created at `.mcptix/mcp-server-config.json`. Copy this to Roo's configuration directory:

   ```bash
   mkdir -p .roo
   cp .mcptix/mcp-server-config.json .roo/mcp.json
   ```

2. **Check the configuration file** to ensure paths are absolute:

   ```json
   {
     "mcpServers": {
       "mcptix": {
         "command": "/absolute/path/to/node",
         "args": ["/absolute/path/to/node_modules/@ownlytics/mcptix/dist/mcp/index.js"],
         "env": {
           "MCPTIX_HOME_DIR": "/absolute/path/to/your/project/.mcptix",
           "HOME": "/home/your-username"
         },
         "disabled": false,
         "alwaysAllow": []
       }
     }
   }
   ```

   Ensure `/absolute/path/to/node` is the result of running `which node` in your terminal.

   Ensure `/absolute/path/to/node_modules/@ownlytics/mcptix/dist/mcp/index.js` is the absolute path to the mcptix MCP server in your node_modules.

   Ensure `/absolute/path/to/your/project/.mcptix` is the absolute path to your project's `.mcptix` directory.

   Ensure `/home/your-username` is your home directory (result of `echo $HOME`).

#### For Claude Desktop

1. **Install desktop-commander** if you haven't already:

   ```bash
   npm install -g desktop-commander
   ```

2. **Connect Claude Desktop to your filesystem**:

   ```bash
   desktop-commander connect
   ```

3. **Configure Claude Desktop**:

   In Claude Desktop:

   - Go to Settings > Developer
   - Add the MCP configuration in the "MCP Server Configuration" section:

   ```json
   {
     "mcpServers": {
       "mcptix": {
         "command": "/absolute/path/to/node",
         "args": ["/absolute/path/to/node_modules/@ownlytics/mcptix/dist/mcp/index.js"],
         "env": {
           "MCPTIX_HOME_DIR": "/absolute/path/to/your/project/.mcptix",
           "HOME": "/home/your-username"
         },
         "disabled": false,
         "alwaysAllow": []
       },
       "desktop-commander": {
         "command": "npx",
         "args": ["-y", "@smithery/cli@latest", "run", "@wonderwhy-er/desktop-commander", "--config", "{}"]
       }
     }
   }
   ```

   Use the json as described in the coding agent configuration.

4. **Create a project in Claude Desktop**:

   - Click "New Project" in Claude Desktop
   - Name your project appropriately
   - Set your project directory to your development project's root directory

5. **Edit the project system instructions**:

   Add instructions for Claude about using mcptix:

   ```
   This project uses mcptix for ticket tracking. When planning work:

   1. Use the mcptix MCP server to create and manage tickets
   2. Break down complex tasks into smaller tickets
   3. Use the agent_context field in tickets to store comprehensive planning in Markdown format
   4. Project files are located in: /path/to/your/project
   ```

### Using mcptix with AI Assistants

Once configured, you can start talking to your AI assistant about your project. Here's a workflow:

1. **Start the mcptix UI**:

   ```bash
   npx mcptix start
   ```

2. **Initiate a conversation** with Claude Desktop or your AI assistant about planning your project

3. **Ask for help breaking down complex tasks**:
   Example: "I need to implement a user authentication system. Can you help me break this down into manageable tickets?"

4. **The AI will create tickets** with detailed planning in the `agent_context` field

5. **View the tickets** in the mcptix UI at http://localhost:3000 (or your configured port)

6. **Execute tickets** following the plans in the `agent_context` field

7. **Review progress** with your AI assistant and refine plans as needed

### Working with Cline/Roo

When working with Cline or Roo:

1. **Tell the assistant to find tickets**:

   ```
   Find tickets in the 'in-progress' status.
   ```

2. **Ask the assistant to work on a specific ticket**:

   ```
   Work on ticket #42 following the plan in the agent_context.
   ```

3. **The assistant will execute the plan** in the agent_context field

## Kanban Board Usage

### The Kanban Board

When you open mcptix, you'll see a Kanban board with columns for different ticket statuses:

- **Backlog** - Tickets that need to be worked on
- **Up Next** - Tickets that are ready to be worked on
- **In Progress** - Tickets that are currently being worked on
- **In Review** - Tickets that are being reviewed
- **Completed** - Tickets that are done

### Creating a Ticket Manually

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

## Advanced Configuration

You can customize mcptix by editing the `.mcptix/mcptix.config.js` file:

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
- **Change data location**: If you want to store data elsewhere, change `dbPath`

## Troubleshooting

### Installation Issues

- **"Command not found" when running mcptix**

  - Make sure you've installed mcptix (`npm install @ownlytics/mcptix`)
  - Try using the full path: `./node_modules/.bin/mcptix`

- **Initialization fails**
  - Check if you have permission to write to the current directory
  - Make sure Node.js is installed and up to date

### mcptix UI Won't Start

- **Port already in use**

  - Change the port in `.mcptix/mcptix.config.js`
  - Check if another instance is already running

- **Database errors**
  - Ensure the database path is accessible
  - Check file permissions on the `.mcptix` directory

### AI Integration Issues

- **AI assistant can't connect to mcptix**

  - Verify that the MCP configuration paths are absolute and correct
  - Check that your AI assistant supports MCP
  - Ensure the database path in the configuration is accessible to the MCP server

- **MCP server won't start**

  - Check the environment variables in your MCP configuration
  - Verify the path to Node.js and the mcptix MCP server
  - Look for error messages in your AI assistant's logs

- **"Module not found" errors**
  - Ensure mcptix is properly installed
  - Check that the paths in your MCP configuration are correct

## Command Line Reference

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

## Understanding the MCP Architecture

The MCP (Model Context Protocol) server is designed to be started by your AI assistant, not by mcptix itself. This architecture ensures:

1. The MCP server is only running when needed
2. The MCP server has access to the correct database
3. The MCP server is properly configured for your AI assistant

When your AI assistant needs to interact with mcptix, it will:

1. Read the MCP configuration file from its configuration directory
2. Start the MCP server as specified in the configuration
3. Connect to the MCP server
4. Use the tools and resources provided by the MCP server to interact with mcptix

## 🛡️ License & Usage

This project is licensed under the **Business Source License 1.1 (BSL 1.1)**.

You are welcome to use, modify, and explore this software for **non-commercial** purposes, including internal evaluation, experimentation, or research.

**Commercial use — including in production, paid services, or enterprise environments — requires a commercial license from Tesseract Labs, LLC.**

We're happy to support teams looking to integrate or scale with this tool. Please reach out to us for licensing or consulting:

📧 [hello@ownlytics.io](mailto:hello@ownlytics.io)  
📄 [View full license terms](./LICENSE.md)

_Respecting this license helps support ongoing development and innovation._

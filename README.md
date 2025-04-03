# Epic Tracker

A simple, powerful ticket tracking system with AI assistant integration.

![Epic Tracker Banner](https://via.placeholder.com/800x200?text=Epic+Tracker)

## What is Epic Tracker?

Epic Tracker is a ticket tracking system that helps you manage tasks, bugs, and features for your projects. It's designed to be easy to use and integrates with AI assistants through the Model Context Protocol (MCP).

- 📋 **Track tickets** - Create, update, and manage tickets for your projects
- 🧠 **Measure complexity** - Track how complex your tickets are with the Complexity Intelligence Engine
- 💬 **Add comments** - Collaborate with comments on tickets
- 🤖 **AI integration** - Connect your AI assistants to Epic Tracker

## Super Easy Setup (For Everyone)

### Step 1: Install Epic Tracker

Open your terminal and run:

```bash
npm install epic-tracker
```

### Step 2: Initialize Epic Tracker in your project

```bash
npx epic-tracker init
```

This will:
- Create a `.epic-tracker` folder in your project
- Add configuration files
- Add an `epic-tracker` script to your package.json

### Step 3: Start Epic Tracker

```bash
npm run epic-tracker
```

That's it! Epic Tracker will start and open in your browser automatically.

## Using Epic Tracker

### The Kanban Board

When you open Epic Tracker, you'll see a Kanban board with columns for different ticket statuses:

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

Epic Tracker includes an MCP server that allows AI assistants to interact with your tickets. To connect your AI assistant to Epic Tracker, add the following configuration to your MCP client:

```json
{
  "servers": [
    {
      "name": "epic-tracker",
      "transport": {
        "type": "stdio",
        "command": "npx epic-tracker mcp"
      },
      "capabilities": {
        "tools": [
          "list_tickets",
          "get_ticket",
          "create_ticket",
          "update_ticket",
          "delete_ticket",
          "add_comment",
          "search_tickets",
          "get_stats"
        ],
        "resources": [
          "tickets://all",
          "tickets://status/{status}",
          "tickets://id/{id}"
        ]
      }
    }
  ]
}
```

This configuration tells your AI assistant how to connect to Epic Tracker and what capabilities it has.

## Customizing Epic Tracker

You can customize Epic Tracker by editing the `.epic-tracker/epic-tracker.config.js` file in your project:

```javascript
module.exports = {
  // Database configuration
  dbPath: './.epic-tracker/data/epic-tracker.db',
  
  // API server configuration
  apiPort: 3000,
  apiHost: 'localhost',
  
  // Server options
  mcpEnabled: true,
  apiEnabled: true,
  
  // Logging configuration
  logLevel: 'info',
  
  // Data management
  clearDataOnInit: false
};
```

### Common Customizations

- **Change the port**: If port 3000 is already in use, change `apiPort` to another number
- **Disable MCP**: If you don't need AI assistant integration, set `mcpEnabled` to `false`
- **Change data location**: If you want to store data elsewhere, change `dbPath`

## Troubleshooting

### Epic Tracker won't start

If Epic Tracker won't start, check:

1. Is another application using port 3000? Change the port in the config file.
2. Do you have permission to write to the data directory? Check file permissions.
3. Is Node.js installed and up to date? Epic Tracker requires Node.js 14 or higher.

### Can't connect AI assistant

If your AI assistant can't connect to Epic Tracker:

1. Make sure Epic Tracker is running with MCP enabled
2. Check that your MCP configuration is correct
3. Ensure your AI assistant supports the Model Context Protocol

## Command Line Options

Epic Tracker provides several command line options:

```bash
# Initialize Epic Tracker in your project
npx epic-tracker init

# Start Epic Tracker
npx epic-tracker start

# Start with custom port and host
npx epic-tracker start --port 3001 --host 0.0.0.0

# Start without opening the browser
npx epic-tracker start --no-open

# Start only the MCP server (for AI assistants)
npx epic-tracker mcp
```

## For Advanced Users

If you're comfortable with code, you can also use Epic Tracker programmatically:

```javascript
const { createEpicTracker } = require('epic-tracker');

// Create an Epic Tracker instance
const epicTracker = createEpicTracker();

// Start the servers
await epicTracker.start();

// Get the ticket queries for programmatic access
const ticketQueries = epicTracker.getTicketQueries();

// Create a ticket
const ticketId = ticketQueries.createTicket({
  title: 'Example Ticket',
  description: 'This is an example ticket.',
  priority: 'medium',
  status: 'backlog'
});

// Shut down when done
await epicTracker.shutdown();
```

## License

MIT
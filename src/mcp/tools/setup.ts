import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { TicketQueries } from '../../db/queries';
import { Logger } from '../../utils/logger';
import { toolSchemas } from './schemas';

// Import all handlers
import { handleListTickets } from './handlers/list-tickets';
import { handleGetTicket } from './handlers/get-ticket';
import { handleCreateTicket } from './handlers/create-ticket';
import { handleUpdateTicket } from './handlers/update-ticket';
import { handleDeleteTicket } from './handlers/delete-ticket';
import { handleAddComment } from './handlers/add-comment';
import { handleSearchTickets } from './handlers/search-tickets';
import { handleGetStats } from './handlers/get-stats';
import { handleGetNextTicket } from './handlers/get-next-ticket';
import { handleReorderTicket, handleMoveTicket } from './handlers/ticket-ordering';
import { handleEditField } from './handlers/edit-field';

export function setupToolHandlers(server: Server, ticketQueries: TicketQueries) {
  // Log setup
  Logger.info('McpServer', 'Setting up MCP tool handlers');

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolSchemas,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;
    Logger.debug('McpServer', `Tool call received: ${name}`);
    Logger.debug('McpServer', `Tool arguments: ${JSON.stringify(args)}`);

    try {
      Logger.debug('McpServer', `Processing tool call: ${name}`);
      switch (name) {
        case 'list_tickets':
          return handleListTickets(ticketQueries, args);
        case 'get_ticket':
          return handleGetTicket(ticketQueries, args);
        case 'create_ticket':
          return handleCreateTicket(ticketQueries, args);
        case 'update_ticket':
          return handleUpdateTicket(ticketQueries, args);
        case 'delete_ticket':
          return handleDeleteTicket(ticketQueries, args);
        case 'add_comment':
          return handleAddComment(ticketQueries, args);
        case 'search_tickets':
          return handleSearchTickets(ticketQueries, args);
        case 'get_stats':
          return handleGetStats(ticketQueries, args);
        case 'get_next_ticket':
          return handleGetNextTicket(ticketQueries, args);
        case 'reorder_ticket':
          return handleReorderTicket(ticketQueries, args);
        case 'move_ticket':
          return handleMoveTicket(ticketQueries, args);
        case 'edit_field':
          return handleEditField(ticketQueries, args);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('McpServer', `Tool call error: ${errorMessage}`);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ReadResourceRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TicketQueries } from '../db/queries';
import { Logger } from '../utils/logger';
export function setupResourceHandlers(server: Server, ticketQueries: TicketQueries) {
  // Log setup
  Logger.info('McpServer', 'Setting up MCP resource handlers');
  // Handler for resources/list
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'tickets://all',
          name: 'All Tickets',
          description: 'Get all tickets, with optional filtering, sorting, and pagination',
        },
      ],
    };
  });

  // Handler for resources/templates/list
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: 'tickets://status/{status}',
          name: 'Tickets by Status',
          description: 'Get tickets by status (backlog, up-next, in-progress, in-review, completed)',
        },
        {
          uriTemplate: 'tickets://id/{id}',
          name: 'Ticket by ID',
          description: 'Get a specific ticket by ID',
        },
      ],
    };
  });

  // Handler for resources/read
  server.setRequestHandler(ReadResourceRequestSchema, async request => {
    const { uri } = request.params;
    Logger.info('McpServer', `Resource read request for URI: ${uri}`);

    try {
      // Parse the URI manually since URL class expects double slashes after protocol

      // Check if it's a tickets resource
      if (!uri.startsWith('tickets://')) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown resource protocol: ${uri.split(':')[0]}`);
      }

      // Extract the path part (everything after tickets://)
      const path = uri.substring('tickets://'.length);
      Logger.debug('McpServer', `Resource path: ${path}`);

      // Handle different resource types
      let resourceContent;

      if (path === 'all') {
        resourceContent = await handleAllTickets(ticketQueries, uri);
      } else if (path.startsWith('status/')) {
        const status = path.substring('status/'.length);
        if (['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(status)) {
          resourceContent = await handleTicketsByStatus(ticketQueries, status, uri);
        } else {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown status: ${status}`);
        }
      } else if (path.startsWith('id/')) {
        const id = path.substring('id/'.length);
        if (id.startsWith('ticket-')) {
          resourceContent = await handleTicketById(ticketQueries, id);
        } else {
          throw new McpError(ErrorCode.MethodNotFound, `Invalid ticket ID format: ${id}`);
        }
      } else {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown resource: ${uri}`);
      }

      // Format the response according to the MCP protocol
      return {
        contents: [
          {
            uri,
            text: JSON.stringify(resourceContent, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        Logger.warn('McpServer', `MCP Error: ${error.message}`);
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('McpServer', `Resource error: ${errorMessage}`);
      throw new McpError(ErrorCode.InternalError, `Error accessing resource: ${errorMessage}`);
    }
  });
}

// Handler for tickets://all
async function handleAllTickets(ticketQueries: TicketQueries, uri: string) {
  Logger.info('McpServer', `Handling all tickets resource: ${uri}`);
  // Use default values for pagination and sorting
  const limit = 100;
  const offset = 0;
  const sort = 'updated';
  const order = 'desc';

  // Get tickets with default parameters
  const tickets = ticketQueries.getTickets({}, sort, order, limit, offset);
  Logger.info('McpServer', `Found ${tickets.length} tickets`);
  Logger.debug('McpServer', `Database path: ${ticketQueries['db'].name}`);

  // Return tickets with metadata
  return {
    metadata: {
      resource: uri,
      total: tickets.length,
      limit,
      offset,
      sort,
      order,
    },
    tickets,
  };
}

// Handler for tickets://status/[status]
async function handleTicketsByStatus(ticketQueries: TicketQueries, status: string, uri: string) {
  Logger.info('McpServer', `Handling tickets by status: ${status}`);
  // Use default values for pagination and sorting
  const limit = 100;
  const offset = 0;
  const sort = 'updated';
  const order = 'desc';

  // Get tickets filtered by status
  const tickets = ticketQueries.getTickets({ status }, sort, order, limit, offset);
  Logger.info('McpServer', `Found ${tickets.length} tickets with status: ${status}`);

  // Return tickets with metadata
  return {
    metadata: {
      resource: uri,
      status,
      total: tickets.length,
      limit,
      offset,
      sort,
      order,
    },
    tickets,
  };
}

// Handler for tickets://id/[id]
async function handleTicketById(ticketQueries: TicketQueries, id: string) {
  Logger.info('McpServer', `Handling ticket by ID: ${id}`);
  // Get ticket by ID
  const ticket = ticketQueries.getTicketById(id);

  // Check if ticket exists
  if (!ticket) {
    Logger.warn('McpServer', `Ticket not found: ${id}`);
    throw new McpError(ErrorCode.MethodNotFound, `Ticket with ID ${id} not found`);
  }
  Logger.info('McpServer', `Found ticket: ${id}`);

  // Return ticket
  return {
    metadata: {
      resource: `tickets://id/${id}`,
      id,
    },
    ticket,
  };
}

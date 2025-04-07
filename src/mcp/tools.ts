import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

import { TicketQueries } from '../db/queries';
import { Ticket, Comment } from '../types';
import { Logger } from '../utils/logger';

export function setupToolHandlers(server: Server, ticketQueries: TicketQueries) {
  // Log setup
  Logger.info('McpServer', 'Setting up MCP tool handlers');
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_tickets',
        description: 'List tickets with optional filtering, sorting, and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by status',
              enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
            },
            priority: {
              type: 'string',
              description: 'Filter by priority',
              enum: ['low', 'medium', 'high'],
            },
            search: {
              type: 'string',
              description: 'Search term for title and description',
            },
            sort: {
              type: 'string',
              description: 'Sort field',
              default: 'updated',
            },
            order: {
              type: 'string',
              description: 'Sort order',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of tickets to return',
              default: 100,
            },
            offset: {
              type: 'number',
              description: 'Number of tickets to skip',
              default: 0,
            },
          },
        },
      },
      {
        name: 'get_ticket',
        description: 'Get a ticket by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Ticket ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'create_ticket',
        description: 'Create a new ticket',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Ticket title',
            },
            description: {
              type: 'string',
              description: 'Ticket description',
            },
            priority: {
              type: 'string',
              description: 'Ticket priority',
              enum: ['low', 'medium', 'high'],
              default: 'medium',
            },
            status: {
              type: 'string',
              description: 'Ticket status',
              enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
              default: 'backlog',
            },
            complexity_metadata: {
              type: 'object',
              description: 'Complexity metrics',
              properties: {
                files_touched: { type: 'number' },
                modules_crossed: { type: 'number' },
                stack_layers_involved: { type: 'number' },
                dependencies: { type: 'number' },
                shared_state_touches: { type: 'number' },
                cascade_impact_zones: { type: 'number' },
                subjectivity_rating: { type: 'number' },
                loc_added: { type: 'number' },
                loc_modified: { type: 'number' },
                test_cases_written: { type: 'number' },
                edge_cases: { type: 'number' },
                mocking_complexity: { type: 'number' },
                coordination_touchpoints: { type: 'number' },
                review_rounds: { type: 'number' },
                blockers_encountered: { type: 'number' },
                cie_score: { type: 'number' },
              },
            },
            agent_context: {
              type: 'string',
              description:
                'Markdown-formatted workspace for the agent to store research, analysis, and implementation plans',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'update_ticket',
        description: 'Update an existing ticket',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Ticket ID',
            },
            title: {
              type: 'string',
              description: 'Ticket title',
            },
            description: {
              type: 'string',
              description: 'Ticket description',
            },
            priority: {
              type: 'string',
              description: 'Ticket priority',
              enum: ['low', 'medium', 'high'],
            },
            status: {
              type: 'string',
              description: 'Ticket status',
              enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
            },
            complexity_metadata: {
              type: 'object',
              description: 'Complexity metrics',
              properties: {
                files_touched: { type: 'number' },
                modules_crossed: { type: 'number' },
                stack_layers_involved: { type: 'number' },
                dependencies: { type: 'number' },
                shared_state_touches: { type: 'number' },
                cascade_impact_zones: { type: 'number' },
                subjectivity_rating: { type: 'number' },
                loc_added: { type: 'number' },
                loc_modified: { type: 'number' },
                test_cases_written: { type: 'number' },
                edge_cases: { type: 'number' },
                mocking_complexity: { type: 'number' },
                coordination_touchpoints: { type: 'number' },
                review_rounds: { type: 'number' },
                blockers_encountered: { type: 'number' },
                cie_score: { type: 'number' },
              },
            },
            agent_context: {
              type: 'string',
              description:
                'Markdown-formatted workspace for the agent to store research, analysis, and implementation plans',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_ticket',
        description: 'Delete a ticket',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Ticket ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'add_comment',
        description: 'Add a comment to a ticket',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'Ticket ID',
            },
            content: {
              type: 'string',
              description: 'Comment content (deprecated for agent comments - use summary and fullText instead)',
            },
            summary: {
              type: 'string',
              description: 'A concise summary of the comment (1-2 sentences) that will be shown by default in the UI',
            },
            fullText: {
              type: 'string',
              description: 'The complete, detailed explanation or analysis that can be expanded by the user',
            },
            type: {
              type: 'string',
              description: 'Comment type',
              enum: ['comment', 'request_changes', 'change_proposal'],
              default: 'comment',
            },
            author: {
              type: 'string',
              description: 'Comment author',
              enum: ['developer', 'agent'],
              default: 'agent',
            },
            status: {
              type: 'string',
              description: 'Comment status',
              enum: ['open', 'in_progress', 'resolved', 'wont_fix'],
              default: 'open',
            },
          },
          required: ['ticket_id', 'content'],
        },
      },
      {
        name: 'search_tickets',
        description: 'Search for tickets based on various criteria',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            status: {
              type: 'string',
              description: 'Filter by status',
              enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
            },
            priority: {
              type: 'string',
              description: 'Filter by priority',
              enum: ['low', 'medium', 'high'],
            },
            sort: {
              type: 'string',
              description: 'Sort field',
              default: 'relevance',
            },
            order: {
              type: 'string',
              description: 'Sort order',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of tickets to return',
              default: 100,
            },
            offset: {
              type: 'number',
              description: 'Number of tickets to skip',
              default: 0,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_stats',
        description: 'Get statistics about tickets in the system',
        inputSchema: {
          type: 'object',
          properties: {
            group_by: {
              type: 'string',
              description: 'Field to group by',
              enum: ['status', 'priority'],
              default: 'status',
            },
          },
        },
      },
      {
        name: 'get_next_ticket',
        description: 'Get the next ticket from a status category',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Status category to get the next ticket from',
              enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
            },
          },
          required: ['status'],
        },
      },
      {
        name: 'reorder_ticket',
        description: 'Update the order of a ticket within its current status column',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Ticket ID',
            },
            order_value: {
              type: 'number',
              description: 'New order value for the ticket',
            },
          },
          required: ['id', 'order_value'],
        },
      },
      {
        name: 'move_ticket',
        description: 'Move a ticket to a different status and optionally reorder it',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Ticket ID',
            },
            status: {
              type: 'string',
              description: 'New status for the ticket',
              enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
            },
            order_value: {
              type: 'number',
              description: 'Optional new order value for the ticket',
            },
          },
          required: ['id', 'status'],
        },
      },
    ],
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

// Handler for list_tickets tool
function handleListTickets(ticketQueries: TicketQueries, args: any) {
  Logger.debug('McpServer', `handleListTickets called with args: ${JSON.stringify(args)}`);

  const filters = {
    status: args.status,
    priority: args.priority,
    search: args.search,
  };

  Logger.debug('McpServer', `Using filters: ${JSON.stringify(filters)}`);

  const tickets = ticketQueries.getTickets(
    filters,
    args.sort || 'updated',
    args.order || 'desc',
    args.limit || 100,
    args.offset || 0,
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(tickets, null, 2),
      },
    ],
  };
}

// Handler for get_ticket tool
function handleGetTicket(ticketQueries: TicketQueries, args: any) {
  if (!args.id) {
    Logger.warn('McpServer', 'Ticket ID is required');
    throw new Error('Ticket ID is required');
  }

  Logger.debug('McpServer', `Getting ticket with ID: ${args.id}`);

  const ticket = ticketQueries.getTicketById(args.id);

  if (!ticket) {
    Logger.warn('McpServer', `Ticket with ID ${args.id} not found`);
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  Logger.debug('McpServer', `Found ticket: ${args.id}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(ticket, null, 2),
      },
    ],
  };
}

// Handler for create_ticket tool
/**
 * Creates a new ticket and sets an appropriate order_value to ensure
 * it can be properly positioned in the UI.
 *
 * The fix addresses an issue where tickets created via the MCP server
 * all had the default order_value of 0, making them impossible to
 * sort properly in the UI's drag-and-drop functionality.
 */
function handleCreateTicket(ticketQueries: TicketQueries, args: any) {
  if (!args.title) {
    throw new Error('Ticket title is required');
  }

  const status = args.status || 'backlog';

  // First create the ticket with default values
  const ticket: Ticket = {
    id: `ticket-${Date.now()}`,
    title: args.title,
    description: args.description || '',
    priority: args.priority || 'medium',
    status: status,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    agent_context: args.agent_context || null,
  };

  if (args.complexity_metadata) {
    ticket.complexity_metadata = {
      ticket_id: ticket.id,
      ...args.complexity_metadata,
    };
  }

  // Create the ticket in the database
  const ticketId = ticketQueries.createTicket(ticket);

  try {
    // Get all tickets in the same status to find the maximum order_value
    const ticketsInStatus = ticketQueries.getTickets({ status: status }, 'order_value', 'desc', 100, 0);

    // Only attempt to set order_value if ticketsInStatus is a valid array
    if (Array.isArray(ticketsInStatus) && ticketsInStatus.length > 0 && ticketsInStatus[0]?.id !== ticketId) {
      // The first ticket has the highest order_value
      // @ts-ignore - order_value exists in the database but not in the type definition
      const maxOrderValue = ticketsInStatus[0].order_value || 0;
      const newOrderValue = maxOrderValue + 1000;

      // Update the ticket's order_value
      ticketQueries.reorderTicket(ticketId, newOrderValue);
    }
  } catch (error) {
    // Log the error but don't fail ticket creation
    Logger.warn('McpServer', `Failed to set order_value for ticket ${ticketId}: ${error}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ id: ticketId, success: true }, null, 2),
      },
    ],
  };
}

// Handler for update_ticket tool
function handleUpdateTicket(ticketQueries: TicketQueries, args: any) {
  if (!args.id) {
    throw new Error('Ticket ID is required');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Create updated ticket object
  const ticket: Ticket = {
    id: args.id,
    title: args.title || existingTicket.title,
    description: args.description || existingTicket.description,
    priority: args.priority || existingTicket.priority,
    status: args.status || existingTicket.status,
    created: existingTicket.created,
    updated: new Date().toISOString(),
    agent_context: args.agent_context !== undefined ? args.agent_context : existingTicket.agent_context,
  };

  // Update complexity metadata if provided
  if (args.complexity_metadata) {
    ticket.complexity_metadata = {
      ticket_id: args.id,
      ...existingTicket.complexity_metadata,
      ...args.complexity_metadata,
    };
  }

  // Update ticket
  const success = ticketQueries.updateTicket(ticket);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ id: args.id, success }, null, 2),
      },
    ],
  };
}

// Handler for delete_ticket tool
function handleDeleteTicket(ticketQueries: TicketQueries, args: any) {
  if (!args.id) {
    throw new Error('Ticket ID is required');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Delete ticket
  const success = ticketQueries.deleteTicket(args.id);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ id: args.id, success }, null, 2),
      },
    ],
  };
}

// Handler for add_comment tool
function handleAddComment(ticketQueries: TicketQueries, args: any) {
  if (!args.ticket_id) {
    throw new Error('Ticket ID is required');
  }

  if (!args.content && !args.summary && !args.fullText) {
    throw new Error('Comment content is required (either content, or summary and fullText)');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.ticket_id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.ticket_id} not found`);
  }

  const author = args.author || 'agent';

  // Create comment object
  const comment: Comment = {
    id: `comment-${Date.now()}`,
    ticket_id: args.ticket_id,
    content: args.content || '',
    type: args.type || 'comment',
    author,
    status: args.status || 'open',
    timestamp: new Date().toISOString(),
  };

  // Handle summary and fullText based on author
  if (author === 'agent') {
    // For agent comments, we need summary and fullText for proper UI rendering
    if (args.summary) {
      comment.summary = args.summary;
    } else if (args.content) {
      // Create a summary from content if not provided
      // Use the first sentence or first 100 characters
      const firstSentenceMatch = args.content.match(/^(.*?[.!?])\s/);
      if (firstSentenceMatch && firstSentenceMatch[1]) {
        comment.summary = firstSentenceMatch[1];
      } else {
        // If no sentence ending found, use first 100 chars or the whole content
        comment.summary = args.content.length > 100 ? args.content.substring(0, 100) + '...' : args.content;
      }
    }

    // Set fullText from args or fall back to content
    comment.fullText = args.fullText || args.content || '';

    // Set default display state to collapsed
    comment.display = 'collapsed';
  }

  // Add comment
  const commentId = ticketQueries.addComment(args.ticket_id, comment);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ id: commentId, success: true }, null, 2),
      },
    ],
  };
}

// Handler for search_tickets tool
function handleSearchTickets(ticketQueries: TicketQueries, args: any) {
  if (!args.query) {
    throw new Error('Search query is required');
  }

  const filters = {
    status: args.status,
    priority: args.priority,
    search: args.query,
  };

  const tickets = ticketQueries.getTickets(
    filters,
    args.sort || 'updated',
    args.order || 'desc',
    args.limit || 100,
    args.offset || 0,
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(tickets, null, 2),
      },
    ],
  };
}

// Handler for get_next_ticket tool
function handleGetNextTicket(ticketQueries: TicketQueries, args: any) {
  if (!args.status || !['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(args.status)) {
    throw new Error('Valid status is required (backlog, up-next, in-progress, in-review, completed)');
  }

  const ticket = ticketQueries.getNextTicket(
    args.status as 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed',
  );

  if (!ticket) {
    throw new Error(`No tickets found in ${args.status}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(ticket, null, 2),
      },
    ],
  };
}

// Handler for reorder_ticket tool
function handleReorderTicket(ticketQueries: TicketQueries, args: any) {
  if (!args.id) {
    throw new Error('Ticket ID is required');
  }

  if (typeof args.order_value !== 'number') {
    throw new Error('order_value must be a number');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Reorder the ticket
  const success = ticketQueries.reorderTicket(args.id, args.order_value);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ id: args.id, success }, null, 2),
      },
    ],
  };
}

// Handler for move_ticket tool
function handleMoveTicket(ticketQueries: TicketQueries, args: any) {
  if (!args.id) {
    throw new Error('Ticket ID is required');
  }

  if (!args.status || !['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(args.status)) {
    throw new Error('Valid status is required (backlog, up-next, in-progress, in-review, completed)');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Move the ticket to the new status
  const success = ticketQueries.moveTicket(
    args.id,
    args.status as 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed',
    args.order_value,
  );

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ id: args.id, success }, null, 2),
      },
    ],
  };
}
// Handler for get_stats tool
function handleGetStats(ticketQueries: TicketQueries, args: any) {
  const groupBy = args.group_by || 'status';

  // Get all tickets
  const tickets = ticketQueries.getTickets({}, 'updated', 'desc', 1000, 0);

  // Group tickets by the specified field
  const stats: Record<string, number> = {};

  for (const ticket of tickets) {
    const key = ticket[groupBy as keyof Ticket] as string;
    stats[key] = (stats[key] || 0) + 1;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(stats, null, 2),
      },
    ],
  };
}

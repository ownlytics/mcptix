"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupToolHandlers = setupToolHandlers;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const debug_logger_1 = require("./debug-logger");
function setupToolHandlers(server, ticketQueries) {
    const logger = debug_logger_1.DebugLogger.getInstance();
    logger.log('Setting up MCP tool handlers');
    // List available tools
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
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
                            description: 'Comment content',
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
        ],
    }));
    // Handle tool calls
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        logger.log(`Tool call received: ${name}`);
        logger.log(`Tool arguments: ${JSON.stringify(args)}`);
        try {
            logger.log(`Processing tool call: ${name}`);
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
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.log(`Tool call error: ${errorMessage}`);
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
function handleListTickets(ticketQueries, args) {
    const logger = debug_logger_1.DebugLogger.getInstance();
    console.log('[MCP Tools] handleListTickets called with args:', JSON.stringify(args));
    logger.log(`handleListTickets called with args: ${JSON.stringify(args)}`);
    const filters = {
        status: args.status,
        priority: args.priority,
        search: args.search,
    };
    console.log('[MCP Tools] Using filters:', JSON.stringify(filters));
    logger.log(`Using filters: ${JSON.stringify(filters)}`);
    const tickets = ticketQueries.getTickets(filters, args.sort || 'updated', args.order || 'desc', args.limit || 100, args.offset || 0);
    logger.log(`Found ${tickets.length} tickets`);
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
function handleGetTicket(ticketQueries, args) {
    if (!args.id) {
        throw new Error('Ticket ID is required');
    }
    const ticket = ticketQueries.getTicketById(args.id);
    if (!ticket) {
        throw new Error(`Ticket with ID ${args.id} not found`);
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
// Handler for create_ticket tool
function handleCreateTicket(ticketQueries, args) {
    if (!args.title) {
        throw new Error('Ticket title is required');
    }
    const ticket = {
        id: `ticket-${Date.now()}`,
        title: args.title,
        description: args.description || '',
        priority: args.priority || 'medium',
        status: args.status || 'backlog',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    };
    if (args.complexity_metadata) {
        ticket.complexity_metadata = {
            ticket_id: ticket.id,
            ...args.complexity_metadata,
        };
    }
    const ticketId = ticketQueries.createTicket(ticket);
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
function handleUpdateTicket(ticketQueries, args) {
    if (!args.id) {
        throw new Error('Ticket ID is required');
    }
    // Check if ticket exists
    const existingTicket = ticketQueries.getTicketById(args.id);
    if (!existingTicket) {
        throw new Error(`Ticket with ID ${args.id} not found`);
    }
    // Create updated ticket object
    const ticket = {
        id: args.id,
        title: args.title || existingTicket.title,
        description: args.description || existingTicket.description,
        priority: args.priority || existingTicket.priority,
        status: args.status || existingTicket.status,
        created: existingTicket.created,
        updated: new Date().toISOString(),
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
function handleDeleteTicket(ticketQueries, args) {
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
function handleAddComment(ticketQueries, args) {
    if (!args.ticket_id) {
        throw new Error('Ticket ID is required');
    }
    if (!args.content) {
        throw new Error('Comment content is required');
    }
    // Check if ticket exists
    const existingTicket = ticketQueries.getTicketById(args.ticket_id);
    if (!existingTicket) {
        throw new Error(`Ticket with ID ${args.ticket_id} not found`);
    }
    // Create comment object
    const comment = {
        id: `comment-${Date.now()}`,
        ticket_id: args.ticket_id,
        content: args.content,
        type: args.type || 'comment',
        author: args.author || 'agent',
        status: args.status || 'open',
        timestamp: new Date().toISOString(),
    };
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
function handleSearchTickets(ticketQueries, args) {
    if (!args.query) {
        throw new Error('Search query is required');
    }
    const filters = {
        status: args.status,
        priority: args.priority,
        search: args.query,
    };
    const tickets = ticketQueries.getTickets(filters, args.sort || 'updated', args.order || 'desc', args.limit || 100, args.offset || 0);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(tickets, null, 2),
            },
        ],
    };
}
// Handler for get_stats tool
function handleGetStats(ticketQueries, args) {
    const groupBy = args.group_by || 'status';
    // Get all tickets
    const tickets = ticketQueries.getTickets({}, 'updated', 'desc', 1000, 0);
    // Group tickets by the specified field
    const stats = {};
    for (const ticket of tickets) {
        const key = ticket[groupBy];
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
//# sourceMappingURL=tools.js.map
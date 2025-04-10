"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupToolHandlers = setupToolHandlers;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const logger_1 = require("../utils/logger");
function setupToolHandlers(server, ticketQueries) {
    // Log setup
    logger_1.Logger.info('McpServer', 'Setting up MCP tool handlers');
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
                        agent_context: {
                            type: 'string',
                            description: 'Markdown-formatted workspace for the agent to store research, analysis, and implementation plans',
                        },
                    },
                    required: ['title'],
                },
            },
            {
                name: 'update_ticket',
                description: 'Update an existing ticket (use edit_field instead for targeted text changes to save context space)',
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
                            description: 'Markdown-formatted workspace for the agent to store research, analysis, and implementation plans',
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
                            description: 'Comment content (supports markdown)',
                        },
                        author: {
                            type: 'string',
                            description: 'Comment author',
                            enum: ['developer', 'agent'],
                            default: 'agent',
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
            {
                name: 'edit_field',
                description: 'Efficiently perform targeted text changes on a ticket field (PREFERRED over update_ticket for field edits, supports regex and partial replacements to save context space compared to rewriting entire fields)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Ticket ID',
                        },
                        field: {
                            type: 'string',
                            description: 'Field name to edit',
                            enum: ['title', 'description', 'agent_context'],
                        },
                        search: {
                            type: 'string',
                            description: 'Text to search for (or regex pattern if useRegex is true). Use this to target specific portions of text without rewriting the entire field.',
                        },
                        replace: {
                            type: 'string',
                            description: 'Replacement text (can include regex capturing groups like $1 if useRegex is true). This will replace only the matched text, preserving the rest of the field content.',
                        },
                        useRegex: {
                            type: 'boolean',
                            description: 'Use regular expressions for search and replace. Enables powerful pattern matching for complex replacements in code blocks, markdown, etc.',
                            default: false,
                        },
                        caseSensitive: {
                            type: 'boolean',
                            description: 'Whether the search is case-sensitive. Set to false to match text regardless of casing.',
                            default: true,
                        },
                    },
                    required: ['id', 'field', 'search', 'replace'],
                    markdownDescription: `
## Edit Field Tool
This tool efficiently performs targeted text replacements within specific ticket fields, saving valuable context space compared to rewriting entire fields.

### Benefits
- **Context Efficiency**: Makes small updates without resending large text blocks
- **Precision Editing**: Changes only what needs to be changed
- **Advanced Pattern Matching**: Supports regex for sophisticated replacements
- **Preserves Structure**: Maintains the overall structure of the field

### When to Use
- Updating code snippets in documentation
- Fixing typos or terminology
- Editing specific sections of a large field
- Refactoring code examples
- Making formatting changes

### Best Practices
- For small to medium changes, always prefer this over update_ticket
- Use regex mode for complex pattern matching
- Use capturing groups ($1, $2) to preserve parts of matched text
`,
                },
            },
        ],
    }));
    // Handle tool calls
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        logger_1.Logger.debug('McpServer', `Tool call received: ${name}`);
        logger_1.Logger.debug('McpServer', `Tool arguments: ${JSON.stringify(args)}`);
        try {
            logger_1.Logger.debug('McpServer', `Processing tool call: ${name}`);
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
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.Logger.error('McpServer', `Tool call error: ${errorMessage}`);
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
    logger_1.Logger.debug('McpServer', `handleListTickets called with args: ${JSON.stringify(args)}`);
    const filters = {
        status: args.status,
        priority: args.priority,
        search: args.search,
    };
    logger_1.Logger.debug('McpServer', `Using filters: ${JSON.stringify(filters)}`);
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
// Handler for get_ticket tool
function handleGetTicket(ticketQueries, args) {
    if (!args.id) {
        logger_1.Logger.warn('McpServer', 'Ticket ID is required');
        throw new Error('Ticket ID is required');
    }
    logger_1.Logger.debug('McpServer', `Getting ticket with ID: ${args.id}`);
    const ticket = ticketQueries.getTicketById(args.id);
    if (!ticket) {
        logger_1.Logger.warn('McpServer', `Ticket with ID ${args.id} not found`);
        throw new Error(`Ticket with ID ${args.id} not found`);
    }
    logger_1.Logger.debug('McpServer', `Found ticket: ${args.id}`);
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
function handleCreateTicket(ticketQueries, args) {
    if (!args.title) {
        throw new Error('Ticket title is required');
    }
    const status = args.status || 'backlog';
    // First create the ticket with default values
    const ticket = {
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
            // @ts-expect-error - order_value exists in the database but not in the type definition
            const maxOrderValue = ticketsInStatus[0].order_value || 0;
            const newOrderValue = maxOrderValue + 1000;
            // Update the ticket's order_value
            ticketQueries.reorderTicket(ticketId, newOrderValue);
        }
    }
    catch (error) {
        // Log the error but don't fail ticket creation
        logger_1.Logger.warn('McpServer', `Failed to set order_value for ticket ${ticketId}: ${error}`);
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
    const author = args.author || 'agent';
    // Create comment object
    const comment = {
        id: `comment-${Date.now()}`,
        ticket_id: args.ticket_id,
        content: args.content,
        author,
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
// Handler for get_next_ticket tool
function handleGetNextTicket(ticketQueries, args) {
    if (!args.status || !['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(args.status)) {
        throw new Error('Valid status is required (backlog, up-next, in-progress, in-review, completed)');
    }
    const ticket = ticketQueries.getNextTicket(args.status);
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
function handleReorderTicket(ticketQueries, args) {
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
function handleMoveTicket(ticketQueries, args) {
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
    const success = ticketQueries.moveTicket(args.id, args.status, args.order_value);
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
// Handler for edit_field tool
function handleEditField(ticketQueries, args) {
    logger_1.Logger.debug('McpServer', `handleEditField called with args: ${JSON.stringify(args)}`);
    if (!args.id) {
        logger_1.Logger.warn('McpServer', 'Ticket ID is required');
        throw new Error('Ticket ID is required');
    }
    if (!args.field || !['title', 'description', 'agent_context'].includes(args.field)) {
        logger_1.Logger.warn('McpServer', 'Valid field name is required (title, description, agent_context)');
        throw new Error('Valid field name is required (title, description, agent_context)');
    }
    if (args.search === undefined || args.replace === undefined) {
        logger_1.Logger.warn('McpServer', 'Both search and replace parameters are required');
        throw new Error('Both search and replace parameters are required');
    }
    // Check if ticket exists
    logger_1.Logger.debug('McpServer', `Getting ticket with ID: ${args.id}`);
    const existingTicket = ticketQueries.getTicketById(args.id);
    if (!existingTicket) {
        logger_1.Logger.warn('McpServer', `Ticket with ID ${args.id} not found`);
        throw new Error(`Ticket with ID ${args.id} not found`);
    }
    // Get current field value
    const currentValue = existingTicket[args.field] || '';
    logger_1.Logger.debug('McpServer', `Current value of ${args.field}: ${currentValue.substring(0, 50)}${currentValue.length > 50 ? '...' : ''}`);
    // Get search/replace parameters
    const useRegex = args.useRegex === true;
    const caseSensitive = args.caseSensitive !== false;
    logger_1.Logger.debug('McpServer', `Performing find/replace: Mode=${useRegex ? 'regex' : 'literal'}, CaseSensitive=${caseSensitive}`);
    logger_1.Logger.debug('McpServer', `Search: '${args.search.substring(0, 30)}${args.search.length > 30 ? '...' : ''}'`);
    logger_1.Logger.debug('McpServer', `Replace: '${args.replace.substring(0, 30)}${args.replace.length > 30 ? '...' : ''}'`);
    let newValue;
    let replacementCount = 0;
    try {
        if (useRegex) {
            // Use the search string directly as a regex pattern
            const flags = caseSensitive ? 'g' : 'gi';
            const regex = new RegExp(args.search, flags);
            newValue = currentValue.replace(regex, args.replace);
            // Count replacements
            try {
                const countRegex = new RegExp(args.search, caseSensitive ? 'g' : 'gi');
                const matches = currentValue.match(countRegex);
                replacementCount = matches ? matches.length : 0;
            }
            catch (countError) {
                // If counting fails, just set to 0
                logger_1.Logger.warn('McpServer', `Could not count replacements: ${countError instanceof Error ? countError.message : String(countError)}`);
            }
        }
        else {
            // Perform literal string replacement (escape regex special chars)
            const safeSearch = args.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const flags = caseSensitive ? 'g' : 'gi';
            const regex = new RegExp(safeSearch, flags);
            newValue = currentValue.replace(regex, args.replace);
            // Count literal string occurrences
            let count = 0;
            let lastIndex = 0;
            if (caseSensitive) {
                while ((lastIndex = currentValue.indexOf(args.search, lastIndex)) !== -1) {
                    count++;
                    lastIndex += args.search.length;
                }
            }
            else {
                const lowerText = currentValue.toLowerCase();
                const lowerSearch = args.search.toLowerCase();
                while ((lastIndex = lowerText.indexOf(lowerSearch, lastIndex)) !== -1) {
                    count++;
                    lastIndex += lowerSearch.length;
                }
            }
            replacementCount = count;
        }
    }
    catch (error) {
        logger_1.Logger.error('McpServer', `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Only update if something changed
    if (currentValue === newValue) {
        logger_1.Logger.debug('McpServer', `No changes needed for ticket ${args.id}`);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        id: args.id,
                        success: true,
                        changed: false,
                        message: 'No changes made - search text not found',
                    }, null, 2),
                },
            ],
        };
    }
    logger_1.Logger.debug('McpServer', `Updating ${args.field} for ticket ${args.id} (${replacementCount} replacements)`);
    // Create updated ticket with the modified field
    let ticket = {
        ...existingTicket,
        updated: new Date().toISOString(),
    };
    // Update the specific field based on field name
    if (args.field === 'title') {
        ticket.title = newValue;
    }
    else if (args.field === 'description') {
        ticket.description = newValue;
    }
    else if (args.field === 'agent_context') {
        ticket.agent_context = newValue;
    }
    // Update ticket
    const success = ticketQueries.updateTicket(ticket);
    logger_1.Logger.debug('McpServer', `Update result for ticket ${args.id}: ${success}`);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    id: args.id,
                    success,
                    changed: true,
                    message: 'Field updated successfully',
                    replacement_count: replacementCount,
                }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=tools.js.map
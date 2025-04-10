"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupToolHandlers = setupToolHandlers;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const logger_1 = require("../../utils/logger");
const schemas_1 = require("./schemas");
// Import all handlers
const list_tickets_1 = require("./handlers/list-tickets");
const get_ticket_1 = require("./handlers/get-ticket");
const create_ticket_1 = require("./handlers/create-ticket");
const update_ticket_1 = require("./handlers/update-ticket");
const delete_ticket_1 = require("./handlers/delete-ticket");
const add_comment_1 = require("./handlers/add-comment");
const search_tickets_1 = require("./handlers/search-tickets");
const get_stats_1 = require("./handlers/get-stats");
const get_next_ticket_1 = require("./handlers/get-next-ticket");
const ticket_ordering_1 = require("./handlers/ticket-ordering");
const edit_field_1 = require("./handlers/edit-field");
function setupToolHandlers(server, ticketQueries) {
    // Log setup
    logger_1.Logger.info('McpServer', 'Setting up MCP tool handlers');
    // List available tools
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
        tools: schemas_1.toolSchemas,
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
                    return (0, list_tickets_1.handleListTickets)(ticketQueries, args);
                case 'get_ticket':
                    return (0, get_ticket_1.handleGetTicket)(ticketQueries, args);
                case 'create_ticket':
                    return (0, create_ticket_1.handleCreateTicket)(ticketQueries, args);
                case 'update_ticket':
                    return (0, update_ticket_1.handleUpdateTicket)(ticketQueries, args);
                case 'delete_ticket':
                    return (0, delete_ticket_1.handleDeleteTicket)(ticketQueries, args);
                case 'add_comment':
                    return (0, add_comment_1.handleAddComment)(ticketQueries, args);
                case 'search_tickets':
                    return (0, search_tickets_1.handleSearchTickets)(ticketQueries, args);
                case 'get_stats':
                    return (0, get_stats_1.handleGetStats)(ticketQueries, args);
                case 'get_next_ticket':
                    return (0, get_next_ticket_1.handleGetNextTicket)(ticketQueries, args);
                case 'reorder_ticket':
                    return (0, ticket_ordering_1.handleReorderTicket)(ticketQueries, args);
                case 'move_ticket':
                    return (0, ticket_ordering_1.handleMoveTicket)(ticketQueries, args);
                case 'edit_field':
                    return (0, edit_field_1.handleEditField)(ticketQueries, args);
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
//# sourceMappingURL=setup.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetTicket = handleGetTicket;
const logger_1 = require("../../../utils/logger");
const types_1 = require("../types");
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
    return (0, types_1.createSuccessResponse)(ticket);
}
//# sourceMappingURL=get-ticket.js.map
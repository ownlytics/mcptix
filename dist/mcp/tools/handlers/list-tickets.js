"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListTickets = handleListTickets;
const logger_1 = require("../../../utils/logger");
const types_1 = require("../types");
function handleListTickets(ticketQueries, args) {
    logger_1.Logger.debug('McpServer', `handleListTickets called with args: ${JSON.stringify(args)}`);
    const filters = {
        status: args.status,
        priority: args.priority,
        search: args.search,
    };
    logger_1.Logger.debug('McpServer', `Using filters: ${JSON.stringify(filters)}`);
    const tickets = ticketQueries.getTickets(filters, args.sort || 'updated', args.order || 'desc', args.limit || 100, args.offset || 0);
    return (0, types_1.createSuccessResponse)(tickets);
}
//# sourceMappingURL=list-tickets.js.map
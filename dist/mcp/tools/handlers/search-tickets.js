"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSearchTickets = handleSearchTickets;
const types_1 = require("../types");
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
    return (0, types_1.createSuccessResponse)(tickets);
}
//# sourceMappingURL=search-tickets.js.map
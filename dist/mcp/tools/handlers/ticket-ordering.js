"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReorderTicket = handleReorderTicket;
exports.handleMoveTicket = handleMoveTicket;
const types_1 = require("../types");
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
    return (0, types_1.createSuccessResponse)({ id: args.id, success });
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
    return (0, types_1.createSuccessResponse)({ id: args.id, success });
}
//# sourceMappingURL=ticket-ordering.js.map
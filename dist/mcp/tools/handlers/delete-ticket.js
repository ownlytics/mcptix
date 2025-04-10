"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDeleteTicket = handleDeleteTicket;
const types_1 = require("../types");
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
    return (0, types_1.createSuccessResponse)({ id: args.id, success });
}
//# sourceMappingURL=delete-ticket.js.map
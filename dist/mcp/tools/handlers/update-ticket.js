"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpdateTicket = handleUpdateTicket;
const types_1 = require("../types");
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
    return (0, types_1.createSuccessResponse)({ id: args.id, success });
}
//# sourceMappingURL=update-ticket.js.map
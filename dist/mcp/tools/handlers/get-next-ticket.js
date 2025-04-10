"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetNextTicket = handleGetNextTicket;
const types_1 = require("../types");
function handleGetNextTicket(ticketQueries, args) {
    if (!args.status || !['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(args.status)) {
        throw new Error('Valid status is required (backlog, up-next, in-progress, in-review, completed)');
    }
    const ticket = ticketQueries.getNextTicket(args.status);
    if (!ticket) {
        throw new Error(`No tickets found in ${args.status}`);
    }
    return (0, types_1.createSuccessResponse)(ticket);
}
//# sourceMappingURL=get-next-ticket.js.map
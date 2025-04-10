"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetStats = handleGetStats;
const types_1 = require("../types");
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
    return (0, types_1.createSuccessResponse)(stats);
}
//# sourceMappingURL=get-stats.js.map
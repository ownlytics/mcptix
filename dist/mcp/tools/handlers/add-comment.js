"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAddComment = handleAddComment;
const types_1 = require("../types");
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
    return (0, types_1.createSuccessResponse)({ id: commentId, success: true });
}
//# sourceMappingURL=add-comment.js.map
import { TicketQueries } from '../../../db/queries';
import { Comment } from '../../../types';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleAddComment(ticketQueries: TicketQueries, args: any): ToolResponse {
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
  const comment: Comment = {
    id: `comment-${Date.now()}`,
    ticket_id: args.ticket_id,
    content: args.content,
    author,
    timestamp: new Date().toISOString(),
  };

  // Add comment
  const commentId = ticketQueries.addComment(args.ticket_id, comment);

  return createSuccessResponse({ id: commentId, success: true });
}

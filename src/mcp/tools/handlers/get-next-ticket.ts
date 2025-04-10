import { TicketQueries } from '../../../db/queries';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleGetNextTicket(ticketQueries: TicketQueries, args: any): ToolResponse {
  if (!args.status || !['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(args.status)) {
    throw new Error('Valid status is required (backlog, up-next, in-progress, in-review, completed)');
  }

  const ticket = ticketQueries.getNextTicket(
    args.status as 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed',
  );

  if (!ticket) {
    throw new Error(`No tickets found in ${args.status}`);
  }

  return createSuccessResponse(ticket);
}

import { TicketQueries } from '../../../db/queries';
import { Ticket } from '../../../types';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleGetStats(ticketQueries: TicketQueries, args: any): ToolResponse {
  const groupBy = args.group_by || 'status';

  // Get all tickets
  const tickets = ticketQueries.getTickets({}, 'updated', 'desc', 1000, 0);

  // Group tickets by the specified field
  const stats: Record<string, number> = {};

  for (const ticket of tickets) {
    const key = ticket[groupBy as keyof Ticket] as string;
    stats[key] = (stats[key] || 0) + 1;
  }

  return createSuccessResponse(stats);
}

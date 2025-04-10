import { TicketQueries } from '../../../db/queries';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleSearchTickets(ticketQueries: TicketQueries, args: any): ToolResponse {
  if (!args.query) {
    throw new Error('Search query is required');
  }

  const filters = {
    status: args.status,
    priority: args.priority,
    search: args.query,
  };

  const tickets = ticketQueries.getTickets(
    filters,
    args.sort || 'updated',
    args.order || 'desc',
    args.limit || 100,
    args.offset || 0,
  );

  return createSuccessResponse(tickets);
}

import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleListTickets(ticketQueries: TicketQueries, args: any): ToolResponse {
  Logger.debug('McpServer', `handleListTickets called with args: ${JSON.stringify(args)}`);

  const filters = {
    status: args.status,
    priority: args.priority,
    search: args.search,
  };

  Logger.debug('McpServer', `Using filters: ${JSON.stringify(filters)}`);

  const tickets = ticketQueries.getTickets(
    filters,
    args.sort || 'updated',
    args.order || 'desc',
    args.limit || 100,
    args.offset || 0,
  );

  return createSuccessResponse(tickets);
}

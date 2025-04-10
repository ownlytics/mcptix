import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleGetTicket(ticketQueries: TicketQueries, args: any): ToolResponse {
  if (!args.id) {
    Logger.warn('McpServer', 'Ticket ID is required');
    throw new Error('Ticket ID is required');
  }

  Logger.debug('McpServer', `Getting ticket with ID: ${args.id}`);

  const ticket = ticketQueries.getTicketById(args.id);

  if (!ticket) {
    Logger.warn('McpServer', `Ticket with ID ${args.id} not found`);
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  Logger.debug('McpServer', `Found ticket: ${args.id}`);

  return createSuccessResponse(ticket);
}

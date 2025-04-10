import { TicketQueries } from '../../../db/queries';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleDeleteTicket(ticketQueries: TicketQueries, args: any): ToolResponse {
  if (!args.id) {
    throw new Error('Ticket ID is required');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Delete ticket
  const success = ticketQueries.deleteTicket(args.id);

  return createSuccessResponse({ id: args.id, success });
}

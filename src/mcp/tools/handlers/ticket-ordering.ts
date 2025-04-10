import { TicketQueries } from '../../../db/queries';
import { createSuccessResponse, ToolResponse } from '../types';

// Handler for reorder_ticket tool
export function handleReorderTicket(ticketQueries: TicketQueries, args: any): ToolResponse {
  if (!args.id) {
    throw new Error('Ticket ID is required');
  }

  if (typeof args.order_value !== 'number') {
    throw new Error('order_value must be a number');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Reorder the ticket
  const success = ticketQueries.reorderTicket(args.id, args.order_value);

  return createSuccessResponse({ id: args.id, success });
}

// Handler for move_ticket tool
export function handleMoveTicket(ticketQueries: TicketQueries, args: any): ToolResponse {
  if (!args.id) {
    throw new Error('Ticket ID is required');
  }

  if (!args.status || !['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(args.status)) {
    throw new Error('Valid status is required (backlog, up-next, in-progress, in-review, completed)');
  }

  // Check if ticket exists
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Move the ticket to the new status
  const success = ticketQueries.moveTicket(
    args.id,
    args.status as 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed',
    args.order_value,
  );

  return createSuccessResponse({ id: args.id, success });
}

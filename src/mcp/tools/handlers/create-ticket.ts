import { TicketQueries } from '../../../db/queries';
import { Ticket } from '../../../types';
import { Logger } from '../../../utils/logger';
import { createSuccessResponse, ToolResponse } from '../types';

/**
 * Creates a new ticket and sets an appropriate order_value to ensure
 * it can be properly positioned in the UI.
 *
 * The fix addresses an issue where tickets created via the MCP server
 * all had the default order_value of 0, making them impossible to
 * sort properly in the UI's drag-and-drop functionality.
 */
export function handleCreateTicket(ticketQueries: TicketQueries, args: any): ToolResponse {
  if (!args.title) {
    throw new Error('Ticket title is required');
  }

  const status = args.status || 'backlog';

  // First create the ticket with default values
  const ticket: Ticket = {
    id: `ticket-${Date.now()}`,
    title: args.title,
    description: args.description || '',
    priority: args.priority || 'medium',
    status: status,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    agent_context: args.agent_context || null,
  };

  if (args.complexity_metadata) {
    ticket.complexity_metadata = {
      ticket_id: ticket.id,
      ...args.complexity_metadata,
    };
  }

  // Create the ticket in the database
  const ticketId = ticketQueries.createTicket(ticket);

  try {
    // Get all tickets in the same status to find the maximum order_value
    const ticketsInStatus = ticketQueries.getTickets({ status: status }, 'order_value', 'desc', 100, 0);

    // Only attempt to set order_value if ticketsInStatus is a valid array
    if (Array.isArray(ticketsInStatus) && ticketsInStatus.length > 0 && ticketsInStatus[0]?.id !== ticketId) {
      // The first ticket has the highest order_value
      // @ts-expect-error - order_value exists in the database but not in the type definition
      const maxOrderValue = ticketsInStatus[0].order_value || 0;
      const newOrderValue = maxOrderValue + 1000;

      // Update the ticket's order_value
      ticketQueries.reorderTicket(ticketId, newOrderValue);
    }
  } catch (error) {
    // Log the error but don't fail ticket creation
    Logger.warn('McpServer', `Failed to set order_value for ticket ${ticketId}: ${error}`);
  }

  return createSuccessResponse({ id: ticketId, success: true });
}

import { TicketQueries } from '../../../db/queries';
import { ToolResponse } from '../types';
/**
 * Creates a new ticket and sets an appropriate order_value to ensure
 * it can be properly positioned in the UI.
 *
 * The fix addresses an issue where tickets created via the MCP server
 * all had the default order_value of 0, making them impossible to
 * sort properly in the UI's drag-and-drop functionality.
 */
export declare function handleCreateTicket(ticketQueries: TicketQueries, args: any): ToolResponse;
//# sourceMappingURL=create-ticket.d.ts.map
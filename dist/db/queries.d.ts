import Database from 'better-sqlite3';
import { Ticket, Comment, TicketFilter, ExportedData } from '../types';
export declare class TicketQueries {
    private db;
    constructor(db: Database.Database);
    getTickets(filters?: TicketFilter, sort?: string, order?: string, limit?: number, offset?: number): Ticket[];
    getTicketById(id: string): Ticket | null;
    createTicket(ticket: Ticket): string;
    updateTicket(ticket: Ticket): boolean;
    deleteTicket(id: string): boolean;
    addComment(ticketId: string, comment: Comment): string;
    exportToJson(): ExportedData;
    /**
     * Get the "next" ticket from a status category
     * Returns the ticket with the highest order_value in the specified status
     * In case of ties, the most recently updated ticket is returned
     * @param status The status category to get the next ticket from
     * @returns The next ticket, or null if no tickets exist in the status
     */
    getNextTicket(status: 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed'): Ticket | null;
    /**
     * Reorder a ticket within its current status column
     * @param id The ID of the ticket to reorder
     * @param newOrderValue The new order value for the ticket
     * @returns True if the ticket was reordered successfully, false otherwise
     */
    reorderTicket(id: string, newOrderValue: number): boolean;
    /**
     * Move a ticket to a different status and optionally reorder it
     * If no new order value is specified, the ticket will be placed at the bottom of the new status column
     * @param id The ID of the ticket to move
     * @param newStatus The new status for the ticket
     * @param newOrderValue Optional new order value for the ticket
     * @returns True if the ticket was moved successfully, false otherwise
     */
    moveTicket(id: string, newStatus: 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed', newOrderValue?: number): boolean;
}
//# sourceMappingURL=queries.d.ts.map
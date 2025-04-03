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
}

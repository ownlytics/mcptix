import Database from 'better-sqlite3';
import { Ticket } from '../types';
import { TicketQueries } from './queries';
import { clearDatabase, initializeDatabase } from './schema';

describe('TicketQueries - Reorder Ticket', () => {
  let db: Database.Database;
  let ticketQueries: TicketQueries;

  beforeEach(() => {
    // Create an in-memory database for testing
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    // Initialize the database
    db.exec(`
      CREATE TABLE tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
        status TEXT CHECK(status IN ('backlog', 'up-next', 'in-progress', 'in-review', 'completed')),
        created TEXT NOT NULL,
        updated TEXT NOT NULL,
        agent_context TEXT,
        order_value REAL DEFAULT 0
      );
      CREATE INDEX idx_tickets_status ON tickets(status);
      CREATE INDEX idx_tickets_priority ON tickets(priority);
      
      CREATE TABLE complexity (
        ticket_id TEXT PRIMARY KEY,
        files_touched INTEGER DEFAULT 0,
        modules_crossed INTEGER DEFAULT 0,
        stack_layers_involved INTEGER DEFAULT 0,
        dependencies INTEGER DEFAULT 0,
        shared_state_touches INTEGER DEFAULT 0,
        cascade_impact_zones INTEGER DEFAULT 0,
        subjectivity_rating REAL DEFAULT 0,
        loc_added INTEGER DEFAULT 0,
        loc_modified INTEGER DEFAULT 0,
        test_cases_written INTEGER DEFAULT 0,
        edge_cases INTEGER DEFAULT 0,
        mocking_complexity INTEGER DEFAULT 0,
        coordination_touchpoints INTEGER DEFAULT 0,
        review_rounds INTEGER DEFAULT 0,
        blockers_encountered INTEGER DEFAULT 0,
        cie_score REAL DEFAULT 0,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );
      
      CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        content TEXT,
        type TEXT CHECK(type IN ('comment', 'request_changes', 'change_proposal')),
        author TEXT CHECK(author IN ('developer', 'agent')),
        status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
        timestamp TEXT NOT NULL,
        summary TEXT,
        full_text TEXT,
        display TEXT CHECK(display IN ('expanded', 'collapsed')),
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
    `);

    // Create the ticket queries instance
    ticketQueries = new TicketQueries(db);

    // Insert some test tickets with order values
    const now = new Date().toISOString();
    const tickets = [
      {
        id: 'ticket-1',
        title: 'Ticket 1',
        description: 'Description for ticket 1',
        priority: 'medium',
        status: 'in-progress' as const,
        created: now,
        updated: now,
        order_value: 3000,
      },
      {
        id: 'ticket-2',
        title: 'Ticket 2',
        description: 'Description for ticket 2',
        priority: 'medium',
        status: 'in-progress' as const,
        created: now,
        updated: now,
        order_value: 2000,
      },
      {
        id: 'ticket-3',
        title: 'Ticket 3',
        description: 'Description for ticket 3',
        priority: 'medium',
        status: 'in-progress' as const,
        created: now,
        updated: now,
        order_value: 1000,
      },
      {
        id: 'ticket-4',
        title: 'Ticket 4',
        description: 'Description for ticket 4',
        priority: 'medium',
        status: 'backlog' as const,
        created: now,
        updated: now,
        order_value: 3000,
      },
      {
        id: 'ticket-5',
        title: 'Ticket 5',
        description: 'Description for ticket 5',
        priority: 'medium',
        status: 'backlog' as const,
        created: now,
        updated: now,
        order_value: 2000,
      },
    ];

    for (const ticket of tickets) {
      db.prepare(
        `
        INSERT INTO tickets (id, title, description, priority, status, created, updated, order_value)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        ticket.id,
        ticket.title,
        ticket.description,
        ticket.priority,
        ticket.status,
        ticket.created,
        ticket.updated,
        ticket.order_value,
      );
    }
  });

  afterEach(() => {
    db.close();
  });

  test('reorderTicket should update the order_value of a ticket within the same status', () => {
    // Move ticket-3 between ticket-1 and ticket-2 (from bottom to middle)
    const result = ticketQueries.reorderTicket('ticket-3', 2500);

    expect(result).toBe(true);

    // Check the new order value
    const ticket = db.prepare('SELECT order_value FROM tickets WHERE id = ?').get('ticket-3') as {
      order_value: number;
    };
    expect(ticket.order_value).toBe(2500);

    // Get all tickets in order
    const tickets = db
      .prepare("SELECT id, order_value FROM tickets WHERE status = 'in-progress' ORDER BY order_value DESC")
      .all() as Array<{ id: string; order_value: number }>;

    expect(tickets[0].id).toBe('ticket-1'); // Top (3000)
    expect(tickets[1].id).toBe('ticket-3'); // Middle (2500)
    expect(tickets[2].id).toBe('ticket-2'); // Bottom (2000)
  });

  test('reorderTicket should return false if the ticket does not exist', () => {
    const result = ticketQueries.reorderTicket('non-existent-ticket', 2500);
    expect(result).toBe(false);
  });

  test('moveTicket should update both status and order_value', () => {
    // Move ticket-3 from in-progress to backlog with a specific order_value
    const result = ticketQueries.moveTicket('ticket-3', 'backlog', 2500);

    expect(result).toBe(true);

    // Check the new status and order value
    const ticket = db.prepare('SELECT status, order_value FROM tickets WHERE id = ?').get('ticket-3') as {
      status: string;
      order_value: number;
    };

    expect(ticket.status).toBe('backlog');
    expect(ticket.order_value).toBe(2500);

    // Get all backlog tickets in order
    const tickets = db
      .prepare("SELECT id, order_value FROM tickets WHERE status = 'backlog' ORDER BY order_value DESC")
      .all() as Array<{ id: string; order_value: number }>;

    expect(tickets[0].id).toBe('ticket-4'); // Top (3000)
    expect(tickets[1].id).toBe('ticket-3'); // Middle (2500)
    expect(tickets[2].id).toBe('ticket-5'); // Bottom (2000)
  });

  test('moveTicket should place a ticket at the bottom of the new status if no order_value is specified', () => {
    // Move ticket-3 from in-progress to backlog without specifying an order_value
    const result = ticketQueries.moveTicket('ticket-3', 'backlog');

    expect(result).toBe(true);

    // Check the new status and order value
    const ticket = db.prepare('SELECT status, order_value FROM tickets WHERE id = ?').get('ticket-3') as {
      status: string;
      order_value: number;
    };

    expect(ticket.status).toBe('backlog');

    // The ticket should be at the bottom (lowest order_value) in the backlog column
    const lowestOrderValueInBacklog = db
      .prepare("SELECT MIN(order_value) as min_order FROM tickets WHERE status = 'backlog'")
      .get() as { min_order: number };

    expect(ticket.order_value).toBe(lowestOrderValueInBacklog.min_order);
    expect(ticket.order_value).toBeLessThan(2000); // Less than the previous minimum (ticket-5)
  });

  test('getTickets should use order_value as default sort field', () => {
    // Get tickets without specifying a sort field
    const result = ticketQueries.getTickets({ status: 'in-progress' });

    // Verify they're sorted by order_value in descending order by default
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('ticket-1'); // Top (3000)
    expect(result[1].id).toBe('ticket-2'); // Middle (2000)
    expect(result[2].id).toBe('ticket-3'); // Bottom (1000)
  });

  test('moveTicket should return false if the ticket does not exist', () => {
    const result = ticketQueries.moveTicket('non-existent-ticket', 'backlog');
    expect(result).toBe(false);
  });
});

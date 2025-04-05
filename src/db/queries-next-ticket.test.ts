import Database from 'better-sqlite3';

import { Ticket } from '../types';

import { TicketQueries } from './queries';
import { clearDatabase, initializeDatabase } from './schema';

describe('TicketQueries - Next Ticket', () => {
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
    const statuses = ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'];

    statuses.forEach((status, statusIndex) => {
      for (let i = 0; i < 3; i++) {
        const ticket: Ticket = {
          id: `ticket-${status}-${i}`,
          title: `Ticket ${i} in ${status}`,
          description: `Description for ticket ${i} in ${status}`,
          priority: 'medium',
          status: status as 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed',
          created: now,
          updated: now,
        };

        ticketQueries.createTicket(ticket);

        // Set order values (3000, 2000, 1000 for each status)
        // Higher values are at the top of the column
        db.prepare(
          `
          UPDATE tickets
          SET order_value = ?
          WHERE id = ?
        `,
        ).run((3 - i) * 1000, ticket.id);
      }
    });
  });

  afterEach(() => {
    db.close();
  });

  test('getNextTicket should return the ticket with the highest order_value in a status', () => {
    // The method doesn't exist yet, this will fail
    const nextTicket = ticketQueries.getNextTicket('in-progress');

    // The first ticket should have the highest order value (3000)
    expect(nextTicket).not.toBeNull();
    expect(nextTicket?.id).toBe('ticket-in-progress-0');
    expect(nextTicket?.title).toBe('Ticket 0 in in-progress');
  });

  test('getNextTicket should return null if no tickets exist in the status', () => {
    // Delete all in-progress tickets
    db.prepare(`DELETE FROM tickets WHERE status = 'in-progress'`).run();

    const nextTicket = ticketQueries.getNextTicket('in-progress');
    expect(nextTicket).toBeNull();
  });

  test('getNextTicket should handle ties in order_value by using most recently updated', () => {
    // Make two tickets have the same order_value but different updated times
    const olderTime = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    const newerTime = new Date().toISOString(); // now

    // Set both tickets to have the same order_value
    db.prepare(
      `
      UPDATE tickets
      SET order_value = 5000
      WHERE id IN ('ticket-in-progress-0', 'ticket-in-progress-1')
    `,
    ).run();

    // Set different update times
    db.prepare(
      `
      UPDATE tickets
      SET updated = ?
      WHERE id = 'ticket-in-progress-0'
    `,
    ).run(olderTime);

    db.prepare(
      `
      UPDATE tickets
      SET updated = ?
      WHERE id = 'ticket-in-progress-1'
    `,
    ).run(newerTime);

    // Get the next ticket - should be the most recently updated one
    const nextTicket = ticketQueries.getNextTicket('in-progress');
    expect(nextTicket).not.toBeNull();
    expect(nextTicket?.id).toBe('ticket-in-progress-1');
  });
});

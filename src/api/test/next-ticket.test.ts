import Database from 'better-sqlite3';
import { Express } from 'express';
import request from 'supertest';

import { TicketQueries } from '../../db/queries';
import { Ticket } from '../../types';

import { createTestServer } from './api-test-helper';

describe('Next Ticket API', () => {
  let app: any; // Changed from Express to any to avoid type issues
  let db: Database.Database;
  let ticketQueries: TicketQueries;

  beforeEach(async () => {
    // Create an in-memory database for testing
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    // Initialize the database schema
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
      
      CREATE INDEX idx_tickets_status ON tickets(status);
      CREATE INDEX idx_tickets_priority ON tickets(priority);
      CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
    `);

    // Create ticket queries
    ticketQueries = new TicketQueries(db);

    // Set up the Express app with the routes
    const testServer = createTestServer(ticketQueries);
    app = testServer.app;

    // Add some test tickets
    const now = new Date().toISOString();
    const statuses = ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'];

    statuses.forEach((status, i) => {
      for (let j = 0; j < 3; j++) {
        const ticket: Ticket = {
          id: `ticket-${status}-${j}`,
          title: `Ticket ${j} in ${status}`,
          description: `Description for ticket ${j} in ${status}`,
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
        ).run((3 - j) * 1000, ticket.id);
      }
    });
  });

  afterEach(() => {
    db.close();
  });

  test('GET /api/tickets/next/:status should return the next ticket from the specified status', async () => {
    const response = await request(app).get('/api/tickets/next/in-progress');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 'ticket-in-progress-0');
    expect(response.body).toHaveProperty('title', 'Ticket 0 in in-progress');
    expect(response.body).toHaveProperty('order_value', 3000);
  });

  test('GET /api/tickets/next/:status should return 404 if no tickets exist in the status', async () => {
    // Delete all in-progress tickets
    db.exec(`DELETE FROM tickets WHERE status = 'in-progress'`);

    const response = await request(app).get('/api/tickets/next/in-progress');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  test('PUT /api/tickets/:id/reorder should update the order of a ticket', async () => {
    const response = await request(app)
      .put('/api/tickets/ticket-in-progress-2/reorder')
      .send({ order_value: 2500 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);

    // Check the new order value
    const ticket = db
      .prepare('SELECT order_value FROM tickets WHERE id = ?')
      .get('ticket-in-progress-2') as { order_value: number };
    expect(ticket.order_value).toBe(2500);
  });

  test('PUT /api/tickets/:id/move should update the status and order of a ticket', async () => {
    const response = await request(app)
      .put('/api/tickets/ticket-in-progress-2/move')
      .send({ status: 'backlog', order_value: 2500 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);

    // Check the new status and order value
    const ticket = db
      .prepare('SELECT status, order_value FROM tickets WHERE id = ?')
      .get('ticket-in-progress-2') as {
      status: string;
      order_value: number;
    };

    expect(ticket.status).toBe('backlog');
    expect(ticket.order_value).toBe(2500);
  });
});

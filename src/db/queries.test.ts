import fs from 'fs';
import path from 'path';
import { Ticket } from '../types';
import { TicketQueries } from './queries';
import { initializeDatabase, closeDatabase } from './schema';

describe('TicketQueries', () => {
  const testDbPath = path.join(process.cwd(), 'test-queries.db');
  let db: any;
  let ticketQueries: TicketQueries;

  // Set up test database before each test
  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    db = initializeDatabase(testDbPath);
    ticketQueries = new TicketQueries(db);
  });

  // Clean up test database after each test
  afterEach(() => {
    closeDatabase(db);

    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should create and retrieve a ticket', () => {
    // Create a ticket
    const ticket: Ticket = {
      id: 'test-ticket',
      title: 'Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      status: 'backlog',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    const ticketId = ticketQueries.createTicket(ticket);
    expect(ticketId).toBe('test-ticket');

    // Retrieve the ticket
    const retrievedTicket = ticketQueries.getTicketById('test-ticket');
    expect(retrievedTicket).not.toBeNull();
    expect(retrievedTicket?.title).toBe('Test Ticket');
    expect(retrievedTicket?.description).toBe('This is a test ticket');
  });

  test('should update a ticket', () => {
    // Create a ticket
    const ticket: Ticket = {
      id: 'test-ticket',
      title: 'Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      status: 'backlog',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    ticketQueries.createTicket(ticket);

    // Update the ticket
    const updatedTicket: Ticket = {
      ...ticket,
      title: 'Updated Ticket',
      description: 'This ticket has been updated',
      status: 'in-progress',
    };

    const success = ticketQueries.updateTicket(updatedTicket);
    expect(success).toBe(true);

    // Retrieve the updated ticket
    const retrievedTicket = ticketQueries.getTicketById('test-ticket');
    expect(retrievedTicket).not.toBeNull();
    expect(retrievedTicket?.title).toBe('Updated Ticket');
    expect(retrievedTicket?.description).toBe('This ticket has been updated');
    expect(retrievedTicket?.status).toBe('in-progress');
  });

  test('should delete a ticket', () => {
    // Create a ticket
    const ticket: Ticket = {
      id: 'test-ticket',
      title: 'Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      status: 'backlog',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    ticketQueries.createTicket(ticket);

    // Delete the ticket
    const success = ticketQueries.deleteTicket('test-ticket');
    expect(success).toBe(true);

    // Try to retrieve the deleted ticket
    const retrievedTicket = ticketQueries.getTicketById('test-ticket');
    expect(retrievedTicket).toBeNull();
  });

  test('should add a comment to a ticket', () => {
    // Create a ticket
    const ticket: Ticket = {
      id: 'test-ticket',
      title: 'Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      status: 'backlog',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    ticketQueries.createTicket(ticket);

    // Add a comment
    const commentId = ticketQueries.addComment('test-ticket', {
      id: 'test-comment',
      ticket_id: 'test-ticket',
      content: 'This is a test comment',
      type: 'comment',
      author: 'developer',
      status: 'open',
      timestamp: '2023-01-01T00:00:00.000Z',
    });

    expect(commentId).toBe('test-comment');

    // Retrieve the ticket with comment
    const retrievedTicket = ticketQueries.getTicketById('test-ticket');
    expect(retrievedTicket).not.toBeNull();
    expect(retrievedTicket?.comments).toHaveLength(1);
    expect(retrievedTicket?.comments?.[0].content).toBe('This is a test comment');
  });

  test('should filter tickets by status', () => {
    // Create tickets with different statuses
    const ticket1: Ticket = {
      id: 'ticket-1',
      title: 'Ticket 1',
      description: 'This is ticket 1',
      priority: 'medium',
      status: 'backlog',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    const ticket2: Ticket = {
      id: 'ticket-2',
      title: 'Ticket 2',
      description: 'This is ticket 2',
      priority: 'high',
      status: 'in-progress',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    ticketQueries.createTicket(ticket1);
    ticketQueries.createTicket(ticket2);

    // Filter by status
    const backlogTickets = ticketQueries.getTickets({ status: 'backlog' });
    expect(backlogTickets).toHaveLength(1);
    expect(backlogTickets[0].id).toBe('ticket-1');

    const inProgressTickets = ticketQueries.getTickets({ status: 'in-progress' });
    expect(inProgressTickets).toHaveLength(1);
    expect(inProgressTickets[0].id).toBe('ticket-2');
  });

  test('should export tickets to JSON format', () => {
    // Create tickets with different statuses
    const ticket1: Ticket = {
      id: 'ticket-1',
      title: 'Ticket 1',
      description: 'This is ticket 1',
      priority: 'medium',
      status: 'backlog',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    const ticket2: Ticket = {
      id: 'ticket-2',
      title: 'Ticket 2',
      description: 'This is ticket 2',
      priority: 'high',
      status: 'in-progress',
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
    };

    ticketQueries.createTicket(ticket1);
    ticketQueries.createTicket(ticket2);

    // Export to JSON
    const exportedData = ticketQueries.exportToJson();

    // Check the structure
    expect(exportedData.columns).toHaveLength(5);

    // Check the backlog column
    const backlogColumn = exportedData.columns.find(col => col.id === 'backlog');
    expect(backlogColumn).toBeDefined();
    expect(backlogColumn?.tickets).toHaveLength(1);
    expect(backlogColumn?.tickets[0].id).toBe('ticket-1');

    // Check the in-progress column
    const inProgressColumn = exportedData.columns.find(col => col.id === 'in-progress');
    expect(inProgressColumn).toBeDefined();
    expect(inProgressColumn?.tickets).toHaveLength(1);
    expect(inProgressColumn?.tickets[0].id).toBe('ticket-2');
  });
});

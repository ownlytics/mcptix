import { createTestServer } from './api-test-helper';
import { seedTestData, sampleTickets } from './fixtures';
import { initTestDatabase, cleanupTestDatabase, resetTestDatabase } from './test-utils';

describe('Ticket Endpoints', () => {
  let db: any;
  let ticketQueries: any;
  let testServer: any;

  beforeAll(() => {
    const testEnv = initTestDatabase();
    db = testEnv.db;
    ticketQueries = testEnv.ticketQueries;
    testServer = createTestServer(ticketQueries);
  });

  beforeEach(() => {
    resetTestDatabase(db);
    seedTestData(ticketQueries);
  });

  afterAll(() => {
    cleanupTestDatabase(db);
  });

  describe('GET /api/tickets', () => {
    test('should return all tickets', async () => {
      const response = await testServer.request().get('/api/tickets').expect(200);

      expect(response.body.tickets).toHaveLength(sampleTickets.length);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.total).toBe(sampleTickets.length);
    });

    test('should filter tickets by status', async () => {
      const status = 'in-progress';
      const response = await testServer.request().get(`/api/tickets?status=${status}`).expect(200);

      expect(response.body.tickets.length).toBeGreaterThan(0);
      expect(response.body.tickets.every((t: any) => t.status === status)).toBe(true);
    });

    test('should filter tickets by priority', async () => {
      const priority = 'high';
      const response = await testServer
        .request()
        .get(`/api/tickets?priority=${priority}`)
        .expect(200);

      expect(response.body.tickets.length).toBeGreaterThan(0);
      expect(response.body.tickets.every((t: any) => t.priority === priority)).toBe(true);
    });

    test('should search tickets by title or description', async () => {
      const search = 'API';
      const response = await testServer.request().get(`/api/tickets?search=${search}`).expect(200);

      expect(response.body.tickets.length).toBeGreaterThan(0);
      expect(
        response.body.tickets.some(
          (t: any) => t.title.includes(search) || (t.description && t.description.includes(search)),
        ),
      ).toBe(true);
    });

    test('should sort tickets', async () => {
      const response = await testServer
        .request()
        .get('/api/tickets?sort=created&order=asc')
        .expect(200);

      const tickets = response.body.tickets;
      for (let i = 1; i < tickets.length; i++) {
        expect(new Date(tickets[i].created) >= new Date(tickets[i - 1].created)).toBe(true);
      }
    });

    test('should paginate tickets', async () => {
      const limit = 2;
      const response = await testServer
        .request()
        .get(`/api/tickets?limit=${limit}&offset=0`)
        .expect(200);

      expect(response.body.tickets).toHaveLength(limit);
      expect(response.body.metadata.limit).toBe(limit);
    });
  });

  describe('GET /api/tickets/:id', () => {
    test('should return a ticket by ID', async () => {
      const ticketId = sampleTickets[0].id;
      const response = await testServer.request().get(`/api/tickets/${ticketId}`).expect(200);

      expect(response.body.id).toBe(ticketId);
      expect(response.body.title).toBe(sampleTickets[0].title);
    });

    test('should return 404 for non-existent ticket', async () => {
      const response = await testServer.request().get('/api/tickets/non-existent-id').expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/tickets', () => {
    test('should create a new ticket', async () => {
      const newTicket = {
        title: 'New Test Ticket',
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'backlog',
      };

      const response = await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();

      // Verify the ticket was created
      const createdTicket = ticketQueries.getTicketById(response.body.id);
      expect(createdTicket).toBeDefined();
      expect(createdTicket.title).toBe(newTicket.title);
    });

    test('should return 400 if title is missing', async () => {
      const invalidTicket = {
        description: 'This is a test ticket',
        priority: 'medium',
        status: 'backlog',
      };

      const response = await testServer
        .request()
        .post('/api/tickets')
        .send(invalidTicket)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should create a ticket with complexity metadata', async () => {
      const newTicket = {
        title: 'Complex Ticket',
        description: 'This is a complex ticket',
        priority: 'high',
        status: 'backlog',
        complexity_metadata: {
          files_touched: 10,
          modules_crossed: 5,
          cie_score: 75.5,
        },
      };

      const response = await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      // Verify the ticket was created with complexity metadata
      const createdTicket = ticketQueries.getTicketById(response.body.id);
      expect(createdTicket.complexity_metadata).toBeDefined();
      expect(createdTicket.complexity_metadata.files_touched).toBe(10);
      expect(createdTicket.complexity_metadata.cie_score).toBe(75.5);
    });
  });

  // Additional test cases for other endpoints will be added in future PRs
});

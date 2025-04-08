import { createTestServer } from './api-test-helper';
import { initTestDatabase, cleanupTestDatabase, resetTestDatabase } from './test-utils';

describe('Agent Context Functionality', () => {
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
  });

  afterAll(() => {
    cleanupTestDatabase(db);
  });

  describe('Creating Tickets', () => {
    test('should create a ticket with agent_context', async () => {
      const newTicket = {
        title: 'Ticket with Agent Context',
        description: 'This ticket has agent context',
        priority: 'medium',
        status: 'backlog',
        agent_context:
          '# Agent Analysis\n\n## Requirements\n- Feature A\n- Feature B\n\n## Implementation Plan\n1. Step one\n2. Step two',
      };

      const response = await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      const ticketId = response.body.id;
      expect(ticketId).toBeDefined();

      // Verify the ticket was created with the agent_context
      const createdTicket = ticketQueries.getTicketById(ticketId);
      expect(createdTicket.agent_context).toBe(newTicket.agent_context);
    });

    test('should create a ticket with null agent_context if not provided', async () => {
      const newTicket = {
        title: 'Ticket without Agent Context',
        description: 'This ticket has no agent context',
      };

      const response = await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      const ticketId = response.body.id;
      expect(ticketId).toBeDefined();

      // Verify the ticket was created with null agent_context
      const createdTicket = ticketQueries.getTicketById(ticketId);
      expect(createdTicket.agent_context).toBeNull();
    });
  });

  describe('Updating Tickets', () => {
    test('should update a ticket with agent_context', async () => {
      // First create a ticket
      const newTicket = {
        title: 'Original Ticket',
        description: 'This ticket will be updated',
      };

      const createResponse = await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      const ticketId = createResponse.body.id;

      // Now update the ticket with agent_context
      const updateData = {
        agent_context:
          '# Updated Agent Analysis\n\n## New Implementation Plan\n1. Updated step one\n2. Updated step two',
      };

      const updateResponse = await testServer.request().put(`/api/tickets/${ticketId}`).send(updateData).expect(200);

      // Verify the ticket was updated
      const updatedTicket = ticketQueries.getTicketById(ticketId);
      expect(updatedTicket.agent_context).toBe(updateData.agent_context);
    });

    test('should preserve agent_context when updating other fields', async () => {
      // First create a ticket with agent_context
      const newTicket = {
        title: 'Original Ticket',
        description: 'This ticket will be updated',
        agent_context: '# Original Agent Analysis\n\n## Implementation Plan\n1. Step one\n2. Step two',
      };

      const createResponse = await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      const ticketId = createResponse.body.id;

      // Now update other fields
      const updateData = {
        title: 'Updated Title',
        status: 'in-progress',
      };

      const updateResponse = await testServer.request().put(`/api/tickets/${ticketId}`).send(updateData).expect(200);

      // Verify the agent_context was preserved
      const updatedTicket = ticketQueries.getTicketById(ticketId);
      expect(updatedTicket.title).toBe(updateData.title);
      expect(updatedTicket.status).toBe(updateData.status);
      expect(updatedTicket.agent_context).toBe(newTicket.agent_context);
    });
  });

  describe('Retrieving Tickets', () => {
    test('should retrieve a ticket with agent_context field', async () => {
      // First create a ticket with agent_context
      const newTicket = {
        title: 'Ticket to Retrieve',
        description: 'This ticket will be retrieved',
        agent_context: '# Agent Analysis for Retrieval\n\n## Implementation Plan\n1. Step one\n2. Step two',
      };

      const createResponse = await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      const ticketId = createResponse.body.id;

      // Now retrieve the ticket
      const response = await testServer.request().get(`/api/tickets/${ticketId}`).expect(200);

      // Verify the agent_context field is included
      expect(response.body.agent_context).toBe(newTicket.agent_context);
    });

    test('should include agent_context in ticket list results', async () => {
      // Create a ticket with agent_context
      const newTicket = {
        title: 'Ticket in List',
        description: 'This ticket should be in the list',
        agent_context: '# Agent Analysis for List\n\n## Notes\n- Note 1\n- Note 2',
      };

      await testServer.request().post('/api/tickets').send(newTicket).expect(201);

      // Get all tickets
      const response = await testServer.request().get('/api/tickets').expect(200);

      // Verify at least one ticket has agent_context
      const hasAgentContext = response.body.tickets.some(
        (ticket: any) => ticket.agent_context === newTicket.agent_context,
      );
      expect(hasAgentContext).toBe(true);
    });
  });
});

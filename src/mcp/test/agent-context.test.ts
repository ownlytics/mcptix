import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  initTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase,
} from '../../api/test/test-utils';
import { TicketQueries } from '../../db/queries';
import { Ticket } from '../../types';
import { setupToolHandlers } from '../tools';

// Type definition for the call tool handler
type CallToolHandler = (request: { params: any }) => Promise<any>;

// Mock MCP Server class that matches the required interface
class MockMcpServer {
  requestHandlers = new Map();

  setRequestHandler(schema: any, handler: CallToolHandler): void {
    this.requestHandlers.set(schema, handler);
  }
}

describe('MCP Agent Context Integration Tests', () => {
  let db: any;
  let ticketQueries: TicketQueries;
  let mockServer: MockMcpServer;
  let callToolHandler: CallToolHandler;

  beforeAll(() => {
    const testEnv = initTestDatabase();
    db = testEnv.db;
    ticketQueries = testEnv.ticketQueries;
    mockServer = new MockMcpServer();

    // Set up the tool handlers
    setupToolHandlers(mockServer as any, ticketQueries);

    // Get the call_tool handler
    callToolHandler = mockServer.requestHandlers.get(CallToolRequestSchema);
    expect(callToolHandler).toBeDefined();
  });

  beforeEach(() => {
    resetTestDatabase(db);
  });

  afterAll(() => {
    cleanupTestDatabase(db);
  });

  describe('create_ticket tool', () => {
    test('should create a ticket with agent_context field', async () => {
      const params = {
        name: 'create_ticket',
        arguments: {
          title: 'MCP Created Ticket',
          description: 'Created via MCP tool',
          priority: 'high',
          status: 'backlog',
          agent_context:
            '# MCP Agent Analysis\n\n## Implementation Steps\n1. First step\n2. Second step',
        },
      };

      const result = await callToolHandler({ params });
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe('text');

      // Parse the result JSON
      const resultObj = JSON.parse(result.content[0].text);
      expect(resultObj.id).toBeDefined();
      expect(resultObj.success).toBe(true);

      // Get the ticket from the database and verify agent_context
      const ticketId = resultObj.id;
      const createdTicket = ticketQueries.getTicketById(ticketId);
      expect(createdTicket).not.toBeNull();
      if (createdTicket) {
        expect(createdTicket.title).toBe(params.arguments.title);
        expect(createdTicket.agent_context).toBe(params.arguments.agent_context);
      }
    });
  });

  describe('update_ticket tool', () => {
    test('should update a ticket with agent_context field', async () => {
      // First create a ticket
      const ticket: Ticket = {
        id: `ticket-${Date.now()}`,
        title: 'Original MCP Ticket',
        description: 'This ticket will be updated',
        priority: 'medium',
        status: 'backlog',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      const ticketId = ticketQueries.createTicket(ticket);

      // Now update the ticket with agent_context
      const params = {
        name: 'update_ticket',
        arguments: {
          id: ticketId,
          agent_context:
            '# Updated MCP Agent Analysis\n\n## New Steps\n1. Updated first step\n2. Updated second step',
        },
      };

      const result = await callToolHandler({ params });
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe('text');

      // Verify the ticket was updated with agent_context
      const updatedTicket = ticketQueries.getTicketById(ticketId);
      expect(updatedTicket).not.toBeNull();
      if (updatedTicket) {
        expect(updatedTicket.agent_context).toBe(params.arguments.agent_context);
      }
    });
  });

  describe('get_ticket tool', () => {
    test('should retrieve a ticket with agent_context field', async () => {
      // First create a ticket with agent_context
      const ticket: Ticket = {
        id: `ticket-${Date.now()}`,
        title: 'MCP Ticket to Retrieve',
        description: 'This ticket will be retrieved',
        priority: 'medium',
        status: 'backlog',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        agent_context: '# MCP Agent Analysis for Retrieval\n\n## Plan\n1. Step one\n2. Step two',
      };

      const ticketId = ticketQueries.createTicket(ticket);

      // Now retrieve the ticket
      const params = {
        name: 'get_ticket',
        arguments: {
          id: ticketId,
        },
      };

      const result = await callToolHandler({ params });
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      expect(result.content[0].type).toBe('text');

      // Parse the result JSON and verify agent_context
      const resultObj = JSON.parse(result.content[0].text);
      expect(resultObj.id).toBe(ticketId);
      expect(resultObj.agent_context).toBe(ticket.agent_context);
    });
  });
});

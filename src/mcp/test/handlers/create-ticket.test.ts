import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleComplexityMetrics } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('create_ticket handler', () => {
  let mockServer: jest.Mocked<Server>;
  let mockTicketQueries: jest.Mocked<TicketQueries>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mocks
    const mocks = createMocks();
    mockServer = mocks.mockServer;
    mockTicketQueries = mocks.mockTicketQueries;
  });

  test('should create a new ticket', async () => {
    const newTicketId = 'new-ticket-id';
    mockTicketQueries.createTicket.mockReturnValue(newTicketId);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'create_ticket', {
      title: 'New Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      status: 'backlog',
    });

    expect(mockTicketQueries.createTicket).toHaveBeenCalled();
    expect(mockTicketQueries.createTicket.mock.calls[0][0]).toMatchObject({
      title: 'New Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      status: 'backlog',
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ id: newTicketId, success: true }, null, 2),
        },
      ],
    });
  });

  test('should create a ticket with complexity metadata', async () => {
    const newTicketId = 'new-ticket-id';
    mockTicketQueries.createTicket.mockReturnValue(newTicketId);

    const complexityMetadata = {
      files_touched: 5,
      modules_crossed: 2,
      cie_score: 45.5,
    };

    const result = await callToolHandler(mockServer, mockTicketQueries, 'create_ticket', {
      title: 'Complex Ticket',
      description: 'This is a complex ticket',
      complexity_metadata: complexityMetadata,
    });

    expect(mockTicketQueries.createTicket).toHaveBeenCalled();
    expect(mockTicketQueries.createTicket.mock.calls[0][0].complexity_metadata).toMatchObject({
      ...complexityMetadata,
      ticket_id: expect.any(String),
    });
  });

  test('should create a ticket with agent_context', async () => {
    const newTicketId = 'new-ticket-id';
    mockTicketQueries.createTicket.mockReturnValue(newTicketId);

    const agentContext = '# Agent Workspace\nThis is a test workspace.';

    const result = await callToolHandler(mockServer, mockTicketQueries, 'create_ticket', {
      title: 'Ticket with Agent Context',
      description: 'This ticket has agent context',
      agent_context: agentContext,
    });

    expect(mockTicketQueries.createTicket).toHaveBeenCalled();
    expect(mockTicketQueries.createTicket.mock.calls[0][0].agent_context).toBe(agentContext);
  });

  test('should throw error if title is missing', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'create_ticket', {
      description: 'This is a test ticket',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Ticket title is required');
    expect(mockTicketQueries.createTicket).not.toHaveBeenCalled();
  });
});

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets, sampleComplexityMetrics } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('update_ticket handler', () => {
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

  test('should update an existing ticket', async () => {
    const existingTicket = sampleTickets[0];
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.updateTicket.mockReturnValue(true);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'update_ticket', {
      id: existingTicket.id,
      title: 'Updated Title',
      status: 'completed',
    });

    expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith(existingTicket.id);
    expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
    expect(mockTicketQueries.updateTicket.mock.calls[0][0]).toMatchObject({
      id: existingTicket.id,
      title: 'Updated Title',
      description: existingTicket.description,
      status: 'completed',
      priority: existingTicket.priority,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ id: existingTicket.id, success: true }, null, 2),
        },
      ],
    });
  });

  test('should update complexity metadata if provided', async () => {
    const existingTicket = {
      ...sampleTickets[0],
      complexity_metadata: sampleComplexityMetrics[0],
    };
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.updateTicket.mockReturnValue(true);

    const updatedMetadata = {
      files_touched: 10,
      modules_crossed: 5,
    };

    const result = await callToolHandler(mockServer, mockTicketQueries, 'update_ticket', {
      id: existingTicket.id,
      complexity_metadata: updatedMetadata,
    });

    expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
    expect(mockTicketQueries.updateTicket.mock.calls[0][0].complexity_metadata).toMatchObject({
      ...existingTicket.complexity_metadata,
      ...updatedMetadata,
      ticket_id: existingTicket.id,
    });
  });

  test('should update agent_context if provided', async () => {
    const existingTicket = {
      ...sampleTickets[0],
      agent_context: '# Original Context',
    };
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.updateTicket.mockReturnValue(true);

    const newContext = '# Updated Context\n\nThis is a new context for the ticket.';

    const result = await callToolHandler(mockServer, mockTicketQueries, 'update_ticket', {
      id: existingTicket.id,
      agent_context: newContext,
    });

    expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
    expect(mockTicketQueries.updateTicket.mock.calls[0][0].agent_context).toBe(newContext);
  });

  test('should throw error if ticket ID is missing', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'update_ticket', {
      title: 'Updated Title',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Ticket ID is required');
    expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
  });

  test('should throw error if ticket is not found', async () => {
    mockTicketQueries.getTicketById.mockReturnValue(null);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'update_ticket', {
      id: 'non-existent',
      title: 'Updated Title',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('not found');
    expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
  });
});

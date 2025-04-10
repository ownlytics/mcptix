import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('delete_ticket handler', () => {
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

  test('should delete an existing ticket', async () => {
    const existingTicket = sampleTickets[0];
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.deleteTicket.mockReturnValue(true);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'delete_ticket', {
      id: existingTicket.id,
    });

    expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith(existingTicket.id);
    expect(mockTicketQueries.deleteTicket).toHaveBeenCalledWith(existingTicket.id);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ id: existingTicket.id, success: true }, null, 2),
        },
      ],
    });
  });

  test('should throw error if ticket ID is missing', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'delete_ticket', {});

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Ticket ID is required');
    expect(mockTicketQueries.deleteTicket).not.toHaveBeenCalled();
  });

  test('should throw error if ticket is not found', async () => {
    mockTicketQueries.getTicketById.mockReturnValue(null);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'delete_ticket', {
      id: 'non-existent',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('not found');
    expect(mockTicketQueries.deleteTicket).not.toHaveBeenCalled();
  });

  test('should handle database errors during deletion', async () => {
    const existingTicket = sampleTickets[0];
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.deleteTicket.mockImplementation(() => {
      throw new Error('Database connection error');
    });

    const result = await callToolHandler(mockServer, mockTicketQueries, 'delete_ticket', {
      id: existingTicket.id,
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Database connection error');
  });
});

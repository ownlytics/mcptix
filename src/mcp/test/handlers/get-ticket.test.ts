import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('get_ticket handler', () => {
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

  test('should return a ticket by ID', async () => {
    const mockTicket = sampleTickets[0];
    mockTicketQueries.getTicketById.mockReturnValue(mockTicket);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'get_ticket', { id: 'ticket-1' });

    expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith('ticket-1');
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockTicket, null, 2),
        },
      ],
    });
  });

  test('should throw error if ticket ID is missing', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'get_ticket', {});

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Ticket ID is required');
  });

  test('should throw error if ticket is not found', async () => {
    mockTicketQueries.getTicketById.mockReturnValue(null);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'get_ticket', { id: 'non-existent' });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('not found');
  });
});

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('list_tickets handler', () => {
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

  test('should return tickets based on filters', async () => {
    const mockTickets = sampleTickets.slice(0, 2);
    mockTicketQueries.getTickets.mockReturnValue(mockTickets);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'list_tickets', {
      status: 'in-progress',
      priority: 'high',
      search: 'API',
      sort: 'updated',
      order: 'desc',
      limit: 10,
      offset: 0,
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalledWith(
      { status: 'in-progress', priority: 'high', search: 'API' },
      'updated',
      'desc',
      10,
      0,
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockTickets, null, 2),
        },
      ],
    });
  });

  test('should use default values when not provided', async () => {
    mockTicketQueries.getTickets.mockReturnValue([]);

    await callToolHandler(mockServer, mockTicketQueries, 'list_tickets', {});

    expect(mockTicketQueries.getTickets).toHaveBeenCalledWith(
      { status: undefined, priority: undefined, search: undefined },
      'updated',
      'desc',
      100,
      0,
    );
  });
});

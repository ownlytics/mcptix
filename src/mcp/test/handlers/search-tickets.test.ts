import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('search_tickets handler', () => {
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

  test('should search for tickets based on query', async () => {
    const mockTickets = sampleTickets.slice(0, 2);
    mockTicketQueries.getTickets.mockReturnValue(mockTickets);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'search_tickets', {
      query: 'API',
      status: 'in-progress',
      priority: 'high',
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalledWith(
      { status: 'in-progress', priority: 'high', search: 'API' },
      'updated',
      'desc',
      100,
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

  test('should use provided sort parameters', async () => {
    mockTicketQueries.getTickets.mockReturnValue([]);

    await callToolHandler(mockServer, mockTicketQueries, 'search_tickets', {
      query: 'test',
      sort: 'created',
      order: 'asc',
      limit: 50,
      offset: 10,
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalledWith(
      { status: undefined, priority: undefined, search: 'test' },
      'created',
      'asc',
      50,
      10,
    );
  });

  test('should throw error if query is missing', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'search_tickets', {
      status: 'in-progress',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Search query is required');
  });

  test('should return empty array when no matches found', async () => {
    mockTicketQueries.getTickets.mockReturnValue([]);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'search_tickets', {
      query: 'no matches',
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalled();
    expect(result.content[0].text).toBe('[]');
  });
});

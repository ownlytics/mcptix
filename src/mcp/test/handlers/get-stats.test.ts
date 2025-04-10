import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('get_stats handler', () => {
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

  test('should return ticket statistics grouped by status', async () => {
    mockTicketQueries.getTickets.mockReturnValue([
      { ...sampleTickets[0], status: 'in-progress' },
      { ...sampleTickets[1], status: 'backlog' },
      { ...sampleTickets[2], status: 'backlog' },
    ]);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'get_stats', {
      group_by: 'status',
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalled();

    const statsText = result.content?.[0]?.text || '{}';
    expect(JSON.parse(statsText)).toEqual({
      'in-progress': 1,
      backlog: 2,
    });
  });

  test('should return ticket statistics grouped by priority', async () => {
    mockTicketQueries.getTickets.mockReturnValue([
      { ...sampleTickets[0], priority: 'high' },
      { ...sampleTickets[1], priority: 'medium' },
      { ...sampleTickets[2], priority: 'high' },
    ]);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'get_stats', {
      group_by: 'priority',
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalled();

    const statsText = result.content?.[0]?.text || '{}';
    expect(JSON.parse(statsText)).toEqual({
      high: 2,
      medium: 1,
    });
  });

  test('should use default group_by if not provided', async () => {
    mockTicketQueries.getTickets.mockReturnValue(sampleTickets);

    await callToolHandler(mockServer, mockTicketQueries, 'get_stats', {});

    // Default group_by is 'status'
    expect(mockTicketQueries.getTickets).toHaveBeenCalled();
  });

  test('should handle empty ticket list', async () => {
    mockTicketQueries.getTickets.mockReturnValue([]);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'get_stats', {
      group_by: 'status',
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalled();
    const statsText = result.content?.[0]?.text || '{}';
    expect(JSON.parse(statsText)).toEqual({});
  });

  test('should handle invalid group_by value gracefully', async () => {
    mockTicketQueries.getTickets.mockReturnValue(sampleTickets);

    // Even though the handler should validate this, we test for robustness
    const result = await callToolHandler(mockServer, mockTicketQueries, 'get_stats', {
      // @ts-ignore - intentionally passing invalid value for test
      group_by: 'invalid_field',
    });

    expect(mockTicketQueries.getTickets).toHaveBeenCalled();
    // Should fall back to status grouping
    expect(result.isError).toBeFalsy();
  });
});

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Ticket } from '../../../types';
import { Logger } from '../../../utils/logger';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('Ticket Ordering Handlers', () => {
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

  describe('get_next_ticket', () => {
    test('should return the next ticket from the specified status', async () => {
      // Setup mock data
      const mockTicket = {
        id: 'ticket-123',
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
        status: 'in-progress',
        created: '2025-04-05T00:00:00.000Z',
        updated: '2025-04-05T00:00:00.000Z',
        order_value: 3000,
      } as Ticket & { order_value: number };

      // Setup mock return value
      mockTicketQueries.getNextTicket.mockReturnValue(mockTicket);

      // Call the tool handler
      const result = await callToolHandler(mockServer, mockTicketQueries, 'get_next_ticket', {
        status: 'in-progress',
      });

      // Check that the handler called the correct method with the right args
      expect(mockTicketQueries.getNextTicket).toHaveBeenCalledWith('in-progress');

      // Check the response
      expect(result.content[0].type).toBe('text');
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.id).toBe('ticket-123');
      expect(responseData.order_value).toBe(3000);
    });

    test('should throw error if status is missing', async () => {
      const result = await callToolHandler(mockServer, mockTicketQueries, 'get_next_ticket', {});

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Valid status is required');
    });

    test('should handle case when no ticket is found', async () => {
      mockTicketQueries.getNextTicket.mockReturnValue(null);

      const result = await callToolHandler(mockServer, mockTicketQueries, 'get_next_ticket', {
        status: 'completed',
      });

      // The implementation returns an error when no ticket is found
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No tickets found in completed');
    });
  });

  describe('reorder_ticket', () => {
    test('should update the order of a ticket', async () => {
      // Setup mock return value
      mockTicketQueries.getTicketById.mockReturnValue({
        id: 'ticket-123',
        title: 'Test Ticket',
        priority: 'medium',
        status: 'in-progress',
        created: '2025-04-05T00:00:00.000Z',
        updated: '2025-04-05T00:00:00.000Z',
      } as Ticket);
      mockTicketQueries.reorderTicket.mockReturnValue(true);

      // Call the tool handler
      const result = await callToolHandler(mockServer, mockTicketQueries, 'reorder_ticket', {
        id: 'ticket-123',
        order_value: 2500,
      });

      // Check that the handler called the correct methods with the right args
      expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith('ticket-123');
      expect(mockTicketQueries.reorderTicket).toHaveBeenCalledWith('ticket-123', 2500);

      // Check the response
      expect(result.content[0].type).toBe('text');
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.id).toBe('ticket-123');
      expect(responseData.success).toBe(true);
    });

    test('should throw error if ticket ID is missing', async () => {
      const result = await callToolHandler(mockServer, mockTicketQueries, 'reorder_ticket', {
        order_value: 2500,
      });

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Ticket ID is required');
    });

    test('should throw error if order_value is missing', async () => {
      mockTicketQueries.getTicketById.mockReturnValue({
        id: 'ticket-123',
        title: 'Test Ticket',
      } as Ticket);

      const result = await callToolHandler(mockServer, mockTicketQueries, 'reorder_ticket', {
        id: 'ticket-123',
      });

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('order_value must be a number');
    });

    test('should throw error if ticket is not found', async () => {
      mockTicketQueries.getTicketById.mockReturnValue(null);

      const result = await callToolHandler(mockServer, mockTicketQueries, 'reorder_ticket', {
        id: 'non-existent',
        order_value: 2500,
      });

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('not found');
    });
  });

  describe('move_ticket', () => {
    test('should update the status and order of a ticket', async () => {
      // Setup mock return value
      mockTicketQueries.getTicketById.mockReturnValue({
        id: 'ticket-123',
        title: 'Test Ticket',
        priority: 'medium',
        status: 'in-progress',
        created: '2025-04-05T00:00:00.000Z',
        updated: '2025-04-05T00:00:00.000Z',
      } as Ticket);
      mockTicketQueries.moveTicket.mockReturnValue(true);

      // Call the tool handler
      const result = await callToolHandler(mockServer, mockTicketQueries, 'move_ticket', {
        id: 'ticket-123',
        status: 'completed',
        order_value: 5000,
      });

      // Check that the handler called the correct methods with the right args
      expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith('ticket-123');
      expect(mockTicketQueries.moveTicket).toHaveBeenCalledWith('ticket-123', 'completed', 5000);

      // Check the response
      expect(result.content[0].type).toBe('text');
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.id).toBe('ticket-123');
      expect(responseData.success).toBe(true);
    });

    test('should place ticket at the bottom of new status if no order_value specified', async () => {
      // Setup mock return value
      mockTicketQueries.getTicketById.mockReturnValue({
        id: 'ticket-123',
        title: 'Test Ticket',
        priority: 'medium',
        status: 'in-progress',
        created: '2025-04-05T00:00:00.000Z',
        updated: '2025-04-05T00:00:00.000Z',
      } as Ticket);
      mockTicketQueries.moveTicket.mockReturnValue(true);

      // Call the tool handler
      const result = await callToolHandler(mockServer, mockTicketQueries, 'move_ticket', {
        id: 'ticket-123',
        status: 'completed',
      });

      // Check that the handler called the correct methods with the right args
      expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith('ticket-123');
      expect(mockTicketQueries.moveTicket).toHaveBeenCalledWith('ticket-123', 'completed', undefined);

      // Check the response
      expect(result.content[0].type).toBe('text');
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.id).toBe('ticket-123');
      expect(responseData.success).toBe(true);
    });

    test('should throw error if ticket ID is missing', async () => {
      const result = await callToolHandler(mockServer, mockTicketQueries, 'move_ticket', {
        status: 'completed',
      });

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Ticket ID is required');
    });

    test('should throw error if status is missing', async () => {
      mockTicketQueries.getTicketById.mockReturnValue({
        id: 'ticket-123',
        title: 'Test Ticket',
      } as Ticket);

      const result = await callToolHandler(mockServer, mockTicketQueries, 'move_ticket', {
        id: 'ticket-123',
      });

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Valid status is required');
    });

    test('should throw error if ticket is not found', async () => {
      mockTicketQueries.getTicketById.mockReturnValue(null);

      const result = await callToolHandler(mockServer, mockTicketQueries, 'move_ticket', {
        id: 'non-existent',
        status: 'completed',
      });

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('not found');
    });
  });
});

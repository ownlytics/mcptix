import { Server } from '@modelcontextprotocol/sdk/server/index.js';

import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TicketQueries } from '../../db/queries';
import { Ticket } from '../../types';
import { Logger } from '../../utils/logger';
import { setupToolHandlers } from '../tools';

// Define types for the MCP SDK response structure
interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../utils/logger');

describe('MCP Ticket Ordering Tools', () => {
  let mockServer: jest.Mocked<Server>;
  let mockTicketQueries: jest.Mocked<TicketQueries>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock server
    mockServer = {
      setRequestHandler: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    // Setup mock ticket queries
    mockTicketQueries = {
      getTickets: jest.fn(),
      getTicketById: jest.fn(),
      createTicket: jest.fn(),
      updateTicket: jest.fn(),
      deleteTicket: jest.fn(),
      addComment: jest.fn(),
      getNextTicket: jest.fn(),
      reorderTicket: jest.fn(),
      moveTicket: jest.fn(),
    } as unknown as jest.Mocked<TicketQueries>;
  });

  // Helper function to call a tool handler
  async function callToolHandler(toolName: string, args: any): Promise<ToolResponse> {
    setupToolHandlers(mockServer, mockTicketQueries);

    // Get the handler function that was registered
    const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
      call => call[0] === CallToolRequestSchema,
    )?.[1];

    expect(callToolHandler).toBeDefined();

    if (callToolHandler) {
      // Mock the implementation to match the expected signature
      const mockRequest = { method: 'call_tool', params: { name: toolName, arguments: args } };
      const mockContext = { signal: new AbortController().signal };

      return (await callToolHandler(mockRequest, mockContext)) as ToolResponse;
    }

    throw new Error('Call tool handler not found');
  }

  test('get_next_ticket should return the next ticket from the specified status', async () => {
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
    const result = await callToolHandler('get_next_ticket', {
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

  test('reorder_ticket should update the order of a ticket', async () => {
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
    const result = await callToolHandler('reorder_ticket', {
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

  test('move_ticket should update the status and order of a ticket', async () => {
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
    const result = await callToolHandler('move_ticket', {
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

  test('move_ticket should place ticket at the bottom of new status if no order_value specified', async () => {
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
    const result = await callToolHandler('move_ticket', {
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
});

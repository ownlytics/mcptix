import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { TicketQueries } from '../../db/queries';
import { Logger } from '../../utils/logger';
import { setupToolHandlers } from '../tools';
import { createMocks } from './utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../utils/logger');

describe('MCP Tools Integration', () => {
  let mockServer: jest.Mocked<Server>;
  let mockTicketQueries: jest.Mocked<TicketQueries>;
  let callToolHandler: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mocks
    const mocks = createMocks();
    mockServer = mocks.mockServer;
    mockTicketQueries = mocks.mockTicketQueries;

    // Setup tool handlers
    setupToolHandlers(mockServer, mockTicketQueries);

    // Get the call tool handler function
    callToolHandler = mockServer.setRequestHandler.mock.calls.find(call => call[0] === CallToolRequestSchema)?.[1];
  });

  test('should handle unknown tool name', async () => {
    expect(callToolHandler).toBeDefined();

    if (callToolHandler) {
      const mockRequest = { method: 'call_tool', params: { name: 'unknown_tool', arguments: {} } };
      const mockContext = { signal: new AbortController().signal };

      const result = await callToolHandler(mockRequest, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Unknown tool');
    }
  });

  test('should handle unexpected errors', async () => {
    expect(callToolHandler).toBeDefined();

    if (callToolHandler) {
      mockTicketQueries.getTickets.mockImplementation(() => {
        throw new Error('Database error');
      });

      const mockRequest = { method: 'call_tool', params: { name: 'list_tickets', arguments: {} } };
      const mockContext = { signal: new AbortController().signal };

      const result = await callToolHandler(mockRequest, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Database error');
    }
  });

  test('should handle McpError instances correctly', async () => {
    expect(callToolHandler).toBeDefined();

    if (callToolHandler) {
      mockTicketQueries.getTicketById.mockImplementation(() => {
        throw new McpError(ErrorCode.MethodNotFound, 'Invalid ticket ID format');
      });

      const mockRequest = { method: 'call_tool', params: { name: 'get_ticket', arguments: { id: 'invalid-id' } } };
      const mockContext = { signal: new AbortController().signal };

      const result = await callToolHandler(mockRequest, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content?.[0]?.text).toContain('Invalid ticket ID format');
    }
  });

  // Test for workflow between tools
  test('should support workflow between create and update tools', async () => {
    expect(callToolHandler).toBeDefined();

    if (callToolHandler) {
      // Setup for create ticket
      const newTicketId = 'new-ticket-id';
      mockTicketQueries.createTicket.mockReturnValue(newTicketId);

      // Create a ticket
      const createRequest = {
        method: 'call_tool',
        params: {
          name: 'create_ticket',
          arguments: {
            title: 'Integration Test Ticket',
            description: 'This is a test of the workflow between tools',
            priority: 'medium',
          },
        },
      };

      const mockContext = { signal: new AbortController().signal };
      const createResult = await callToolHandler(createRequest, mockContext);

      expect(createResult.isError).toBeFalsy();
      const createResponseData = JSON.parse(createResult.content[0].text);
      expect(createResponseData.id).toBe(newTicketId);

      // Setup for get ticket
      mockTicketQueries.getTicketById.mockReturnValue({
        id: newTicketId,
        title: 'Integration Test Ticket',
        description: 'This is a test of the workflow between tools',
        priority: 'medium',
        status: 'backlog',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      });

      // Setup for update ticket
      mockTicketQueries.updateTicket.mockReturnValue(true);

      // Update the ticket
      const updateRequest = {
        method: 'call_tool',
        params: {
          name: 'update_ticket',
          arguments: {
            id: newTicketId,
            status: 'in-progress',
            priority: 'high',
          },
        },
      };

      const updateResult = await callToolHandler(updateRequest, mockContext);

      expect(updateResult.isError).toBeFalsy();
      const updateResponseData = JSON.parse(updateResult.content[0].text);
      expect(updateResponseData.id).toBe(newTicketId);
      expect(updateResponseData.success).toBe(true);

      // Verify the update call had the right arguments
      expect(mockTicketQueries.updateTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          id: newTicketId,
          status: 'in-progress',
          priority: 'high',
        }),
      );
    }
  });
});

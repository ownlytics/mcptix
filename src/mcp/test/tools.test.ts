import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';

import { sampleTickets, sampleComments, sampleComplexityMetrics } from '../../api/test/fixtures';
import { TicketQueries } from '../../db/queries';
import { Ticket, Comment } from '../../types';
import { Logger } from '../../utils/logger';
import { setupToolHandlers } from '../tools';

// Define types for the MCP SDK response structure
interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

interface ListToolsResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>;
}

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../utils/logger');

describe('MCP Tools', () => {
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
    } as unknown as jest.Mocked<TicketQueries>;
  });

  describe('setupToolHandlers', () => {
    test('should register list_tools handler', () => {
      setupToolHandlers(mockServer, mockTicketQueries);

      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ListToolsRequestSchema, expect.any(Function));
      expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Setting up MCP tool handlers');
    });

    test('should register call_tool handler', () => {
      setupToolHandlers(mockServer, mockTicketQueries);

      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(CallToolRequestSchema, expect.any(Function));
    });

    test('should return list of available tools', async () => {
      setupToolHandlers(mockServer, mockTicketQueries);

      // Get the handler function that was registered
      const listToolsHandler = mockServer.setRequestHandler.mock.calls.find(
        call => call[0] === ListToolsRequestSchema,
      )?.[1];

      expect(listToolsHandler).toBeDefined();

      if (listToolsHandler) {
        // Mock the implementation to match the expected signature
        const mockRequest = { method: 'list_tools', params: {} };
        const mockContext = { signal: new AbortController().signal };

        const result = (await listToolsHandler(mockRequest, mockContext)) as ListToolsResponse;
        expect(result.tools).toHaveLength(11); // There are 11 tools defined in tools.ts (8 original + 3 new ordering tools)
        expect(result.tools[0].name).toBe('list_tickets');
        expect(result.tools[1].name).toBe('get_ticket');
      }
    });
  });

  describe('Tool Handlers', () => {
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

    describe('list_tickets', () => {
      test('should return tickets based on filters', async () => {
        const mockTickets = sampleTickets.slice(0, 2);
        mockTicketQueries.getTickets.mockReturnValue(mockTickets);

        const result = await callToolHandler('list_tickets', {
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

        await callToolHandler('list_tickets', {});

        expect(mockTicketQueries.getTickets).toHaveBeenCalledWith(
          { status: undefined, priority: undefined, search: undefined },
          'updated',
          'desc',
          100,
          0,
        );
      });
    });

    describe('get_ticket', () => {
      test('should return a ticket by ID', async () => {
        const mockTicket = sampleTickets[0];
        mockTicketQueries.getTicketById.mockReturnValue(mockTicket);

        const result = await callToolHandler('get_ticket', { id: 'ticket-1' });

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
        const result = await callToolHandler('get_ticket', {});

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Ticket ID is required');
      });

      test('should throw error if ticket is not found', async () => {
        mockTicketQueries.getTicketById.mockReturnValue(null);

        const result = await callToolHandler('get_ticket', { id: 'non-existent' });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('not found');
      });
    });

    describe('create_ticket', () => {
      test('should create a new ticket', async () => {
        const newTicketId = 'new-ticket-id';
        mockTicketQueries.createTicket.mockReturnValue(newTicketId);

        const result = await callToolHandler('create_ticket', {
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

        const result = await callToolHandler('create_ticket', {
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

      test('should throw error if title is missing', async () => {
        const result = await callToolHandler('create_ticket', {
          description: 'This is a test ticket',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Ticket title is required');
        expect(mockTicketQueries.createTicket).not.toHaveBeenCalled();
      });
    });

    describe('update_ticket', () => {
      test('should update an existing ticket', async () => {
        const existingTicket = sampleTickets[0];
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        const result = await callToolHandler('update_ticket', {
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

        const result = await callToolHandler('update_ticket', {
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

      test('should throw error if ticket ID is missing', async () => {
        const result = await callToolHandler('update_ticket', {
          title: 'Updated Title',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Ticket ID is required');
        expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
      });

      test('should throw error if ticket is not found', async () => {
        mockTicketQueries.getTicketById.mockReturnValue(null);

        const result = await callToolHandler('update_ticket', {
          id: 'non-existent',
          title: 'Updated Title',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('not found');
        expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
      });
    });

    describe('delete_ticket', () => {
      test('should delete an existing ticket', async () => {
        const existingTicket = sampleTickets[0];
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.deleteTicket.mockReturnValue(true);

        const result = await callToolHandler('delete_ticket', {
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
        const result = await callToolHandler('delete_ticket', {});

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Ticket ID is required');
        expect(mockTicketQueries.deleteTicket).not.toHaveBeenCalled();
      });

      test('should throw error if ticket is not found', async () => {
        mockTicketQueries.getTicketById.mockReturnValue(null);

        const result = await callToolHandler('delete_ticket', {
          id: 'non-existent',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('not found');
        expect(mockTicketQueries.deleteTicket).not.toHaveBeenCalled();
      });
    });

    describe('add_comment', () => {
      test('should add a comment to a ticket', async () => {
        const existingTicket = sampleTickets[0];
        const newCommentId = 'new-comment-id';
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.addComment.mockReturnValue(newCommentId);

        const result = await callToolHandler('add_comment', {
          ticket_id: existingTicket.id,
          content: 'This is a test comment',
          type: 'comment',
          author: 'agent',
          status: 'open',
        });

        expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith(existingTicket.id);
        expect(mockTicketQueries.addComment).toHaveBeenCalled();
        expect(mockTicketQueries.addComment.mock.calls[0][0]).toBe(existingTicket.id);
        expect(mockTicketQueries.addComment.mock.calls[0][1]).toMatchObject({
          ticket_id: existingTicket.id,
          content: 'This is a test comment',
          type: 'comment',
          author: 'agent',
          status: 'open',
        });

        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ id: newCommentId, success: true }, null, 2),
            },
          ],
        });
      });

      test('should use default values when not provided', async () => {
        const existingTicket = sampleTickets[0];
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.addComment.mockReturnValue('new-comment-id');

        await callToolHandler('add_comment', {
          ticket_id: existingTicket.id,
          content: 'This is a test comment',
        });

        expect(mockTicketQueries.addComment.mock.calls[0][1]).toMatchObject({
          type: 'comment',
          author: 'agent',
          status: 'open',
        });
      });

      test('should throw error if ticket ID is missing', async () => {
        const result = await callToolHandler('add_comment', {
          content: 'This is a test comment',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Ticket ID is required');
        expect(mockTicketQueries.addComment).not.toHaveBeenCalled();
      });

      test('should throw error if neither content nor summary/fullText is provided', async () => {
        const result = await callToolHandler('add_comment', {
          ticket_id: 'ticket-1',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain(
          'Comment content is required (either content, or summary and fullText)',
        );
        expect(mockTicketQueries.addComment).not.toHaveBeenCalled();
      });

      test('should throw error if ticket is not found', async () => {
        mockTicketQueries.getTicketById.mockReturnValue(null);

        const result = await callToolHandler('add_comment', {
          ticket_id: 'non-existent',
          content: 'This is a test comment',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('not found');
        expect(mockTicketQueries.addComment).not.toHaveBeenCalled();
      });

      test('should add summary and fullText when agent adds comment with content only', async () => {
        const existingTicket = sampleTickets[0];
        const newCommentId = 'new-comment-id';
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.addComment.mockReturnValue(newCommentId);

        const content = 'This is a test comment with a longer explanation. It contains multiple sentences.';

        const result = await callToolHandler('add_comment', {
          ticket_id: existingTicket.id,
          content,
          author: 'agent',
        });

        expect(mockTicketQueries.addComment).toHaveBeenCalled();
        expect(mockTicketQueries.addComment.mock.calls[0][1]).toMatchObject({
          content,
          fullText: content,
          summary: 'This is a test comment with a longer explanation.',
          display: 'collapsed',
          author: 'agent',
        });
      });

      test('should use provided summary and fullText for agent comment', async () => {
        const existingTicket = sampleTickets[0];
        const newCommentId = 'new-comment-id';
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.addComment.mockReturnValue(newCommentId);

        const summary = 'Test summary';
        const fullText = 'Detailed explanation of the test';

        const result = await callToolHandler('add_comment', {
          ticket_id: existingTicket.id,
          content: '',
          summary,
          fullText,
          author: 'agent',
        });

        expect(mockTicketQueries.addComment).toHaveBeenCalled();
        expect(mockTicketQueries.addComment.mock.calls[0][1]).toMatchObject({
          summary,
          fullText,
          display: 'collapsed',
          author: 'agent',
        });
      });

      test('should accept comment with summary and fullText instead of content', async () => {
        const existingTicket = sampleTickets[0];
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.addComment.mockReturnValue('new-comment-id');

        const result = await callToolHandler('add_comment', {
          ticket_id: existingTicket.id,
          summary: 'Test summary',
          fullText: 'Test full text',
          author: 'agent',
        });

        expect(result.isError).toBeUndefined();
        expect(mockTicketQueries.addComment).toHaveBeenCalled();
      });
    });

    describe('search_tickets', () => {
      test('should search for tickets based on query', async () => {
        const mockTickets = sampleTickets.slice(0, 2);
        mockTicketQueries.getTickets.mockReturnValue(mockTickets);

        const result = await callToolHandler('search_tickets', {
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

      test('should throw error if query is missing', async () => {
        const result = await callToolHandler('search_tickets', {
          status: 'in-progress',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Search query is required');
      });
    });
    describe('get_stats', () => {
      test('should return ticket statistics grouped by status', async () => {
        mockTicketQueries.getTickets.mockReturnValue([
          { ...sampleTickets[0], status: 'in-progress' },
          { ...sampleTickets[1], status: 'backlog' },
          { ...sampleTickets[2], status: 'backlog' },
        ]);

        const result = await callToolHandler('get_stats', {
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

        const result = await callToolHandler('get_stats', {
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

        await callToolHandler('get_stats', {});

        // Default group_by is 'status'
        expect(mockTicketQueries.getTickets).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      test('should handle unknown tool name', async () => {
        const result = await callToolHandler('unknown_tool', {});

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Unknown tool');
      });

      test('should handle unexpected errors', async () => {
        mockTicketQueries.getTickets.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await callToolHandler('list_tickets', {});

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Database error');
      });
    });
  });
});

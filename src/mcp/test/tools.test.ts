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
        expect(result.tools).toHaveLength(12); // There are 12 tools defined in tools.ts (previous 11 + new edit_field tool)
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
          author: 'agent',
        });

        expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith(existingTicket.id);
        expect(mockTicketQueries.addComment).toHaveBeenCalled();
        expect(mockTicketQueries.addComment.mock.calls[0][0]).toBe(existingTicket.id);
        expect(mockTicketQueries.addComment.mock.calls[0][1]).toMatchObject({
          ticket_id: existingTicket.id,
          content: 'This is a test comment',
          author: 'agent',
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
          author: 'agent',
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

      test('should throw error if content is not provided', async () => {
        const result = await callToolHandler('add_comment', {
          ticket_id: 'ticket-1',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Comment content is required');
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

      test('should add a comment with content for an agent', async () => {
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
          author: 'agent',
        });
      });

      // Test removed: The summary/fullText functionality has been removed

      // Since summary and fullText are no longer supported, we don't need this test
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

    describe('edit_field', () => {
      test('should perform find/replace on a ticket field', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          description: 'This is a test description with some text to replace.',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: 'text to replace',
          replace: 'new content',
        });

        expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith(existingTicket.id);
        expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
        expect(mockTicketQueries.updateTicket.mock.calls[0][0].description).toBe(
          'This is a test description with some new content.',
        );

        const responseObj = JSON.parse(result.content[0].text);
        expect(responseObj.id).toBe(existingTicket.id);
        expect(responseObj.success).toBe(true);
        expect(responseObj.changed).toBe(true);
        expect(responseObj.message).toBe('Field updated successfully');
        expect(responseObj.replacement_count).toBe(1);
      });

      test('should handle no changes when search text is not found', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          description: 'This is a test description.',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: 'nonexistent text',
          replace: 'new content',
        });

        expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith(existingTicket.id);
        expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();

        const responseObj = JSON.parse(result.content[0].text);
        expect(responseObj.id).toBe(existingTicket.id);
        expect(responseObj.success).toBe(true);
        expect(responseObj.changed).toBe(false);
        expect(responseObj.message).toBe('No changes made - search text not found');
      });

      test('should handle regex special characters in search string', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          description: 'This is a test with (special) [characters] and * symbols.',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: '(special) [characters]',
          replace: 'replaced text',
        });

        expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
        expect(mockTicketQueries.updateTicket.mock.calls[0][0].description).toBe(
          'This is a test with replaced text and * symbols.',
        );
      });

      test('should throw error if ticket ID is missing', async () => {
        const result = await callToolHandler('edit_field', {
          field: 'description',
          search: 'text',
          replace: 'new text',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Ticket ID is required');
        expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
      });

      test('should throw error if field is invalid', async () => {
        const existingTicket = sampleTickets[0];
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'invalid_field',
          search: 'text',
          replace: 'new text',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Valid field name is required');
        expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
      });

      test('should throw error if search or replace is missing', async () => {
        const existingTicket = sampleTickets[0];
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: 'text',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Both search and replace parameters are required');
        expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
      });

      test('should throw error if ticket is not found', async () => {
        mockTicketQueries.getTicketById.mockReturnValue(null);

        const result = await callToolHandler('edit_field', {
          id: 'non-existent',
          field: 'description',
          search: 'text',
          replace: 'new text',
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('not found');
        expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
      });

      test('should be able to edit agent_context field', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          agent_context: '# Agent Workspace\nThis contains some important notes to edit.',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'agent_context',
          search: 'important notes',
          replace: 'critical information',
        });

        expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
        expect(mockTicketQueries.updateTicket.mock.calls[0][0].agent_context).toBe(
          '# Agent Workspace\nThis contains some critical information to edit.',
        );
        expect(result.content?.[0]?.text).toContain('changed": true');
      });

      test('should use regex mode when useRegex is true', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          description: 'User123 and User456 need access to the system.',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: 'User\\d+',
          replace: 'Member',
          useRegex: true,
        });

        expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
        expect(mockTicketQueries.updateTicket.mock.calls[0][0].description).toBe(
          'Member and Member need access to the system.',
        );

        const responseObj = JSON.parse(result.content[0].text);
        expect(responseObj.replacement_count).toBe(2);
      });

      test('should support regex capturing groups', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          description: 'Contact John at john@example.com or Jane at jane@example.com',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: '(\\w+)@example.com',
          replace: '$1@company.org',
          useRegex: true,
        });

        expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
        expect(mockTicketQueries.updateTicket.mock.calls[0][0].description).toBe(
          'Contact John at john@company.org or Jane at jane@company.org',
        );
      });

      test('should support case-insensitive search when caseSensitive is false', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          description: 'The ERROR occurred because of an Error in the code. error handling needs improvement.',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: 'error',
          replace: 'exception',
          caseSensitive: false,
        });

        expect(mockTicketQueries.updateTicket).toHaveBeenCalled();
        expect(mockTicketQueries.updateTicket.mock.calls[0][0].description).toBe(
          'The exception occurred because of an exception in the code. exception handling needs improvement.',
        );

        const responseObj = JSON.parse(result.content[0].text);
        expect(responseObj.replacement_count).toBe(3);
      });

      test('should handle invalid regex patterns gracefully', async () => {
        const existingTicket = {
          ...sampleTickets[0],
          description: 'Some text with (unbalanced parentheses',
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);

        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'description',
          search: '(unclosed group',
          replace: 'replacement',
          useRegex: true,
        });

        expect(result.isError).toBe(true);
        expect(result.content?.[0]?.text).toContain('Invalid regex pattern');
      });

      test('should handle realistic code refactoring scenario', async () => {
        // Create a ticket with agent_context containing a code snippet that needs refactoring
        const existingTicket = {
          ...sampleTickets[0],
          agent_context: `
# Implementation Plan

## Current Function (needs refactoring)

\`\`\`typescript
// TODO: Refactor this function to use modern ES6+ features
function processTicketData(tickets, filters) {
  var results = [];
  
  for (var i = 0; i < tickets.length; i++) {
    var ticket = tickets[i];
    var matchesFilter = true;
    
    if (filters.status && ticket.status !== filters.status) {
      matchesFilter = false;
    }
    
    if (filters.priority && ticket.priority !== filters.priority) {
      matchesFilter = false;
    }
    
    if (filters.search && ticket.title.indexOf(filters.search) === -1 && ticket.description.indexOf(filters.search) === -1) {
      matchesFilter = false;
    }
    
    if (matchesFilter) {
      results.push(ticket);
    }
  }
  
  return results;
}
\`\`\`

## Database Schema
...
`,
        };
        mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
        mockTicketQueries.updateTicket.mockReturnValue(true);

        // Use regex mode to replace the entire function with a modern implementation
        const result = await callToolHandler('edit_field', {
          id: existingTicket.id,
          field: 'agent_context',
          search: '```typescript[\\s\\S]*?function processTicketData\\([^)]*\\)[\\s\\S]*?```',
          replace:
            '```typescript\n// Refactored to use modern ES6+ features\nconst processTicketData = (tickets, filters) => {\n  return tickets.filter(ticket => {\n    // Check status match\n    if (filters.status && ticket.status !== filters.status) {\n      return false;\n    }\n    \n    // Check priority match\n    if (filters.priority && ticket.priority !== filters.priority) {\n      return false;\n    }\n    \n    // Check search term match (title or description)\n    if (filters.search && \n        !ticket.title.includes(filters.search) && \n        !ticket.description.includes(filters.search)) {\n      return false;\n    }\n    \n    return true;\n  });\n};\n```',
          useRegex: true,
        });

        expect(mockTicketQueries.updateTicket).toHaveBeenCalled();

        // Verify the function was replaced correctly
        const updatedTicket = mockTicketQueries.updateTicket.mock.calls[0][0];
        expect(updatedTicket.agent_context).toContain('const processTicketData = (tickets, filters) =>');
        expect(updatedTicket.agent_context).toContain('return tickets.filter(ticket =>');
        expect(updatedTicket.agent_context).toContain('!ticket.title.includes(filters.search)');
        expect(updatedTicket.agent_context).not.toContain('for (var i = 0; i < tickets.length; i++)');

        // Check the response details
        const responseObj = JSON.parse(result.content[0].text);
        expect(responseObj.changed).toBe(true);
        expect(responseObj.message).toBe('Field updated successfully');
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

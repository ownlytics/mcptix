import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { sampleTickets } from '../../api/test/fixtures';
import { TicketQueries } from '../../db/queries';
import { Logger } from '../../utils/logger';
import { setupResourceHandlers } from '../resources';

// Define types for the MCP SDK response structure
interface ResourcesListResponse {
  resources: Array<{
    uri: string;
    name: string;
    description: string;
  }>;
}

interface ResourceTemplatesListResponse {
  resourceTemplates: Array<{
    uriTemplate: string;
    name: string;
    description: string;
  }>;
}

interface ResourceReadResponse {
  contents: Array<{
    uri: string;
    text: string;
  }>;
}

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../utils/logger');
jest.mock('better-sqlite3');

describe('MCP Resources', () => {
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
    } as unknown as jest.Mocked<TicketQueries>;
  });

  describe('setupResourceHandlers', () => {
    test('should register list_resources handler', () => {
      setupResourceHandlers(mockServer, mockTicketQueries);

      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ListResourcesRequestSchema, expect.any(Function));
      expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Setting up MCP resource handlers');
    });

    test('should register list_resource_templates handler', () => {
      setupResourceHandlers(mockServer, mockTicketQueries);

      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        ListResourceTemplatesRequestSchema,
        expect.any(Function),
      );
    });

    test('should register read_resource handler', () => {
      setupResourceHandlers(mockServer, mockTicketQueries);

      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ReadResourceRequestSchema, expect.any(Function));
    });
  });

  describe('Resource Handlers', () => {
    // Helper function to get a specific handler
    function getHandler<T, R>(schema: T): ((request: any, context: any) => Promise<R>) | undefined {
      setupResourceHandlers(mockServer, mockTicketQueries);

      const handlerCall = mockServer.setRequestHandler.mock.calls.find(call => call[0] === schema);

      return handlerCall?.[1] as (request: any, context: any) => Promise<R>;
    }

    describe('list_resources handler', () => {
      test('should return list of available resources', async () => {
        const handler = getHandler<typeof ListResourcesRequestSchema, ResourcesListResponse>(
          ListResourcesRequestSchema,
        );

        expect(handler).toBeDefined();

        if (handler) {
          const mockRequest = { method: 'resources/list', params: {} };
          const mockContext = { signal: new AbortController().signal };

          const result = await handler(mockRequest, mockContext);

          expect(result.resources).toHaveLength(1);
          expect(result.resources[0]).toEqual({
            uri: 'tickets://all',
            name: 'All Tickets',
            description: 'Get all tickets, with optional filtering, sorting, and pagination',
          });
        }
      });
    });

    describe('list_resource_templates handler', () => {
      test('should return list of resource templates', async () => {
        const handler = getHandler<typeof ListResourceTemplatesRequestSchema, ResourceTemplatesListResponse>(
          ListResourceTemplatesRequestSchema,
        );

        expect(handler).toBeDefined();

        if (handler) {
          const mockRequest = { method: 'resources/templates/list', params: {} };
          const mockContext = { signal: new AbortController().signal };

          const result = await handler(mockRequest, mockContext);

          expect(result.resourceTemplates).toHaveLength(2);
          expect(result.resourceTemplates[0]).toEqual({
            uriTemplate: 'tickets://status/{status}',
            name: 'Tickets by Status',
            description: 'Get tickets by status (backlog, up-next, in-progress, in-review, completed)',
          });
          expect(result.resourceTemplates[1]).toEqual({
            uriTemplate: 'tickets://id/{id}',
            name: 'Ticket by ID',
            description: 'Get a specific ticket by ID',
          });
        }
      });
    });

    describe('read_resource handler', () => {
      test('should handle tickets://all URI', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          const mockTickets = sampleTickets.slice(0, 2);
          mockTicketQueries.getTickets.mockReturnValue(mockTickets);

          // Mock the database path for logging
          const mockDb = { name: '/test/path/mcptix.db' } as unknown as Database.Database;
          Object.defineProperty(mockTicketQueries, 'db', {
            get: jest.fn(() => mockDb),
            configurable: true,
          });

          const mockRequest = { method: 'resources/read', params: { uri: 'tickets://all' } };
          const mockContext = { signal: new AbortController().signal };

          const result = await handler(mockRequest, mockContext);

          expect(mockTicketQueries.getTickets).toHaveBeenCalledWith({}, 'updated', 'desc', 100, 0);

          expect(result.contents).toHaveLength(1);
          expect(result.contents[0].uri).toBe('tickets://all');

          const parsedContent = JSON.parse(result.contents[0].text);
          expect(parsedContent.tickets).toEqual(mockTickets);
          expect(parsedContent.metadata).toMatchObject({
            resource: 'tickets://all',
            total: mockTickets.length,
            limit: 100,
            offset: 0,
            sort: 'updated',
            order: 'desc',
          });

          expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Resource read request for URI: tickets://all');
          expect(Logger.debug).toHaveBeenCalledWith('McpServer', 'Resource path: all');
          expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Handling all tickets resource: tickets://all');
          expect(Logger.info).toHaveBeenCalledWith('McpServer', `Found ${mockTickets.length} tickets`);
        }
      });

      test('should handle tickets://status/{status} URI', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          const mockTickets = sampleTickets.filter(ticket => ticket.status === 'in-progress');
          mockTicketQueries.getTickets.mockReturnValue(mockTickets);

          const mockRequest = {
            method: 'resources/read',
            params: { uri: 'tickets://status/in-progress' },
          };
          const mockContext = { signal: new AbortController().signal };

          const result = await handler(mockRequest, mockContext);

          expect(mockTicketQueries.getTickets).toHaveBeenCalledWith(
            { status: 'in-progress' },
            'updated',
            'desc',
            100,
            0,
          );

          expect(result.contents).toHaveLength(1);
          expect(result.contents[0].uri).toBe('tickets://status/in-progress');

          const parsedContent = JSON.parse(result.contents[0].text);
          expect(parsedContent.tickets).toEqual(mockTickets);
          expect(parsedContent.metadata).toMatchObject({
            resource: 'tickets://status/in-progress',
            status: 'in-progress',
            total: mockTickets.length,
          });
          expect(Logger.info).toHaveBeenCalledWith(
            'McpServer',
            'Resource read request for URI: tickets://status/in-progress',
          );
          expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Handling tickets by status: in-progress');
        }
      });

      test('should throw error for invalid status in tickets://status/{status} URI', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          const mockRequest = {
            method: 'resources/read',
            params: { uri: 'tickets://status/invalid-status' },
          };
          const mockContext = { signal: new AbortController().signal };

          await expect(handler(mockRequest, mockContext)).rejects.toThrow(
            new McpError(ErrorCode.MethodNotFound, 'Unknown status: invalid-status'),
          );
        }
      });

      test('should handle tickets://id/{id} URI', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          const mockTicket = sampleTickets[0];
          mockTicketQueries.getTicketById.mockReturnValue(mockTicket);

          const mockRequest = {
            method: 'resources/read',
            params: { uri: 'tickets://id/ticket-1' },
          };
          const mockContext = { signal: new AbortController().signal };

          const result = await handler(mockRequest, mockContext);

          expect(mockTicketQueries.getTicketById).toHaveBeenCalledWith('ticket-1');

          expect(result.contents).toHaveLength(1);
          expect(result.contents[0].uri).toBe('tickets://id/ticket-1');

          const parsedContent = JSON.parse(result.contents[0].text);
          expect(parsedContent.ticket).toEqual(mockTicket);
          expect(parsedContent.metadata).toMatchObject({
            resource: 'tickets://id/ticket-1',
            id: 'ticket-1',
          });
          expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Resource read request for URI: tickets://id/ticket-1');
          expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Handling ticket by ID: ticket-1');
          expect(Logger.info).toHaveBeenCalledWith('McpServer', 'Found ticket: ticket-1');
        }
      });

      test('should throw error if ticket not found for tickets://id/{id} URI', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();
        if (handler) {
          mockTicketQueries.getTicketById.mockReturnValue(null);

          const mockRequest = {
            method: 'resources/read',
            params: { uri: 'tickets://id/ticket-non-existent' },
          };
          const mockContext = { signal: new AbortController().signal };

          await expect(handler(mockRequest, mockContext)).rejects.toThrow(
            new McpError(ErrorCode.MethodNotFound, 'Ticket with ID ticket-non-existent not found'),
          );

          expect(Logger.warn).toHaveBeenCalledWith('McpServer', 'Ticket not found: ticket-non-existent');
        }
      });

      test('should throw error for invalid ticket ID format in tickets://id/{id} URI', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          const mockRequest = {
            method: 'resources/read',
            params: { uri: 'tickets://id/invalid-id' },
          };
          const mockContext = { signal: new AbortController().signal };

          await expect(handler(mockRequest, mockContext)).rejects.toThrow(
            new McpError(ErrorCode.MethodNotFound, 'Invalid ticket ID format: invalid-id'),
          );
        }
      });

      test('should throw error for unknown resource URI', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          const mockRequest = { method: 'resources/read', params: { uri: 'tickets://unknown' } };
          const mockContext = { signal: new AbortController().signal };

          await expect(handler(mockRequest, mockContext)).rejects.toThrow(
            new McpError(ErrorCode.MethodNotFound, 'Unknown resource: tickets://unknown'),
          );
        }
      });

      test('should throw error for unknown protocol', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          const mockRequest = { method: 'resources/read', params: { uri: 'unknown://resource' } };
          const mockContext = { signal: new AbortController().signal };

          await expect(handler(mockRequest, mockContext)).rejects.toThrow(
            new McpError(ErrorCode.MethodNotFound, 'Unknown resource protocol: unknown'),
          );
        }
      });

      test('should handle unexpected errors', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          mockTicketQueries.getTickets.mockImplementation(() => {
            throw new Error('Database error');
          });

          const mockRequest = { method: 'resources/read', params: { uri: 'tickets://all' } };
          const mockContext = { signal: new AbortController().signal };

          await expect(handler(mockRequest, mockContext)).rejects.toThrow(
            new McpError(ErrorCode.InternalError, 'Error accessing resource: Database error'),
          );

          expect(Logger.error).toHaveBeenCalledWith('McpServer', 'Resource error: Database error');
        }
      });

      test('should handle non-Error objects thrown', async () => {
        const handler = getHandler<typeof ReadResourceRequestSchema, ResourceReadResponse>(ReadResourceRequestSchema);

        expect(handler).toBeDefined();

        if (handler) {
          mockTicketQueries.getTickets.mockImplementation(() => {
            throw 'Not an Error object';
          });

          const mockRequest = { method: 'resources/read', params: { uri: 'tickets://all' } };
          const mockContext = { signal: new AbortController().signal };

          await expect(handler(mockRequest, mockContext)).rejects.toThrow(
            new McpError(ErrorCode.InternalError, 'Error accessing resource: Not an Error object'),
          );

          expect(Logger.error).toHaveBeenCalledWith('McpServer', 'Resource error: Not an Error object');
        }
      });
    });
  });
});

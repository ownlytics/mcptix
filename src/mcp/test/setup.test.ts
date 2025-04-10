import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TicketQueries } from '../../db/queries';
import { Logger } from '../../utils/logger';
import { setupToolHandlers } from '../tools';
import { createMocks } from './utils/test-helpers';

// Define type for the list tools response
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

describe('MCP Tools Setup', () => {
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
        expect(result.tools).toHaveLength(12); // There are 12 tools defined
        expect(result.tools[0].name).toBe('list_tickets');
        expect(result.tools[1].name).toBe('get_ticket');
      }
    });
  });
});

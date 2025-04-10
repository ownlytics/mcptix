import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TicketQueries } from '../../../db/queries';
import { setupToolHandlers } from '../../tools';

// Types for the MCP responses
export interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Creates mock server and ticket queries for testing
 */
export function createMocks() {
  // Setup mock server
  const mockServer = {
    setRequestHandler: jest.fn(),
  } as unknown as jest.Mocked<Server>;

  // Setup mock ticket queries
  const mockTicketQueries = {
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

  return { mockServer, mockTicketQueries };
}

/**
 * Helper to call a tool handler and return its response
 */
export async function callToolHandler(
  mockServer: jest.Mocked<Server>,
  mockTicketQueries: jest.Mocked<TicketQueries>,
  toolName: string,
  args: any,
): Promise<ToolResponse> {
  setupToolHandlers(mockServer, mockTicketQueries);

  // Get the handler function that was registered
  const callToolHandler = mockServer.setRequestHandler.mock.calls.find(call => call[0] === CallToolRequestSchema)?.[1];

  if (!callToolHandler) {
    throw new Error('Call tool handler not found');
  }

  // Mock the implementation to match the expected signature
  const mockRequest = { method: 'call_tool', params: { name: toolName, arguments: args } };
  const mockContext = { signal: new AbortController().signal };

  return (await callToolHandler(mockRequest, mockContext)) as ToolResponse;
}

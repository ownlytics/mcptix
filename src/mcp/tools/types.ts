import { TicketQueries } from '../../db/queries';

// Common response type for tools
export interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  // Add optional _meta field expected by MCP SDK
  _meta?: Record<string, unknown>;
}

// Helper functions
export function createSuccessResponse(data: any): ToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function createErrorResponse(errorMessage: string): ToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}

// Handler type signature - matches MCP SDK's CallToolResultSchema
export type ToolHandler = (ticketQueries: TicketQueries, args: any) => ToolResponse;

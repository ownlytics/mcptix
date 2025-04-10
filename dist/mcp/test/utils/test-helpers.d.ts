import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
export interface ToolResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
/**
 * Creates mock server and ticket queries for testing
 */
export declare function createMocks(): {
    mockServer: jest.Mocked<Server<{
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
                progressToken?: string | number | undefined;
            } | undefined;
        } | undefined;
    }, {
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
    }, {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    }>>;
    mockTicketQueries: jest.Mocked<TicketQueries>;
};
/**
 * Helper to call a tool handler and return its response
 */
export declare function callToolHandler(mockServer: jest.Mocked<Server>, mockTicketQueries: jest.Mocked<TicketQueries>, toolName: string, args: any): Promise<ToolResponse>;
//# sourceMappingURL=test-helpers.d.ts.map
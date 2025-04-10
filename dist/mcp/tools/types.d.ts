import { TicketQueries } from '../../db/queries';
export interface ToolResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
    _meta?: Record<string, unknown>;
}
export declare function createSuccessResponse(data: any): ToolResponse;
export declare function createErrorResponse(errorMessage: string): ToolResponse;
export type ToolHandler = (ticketQueries: TicketQueries, args: any) => ToolResponse;
//# sourceMappingURL=types.d.ts.map
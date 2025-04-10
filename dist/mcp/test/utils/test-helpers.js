"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMocks = createMocks;
exports.callToolHandler = callToolHandler;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const tools_1 = require("../../tools");
/**
 * Creates mock server and ticket queries for testing
 */
function createMocks() {
    // Setup mock server
    const mockServer = {
        setRequestHandler: jest.fn(),
    };
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
    };
    return { mockServer, mockTicketQueries };
}
/**
 * Helper to call a tool handler and return its response
 */
async function callToolHandler(mockServer, mockTicketQueries, toolName, args) {
    (0, tools_1.setupToolHandlers)(mockServer, mockTicketQueries);
    // Get the handler function that was registered
    const callToolHandler = mockServer.setRequestHandler.mock.calls.find(call => call[0] === types_js_1.CallToolRequestSchema)?.[1];
    if (!callToolHandler) {
        throw new Error('Call tool handler not found');
    }
    // Mock the implementation to match the expected signature
    const mockRequest = { method: 'call_tool', params: { name: toolName, arguments: args } };
    const mockContext = { signal: new AbortController().signal };
    return (await callToolHandler(mockRequest, mockContext));
}
//# sourceMappingURL=test-helpers.js.map
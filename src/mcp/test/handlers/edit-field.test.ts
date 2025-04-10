import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('edit_field handler', () => {
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

  test('should perform find/replace on a ticket field', async () => {
    const existingTicket = {
      ...sampleTickets[0],
      description: 'This is a test description with some text to replace.',
    };
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.updateTicket.mockReturnValue(true);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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

  test('should use regex mode when useRegex is true', async () => {
    const existingTicket = {
      ...sampleTickets[0],
      description: 'User123 and User456 need access to the system.',
    };
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.updateTicket.mockReturnValue(true);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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

    const responseObj = JSON.parse(result.content[0].text);
    expect(responseObj.replacement_count).toBe(2);
  });

  test('should support case-insensitive search when caseSensitive is false', async () => {
    const existingTicket = {
      ...sampleTickets[0],
      description: 'The ERROR occurred because of an Error in the code. error handling needs improvement.',
    };
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.updateTicket.mockReturnValue(true);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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
    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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

  test('should handle invalid regex patterns gracefully', async () => {
    const existingTicket = {
      ...sampleTickets[0],
      description: 'Some text with (unbalanced parentheses',
    };
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
      id: existingTicket.id,
      field: 'description',
      search: '(unclosed group',
      replace: 'replacement',
      useRegex: true,
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Invalid regex pattern');
  });

  test('should throw error if ticket ID is missing', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
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

    const result = await callToolHandler(mockServer, mockTicketQueries, 'edit_field', {
      id: existingTicket.id,
      field: 'description',
      search: 'text',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Both search and replace parameters are required');
    expect(mockTicketQueries.updateTicket).not.toHaveBeenCalled();
  });
});

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TicketQueries } from '../../../db/queries';
import { Logger } from '../../../utils/logger';
import { sampleTickets } from '../utils/fixtures';
import { callToolHandler, createMocks } from '../utils/test-helpers';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../../utils/logger');

describe('add_comment handler', () => {
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

  test('should add a comment to a ticket', async () => {
    const existingTicket = sampleTickets[0];
    const newCommentId = 'new-comment-id';
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.addComment.mockReturnValue(newCommentId);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'add_comment', {
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

    await callToolHandler(mockServer, mockTicketQueries, 'add_comment', {
      ticket_id: existingTicket.id,
      content: 'This is a test comment',
    });
    expect(mockTicketQueries.addComment.mock.calls[0][1]).toMatchObject({
      author: 'agent',
    });
  });

  test('should throw error if ticket ID is missing', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'add_comment', {
      content: 'This is a test comment',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Ticket ID is required');
    expect(mockTicketQueries.addComment).not.toHaveBeenCalled();
  });

  test('should throw error if content is not provided', async () => {
    const result = await callToolHandler(mockServer, mockTicketQueries, 'add_comment', {
      ticket_id: 'ticket-1',
    });

    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text).toContain('Comment content is required');
    expect(mockTicketQueries.addComment).not.toHaveBeenCalled();
  });

  test('should throw error if ticket is not found', async () => {
    mockTicketQueries.getTicketById.mockReturnValue(null);

    const result = await callToolHandler(mockServer, mockTicketQueries, 'add_comment', {
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

    const result = await callToolHandler(mockServer, mockTicketQueries, 'add_comment', {
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

  test('should add a comment with content for a developer', async () => {
    const existingTicket = sampleTickets[0];
    const newCommentId = 'new-comment-id';
    mockTicketQueries.getTicketById.mockReturnValue(existingTicket);
    mockTicketQueries.addComment.mockReturnValue(newCommentId);

    const content = 'Developer comment with code: `const x = 1;`';

    const result = await callToolHandler(mockServer, mockTicketQueries, 'add_comment', {
      ticket_id: existingTicket.id,
      content,
      author: 'developer',
    });

    expect(mockTicketQueries.addComment).toHaveBeenCalled();
    expect(mockTicketQueries.addComment.mock.calls[0][1]).toMatchObject({
      content,
      author: 'developer',
    });
  });
});

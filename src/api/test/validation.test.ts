import { Request } from 'express';
import { validateCreateTicket, validateUpdateTicket, validateCreateComment, validateSearch } from '../validation';

// Helper to create mock Request objects
const createMockRequest = (body = {}, query = {}): Request => {
  return {
    body,
    query,
  } as unknown as Request;
};

describe('Validation Functions', () => {
  describe('validateCreateTicket', () => {
    test('should return null for valid ticket', () => {
      const req = createMockRequest({ title: 'Test Ticket' });
      const result = validateCreateTicket(req);
      expect(result).toBeNull();
    });

    test('should return error message when title is missing', () => {
      const req = createMockRequest({ description: 'No title here' });
      const result = validateCreateTicket(req);
      expect(result).toBe('Ticket title is required');
    });

    test('should return error message when title is empty', () => {
      const req = createMockRequest({ title: '' });
      const result = validateCreateTicket(req);
      expect(result).toBe('Ticket title is required');
    });
  });

  describe('validateUpdateTicket', () => {
    test('should return null for any update request', () => {
      // Test with empty body
      const emptyReq = createMockRequest({});
      expect(validateUpdateTicket(emptyReq)).toBeNull();

      // Test with some fields
      const partialReq = createMockRequest({ title: 'Updated Title' });
      expect(validateUpdateTicket(partialReq)).toBeNull();

      // Test with all fields
      const fullReq = createMockRequest({
        title: 'Updated Title',
        description: 'Updated description',
        status: 'in-progress',
        priority: 'high',
      });
      expect(validateUpdateTicket(fullReq)).toBeNull();
    });
  });

  describe('validateCreateComment', () => {
    test('should return null for valid comment', () => {
      const req = createMockRequest({ content: 'This is a comment' });
      const result = validateCreateComment(req);
      expect(result).toBeNull();
    });

    test('should return error message when content is missing', () => {
      const req = createMockRequest({});
      const result = validateCreateComment(req);
      expect(result).toBe('Comment content is required');
    });

    test('should return error message when content is empty', () => {
      const req = createMockRequest({ content: '' });
      const result = validateCreateComment(req);
      expect(result).toBe('Comment content is required');
    });
  });

  describe('validateSearch', () => {
    test('should return null for valid search query', () => {
      const req = createMockRequest({}, { q: 'search term' });
      const result = validateSearch(req);
      expect(result).toBeNull();
    });

    test('should return error message when search query is missing', () => {
      const req = createMockRequest({}, {});
      const result = validateSearch(req);
      expect(result).toBe('Search query is required');
    });

    test('should return error message when search query is empty', () => {
      const req = createMockRequest({}, { q: '' });
      const result = validateSearch(req);
      expect(result).toBe('Search query is required');
    });
  });
});

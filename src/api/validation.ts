import { Request } from 'express';

/**
 * Validates a ticket creation request
 * @param req The request object
 * @returns An error message or null if valid
 */
export function validateCreateTicket(req: Request): string | null {
  const { title } = req.body;
  
  if (!title) {
    return 'Ticket title is required';
  }
  
  return null;
}

/**
 * Validates a ticket update request
 * @param req The request object
 * @returns An error message or null if valid
 */
export function validateUpdateTicket(req: Request): string | null {
  // No specific validation for update, as all fields are optional
  return null;
}

/**
 * Validates a comment creation request
 * @param req The request object
 * @returns An error message or null if valid
 */
export function validateCreateComment(req: Request): string | null {
  const { content } = req.body;
  
  if (!content) {
    return 'Comment content is required';
  }
  
  return null;
}

/**
 * Validates a search request
 * @param req The request object
 * @returns An error message or null if valid
 */
export function validateSearch(req: Request): string | null {
  const { q } = req.query;
  
  if (!q) {
    return 'Search query is required';
  }
  
  return null;
}
import { Request } from 'express';
/**
 * Validates a ticket creation request
 * @param req The request object
 * @returns An error message or null if valid
 */
export declare function validateCreateTicket(req: Request): string | null;
/**
 * Validates a ticket update request
 * @param req The request object
 * @returns An error message or null if valid
 */
export declare function validateUpdateTicket(req: Request): string | null;
/**
 * Validates a comment creation request
 * @param req The request object
 * @returns An error message or null if valid
 */
export declare function validateCreateComment(req: Request): string | null;
/**
 * Validates a search request
 * @param req The request object
 * @returns An error message or null if valid
 */
export declare function validateSearch(req: Request): string | null;

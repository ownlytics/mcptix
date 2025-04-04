"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateTicket = validateCreateTicket;
exports.validateUpdateTicket = validateUpdateTicket;
exports.validateCreateComment = validateCreateComment;
exports.validateSearch = validateSearch;
/**
 * Validates a ticket creation request
 * @param req The request object
 * @returns An error message or null if valid
 */
function validateCreateTicket(req) {
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
function validateUpdateTicket(_req) {
    // No specific validation for update, as all fields are optional
    return null;
}
/**
 * Validates a comment creation request
 * @param req The request object
 * @returns An error message or null if valid
 */
function validateCreateComment(req) {
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
function validateSearch(req) {
    const { q } = req.query;
    if (!q) {
        return 'Search query is required';
    }
    return null;
}
//# sourceMappingURL=validation.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
exports.requestLogger = requestLogger;
exports.validateRequest = validateRequest;
/**
 * Middleware for handling 404 Not Found errors
 */
function notFoundHandler(req, res, next) {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}
/**
 * Middleware for handling errors
 */
function errorHandler(err, req, res, next) {
    console.error('API Error:', err);
    // Handle specific error types
    if (err.name === 'SyntaxError') {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    // Default error response
    res.status(500).json({ error: err.message || 'Internal Server Error' });
}
/**
 * Middleware for logging requests
 */
function requestLogger(req, res, next) {
    console.log(`${req.method} ${req.path}`);
    next();
}
/**
 * Factory function for creating validation middleware
 * @param validator A function that validates the request and returns an error message or null
 * @returns Middleware function
 */
function validateRequest(validator) {
    return (req, res, next) => {
        const error = validator(req);
        if (error) {
            res.status(400).json({ error });
        }
        else {
            next();
        }
    };
}
//# sourceMappingURL=middleware.js.map
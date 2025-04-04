import { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Middleware for handling 404 Not Found errors
 */
export declare function notFoundHandler(req: Request, res: Response, _next: NextFunction): void | Response;
/**
 * Middleware for handling errors
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void | Response;
/**
 * Middleware for logging requests
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Factory function for creating validation middleware
 * @param validator A function that validates the request and returns an error message or null
 * @returns Middleware function
 */
export declare function validateRequest(validator: (req: Request) => string | null): RequestHandler;
//# sourceMappingURL=middleware.d.ts.map
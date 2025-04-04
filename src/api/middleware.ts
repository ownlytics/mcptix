import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Middleware for handling 404 Not Found errors
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void | Response {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

/**
 * Middleware for handling errors
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void | Response {
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
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  console.log(`${req.method} ${req.path}`);
  next();
}

/**
 * Factory function for creating validation middleware
 * @param validator A function that validates the request and returns an error message or null
 * @returns Middleware function
 */
export function validateRequest(validator: (req: Request) => string | null): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const error = validator(req);
    if (error) {
      res.status(400).json({ error });
    } else {
      next();
    }
  };
}

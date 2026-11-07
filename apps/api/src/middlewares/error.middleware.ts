import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app.error';
import { errorResponse } from '../utils/response.util';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors -> 400
  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json(
      errorResponse(
        'VALIDATION_ERROR',
        'Request input validation failed',
        formattedIssues
      )
    );
    return;
  }

  // 2. Controlled Application Errors (400, 404, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details)
    );
    return;
  }

  // 3. Syntax errors (e.g. malformed JSON body) -> 400
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json(
      errorResponse('INVALID_JSON', 'Malformed JSON in request body')
    );
    return;
  }

  // 4. Unexpected / Unhandled Errors -> Safe 500
  // Log internal details strictly on the server side; do not leak to client
  console.error('Unhandled Server Error:', err instanceof Error ? err.message : err);

  res.status(500).json(
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred. Please try again later.'
    )
  );
}

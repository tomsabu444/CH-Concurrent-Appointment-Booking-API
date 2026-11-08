import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'A conflicting record already exists.') {
    super(message, 409);
  }
}

/**
 * Centralized, route-agnostic error handler middleware.
 * Formats all operational and unexpected application errors into uniform JSON responses.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.id || (req.headers['x-request-id'] as string);

  // 1. Known Operational AppError (Validation, NotFound, Conflict, etc.)
  if (err instanceof AppError) {
    logger.info(
      { requestId, statusCode: err.statusCode, message: err.message },
      `[AppError] ${err.name}: ${err.message}`
    );

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // 2. Schema Validation Errors (Zod) -> 400 Bad Request
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path[0] !== undefined ? String(issue.path[0]) : '';
    const rawMsg = issue.message.toLowerCase();
    const message = (rawMsg.includes('undefined') || rawMsg.includes('null') || rawMsg.includes('required'))
      ? `${field} is required.`
      : `${field} must be a positive integer.`;

    logger.info({ requestId, validationError: message }, '[ValidationError] Zod schema validation failed.');

    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  // 2. Oversized Request Body (413 Payload Too Large)
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    logger.warn({ requestId, status: 413 }, '[PayloadTooLarge] Request body exceeded size limit.');
    res.status(413).json({
      success: false,
      message: 'Payload too large. The request body exceeds the allowable limit.',
    });
    return;
  }

  // 3. JSON Request Body Parse Errors (400 Bad Request)
  if (err.type === 'entity.parse.failed' || err.status === 400 || err.statusCode === 400) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON request payload.',
    });
    return;
  }

  // 4. Database / Driver Integer Range Overflow (400 Bad Request)
  if (
    (typeof err?.message === 'string' && (
      err.message.includes('between -2147483648 and 2147483647') ||
      err.message.includes('out of range for type')
    )) ||
    err?.number === 8115
  ) {
    logger.warn({ requestId, errMessage: err.message }, '[IntegerOverflow] Parameter exceeded allowable range.');
    res.status(400).json({
      success: false,
      message: 'A provided number exceeds the allowable 32-bit integer range.',
    });
    return;
  }

  // 3. Fallback for unhandled database unique constraint violations
  if (err?.number === 2601 || err?.number === 2627) {
    logger.warn({ requestId, sqlError: err.number }, '[DatabaseConflict] Unique constraint violation.');
    res.status(409).json({
      success: false,
      message: 'A conflicting record already exists.',
    });
    return;
  }

  // 4. Fallback for unhandled database deadlock victims
  if (err?.number === 1205) {
    logger.warn({ requestId, sqlError: err.number }, '[DatabaseDeadlock] Transaction was selected as deadlock victim.');
    res.status(409).json({
      success: false,
      message: 'A database concurrency conflict occurred. Please retry your request.',
    });
    return;
  }

  // 5. Unknown / Unhandled Server Errors
  logger.error({ requestId, err }, '[UnknownError] An unhandled exception occurred');

  res.status(500).json({
    success: false,
    message: 'An unexpected internal error occurred. Please try again later.',
  });
}

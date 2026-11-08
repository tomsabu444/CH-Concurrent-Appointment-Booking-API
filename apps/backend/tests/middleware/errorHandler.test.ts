import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  NotFoundError,
  ConflictError,
  ValidationError,
  errorHandler,
} from '../../src/middleware/errorHandler';
import { logger } from '../../src/lib/logger';

describe('Middleware - Error Handler & Custom Error Classes (Unit)', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
    jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    jest.spyOn(logger, 'error').mockImplementation(() => logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should instantiate AppError with correct defaults', () => {
    const err = new AppError('Server error', 500);
    expect(err.message).toBe('Server error');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it('should instantiate NotFoundError with 404 status', () => {
    const err = new NotFoundError('Item not found');
    expect(err.message).toBe('Item not found');
    expect(err.statusCode).toBe(404);
  });

  it('should instantiate ConflictError with 409 status', () => {
    const err = new ConflictError('Duplicate key');
    expect(err.message).toBe('Duplicate key');
    expect(err.statusCode).toBe(409);
  });

  it('should instantiate ValidationError with 400 status', () => {
    const err = new ValidationError('Invalid input');
    expect(err.message).toBe('Invalid input');
    expect(err.statusCode).toBe(400);
  });

  it('should format AppError into structured JSON response', () => {
    const req = { headers: {} } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    const notFound = new NotFoundError('Resource not found');
    errorHandler(notFound, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Resource not found',
    });
  });
});

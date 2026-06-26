import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '../types/index.js';
import { isDevelopment } from '../config/index.js';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errorCode =
    err instanceof ApiError ? err.code ?? 'API_ERROR' : 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(isDevelopment && { stack: err.stack }),
  } as ApiErrorResponse & { stack?: string });
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
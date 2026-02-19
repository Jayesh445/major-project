import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { ZodError, ZodIssue } from 'zod';
import { MongooseError } from 'mongoose';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    const issues: ZodIssue[] = (err as any).issues ?? (err as any).errors ?? [];
    errors = issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError' && err instanceof MongooseError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values((err as any).errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
  }
  // Handle Mongoose duplicate key error
  else if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate Entry';
    const field = Object.keys((err as any).keyPattern)[0];
    errors = [{ field, message: `${field} already exists` }];
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Custom API Error class for standardized error handling
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors: any[];

  constructor(
    statusCode: number,
    message: string,
    errors: any[] = [],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.isOperational = true;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

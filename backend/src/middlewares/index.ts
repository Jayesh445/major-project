/**
 * Middleware exports
 */
export { errorHandler, notFoundHandler } from './errorHandler';
export { authenticate, authorize, optionalAuth } from './auth';
export type { AuthRequest } from './auth';

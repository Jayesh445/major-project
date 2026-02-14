import { Request, Response, NextFunction } from 'express';
import UserService from '@/modules/user/service';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/constants';
import { UserRole } from '@/modules/user/model';

/**
 * Extended Request interface with user property
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Authentication middleware to verify JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const payload = UserService.verifyToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid or expired token'));
    }
  }
};

/**
 * Authorization middleware to check if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'User not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          HttpStatus.FORBIDDEN,
          'You do not have permission to access this resource'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = UserService.verifyToken(token);

      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

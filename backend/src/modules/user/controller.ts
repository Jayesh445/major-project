import { Request, Response } from 'express';
import UserService from './service';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess, sendCreated } from '@/utils/responseHandler';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/constants';

/**
 * Extended Request interface with user property
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * User Controller
 */
export class UserController {
  /**
   * User signup
   * POST /api/users/signup
   */
  signup = asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await UserService.signup(req.body);

    // Remove password hash from response
    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    return sendCreated(res, { user: userResponse, token }, 'User registered successfully');
  });

  /**
   * User login
   * POST /api/users/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { user, token } = await UserService.login(req.body);

    // Remove password hash from response
    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    return sendSuccess(res, { user: userResponse, token }, 'Login successful');
  });

  /**
   * Get current user profile
   * GET /api/users/profile
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    const user = await UserService.getProfile(req.user.userId);

    return sendSuccess(res, user, 'Profile retrieved successfully');
  });

  /**
   * Update current user profile
   * PATCH /api/users/profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    const user = await UserService.updateProfile(req.user.userId, req.body);

    return sendSuccess(res, user, 'Profile updated successfully');
  });

  /**
   * Change password
   * POST /api/users/change-password
   */
  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    await UserService.changePassword(req.user.userId, req.body);

    return sendSuccess(res, null, 'Password changed successfully');
  });

  /**
   * Get all users (admin only)
   * GET /api/users
   */
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      role: req.query.role as any,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    };

    const result = await UserService.getUsers(filters);

    return sendSuccess(
      res,
      {
        users: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: filters.limit,
        },
      },
      'Users retrieved successfully'
    );
  });

  /**
   * Get user by ID (admin only)
   * GET /api/users/:id
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await UserService.getUserById(userId);

    return sendSuccess(res, user, 'User retrieved successfully');
  });

  /**
   * Update user (admin only)
   * PATCH /api/users/:id
   */
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await UserService.updateUser(userId, req.body);

    return sendSuccess(res, user, 'User updated successfully');
  });

  /**
   * Delete user (admin only)
   * DELETE /api/users/:id
   */
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await UserService.deleteUser(userId);

    return sendSuccess(res, null, 'User deleted successfully');
  });
}

export default new UserController();

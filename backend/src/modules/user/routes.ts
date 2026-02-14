import { Router } from 'express';
import UserController from './controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { validateRequest } from '@/utils/validateRequest';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateUserSchema,
  getUserSchema,
  getUsersQuerySchema,
  refreshTokenSchema,
  logoutSchema,
} from './validation';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// POST /api/users/signup - User registration
router.post('/signup', validateRequest(signupSchema), UserController.signup);

// POST /api/users/login - User login
router.post('/login', validateRequest(loginSchema), UserController.login);

// POST /api/users/refresh-token - Refresh access token
router.post('/refresh-token', validateRequest(refreshTokenSchema), UserController.refreshToken);

/**
 * Protected routes (authentication required)
 */

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticate, UserController.getProfile);

// PATCH /api/users/profile - Update current user profile
router.patch(
  '/profile',
  authenticate,
  validateRequest(updateProfileSchema),
  UserController.updateProfile
);

// POST /api/users/change-password - Change password
router.post(
  '/change-password',
  authenticate,
  validateRequest(changePasswordSchema),
  UserController.changePassword
);

// POST /api/users/logout - Logout (revoke refresh token)
router.post(
  '/logout',
  authenticate,
  validateRequest(logoutSchema),
  UserController.logout
);

// POST /api/users/logout-all - Logout from all devices
router.post('/logout-all', authenticate, UserController.logoutAll);

// GET /api/users/sessions - Get active sessions
router.get('/sessions', authenticate, UserController.getSessions);

/**
 * Admin-only routes
 */

// GET /api/users - Get all users (admin only)
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateRequest(getUsersQuerySchema),
  UserController.getUsers
);

// GET /api/users/:id - Get user by ID (admin only)
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest(getUserSchema),
  UserController.getUserById
);

// PATCH /api/users/:id - Update user (admin only)
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest(updateUserSchema),
  UserController.updateUser
);

// DELETE /api/users/:id - Delete user (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest(getUserSchema),
  UserController.deleteUser
);

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = __importDefault(require("./controller"));
const auth_1 = require("@/middlewares/auth");
const validateRequest_1 = require("@/utils/validateRequest");
const validation_1 = require("./validation");
const router = (0, express_1.Router)();
/**
 * Public routes (no authentication required)
 */
// POST /api/users/signup - User registration
router.post('/signup', (0, validateRequest_1.validateRequest)(validation_1.signupSchema), controller_1.default.signup);
// POST /api/users/login - User login
router.post('/login', (0, validateRequest_1.validateRequest)(validation_1.loginSchema), controller_1.default.login);
// POST /api/users/refresh-token - Refresh access token
router.post('/refresh-token', (0, validateRequest_1.validateRequest)(validation_1.refreshTokenSchema), controller_1.default.refreshToken);
/**
 * Protected routes (authentication required)
 */
// GET /api/users/profile - Get current user profile
router.get('/profile', auth_1.authenticate, controller_1.default.getProfile);
// PATCH /api/users/profile - Update current user profile
router.patch('/profile', auth_1.authenticate, (0, validateRequest_1.validateRequest)(validation_1.updateProfileSchema), controller_1.default.updateProfile);
// POST /api/users/change-password - Change password
router.post('/change-password', auth_1.authenticate, (0, validateRequest_1.validateRequest)(validation_1.changePasswordSchema), controller_1.default.changePassword);
// POST /api/users/logout - Logout (revoke refresh token)
router.post('/logout', auth_1.authenticate, (0, validateRequest_1.validateRequest)(validation_1.logoutSchema), controller_1.default.logout);
// POST /api/users/logout-all - Logout from all devices
router.post('/logout-all', auth_1.authenticate, controller_1.default.logoutAll);
// GET /api/users/sessions - Get active sessions
router.get('/sessions', auth_1.authenticate, controller_1.default.getSessions);
/**
 * Admin-only routes
 */
// GET /api/users - Get all users (admin only)
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, validateRequest_1.validateRequest)(validation_1.getUsersQuerySchema), controller_1.default.getUsers);
// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, validateRequest_1.validateRequest)(validation_1.getUserSchema), controller_1.default.getUserById);
// PATCH /api/users/:id - Update user (admin only)
router.patch('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, validateRequest_1.validateRequest)(validation_1.updateUserSchema), controller_1.default.updateUser);
// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, validateRequest_1.validateRequest)(validation_1.getUserSchema), controller_1.default.deleteUser);
exports.default = router;

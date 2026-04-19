"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const service_1 = __importDefault(require("./service"));
const asyncHandler_1 = require("@/utils/asyncHandler");
const responseHandler_1 = require("@/utils/responseHandler");
const ApiError_1 = require("@/utils/ApiError");
const constants_1 = require("@/utils/constants");
/**
 * User Controller
 */
class UserController {
    constructor() {
        /**
         * User signup
         * POST /api/users/signup
         */
        this.signup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const metadata = {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            };
            const { user, accessToken, refreshToken } = await service_1.default.signup(req.body, metadata);
            // Remove password hash from response
            const userResponse = user.toObject();
            delete userResponse.passwordHash;
            return (0, responseHandler_1.sendCreated)(res, { user: userResponse, accessToken, refreshToken }, 'User registered successfully');
        });
        /**
         * User login
         * POST /api/users/login
         */
        this.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const metadata = {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            };
            const { user, accessToken, refreshToken } = await service_1.default.login(req.body, metadata);
            // Remove password hash from response
            const userResponse = user.toObject();
            delete userResponse.passwordHash;
            return (0, responseHandler_1.sendSuccess)(res, { user: userResponse, accessToken, refreshToken }, 'Login successful');
        });
        /**
         * Get current user profile
         * GET /api/users/profile
         */
        this.getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not authenticated');
            }
            const user = await service_1.default.getProfile(req.user.userId);
            return (0, responseHandler_1.sendSuccess)(res, user, 'Profile retrieved successfully');
        });
        /**
         * Update current user profile
         * PATCH /api/users/profile
         */
        this.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not authenticated');
            }
            const user = await service_1.default.updateProfile(req.user.userId, req.body);
            return (0, responseHandler_1.sendSuccess)(res, user, 'Profile updated successfully');
        });
        /**
         * Change password
         * POST /api/users/change-password
         */
        this.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not authenticated');
            }
            await service_1.default.changePassword(req.user.userId, req.body);
            return (0, responseHandler_1.sendSuccess)(res, null, 'Password changed successfully');
        });
        /**
         * Get all users (admin only)
         * GET /api/users
         */
        this.getUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const filters = {
                role: req.query.role,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
            };
            const result = await service_1.default.getUsers(filters);
            return (0, responseHandler_1.sendSuccess)(res, {
                users: result.users,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                    limit: filters.limit,
                },
            }, 'Users retrieved successfully');
        });
        /**
         * Get user by ID (admin only)
         * GET /api/users/:id
         */
        this.getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const user = await service_1.default.getUserById(userId);
            return (0, responseHandler_1.sendSuccess)(res, user, 'User retrieved successfully');
        });
        /**
         * Update user (admin only)
         * PATCH /api/users/:id
         */
        this.updateUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const user = await service_1.default.updateUser(userId, req.body);
            return (0, responseHandler_1.sendSuccess)(res, user, 'User updated successfully');
        });
        /**
         * Delete user (admin only)
         * DELETE /api/users/:id
         */
        this.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            await service_1.default.deleteUser(userId);
            return (0, responseHandler_1.sendSuccess)(res, null, 'User deleted successfully');
        });
        /**
         * Refresh access token
         * POST /api/users/refresh-token
         */
        this.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { refreshToken } = req.body;
            const metadata = {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            };
            const tokens = await service_1.default.refreshAccessToken(refreshToken, metadata);
            return (0, responseHandler_1.sendSuccess)(res, tokens, 'Token refreshed successfully');
        });
        /**
         * Logout (revoke refresh token)
         * POST /api/users/logout
         */
        this.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not authenticated');
            }
            const { refreshToken } = req.body;
            await service_1.default.logout(req.user.userId, refreshToken);
            return (0, responseHandler_1.sendSuccess)(res, null, 'Logged out successfully');
        });
        /**
         * Logout from all devices
         * POST /api/users/logout-all
         */
        this.logoutAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not authenticated');
            }
            await service_1.default.logoutAll(req.user.userId);
            return (0, responseHandler_1.sendSuccess)(res, null, 'Logged out from all devices successfully');
        });
        /**
         * Get active sessions
         * GET /api/users/sessions
         */
        this.getSessions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            if (!req.user) {
                throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not authenticated');
            }
            const sessions = await service_1.default.getActiveSessions(req.user.userId);
            return (0, responseHandler_1.sendSuccess)(res, { sessions }, 'Sessions retrieved successfully');
        });
    }
}
exports.UserController = UserController;
exports.default = new UserController();

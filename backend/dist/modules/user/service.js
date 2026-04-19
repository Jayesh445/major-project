"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const model_1 = __importDefault(require("./model"));
const ApiError_1 = require("@/utils/ApiError");
const constants_1 = require("@/utils/constants");
const mongoose_1 = __importDefault(require("mongoose"));
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // Short-lived access token
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Long-lived refresh token
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET + '-refresh';
const MAX_REFRESH_TOKENS = parseInt(process.env.MAX_REFRESH_TOKENS || '5'); // Maximum refresh tokens per user
/**
 * User Service
 */
class UserService {
    /**
     * Hash a password using bcrypt
     */
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    /**
     * Compare password with hash
     */
    async comparePassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    /**
     * Generate access token (short-lived)
     */
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
    }
    /**
     * Generate refresh token (long-lived)
     */
    generateRefreshToken(payload) {
        const tokenId = crypto_1.default.randomBytes(32).toString('hex');
        return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh', tokenId }, REFRESH_TOKEN_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
    }
    /**
     * Generate token pair (access + refresh)
     */
    generateTokenPair(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }
    /**
     * Get refresh token expiry date
     */
    getRefreshTokenExpiry() {
        const expiresIn = JWT_REFRESH_EXPIRES_IN;
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            // Default to 7 days if parsing fails
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return new Date(Date.now() + value * multipliers[unit]);
    }
    /**
     * Store refresh token in database
     */
    async storeRefreshToken(userId, refreshToken, metadata) {
        const user = await model_1.default.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        // Remove expired tokens
        user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > new Date());
        // Limit number of refresh tokens (remove oldest if exceeded)
        if (user.refreshTokens.length >= MAX_REFRESH_TOKENS) {
            user.refreshTokens.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS + 1);
        }
        // Add new refresh token
        user.refreshTokens.push({
            token: refreshToken,
            expiresAt: this.getRefreshTokenExpiry(),
            createdAt: new Date(),
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
        });
        await user.save();
    }
    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (payload.type !== 'access') {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch (error) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'Invalid or expired access token');
        }
    }
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
            if (payload.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return payload;
        }
        catch (error) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
        }
    }
    /**
     * Legacy method for backward compatibility
     */
    verifyToken(token) {
        return this.verifyAccessToken(token);
    }
    /**
     * Create a new user (signup)
     */
    async signup(data, metadata) {
        // Check if user already exists
        const existingUser = await model_1.default.findOne({ email: data.email });
        if (existingUser) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.CONFLICT, 'User with this email already exists');
        }
        // Validate supplier reference for supplier role
        if (data.role === 'supplier' && !data.supplierRef) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Supplier reference is required for supplier role');
        }
        // Hash password
        const passwordHash = await this.hashPassword(data.password);
        // Create user
        const user = await model_1.default.create({
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
            supplierRef: data.supplierRef ? new mongoose_1.default.Types.ObjectId(data.supplierRef) : undefined,
            assignedWarehouses: data.assignedWarehouses?.map((id) => new mongoose_1.default.Types.ObjectId(id)) || [],
        });
        // Generate token pair
        const tokens = this.generateTokenPair({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        // Store refresh token
        await this.storeRefreshToken(user._id.toString(), tokens.refreshToken, metadata);
        return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    /**
     * Login user
     */
    async login(data, metadata) {
        // Find user by email (include password hash)
        const user = await model_1.default.findOne({ email: data.email }).select('+passwordHash');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'Invalid email or password');
        }
        // Check if user is active
        if (!user.isActive) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.FORBIDDEN, 'Your account has been deactivated');
        }
        // Compare passwords
        const isPasswordValid = await this.comparePassword(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'Invalid email or password');
        }
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        // Generate token pair
        const tokens = this.generateTokenPair({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        // Store refresh token
        await this.storeRefreshToken(user._id.toString(), tokens.refreshToken, metadata);
        return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId)
            .populate('supplierRef')
            .populate('assignedWarehouses');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        return user;
    }
    /**
     * Get all users with filtering and pagination
     */
    async getUsers(filters) {
        const { role, isActive, page = 1, limit = 10 } = filters;
        const query = {};
        if (role)
            query.role = role;
        if (isActive !== undefined)
            query.isActive = isActive;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            model_1.default.find(query)
                .populate('supplierRef')
                .populate('assignedWarehouses')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            model_1.default.countDocuments(query),
        ]);
        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    /**
     * Update user profile (by user themselves)
     */
    async updateProfile(userId, data) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId);
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        if (data.name)
            user.name = data.name;
        if (data.notificationPreferences) {
            user.notificationPreferences = {
                ...user.notificationPreferences,
                ...data.notificationPreferences,
            };
        }
        await user.save();
        return user;
    }
    /**
     * Change user password
     */
    async changePassword(userId, data) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId).select('+passwordHash');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        // Verify current password
        const isPasswordValid = await this.comparePassword(data.currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'Current password is incorrect');
        }
        // Hash new password and save
        user.passwordHash = await this.hashPassword(data.newPassword);
        await user.save();
    }
    /**
     * Update user by admin
     */
    async updateUser(userId, data) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId);
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        if (data.name)
            user.name = data.name;
        if (data.role)
            user.role = data.role;
        if (data.isActive !== undefined)
            user.isActive = data.isActive;
        if (data.assignedWarehouses) {
            user.assignedWarehouses = data.assignedWarehouses.map((id) => new mongoose_1.default.Types.ObjectId(id));
        }
        if (data.supplierRef) {
            user.supplierRef = new mongoose_1.default.Types.ObjectId(data.supplierRef);
        }
        await user.save();
        return user;
    }
    /**
     * Delete user
     */
    async deleteUser(userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId);
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        await user.deleteOne();
    }
    /**
     * Get current user profile
     */
    async getProfile(userId) {
        return this.getUserById(userId);
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken, metadata) {
        // Verify refresh token
        const payload = this.verifyRefreshToken(refreshToken);
        // Find user and verify refresh token exists in database
        const user = await model_1.default.findById(payload.userId).select('+refreshTokens');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'User not found');
        }
        if (!user.isActive) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.FORBIDDEN, 'Your account has been deactivated');
        }
        // Check if refresh token exists in user's refresh tokens
        const tokenExists = user.refreshTokens.some((rt) => rt.token === refreshToken && rt.expiresAt > new Date());
        if (!tokenExists) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
        }
        // Remove old refresh token
        user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
        await user.save();
        // Generate new token pair
        const tokens = this.generateTokenPair({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        // Store new refresh token
        await this.storeRefreshToken(user._id.toString(), tokens.refreshToken, metadata);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    /**
     * Logout user (revoke refresh token)
     */
    async logout(userId, refreshToken) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        // Remove the specific refresh token
        user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
        await user.save();
    }
    /**
     * Logout from all devices (revoke all refresh tokens)
     */
    async logoutAll(userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        // Remove all refresh tokens
        user.refreshTokens = [];
        await user.save();
    }
    /**
     * Get all active sessions (refresh tokens) for a user
     */
    async getActiveSessions(userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.BAD_REQUEST, 'Invalid user ID');
        }
        const user = await model_1.default.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new ApiError_1.ApiError(constants_1.HttpStatus.NOT_FOUND, 'User not found');
        }
        // Filter out expired tokens and return session info (without actual token)
        return user.refreshTokens
            .filter((rt) => rt.expiresAt > new Date())
            .map((rt) => ({
            createdAt: rt.createdAt,
            expiresAt: rt.expiresAt,
            ipAddress: rt.ipAddress,
            userAgent: rt.userAgent,
        }));
    }
    /**
     * Clean up expired refresh tokens for all users (maintenance task)
     */
    async cleanupExpiredTokens() {
        const result = await model_1.default.updateMany({}, {
            $pull: {
                refreshTokens: { expiresAt: { $lt: new Date() } },
            },
        });
        return result.modifiedCount || 0;
    }
}
exports.UserService = UserService;
exports.default = new UserService();

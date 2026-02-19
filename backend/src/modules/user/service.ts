import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser, UserRole } from './model';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/constants';
import mongoose from 'mongoose';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // Short-lived access token
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Long-lived refresh token
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET + '-refresh';
const MAX_REFRESH_TOKENS = parseInt(process.env.MAX_REFRESH_TOKENS || '5'); // Maximum refresh tokens per user

/**
 * Interface for signup data
 */
export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  supplierRef?: string;
  assignedWarehouses?: string[];
}

/**
 * Interface for login data
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Interface for JWT payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type?: 'access' | 'refresh';
}

/**
 * Interface for token pair
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Interface for refresh token metadata
 */
export interface RefreshTokenMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface for update profile data
 */
export interface UpdateProfileData {
  name?: string;
  notificationPreferences?: {
    email?: boolean;
    inApp?: boolean;
    lowStockAlerts?: boolean;
    poApprovals?: boolean;
    negotiationUpdates?: boolean;
  };
}

/**
 * Interface for change password data
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * User Service
 */
export class UserService {
  /**
   * Hash a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token (short-lived)
   */
  private generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Generate refresh token (long-lived)
   */
  private generateRefreshToken(payload: JWTPayload): string {
    const tokenId = crypto.randomBytes(32).toString('hex');
    return jwt.sign(
      { ...payload, type: 'refresh', tokenId },
      REFRESH_TOKEN_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Generate token pair (access + refresh)
   */
  private generateTokenPair(payload: JWTPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Get refresh token expiry date
   */
  private getRefreshTokenExpiry(): Date {
    const expiresIn = JWT_REFRESH_EXPIRES_IN;
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      // Default to 7 days if parsing fails
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
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
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    metadata?: RefreshTokenMetadata
  ): Promise<void> {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    // Remove expired tokens
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.expiresAt > new Date()
    );

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
  public verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  public verifyToken(token: string): JWTPayload {
    return this.verifyAccessToken(token);
  }

  /**
   * Create a new user (signup)
   */
  async signup(
    data: SignupData,
    metadata?: RefreshTokenMetadata
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(HttpStatus.CONFLICT, 'User with this email already exists');
    }

    // Validate supplier reference for supplier role
    if (data.role === 'supplier' && !data.supplierRef) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Supplier reference is required for supplier role');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      supplierRef: data.supplierRef ? new mongoose.Types.ObjectId(data.supplierRef) : undefined,
      assignedWarehouses: data.assignedWarehouses?.map((id) => new mongoose.Types.ObjectId(id)) || [],
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
  async login(
    data: LoginData,
    metadata?: RefreshTokenMetadata
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // Find user by email (include password hash)
    const user = await User.findOne({ email: data.email }).select('+passwordHash');
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Your account has been deactivated');
    }

    // Compare passwords
    const isPasswordValid = await this.comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid email or password');
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
  async getUserById(userId: string): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId)
      .populate('supplierRef')
      .populate('assignedWarehouses');

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    return user;
  }

  /**
   * Get all users with filtering and pagination
   */
  async getUsers(filters: {
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ users: IUser[]; total: number; page: number; totalPages: number }> {
    const { role, isActive, page = 1, limit = 10 } = filters;

    const query: any = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('supplierRef')
        .populate('assignedWarehouses')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
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
  async updateProfile(userId: string, data: UpdateProfileData): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    if (data.name) user.name = data.name;
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
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await this.comparePassword(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Current password is incorrect');
    }

    // Hash new password and save
    user.passwordHash = await this.hashPassword(data.newPassword);
    await user.save();
  }

  /**
   * Update user by admin
   */
  async updateUser(
    userId: string,
    data: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
      assignedWarehouses?: string[];
      supplierRef?: string;
    }
  ): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    if (data.name) user.name = data.name;
    if (data.role) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    if (data.assignedWarehouses) {
      user.assignedWarehouses = data.assignedWarehouses.map((id) => new mongoose.Types.ObjectId(id));
    }
    if (data.supplierRef) {
      user.supplierRef = new mongoose.Types.ObjectId(data.supplierRef);
    }

    await user.save();
    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    await user.deleteOne();
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<IUser> {
    return this.getUserById(userId);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    metadata?: RefreshTokenMetadata
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Find user and verify refresh token exists in database
    const user = await User.findById(payload.userId).select('+refreshTokens');
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Your account has been deactivated');
    }

    // Check if refresh token exists in user's refresh tokens
    const tokenExists = user.refreshTokens.some(
      (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
    );

    if (!tokenExists) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
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
  async logout(userId: string, refreshToken: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    // Remove the specific refresh token
    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
    await user.save();
  }

  /**
   * Logout from all devices (revoke all refresh tokens)
   */
  async logoutAll(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }

    // Remove all refresh tokens
    user.refreshTokens = [];
    await user.save();
  }

  /**
   * Get all active sessions (refresh tokens) for a user
   */
  async getActiveSessions(userId: string): Promise<Array<{
    createdAt: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }>> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user ID');
    }

    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
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
  async cleanupExpiredTokens(): Promise<number> {
    const result = await User.updateMany(
      {},
      {
        $pull: {
          refreshTokens: { expiresAt: { $lt: new Date() } },
        },
      }
    );

    return result.modifiedCount || 0;
  }
}

export default new UserService();

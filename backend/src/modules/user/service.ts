import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser, UserRole } from './model';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/constants';
import mongoose from 'mongoose';

// Default JWT secret (should be replaced with environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
   * Generate JWT token
   */
  private generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid or expired token');
    }
  }

  /**
   * Create a new user (signup)
   */
  async signup(data: SignupData): Promise<{ user: IUser; token: string }> {
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

    // Generate token
    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<{ user: IUser; token: string }> {
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

    // Generate token
    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user, token };
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
}

export default new UserService();

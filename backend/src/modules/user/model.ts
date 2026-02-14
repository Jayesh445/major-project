import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * User role types for RBAC
 */
export type UserRole = 'admin' | 'warehouse_manager' | 'procurement_officer' | 'supplier';

/**
 * Notification preference settings
 */
export interface INotificationPreferences {
  email: boolean;
  inApp: boolean;
  lowStockAlerts: boolean;
  poApprovals: boolean;
  negotiationUpdates: boolean;
}

/**
 * Refresh token interface
 */
export interface IRefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * User document interface
 */
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  supplierRef?: mongoose.Types.ObjectId;
  assignedWarehouses: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastLogin?: Date;
  notificationPreferences: INotificationPreferences;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification preferences subdocument schema
 */
const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    email: {
      type: Boolean,
      default: true,
    },
    inApp: {
      type: Boolean,
      default: true,
    },
    lowStockAlerts: {
      type: Boolean,
      default: true,
    },
    poApprovals: {
      type: Boolean,
      default: true,
    },
    negotiationUpdates: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

/**
 * Refresh token subdocument schema
 */
const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { _id: false }
);

/**
 * User schema definition
 */
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Don't include password hash in queries by default
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['admin', 'warehouse_manager', 'procurement_officer', 'supplier'],
        message: '{VALUE} is not a valid role',
      },
    },
    supplierRef: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: function (this: IUser) {
        return this.role === 'supplier';
      },
    },
    assignedWarehouses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    notificationPreferences: {
      type: NotificationPreferencesSchema,
      default: () => ({}),
    },
    refreshTokens: {
      type: [RefreshTokenSchema],
      default: [],
      select: false, // Don't include refresh tokens in queries by default
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ supplierRef: 1 }, { sparse: true });

// Compound index for warehouse managers
UserSchema.index({ role: 1, assignedWarehouses: 1 });

/**
 * User model
 */
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;

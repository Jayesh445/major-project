"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Notification preferences subdocument schema
 */
const NotificationPreferencesSchema = new mongoose_1.Schema({
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
}, { _id: false });
/**
 * Refresh token subdocument schema
 */
const RefreshTokenSchema = new mongoose_1.Schema({
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
}, { _id: false });
/**
 * User schema definition
 */
const UserSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: function () {
            return this.role === 'supplier';
        },
    },
    assignedWarehouses: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
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
const User = mongoose_1.default.model('User', UserSchema);
exports.default = User;

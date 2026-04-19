"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSchema = exports.refreshTokenSchema = exports.getUsersQuerySchema = exports.getUserSchema = exports.updateUserSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
/**
 * Validation schema for user signup
 */
exports.signupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, 'Name must be at least 2 characters long')
            .max(100, 'Name cannot exceed 100 characters')
            .trim(),
        email: zod_1.z
            .string()
            .email('Please provide a valid email address')
            .toLowerCase()
            .trim(),
        password: zod_1.z
            .string()
            .min(6, 'Password must be at least 6 characters long')
            .max(128, 'Password cannot exceed 128 characters'),
        role: zod_1.z.enum(['admin', 'warehouse_manager', 'procurement_officer', 'supplier'], {
            message: 'Invalid role',
        }),
        supplierRef: zod_1.z.string().optional(),
        assignedWarehouses: zod_1.z.array(zod_1.z.string()).optional().default([]),
    }),
});
/**
 * Validation schema for user login
 */
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email('Please provide a valid email address')
            .toLowerCase()
            .trim(),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
/**
 * Validation schema for updating user profile
 */
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, 'Name must be at least 2 characters long')
            .max(100, 'Name cannot exceed 100 characters')
            .trim()
            .optional(),
        notificationPreferences: zod_1.z
            .object({
            email: zod_1.z.boolean().optional(),
            inApp: zod_1.z.boolean().optional(),
            lowStockAlerts: zod_1.z.boolean().optional(),
            poApprovals: zod_1.z.boolean().optional(),
            negotiationUpdates: zod_1.z.boolean().optional(),
        })
            .optional(),
    }),
});
/**
 * Validation schema for changing password
 */
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: zod_1.z
            .string()
            .min(6, 'New password must be at least 6 characters long')
            .max(128, 'New password cannot exceed 128 characters'),
    }),
});
/**
 * Validation schema for updating user by admin
 */
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'User ID is required'),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, 'Name must be at least 2 characters long')
            .max(100, 'Name cannot exceed 100 characters')
            .trim()
            .optional(),
        role: zod_1.z
            .enum(['admin', 'warehouse_manager', 'procurement_officer', 'supplier'])
            .optional(),
        isActive: zod_1.z.boolean().optional(),
        assignedWarehouses: zod_1.z.array(zod_1.z.string()).optional(),
        supplierRef: zod_1.z.string().optional(),
    }),
});
/**
 * Validation schema for getting user by ID
 */
exports.getUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
/**
 * Validation schema for user query params
 */
exports.getUsersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        role: zod_1.z
            .enum(['admin', 'warehouse_manager', 'procurement_officer', 'supplier'])
            .optional(),
        isActive: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        page: zod_1.z
            .string()
            .optional()
            .default('1')
            .transform((val) => parseInt(val, 10)),
        limit: zod_1.z
            .string()
            .optional()
            .default('10')
            .transform((val) => parseInt(val, 10)),
    }),
});
/**
 * Validation schema for refresh token
 */
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});
/**
 * Validation schema for logout
 */
exports.logoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});

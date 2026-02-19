import { z } from 'zod';

/**
 * Validation schema for user signup
 */
export const signupSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z
      .string()
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(128, 'Password cannot exceed 128 characters'),
    role: z.enum(['admin', 'warehouse_manager', 'procurement_officer', 'supplier'], {
      message: 'Invalid role',
    }),
    supplierRef: z.string().optional(),
    assignedWarehouses: z.array(z.string()).optional().default([]),
  }),
});

/**
 * Validation schema for user login
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * Validation schema for updating user profile
 */
export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    notificationPreferences: z
      .object({
        email: z.boolean().optional(),
        inApp: z.boolean().optional(),
        lowStockAlerts: z.boolean().optional(),
        poApprovals: z.boolean().optional(),
        negotiationUpdates: z.boolean().optional(),
      })
      .optional(),
  }),
});

/**
 * Validation schema for changing password
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters long')
      .max(128, 'New password cannot exceed 128 characters'),
  }),
});

/**
 * Validation schema for updating user by admin
 */
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    role: z
      .enum(['admin', 'warehouse_manager', 'procurement_officer', 'supplier'])
      .optional(),
    isActive: z.boolean().optional(),
    assignedWarehouses: z.array(z.string()).optional(),
    supplierRef: z.string().optional(),
  }),
});

/**
 * Validation schema for getting user by ID
 */
export const getUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

/**
 * Validation schema for user query params
 */
export const getUsersQuerySchema = z.object({
  query: z.object({
    role: z
      .enum(['admin', 'warehouse_manager', 'procurement_officer', 'supplier'])
      .optional(),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => parseInt(val, 10)),
    limit: z
      .string()
      .optional()
      .default('10')
      .transform((val) => parseInt(val, 10)),
  }),
});

/**
 * Validation schema for refresh token
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

/**
 * Validation schema for logout
 */
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

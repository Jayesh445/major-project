"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUploadProductSchema = exports.ProductIdSchema = exports.SearchProductsSchema = exports.QueryProductsSchema = exports.UpdateProductSchema = exports.CreateProductSchema = exports.ProductUnitEnum = exports.ProductCategoryEnum = void 0;
const zod_1 = require("zod");
/**
 * Product category enum
 */
exports.ProductCategoryEnum = zod_1.z.enum([
    'writing_instruments',
    'paper_products',
    'office_supplies',
    'art_supplies',
    'filing_storage',
    'desk_accessories',
    'other',
]);
/**
 * Product unit enum
 */
exports.ProductUnitEnum = zod_1.z.enum([
    'piece',
    'pack',
    'box',
    'ream',
    'set',
    'kg',
    'liter',
]);
/**
 * Create product DTO
 */
exports.CreateProductSchema = zod_1.z.object({
    sku: zod_1.z
        .string()
        .min(3, 'SKU must be at least 3 characters')
        .max(50, 'SKU cannot exceed 50 characters')
        .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens')
        .transform((val) => val.toUpperCase()),
    name: zod_1.z
        .string()
        .min(2, 'Product name must be at least 2 characters')
        .max(200, 'Product name cannot exceed 200 characters')
        .trim(),
    description: zod_1.z
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .trim()
        .optional(),
    category: exports.ProductCategoryEnum,
    unit: exports.ProductUnitEnum,
    unitPrice: zod_1.z
        .number()
        .min(0, 'Unit price cannot be negative')
        .positive('Unit price must be greater than 0'),
    reorderPoint: zod_1.z
        .number()
        .min(0, 'Reorder point cannot be negative')
        .int('Reorder point must be an integer'),
    safetyStock: zod_1.z
        .number()
        .min(0, 'Safety stock cannot be negative')
        .int('Safety stock must be an integer'),
    reorderQty: zod_1.z
        .number()
        .min(1, 'Reorder quantity must be at least 1')
        .int('Reorder quantity must be an integer'),
    leadTimeDays: zod_1.z
        .number()
        .min(0, 'Lead time cannot be negative')
        .int('Lead time must be an integer'),
    primarySupplier: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID')
        .optional(),
    alternateSuppliers: zod_1.z
        .array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'))
        .default([]),
    imageUrl: zod_1.z
        .string()
        .url('Image URL must be a valid URL')
        .optional(),
    isActive: zod_1.z.boolean().default(true),
});
/**
 * Update product DTO
 */
exports.UpdateProductSchema = exports.CreateProductSchema.partial();
/**
 * Query/Filter products DTO
 */
exports.QueryProductsSchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .default('1')
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().min(1)),
    limit: zod_1.z
        .string()
        .optional()
        .default('10')
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().min(1).max(100)),
    category: exports.ProductCategoryEnum.optional(),
    isActive: zod_1.z.preprocess((val) => {
        if (val === undefined)
            return undefined;
        if (val === 'true')
            return true;
        if (val === 'false')
            return false;
        return val;
    }, zod_1.z.boolean().optional()),
    primarySupplier: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID')
        .optional(),
    minPrice: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined))
        .pipe(zod_1.z.number().min(0).optional()),
    maxPrice: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined))
        .pipe(zod_1.z.number().min(0).optional()),
    sortBy: zod_1.z
        .enum(['name', 'sku', 'unitPrice', 'createdAt', 'updatedAt'])
        .optional()
        .default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
/**
 * Search products DTO
 */
exports.SearchProductsSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Search query is required').trim(),
    page: zod_1.z
        .string()
        .optional()
        .default('1')
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().min(1)),
    limit: zod_1.z
        .string()
        .optional()
        .default('10')
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().min(1).max(100)),
    category: exports.ProductCategoryEnum.optional(),
});
/**
 * Product ID param
 */
exports.ProductIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});
/**
 * Bulk upload product schema
 */
exports.BulkUploadProductSchema = zod_1.z.array(exports.CreateProductSchema).min(1).max(1000);

import { z } from 'zod';

/**
 * Product category enum
 */
export const ProductCategoryEnum = z.enum([
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
export const ProductUnitEnum = z.enum([
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
export const CreateProductSchema = z.object({
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU cannot exceed 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  category: ProductCategoryEnum,
  unit: ProductUnitEnum,
  unitPrice: z
    .number()
    .min(0, 'Unit price cannot be negative')
    .positive('Unit price must be greater than 0'),
  reorderPoint: z
    .number()
    .min(0, 'Reorder point cannot be negative')
    .int('Reorder point must be an integer'),
  safetyStock: z
    .number()
    .min(0, 'Safety stock cannot be negative')
    .int('Safety stock must be an integer'),
  reorderQty: z
    .number()
    .min(1, 'Reorder quantity must be at least 1')
    .int('Reorder quantity must be an integer'),
  leadTimeDays: z
    .number()
    .min(0, 'Lead time cannot be negative')
    .int('Lead time must be an integer'),
  primarySupplier: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID')
    .optional(),
  alternateSuppliers: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'))
    .default([]),
  imageUrl: z
    .string()
    .url('Image URL must be a valid URL')
    .optional(),
  isActive: z.boolean().default(true),
});

/**
 * Update product DTO
 */
export const UpdateProductSchema = CreateProductSchema.partial();

/**
 * Query/Filter products DTO
 */
export const QueryProductsSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  category: ProductCategoryEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  primarySupplier: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID')
    .optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  sortBy: z
    .enum(['name', 'sku', 'unitPrice', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Search products DTO
 */
export const SearchProductsSchema = z.object({
  query: z.string().min(1, 'Search query is required').trim(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  category: ProductCategoryEnum.optional(),
});

/**
 * Product ID param
 */
export const ProductIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});

/**
 * Bulk upload product schema
 */
export const BulkUploadProductSchema = z.array(CreateProductSchema).min(1).max(1000);

// Type exports
export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
export type QueryProductsDto = z.infer<typeof QueryProductsSchema>;
export type SearchProductsDto = z.infer<typeof SearchProductsSchema>;
export type ProductIdDto = z.infer<typeof ProductIdSchema>;
export type BulkUploadProductDto = z.infer<typeof BulkUploadProductSchema>;

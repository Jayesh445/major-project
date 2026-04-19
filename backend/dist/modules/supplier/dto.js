"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveSupplierSchema = exports.SupplierProductIdSchema = exports.SupplierIdSchema = exports.QuerySuppliersSchema = exports.UpdateContractTermsSchema = exports.UpdateCatalogProductSchema = exports.AddCatalogProductSchema = exports.UpdateSupplierSchema = exports.CreateSupplierSchema = exports.ContractTermsSchema = exports.CatalogProductSchema = void 0;
const zod_1 = require("zod");
/**
 * Catalog product schema
 */
exports.CatalogProductSchema = zod_1.z.object({
    product: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    unitPrice: zod_1.z.number().min(0, 'Unit price cannot be negative').positive('Unit price must be greater than 0'),
    leadTimeDays: zod_1.z.number().min(0, 'Lead time cannot be negative').int('Lead time must be an integer'),
    moq: zod_1.z.number().min(1, 'MOQ must be at least 1').int('MOQ must be an integer'),
});
/**
 * Contract terms schema
 */
exports.ContractTermsSchema = zod_1.z.object({
    paymentTermsDays: zod_1.z.number().min(0, 'Payment terms cannot be negative').int('Payment terms must be an integer'),
    deliveryTerms: zod_1.z.string().min(5, 'Delivery terms must be at least 5 characters').trim(),
    returnPolicy: zod_1.z.string().min(10, 'Return policy must be at least 10 characters').trim(),
    validUntil: zod_1.z.string().datetime().optional().or(zod_1.z.date().optional()),
});
/**
 * Create supplier DTO
 */
exports.CreateSupplierSchema = zod_1.z.object({
    companyName: zod_1.z
        .string()
        .min(2, 'Company name must be at least 2 characters')
        .max(200, 'Company name cannot exceed 200 characters')
        .trim(),
    contactEmail: zod_1.z
        .string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    contactPhone: zod_1.z
        .string()
        .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number format')
        .trim(),
    address: zod_1.z.string().min(10, 'Address must be at least 10 characters').trim(),
    catalogProducts: zod_1.z.array(exports.CatalogProductSchema).default([]),
    currentContractTerms: exports.ContractTermsSchema.optional(),
    rating: zod_1.z.number().min(0, 'Rating cannot be less than 0').max(5, 'Rating cannot exceed 5').default(0),
    isApproved: zod_1.z.boolean().default(false),
});
/**
 * Update supplier DTO
 */
exports.UpdateSupplierSchema = exports.CreateSupplierSchema.partial();
/**
 * Add catalog product DTO
 */
exports.AddCatalogProductSchema = exports.CatalogProductSchema;
/**
 * Update catalog product DTO
 */
exports.UpdateCatalogProductSchema = exports.CatalogProductSchema.partial().extend({
    product: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});
/**
 * Update contract terms DTO
 */
exports.UpdateContractTermsSchema = exports.ContractTermsSchema;
/**
 * Query suppliers DTO
 */
exports.QuerySuppliersSchema = zod_1.z.object({
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
    isApproved: zod_1.z
        .string()
        .optional()
        .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    minRating: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined))
        .pipe(zod_1.z.number().min(0).max(5).optional()),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z
        .enum(['companyName', 'rating', 'createdAt', 'updatedAt'])
        .optional()
        .default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
/**
 * Supplier ID param
 */
exports.SupplierIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
});
/**
 * Product ID param (for catalog operations)
 */
exports.SupplierProductIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
    productId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});
/**
 * Approve/Reject supplier DTO
 */
exports.ApproveSupplierSchema = zod_1.z.object({
    isApproved: zod_1.z.boolean(),
    notes: zod_1.z.string().optional(),
});

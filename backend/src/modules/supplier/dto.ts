import { z } from 'zod';

/**
 * Catalog product schema
 */
export const CatalogProductSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').positive('Unit price must be greater than 0'),
  leadTimeDays: z.number().min(0, 'Lead time cannot be negative').int('Lead time must be an integer'),
  moq: z.number().min(1, 'MOQ must be at least 1').int('MOQ must be an integer'),
});

/**
 * Contract terms schema
 */
export const ContractTermsSchema = z.object({
  paymentTermsDays: z.number().min(0, 'Payment terms cannot be negative').int('Payment terms must be an integer'),
  deliveryTerms: z.string().min(5, 'Delivery terms must be at least 5 characters').trim(),
  returnPolicy: z.string().min(10, 'Return policy must be at least 10 characters').trim(),
  validUntil: z.string().datetime().optional().or(z.date().optional()),
});

/**
 * Create supplier DTO
 */
export const CreateSupplierSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name cannot exceed 200 characters')
    .trim(),
  contactEmail: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  contactPhone: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
      'Invalid phone number format'
    )
    .trim(),
  address: z.string().min(10, 'Address must be at least 10 characters').trim(),
  catalogProducts: z.array(CatalogProductSchema).default([]),
  currentContractTerms: ContractTermsSchema.optional(),
  rating: z.number().min(0, 'Rating cannot be less than 0').max(5, 'Rating cannot exceed 5').default(0),
  isApproved: z.boolean().default(false),
});

/**
 * Update supplier DTO
 */
export const UpdateSupplierSchema = CreateSupplierSchema.partial();

/**
 * Add catalog product DTO
 */
export const AddCatalogProductSchema = CatalogProductSchema;

/**
 * Update catalog product DTO
 */
export const UpdateCatalogProductSchema = CatalogProductSchema.partial().extend({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});

/**
 * Update contract terms DTO
 */
export const UpdateContractTermsSchema = ContractTermsSchema;

/**
 * Query suppliers DTO
 */
export const QuerySuppliersSchema = z.object({
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
  isApproved: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  minRating: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).max(5).optional()),
  search: z.string().optional(),
  sortBy: z
    .enum(['companyName', 'rating', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Supplier ID param
 */
export const SupplierIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
});

/**
 * Product ID param (for catalog operations)
 */
export const SupplierProductIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});

/**
 * Approve/Reject supplier DTO
 */
export const ApproveSupplierSchema = z.object({
  isApproved: z.boolean(),
  notes: z.string().optional(),
});

// Type exports
export type CreateSupplierDto = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof UpdateSupplierSchema>;
export type AddCatalogProductDto = z.infer<typeof AddCatalogProductSchema>;
export type UpdateCatalogProductDto = z.infer<typeof UpdateCatalogProductSchema>;
export type UpdateContractTermsDto = z.infer<typeof UpdateContractTermsSchema>;
export type QuerySuppliersDto = z.infer<typeof QuerySuppliersSchema>;
export type SupplierIdDto = z.infer<typeof SupplierIdSchema>;
export type SupplierProductIdDto = z.infer<typeof SupplierProductIdSchema>;
export type ApproveSupplierDto = z.infer<typeof ApproveSupplierSchema>;

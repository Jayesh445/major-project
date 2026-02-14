import { z } from 'zod';

/**
 * Transaction type enum
 */
export const TransactionTypeEnum = z.enum([
  'purchase',
  'sale',
  'adjustment',
  'transfer_in',
  'transfer_out',
  'return',
  'damage',
  'reservation',
  'release_reservation',
]);

/**
 * Transaction schema
 */
export const TransactionSchema = z.object({
  type: TransactionTypeEnum,
  quantity: z.number().int('Quantity must be an integer'),
  referenceDoc: z.string().optional(),
  referenceModel: z.string().optional(),
  performedBy: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').trim().optional(),
});

/**
 * Initialize inventory DTO
 */
export const InitializeInventorySchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  currentStock: z.number().min(0, 'Current stock cannot be negative').int('Must be an integer').default(0),
  reservedStock: z.number().min(0, 'Reserved stock cannot be negative').int('Must be an integer').default(0),
  reorderPoint: z.number().min(0, 'Reorder point cannot be negative').int('Must be an integer'),
  safetyStock: z.number().min(0, 'Safety stock cannot be negative').int('Must be an integer'),
  zone: z.string().max(20).trim().toUpperCase().optional(),
});

/**
 * Adjust stock DTO
 */
export const AdjustStockSchema = z.object({
  quantity: z.number().int('Quantity must be an integer'),
  type: z.enum(['increase', 'decrease']),
  reason: z.string().min(5, 'Reason is required').max(500, 'Reason cannot exceed 500 characters').trim(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').trim().optional(),
});

/**
 * Reserve stock DTO
 */
export const ReserveStockSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1').int('Quantity must be an integer'),
  referenceDoc: z.string().optional(),
  referenceModel: z.string().optional(),
  notes: z.string().max(500).trim().optional(),
});

/**
 * Release stock reservation DTO
 */
export const ReleaseReservationSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1').int('Quantity must be an integer'),
  referenceDoc: z.string().optional(),
  notes: z.string().max(500).trim().optional(),
});

/**
 * Transfer stock DTO
 */
export const TransferStockSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  fromWarehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  toWarehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  quantity: z.number().min(1, 'Quantity must be at least 1').int('Quantity must be an integer'),
  reason: z.string().min(5, 'Reason is required').max(500).trim(),
  notes: z.string().max(500).trim().optional(),
}).refine((data) => data.fromWarehouse !== data.toWarehouse, {
  message: 'Source and destination warehouses must be different',
  path: ['toWarehouse'],
});

/**
 * Update reorder settings DTO
 */
export const UpdateReorderSettingsSchema = z.object({
  reorderPoint: z.number().min(0).int().optional(),
  safetyStock: z.number().min(0).int().optional(),
  zone: z.string().max(20).trim().toUpperCase().optional(),
});

/**
 * Query inventory DTO
 */
export const QueryInventorySchema = z.object({
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
  warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional(),
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID').optional(),
  lowStock: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  replenishmentTriggered: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  zone: z.string().optional(),
  sortBy: z
    .enum(['currentStock', 'availableStock', 'product', 'warehouse', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Inventory ID param
 */
export const InventoryIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inventory ID'),
});

/**
 * Trigger replenishment DTO
 */
export const TriggerReplenishmentSchema = z.object({
  autoCreatePO: z.boolean().default(false),
  notifyProcurement: z.boolean().default(true),
});

/**
 * Stock valuation query DTO
 */
export const StockValuationQuerySchema = z.object({
  warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional(),
  category: z.string().optional(),
});

// Type exports
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type TransactionDto = z.infer<typeof TransactionSchema>;
export type InitializeInventoryDto = z.infer<typeof InitializeInventorySchema>;
export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;
export type ReserveStockDto = z.infer<typeof ReserveStockSchema>;
export type ReleaseReservationDto = z.infer<typeof ReleaseReservationSchema>;
export type TransferStockDto = z.infer<typeof TransferStockSchema>;
export type UpdateReorderSettingsDto = z.infer<typeof UpdateReorderSettingsSchema>;
export type QueryInventoryDto = z.infer<typeof QueryInventorySchema>;
export type InventoryIdDto = z.infer<typeof InventoryIdSchema>;
export type TriggerReplenishmentDto = z.infer<typeof TriggerReplenishmentSchema>;
export type StockValuationQueryDto = z.infer<typeof StockValuationQuerySchema>;

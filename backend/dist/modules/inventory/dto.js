"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockValuationQuerySchema = exports.TriggerReplenishmentSchema = exports.InventoryIdSchema = exports.QueryInventorySchema = exports.UpdateReorderSettingsSchema = exports.TransferStockSchema = exports.ReleaseReservationSchema = exports.ReserveStockSchema = exports.AdjustStockSchema = exports.InitializeInventorySchema = exports.TransactionSchema = exports.TransactionTypeEnum = void 0;
const zod_1 = require("zod");
/**
 * Transaction type enum
 */
exports.TransactionTypeEnum = zod_1.z.enum([
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
exports.TransactionSchema = zod_1.z.object({
    type: exports.TransactionTypeEnum,
    quantity: zod_1.z.number().int('Quantity must be an integer'),
    referenceDoc: zod_1.z.string().optional(),
    referenceModel: zod_1.z.string().optional(),
    performedBy: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    notes: zod_1.z.string().max(500, 'Notes cannot exceed 500 characters').trim().optional(),
});
/**
 * Initialize inventory DTO
 */
exports.InitializeInventorySchema = zod_1.z.object({
    product: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    warehouse: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
    currentStock: zod_1.z.number().min(0, 'Current stock cannot be negative').int('Must be an integer').default(0),
    reservedStock: zod_1.z.number().min(0, 'Reserved stock cannot be negative').int('Must be an integer').default(0),
    reorderPoint: zod_1.z.number().min(0, 'Reorder point cannot be negative').int('Must be an integer'),
    safetyStock: zod_1.z.number().min(0, 'Safety stock cannot be negative').int('Must be an integer'),
    zone: zod_1.z.string().max(20).trim().toUpperCase().optional(),
});
/**
 * Adjust stock DTO
 */
exports.AdjustStockSchema = zod_1.z.object({
    quantity: zod_1.z.number().int('Quantity must be an integer'),
    type: zod_1.z.enum(['increase', 'decrease']),
    reason: zod_1.z.string().min(5, 'Reason is required').max(500, 'Reason cannot exceed 500 characters').trim(),
    notes: zod_1.z.string().max(500, 'Notes cannot exceed 500 characters').trim().optional(),
});
/**
 * Reserve stock DTO
 */
exports.ReserveStockSchema = zod_1.z.object({
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1').int('Quantity must be an integer'),
    referenceDoc: zod_1.z.string().optional(),
    referenceModel: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(500).trim().optional(),
});
/**
 * Release stock reservation DTO
 */
exports.ReleaseReservationSchema = zod_1.z.object({
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1').int('Quantity must be an integer'),
    referenceDoc: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(500).trim().optional(),
});
/**
 * Transfer stock DTO
 */
exports.TransferStockSchema = zod_1.z.object({
    product: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    fromWarehouse: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
    toWarehouse: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1').int('Quantity must be an integer'),
    reason: zod_1.z.string().min(5, 'Reason is required').max(500).trim(),
    notes: zod_1.z.string().max(500).trim().optional(),
}).refine((data) => data.fromWarehouse !== data.toWarehouse, {
    message: 'Source and destination warehouses must be different',
    path: ['toWarehouse'],
});
/**
 * Update reorder settings DTO
 */
exports.UpdateReorderSettingsSchema = zod_1.z.object({
    reorderPoint: zod_1.z.number().min(0).int().optional(),
    safetyStock: zod_1.z.number().min(0).int().optional(),
    zone: zod_1.z.string().max(20).trim().toUpperCase().optional(),
});
/**
 * Query inventory DTO
 */
exports.QueryInventorySchema = zod_1.z.object({
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
    warehouse: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional(),
    product: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID').optional(),
    lowStock: zod_1.z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    replenishmentTriggered: zod_1.z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    zone: zod_1.z.string().optional(),
    sortBy: zod_1.z
        .enum(['currentStock', 'availableStock', 'product', 'warehouse', 'createdAt'])
        .optional()
        .default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
/**
 * Inventory ID param
 */
exports.InventoryIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid inventory ID'),
});
/**
 * Trigger replenishment DTO
 */
exports.TriggerReplenishmentSchema = zod_1.z.object({
    autoCreatePO: zod_1.z.boolean().default(false),
    notifyProcurement: zod_1.z.boolean().default(true),
});
/**
 * Stock valuation query DTO
 */
exports.StockValuationQuerySchema = zod_1.z.object({
    warehouse: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional(),
    category: zod_1.z.string().optional(),
});

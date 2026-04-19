"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelPurchaseOrderSchema = exports.ApprovePurchaseOrderSchema = exports.PurchaseOrderIdSchema = exports.QueryPurchaseOrdersSchema = exports.ReceivePurchaseOrderSchema = exports.ReceiveLineItemSchema = exports.UpdatePurchaseOrderSchema = exports.CreatePurchaseOrderSchema = exports.LineItemSchema = exports.TriggeredByEnum = exports.POStatusEnum = void 0;
const zod_1 = require("zod");
/**
 * PO Status enum
 */
exports.POStatusEnum = zod_1.z.enum([
    'draft',
    'pending_approval',
    'approved',
    'sent_to_supplier',
    'acknowledged',
    'partially_received',
    'fully_received',
    'cancelled',
]);
/**
 * Triggered by enum
 */
exports.TriggeredByEnum = zod_1.z.enum([
    'auto_replenishment',
    'manual',
    'negotiation_agent',
]);
/**
 * Line item schema
 */
exports.LineItemSchema = zod_1.z.object({
    product: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    sku: zod_1.z.string().min(3).max(50).transform((val) => val.toUpperCase()),
    orderedQty: zod_1.z.number().min(1, 'Ordered quantity must be at least 1').int(),
    receivedQty: zod_1.z.number().min(0, 'Received quantity cannot be negative').int().default(0),
    unitPrice: zod_1.z.number().min(0, 'Unit price cannot be negative').positive(),
    totalPrice: zod_1.z.number().min(0, 'Total price cannot be negative'),
});
/**
 * Create purchase order DTO
 */
exports.CreatePurchaseOrderSchema = zod_1.z.object({
    supplier: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
    warehouse: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
    lineItems: zod_1.z
        .array(exports.LineItemSchema)
        .min(1, 'At least one line item is required')
        .max(100, 'Maximum 100 line items allowed'),
    currency: zod_1.z
        .string()
        .length(3, 'Currency must be 3-letter ISO code')
        .transform((val) => val.toUpperCase())
        .default('INR'),
    triggeredBy: exports.TriggeredByEnum.default('manual'),
    negotiationSession: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid negotiation session ID').optional(),
    expectedDeliveryDate: zod_1.z.string().datetime().optional().or(zod_1.z.date().optional()),
    notes: zod_1.z.string().max(1000, 'Notes cannot exceed 1000 characters').trim().optional(),
});
/**
 * Update purchase order DTO (for draft status only)
 */
exports.UpdatePurchaseOrderSchema = zod_1.z.object({
    lineItems: zod_1.z.array(exports.LineItemSchema).min(1).max(100).optional(),
    expectedDeliveryDate: zod_1.z.string().datetime().optional().or(zod_1.z.date().optional()),
    notes: zod_1.z.string().max(1000).trim().optional(),
});
/**
 * Receive line item DTO
 */
exports.ReceiveLineItemSchema = zod_1.z.object({
    lineItemId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid line item ID'),
    receivedQty: zod_1.z.number().min(1, 'Received quantity must be at least 1').int(),
    notes: zod_1.z.string().max(500).trim().optional(),
});
/**
 * Receive purchase order DTO (multiple line items)
 */
exports.ReceivePurchaseOrderSchema = zod_1.z.object({
    lineItems: zod_1.z
        .array(exports.ReceiveLineItemSchema)
        .min(1, 'At least one line item must be received'),
    receivedDate: zod_1.z.string().datetime().optional().or(zod_1.z.date().optional()),
    notes: zod_1.z.string().max(1000).trim().optional(),
});
/**
 * Query purchase orders DTO
 */
exports.QueryPurchaseOrdersSchema = zod_1.z.object({
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
    supplier: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID').optional(),
    warehouse: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional(),
    status: exports.POStatusEnum.optional(),
    triggeredBy: exports.TriggeredByEnum.optional(),
    fromDate: zod_1.z.string().datetime().optional(),
    toDate: zod_1.z.string().datetime().optional(),
    sortBy: zod_1.z
        .enum(['poNumber', 'totalAmount', 'status', 'createdAt', 'expectedDeliveryDate'])
        .optional()
        .default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
/**
 * Purchase order ID param
 */
exports.PurchaseOrderIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid purchase order ID'),
});
/**
 * Approve/Reject DTO
 */
exports.ApprovePurchaseOrderSchema = zod_1.z.object({
    notes: zod_1.z.string().max(500).trim().optional(),
});
/**
 * Cancel DTO
 */
exports.CancelPurchaseOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10, 'Cancellation reason is required').max(500).trim(),
});

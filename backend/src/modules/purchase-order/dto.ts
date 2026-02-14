import { z } from 'zod';

/**
 * PO Status enum
 */
export const POStatusEnum = z.enum([
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
export const TriggeredByEnum = z.enum([
  'auto_replenishment',
  'manual',
  'negotiation_agent',
]);

/**
 * Line item schema
 */
export const LineItemSchema = z.object({
  product: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  sku: z.string().min(3).max(50).toUpperCase(),
  orderedQty: z.number().min(1, 'Ordered quantity must be at least 1').int(),
  receivedQty: z.number().min(0, 'Received quantity cannot be negative').int().default(0),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').positive(),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
});

/**
 * Create purchase order DTO
 */
export const CreatePurchaseOrderSchema = z.object({
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID'),
  warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  lineItems: z
    .array(LineItemSchema)
    .min(1, 'At least one line item is required')
    .max(100, 'Maximum 100 line items allowed'),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('INR').toUpperCase(),
  triggeredBy: TriggeredByEnum.default('manual'),
  negotiationSession: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid negotiation session ID').optional(),
  expectedDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').trim().optional(),
});

/**
 * Update purchase order DTO (for draft status only)
 */
export const UpdatePurchaseOrderSchema = z.object({
  lineItems: z.array(LineItemSchema).min(1).max(100).optional(),
  expectedDeliveryDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().max(1000).trim().optional(),
});

/**
 * Receive line item DTO
 */
export const ReceiveLineItemSchema = z.object({
  lineItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid line item ID'),
  receivedQty: z.number().min(1, 'Received quantity must be at least 1').int(),
  notes: z.string().max(500).trim().optional(),
});

/**
 * Receive purchase order DTO (multiple line items)
 */
export const ReceivePurchaseOrderSchema = z.object({
  lineItems: z
    .array(ReceiveLineItemSchema)
    .min(1, 'At least one line item must be received'),
  receivedDate: z.string().datetime().optional().or(z.date().optional()),
  notes: z.string().max(1000).trim().optional(),
});

/**
 * Query purchase orders DTO
 */
export const QueryPurchaseOrdersSchema = z.object({
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
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid supplier ID').optional(),
  warehouse: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional(),
  status: POStatusEnum.optional(),
  triggeredBy: TriggeredByEnum.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  sortBy: z
    .enum(['poNumber', 'totalAmount', 'status', 'createdAt', 'expectedDeliveryDate'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Purchase order ID param
 */
export const PurchaseOrderIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid purchase order ID'),
});

/**
 * Approve/Reject DTO
 */
export const ApprovePurchaseOrderSchema = z.object({
  notes: z.string().max(500).trim().optional(),
});

/**
 * Cancel DTO
 */
export const CancelPurchaseOrderSchema = z.object({
  reason: z.string().min(10, 'Cancellation reason is required').max(500).trim(),
});

// Type exports
export type POStatus = z.infer<typeof POStatusEnum>;
export type TriggeredBy = z.infer<typeof TriggeredByEnum>;
export type LineItemDto = z.infer<typeof LineItemSchema>;
export type CreatePurchaseOrderDto = z.infer<typeof CreatePurchaseOrderSchema>;
export type UpdatePurchaseOrderDto = z.infer<typeof UpdatePurchaseOrderSchema>;
export type ReceiveLineItemDto = z.infer<typeof ReceiveLineItemSchema>;
export type ReceivePurchaseOrderDto = z.infer<typeof ReceivePurchaseOrderSchema>;
export type QueryPurchaseOrdersDto = z.infer<typeof QueryPurchaseOrdersSchema>;
export type PurchaseOrderIdDto = z.infer<typeof PurchaseOrderIdSchema>;
export type ApprovePurchaseOrderDto = z.infer<typeof ApprovePurchaseOrderSchema>;
export type CancelPurchaseOrderDto = z.infer<typeof CancelPurchaseOrderSchema>;

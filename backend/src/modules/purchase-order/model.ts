import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Purchase order status types
 */
export type POStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_supplier'
  | 'acknowledged'
  | 'partially_received'
  | 'fully_received'
  | 'cancelled';

/**
 * Trigger types for PO creation
 */
export type TriggeredBy = 'auto_replenishment' | 'manual' | 'negotiation_agent';

/**
 * Line item in purchase order
 */
export interface ILineItem {
  product: mongoose.Types.ObjectId;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Purchase order document interface
 */
export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplier: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  lineItems: ILineItem[];
  totalAmount: number;
  currency: string;
  status: POStatus;
  triggeredBy: TriggeredBy;
  triggeredAt: Date;
  blockchainTxHash?: string;
  blockchainLoggedAt?: Date;
  negotiationSession?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  expectedDeliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Line item subdocument schema
 */
const LineItemSchema = new Schema<ILineItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
    },
    orderedQty: {
      type: Number,
      required: [true, 'Ordered quantity is required'],
      min: [1, 'Ordered quantity must be at least 1'],
    },
    receivedQty: {
      type: Number,
      required: [true, 'Received quantity is required'],
      min: [0, 'Received quantity cannot be negative'],
      default: 0,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
  },
  { _id: true }
);

/**
 * Purchase order schema definition
 */
const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: [true, 'PO number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^PO-[A-Z0-9]{6,20}$/, 'PO number must follow format PO-XXXXXX'],
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse reference is required'],
    },
    lineItems: {
      type: [LineItemSchema],
      required: [true, 'At least one line item is required'],
      validate: {
        validator: function (items: ILineItem[]) {
          return items && items.length > 0;
        },
        message: 'Purchase order must have at least one line item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      default: 'INR',
      match: [/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: [
          'draft',
          'pending_approval',
          'approved',
          'sent_to_supplier',
          'acknowledged',
          'partially_received',
          'fully_received',
          'cancelled',
        ],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
    },
    triggeredBy: {
      type: String,
      required: [true, 'Triggered by is required'],
      enum: {
        values: ['auto_replenishment', 'manual', 'negotiation_agent'],
        message: '{VALUE} is not a valid trigger type',
      },
    },
    triggeredAt: {
      type: Date,
      required: [true, 'Triggered at timestamp is required'],
      default: Date.now,
    },
    blockchainTxHash: {
      type: String,
      trim: true,
      match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid blockchain transaction hash format'],
    },
    blockchainLoggedAt: {
      type: Date,
    },
    negotiationSession: {
      type: Schema.Types.ObjectId,
      ref: 'NegotiationSession',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PurchaseOrderSchema.index({ poNumber: 1 });
PurchaseOrderSchema.index({ supplier: 1, status: 1 });
PurchaseOrderSchema.index({ warehouse: 1, status: 1 });
PurchaseOrderSchema.index({ blockchainTxHash: 1 }, { sparse: true });
PurchaseOrderSchema.index({ status: 1 });
PurchaseOrderSchema.index({ triggeredBy: 1 });
PurchaseOrderSchema.index({ negotiationSession: 1 }, { sparse: true });

// Compound indexes for common queries
PurchaseOrderSchema.index({ supplier: 1, createdAt: -1 });
PurchaseOrderSchema.index({ warehouse: 1, createdAt: -1 });
PurchaseOrderSchema.index({ status: 1, createdAt: -1 });

/**
 * Purchase order model
 */
const PurchaseOrder: Model<IPurchaseOrder> = mongoose.model<IPurchaseOrder>(
  'PurchaseOrder',
  PurchaseOrderSchema
);

export default PurchaseOrder;

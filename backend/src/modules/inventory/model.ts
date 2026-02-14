import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Transaction types
 */
export type TransactionType =
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'
  | 'return'
  | 'damage'
  | 'reservation'
  | 'release_reservation';

/**
 * Inventory transaction record
 */
export interface ITransaction {
  type: TransactionType;
  quantity: number;
  referenceDoc?: string;
  referenceModel?: string;
  performedBy?: mongoose.Types.ObjectId;
  notes?: string;
  timestamp: Date;
}

/**
 * Inventory document interface
 */
export interface IInventory extends Document {
  product: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  safetyStock: number;
  replenishmentTriggered: boolean;
  lastReplenishmentAt?: Date;
  transactions: ITransaction[];
  zone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction subdocument schema
 */
const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: [
          'purchase',
          'sale',
          'adjustment',
          'transfer_in',
          'transfer_out',
          'return',
          'damage',
          'reservation',
          'release_reservation',
        ],
        message: '{VALUE} is not a valid transaction type',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
    },
    referenceDoc: {
      type: String,
      trim: true,
    },
    referenceModel: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: true }
);

/**
 * Inventory schema definition
 */
const InventorySchema = new Schema<IInventory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse reference is required'],
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock is required'],
      min: [0, 'Current stock cannot be negative'],
      default: 0,
    },
    reservedStock: {
      type: Number,
      required: [true, 'Reserved stock is required'],
      min: [0, 'Reserved stock cannot be negative'],
      default: 0,
    },
    availableStock: {
      type: Number,
      required: [true, 'Available stock is required'],
      min: [0, 'Available stock cannot be negative'],
      default: 0,
    },
    reorderPoint: {
      type: Number,
      required: [true, 'Reorder point is required'],
      min: [0, 'Reorder point cannot be negative'],
    },
    safetyStock: {
      type: Number,
      required: [true, 'Safety stock is required'],
      min: [0, 'Safety stock cannot be negative'],
    },
    replenishmentTriggered: {
      type: Boolean,
      default: false,
    },
    lastReplenishmentAt: {
      type: Date,
    },
    transactions: {
      type: [TransactionSchema],
      default: [],
    },
    zone: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Unique compound index ensuring one inventory record per product per warehouse
InventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
InventorySchema.index({ replenishmentTriggered: 1 });
InventorySchema.index({ warehouse: 1 });
InventorySchema.index({ product: 1 });

// Compound index for low stock queries
InventorySchema.index({ warehouse: 1, currentStock: 1, reorderPoint: 1 });

/**
 * Pre-save hook to auto-compute availableStock
 * availableStock = currentStock - reservedStock
 */
InventorySchema.pre<IInventory>('save', function (next) {
  // Auto-compute available stock
  this.availableStock = this.currentStock - this.reservedStock;

  // Ensure availableStock is not negative
  if (this.availableStock < 0) {
    this.availableStock = 0;
  }

  next();
});

/**
 * Pre-update hook to auto-compute availableStock on updates
 */
InventorySchema.pre<IInventory>('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update.$set) {
    const currentStock = update.$set.currentStock;
    const reservedStock = update.$set.reservedStock;

    // Only compute if both values are being updated or if we have enough info
    if (currentStock !== undefined && reservedStock !== undefined) {
      update.$set.availableStock = Math.max(0, currentStock - reservedStock);
    }
  }

  next();
});

/**
 * Inventory model
 */
const Inventory: Model<IInventory> = mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;

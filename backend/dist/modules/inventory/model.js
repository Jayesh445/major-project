"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Transaction subdocument schema
 */
const TransactionSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { _id: true });
/**
 * Inventory schema definition
 */
const InventorySchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product reference is required'],
    },
    warehouse: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
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
 *
 * Note: Pre-save hooks are commented out due to TypeScript compatibility issues.
 * The availableStock computation should be handled in the service layer.
 */
// InventorySchema.pre('save', function (next) {
//   this.availableStock = this.currentStock - this.reservedStock;
//   if (this.availableStock < 0) {
//     this.availableStock = 0;
//   }
//   next();
// });
// InventorySchema.pre('findOneAndUpdate', function (next) {
//   const update: any = this.getUpdate();
//   if (update?.$set) {
//     const currentStock = update.$set.currentStock;
//     const reservedStock = update.$set.reservedStock;
//     if (currentStock !== undefined && reservedStock !== undefined) {
//       update.$set.availableStock = Math.max(0, currentStock - reservedStock);
//     }
//   }
//   next();
// });
/**
 * Inventory model
 */
const Inventory = mongoose_1.default.model('Inventory', InventorySchema);
exports.default = Inventory;

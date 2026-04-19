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
 * Product schema definition
 */
const ProductSchema = new mongoose_1.Schema({
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9-]{3,50}$/, 'SKU must be 3-50 alphanumeric characters or hyphens'],
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [2, 'Product name must be at least 2 characters long'],
        maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: [
                'writing_instruments',
                'paper_products',
                'office_supplies',
                'art_supplies',
                'filing_storage',
                'desk_accessories',
                'other',
            ],
            message: '{VALUE} is not a valid category',
        },
    },
    unit: {
        type: String,
        required: [true, 'Unit of measurement is required'],
        enum: {
            values: ['piece', 'pack', 'box', 'ream', 'set', 'kg', 'liter'],
            message: '{VALUE} is not a valid unit',
        },
    },
    unitPrice: {
        type: Number,
        required: [true, 'Unit price is required'],
        min: [0, 'Unit price cannot be negative'],
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
    reorderQty: {
        type: Number,
        required: [true, 'Reorder quantity is required'],
        min: [1, 'Reorder quantity must be at least 1'],
    },
    leadTimeDays: {
        type: Number,
        required: [true, 'Lead time is required'],
        min: [0, 'Lead time cannot be negative'],
    },
    primarySupplier: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    alternateSuppliers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Supplier',
        },
    ],
    imageUrl: {
        type: String,
        trim: true,
        match: [
            /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/[\w.-]*)*\/?$/i,
            'Please provide a valid URL',
        ],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// Indexes
ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ primarySupplier: 1 }, { sparse: true });
ProductSchema.index({ isActive: 1 });
// Compound indexes
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ primarySupplier: 1, isActive: 1 });
// Text index for search functionality
ProductSchema.index({ name: 'text', description: 'text' });
/**
 * Product model
 */
const Product = mongoose_1.default.model('Product', ProductSchema);
exports.default = Product;

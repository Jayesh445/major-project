import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Product category types
 */
export type ProductCategory =
  | 'writing_instruments'
  | 'paper_products'
  | 'office_supplies'
  | 'art_supplies'
  | 'filing_storage'
  | 'desk_accessories'
  | 'other';

/**
 * Unit of measurement
 */
export type ProductUnit = 'piece' | 'pack' | 'box' | 'ream' | 'set' | 'kg' | 'liter';

/**
 * Product document interface
 */
export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  unit: ProductUnit;
  unitPrice: number;
  reorderPoint: number;
  safetyStock: number;
  reorderQty: number;
  leadTimeDays: number;
  primarySupplier?: mongoose.Types.ObjectId;
  alternateSuppliers: mongoose.Types.ObjectId[];
  imageUrl?: string;
  isActive: boolean;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product schema definition
 */
const ProductSchema = new Schema<IProduct>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    alternateSuppliers: [
      {
        type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

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
const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

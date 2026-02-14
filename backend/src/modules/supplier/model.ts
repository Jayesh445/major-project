import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Catalog product in supplier's catalog
 */
export interface ICatalogProduct {
  product: mongoose.Types.ObjectId;
  unitPrice: number;
  leadTimeDays: number;
  moq: number; // Minimum Order Quantity
}

/**
 * Contract terms
 */
export interface IContractTerms {
  paymentTermsDays: number;
  deliveryTerms: string;
  returnPolicy: string;
  validUntil?: Date;
}

/**
 * Negotiation statistics
 */
export interface INegotiationStats {
  totalNegotiations: number;
  acceptedOffers: number;
  averageSavingsPercent: number;
}

/**
 * Supplier document interface
 */
export interface ISupplier extends Document {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  catalogProducts: ICatalogProduct[];
  currentContractTerms?: IContractTerms;
  rating: number;
  isApproved: boolean;
  negotiationStats: INegotiationStats;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Catalog product subdocument schema
 */
const CatalogProductSchema = new Schema<ICatalogProduct>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    leadTimeDays: {
      type: Number,
      required: [true, 'Lead time is required'],
      min: [0, 'Lead time cannot be negative'],
    },
    moq: {
      type: Number,
      required: [true, 'Minimum order quantity (MOQ) is required'],
      min: [1, 'MOQ must be at least 1'],
    },
  },
  { _id: true }
);

/**
 * Contract terms subdocument schema
 */
const ContractTermsSchema = new Schema<IContractTerms>(
  {
    paymentTermsDays: {
      type: Number,
      required: [true, 'Payment terms are required'],
      min: [0, 'Payment terms cannot be negative'],
    },
    deliveryTerms: {
      type: String,
      required: [true, 'Delivery terms are required'],
      trim: true,
    },
    returnPolicy: {
      type: String,
      required: [true, 'Return policy is required'],
      trim: true,
    },
    validUntil: {
      type: Date,
    },
  },
  { _id: false }
);

/**
 * Negotiation statistics subdocument schema
 */
const NegotiationStatsSchema = new Schema<INegotiationStats>(
  {
    totalNegotiations: {
      type: Number,
      default: 0,
      min: [0, 'Total negotiations cannot be negative'],
    },
    acceptedOffers: {
      type: Number,
      default: 0,
      min: [0, 'Accepted offers cannot be negative'],
    },
    averageSavingsPercent: {
      type: Number,
      default: 0,
      min: [0, 'Average savings cannot be negative'],
      max: [100, 'Average savings cannot exceed 100%'],
    },
  },
  { _id: false }
);

/**
 * Supplier schema definition
 */
const SupplierSchema = new Schema<ISupplier>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters long'],
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
        'Please provide a valid phone number',
      ],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    catalogProducts: {
      type: [CatalogProductSchema],
      default: [],
    },
    currentContractTerms: {
      type: ContractTermsSchema,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    negotiationStats: {
      type: NegotiationStatsSchema,
      default: () => ({
        totalNegotiations: 0,
        acceptedOffers: 0,
        averageSavingsPercent: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SupplierSchema.index({ companyName: 1 });
SupplierSchema.index({ contactEmail: 1 });
SupplierSchema.index({ isApproved: 1 });
SupplierSchema.index({ rating: -1 }); // Descending order for highest ratings first

// Compound index for catalog products
SupplierSchema.index({ 'catalogProducts.product': 1 });

/**
 * Supplier model
 */
const Supplier: Model<ISupplier> = mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;

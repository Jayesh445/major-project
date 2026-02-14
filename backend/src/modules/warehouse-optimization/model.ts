import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Recommendation status types
 */
export type RecommendationStatus = 'pending' | 'accepted' | 'partially_accepted' | 'rejected';

/**
 * Transfer recommendation details
 */
export interface ITransferRecommendation {
  product: mongoose.Types.ObjectId;
  fromWarehouse: mongoose.Types.ObjectId;
  toWarehouse: mongoose.Types.ObjectId;
  quantity: number;
  reason: string;
  estimatedCostSaving?: number;
}

/**
 * Warehouse optimization recommendation document interface
 */
export interface IWarehouseOptimizationRecommendation extends Document {
  generatedAt: Date;
  generationDurationSeconds: number;
  warehousesAnalysed: mongoose.Types.ObjectId[];
  transferRecommendations: ITransferRecommendation[];
  reallocationSummary: string;
  predictedLogisticsCostReductionPercent?: number;
  predictedCapacityUtilizationImprovement?: number;
  status: RecommendationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  langGraphRunId?: string;
  agentVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transfer recommendation subdocument schema
 */
const TransferRecommendationSchema = new Schema<ITransferRecommendation>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    fromWarehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'From warehouse is required'],
    },
    toWarehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'To warehouse is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    estimatedCostSaving: {
      type: Number,
      min: [0, 'Estimated cost saving cannot be negative'],
    },
  },
  { _id: true }
);

/**
 * Warehouse optimization recommendation schema definition
 */
const WarehouseOptimizationRecommendationSchema = new Schema<IWarehouseOptimizationRecommendation>(
  {
    generatedAt: {
      type: Date,
      required: [true, 'Generated at timestamp is required'],
      default: Date.now,
    },
    generationDurationSeconds: {
      type: Number,
      required: [true, 'Generation duration is required'],
      min: [0, 'Generation duration cannot be negative'],
      max: [300, 'Generation duration must be less than 300 seconds (5 minutes)'],
    },
    warehousesAnalysed: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    ],
    transferRecommendations: {
      type: [TransferRecommendationSchema],
      default: [],
    },
    reallocationSummary: {
      type: String,
      required: [true, 'Reallocation summary is required'],
      trim: true,
      maxlength: [5000, 'Reallocation summary cannot exceed 5000 characters'],
    },
    predictedLogisticsCostReductionPercent: {
      type: Number,
      min: [0, 'Cost reduction cannot be negative'],
      max: [100, 'Cost reduction cannot exceed 100%'],
    },
    predictedCapacityUtilizationImprovement: {
      type: Number,
      min: [0, 'Capacity improvement cannot be negative'],
      max: [100, 'Capacity improvement cannot exceed 100%'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'accepted', 'partially_accepted', 'rejected'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review notes cannot exceed 2000 characters'],
    },
    langGraphRunId: {
      type: String,
      trim: true,
    },
    agentVersion: {
      type: String,
      trim: true,
      default: 'v1.0',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WarehouseOptimizationRecommendationSchema.index({ generatedAt: -1 });
WarehouseOptimizationRecommendationSchema.index({ status: 1 });
WarehouseOptimizationRecommendationSchema.index({ langGraphRunId: 1 }, { sparse: true });

// Compound indexes
WarehouseOptimizationRecommendationSchema.index({ status: 1, generatedAt: -1 });
WarehouseOptimizationRecommendationSchema.index({ reviewedBy: 1, reviewedAt: -1 }, { sparse: true });

// Index for performance tracking
WarehouseOptimizationRecommendationSchema.index({ generationDurationSeconds: 1 });

// Index for warehouses analysed
WarehouseOptimizationRecommendationSchema.index({ warehousesAnalysed: 1 });

/**
 * Warehouse optimization recommendation model
 */
const WarehouseOptimizationRecommendation: Model<IWarehouseOptimizationRecommendation> =
  mongoose.model<IWarehouseOptimizationRecommendation>(
    'WarehouseOptimizationRecommendation',
    WarehouseOptimizationRecommendationSchema
  );

export default WarehouseOptimizationRecommendation;

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Persistent record of a Smart Reorder Agent recommendation.
 * Each entry represents one product at one warehouse that the AI has flagged
 * as needing reordering. Admins/Procurement Officers can act on these by
 * triggering a negotiation (which produces a Purchase Order) or rejecting them.
 */
export type ReorderStatus = 'pending' | 'in_negotiation' | 'ordered' | 'rejected' | 'expired';
export type ReorderUrgency = 'critical' | 'high' | 'medium' | 'low';

export interface IReorderRecommendation extends Document {
  product: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  currentStock: number;
  availableStock: number;
  reorderPoint: number;
  safetyStock: number;
  avgDailyDemand: number;
  daysUntilStockout: number;
  pendingIncoming: number;
  recommendedQty: number;
  eoq: number;
  estimatedUnitPrice: number;
  estimatedTotalCost: number;
  urgency: ReorderUrgency;
  reason: string;
  supplierCount: number;
  minSupplierPrice: number;
  avgSupplierLeadTime: number;
  status: ReorderStatus;
  generatedByRunId?: mongoose.Types.ObjectId;
  actedOnBy?: mongoose.Types.ObjectId;
  actedOnAt?: Date;
  negotiationSessionId?: mongoose.Types.ObjectId;
  purchaseOrderId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReorderRecommendationSchema = new Schema<IReorderRecommendation>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    currentStock: { type: Number, required: true },
    availableStock: { type: Number, required: true },
    reorderPoint: { type: Number, required: true },
    safetyStock: { type: Number, required: true },
    avgDailyDemand: { type: Number, required: true },
    daysUntilStockout: { type: Number, required: true },
    pendingIncoming: { type: Number, default: 0 },
    recommendedQty: { type: Number, required: true },
    eoq: { type: Number, required: true },
    estimatedUnitPrice: { type: Number, required: true },
    estimatedTotalCost: { type: Number, required: true },
    urgency: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
      index: true,
    },
    reason: { type: String, required: true },
    supplierCount: { type: Number, default: 0 },
    minSupplierPrice: { type: Number, default: 0 },
    avgSupplierLeadTime: { type: Number, default: 7 },
    status: {
      type: String,
      enum: ['pending', 'in_negotiation', 'ordered', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    generatedByRunId: { type: Schema.Types.ObjectId, ref: 'AgentRun' },
    actedOnBy: { type: Schema.Types.ObjectId, ref: 'User' },
    actedOnAt: { type: Date },
    negotiationSessionId: { type: Schema.Types.ObjectId, ref: 'NegotiationSession' },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    notes: { type: String },
  },
  { timestamps: true }
);

// Compound index: most recent pending recommendations per product-warehouse
ReorderRecommendationSchema.index({ product: 1, warehouse: 1, status: 1, createdAt: -1 });

const ReorderRecommendation: Model<IReorderRecommendation> = mongoose.model<IReorderRecommendation>(
  'ReorderRecommendation',
  ReorderRecommendationSchema
);

export default ReorderRecommendation;

import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Negotiation initiation types
 */
export type InitiatedBy = 'auto_replenishment' | 'procurement_officer';

/**
 * Negotiation status types
 */
export type NegotiationStatus = 'in_progress' | 'accepted' | 'rejected' | 'escalated' | 'timed_out';

/**
 * Negotiation round status
 */
export type RoundStatus = 'pending' | 'accepted' | 'countered' | 'rejected';

/**
 * Negotiation round details
 */
export interface INegotiationRound {
  roundNumber: number;
  agentOffer?: {
    unitPrice?: number;
    leadTimeDays?: number;
    paymentTermsDays?: number;
    quantity?: number;
  };
  supplierCounterOffer?: {
    unitPrice?: number;
    leadTimeDays?: number;
    paymentTermsDays?: number;
    quantity?: number;
  };
  agentReasoning?: string;
  status: RoundStatus;
  timestamp: Date;
}

/**
 * Agent constraints for negotiation
 */
export interface IAgentConstraints {
  maxUnitPrice: number;
  targetUnitPrice: number;
  maxLeadTimeDays: number;
  requiredQty: number;
}

/**
 * Final negotiated terms
 */
export interface IFinalTerms {
  unitPrice: number;
  leadTimeDays: number;
  paymentTermsDays: number;
  moq: number;
  savingsPercent: number;
}

/**
 * Negotiation session document interface
 */
export interface INegotiationSession extends Document {
  supplier: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  initiatedBy: InitiatedBy;
  initiatedByUser?: mongoose.Types.ObjectId;
  status: NegotiationStatus;
  rounds: INegotiationRound[];
  agentConstraints: IAgentConstraints;
  finalTerms?: IFinalTerms;
  deadline: Date;
  completedAt?: Date;
  langGraphRunId?: string;
  langGraphState?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent offer/counter-offer subdocument schema
 */
const OfferSchema = new Schema(
  {
    unitPrice: {
      type: Number,
      min: [0, 'Unit price cannot be negative'],
    },
    leadTimeDays: {
      type: Number,
      min: [0, 'Lead time cannot be negative'],
    },
    paymentTermsDays: {
      type: Number,
      min: [0, 'Payment terms cannot be negative'],
    },
    quantity: {
      type: Number,
      min: [1, 'Quantity must be at least 1'],
    },
  },
  { _id: false }
);

/**
 * Negotiation round subdocument schema
 */
const NegotiationRoundSchema = new Schema<INegotiationRound>(
  {
    roundNumber: {
      type: Number,
      required: [true, 'Round number is required'],
      min: [1, 'Round number must be at least 1'],
    },
    agentOffer: {
      type: OfferSchema,
    },
    supplierCounterOffer: {
      type: OfferSchema,
    },
    agentReasoning: {
      type: String,
      trim: true,
      maxlength: [2000, 'Agent reasoning cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      required: [true, 'Round status is required'],
      enum: {
        values: ['pending', 'accepted', 'countered', 'rejected'],
        message: '{VALUE} is not a valid round status',
      },
      default: 'pending',
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
    },
  },
  { _id: true }
);

/**
 * Agent constraints subdocument schema
 */
const AgentConstraintsSchema = new Schema<IAgentConstraints>(
  {
    maxUnitPrice: {
      type: Number,
      required: [true, 'Max unit price is required'],
      min: [0, 'Max unit price cannot be negative'],
    },
    targetUnitPrice: {
      type: Number,
      required: [true, 'Target unit price is required'],
      min: [0, 'Target unit price cannot be negative'],
    },
    maxLeadTimeDays: {
      type: Number,
      required: [true, 'Max lead time is required'],
      min: [0, 'Max lead time cannot be negative'],
    },
    requiredQty: {
      type: Number,
      required: [true, 'Required quantity is required'],
      min: [1, 'Required quantity must be at least 1'],
    },
  },
  { _id: false }
);

/**
 * Final terms subdocument schema
 */
const FinalTermsSchema = new Schema<IFinalTerms>(
  {
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
    paymentTermsDays: {
      type: Number,
      required: [true, 'Payment terms are required'],
      min: [0, 'Payment terms cannot be negative'],
    },
    moq: {
      type: Number,
      required: [true, 'MOQ is required'],
      min: [1, 'MOQ must be at least 1'],
    },
    savingsPercent: {
      type: Number,
      required: [true, 'Savings percent is required'],
      min: [0, 'Savings cannot be negative'],
      max: [100, 'Savings cannot exceed 100%'],
    },
  },
  { _id: false }
);

/**
 * Negotiation session schema definition
 */
const NegotiationSessionSchema = new Schema<INegotiationSession>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    initiatedBy: {
      type: String,
      required: [true, 'Initiated by is required'],
      enum: {
        values: ['auto_replenishment', 'procurement_officer'],
        message: '{VALUE} is not a valid initiation type',
      },
    },
    initiatedByUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['in_progress', 'accepted', 'rejected', 'escalated', 'timed_out'],
        message: '{VALUE} is not a valid status',
      },
      default: 'in_progress',
    },
    rounds: {
      type: [NegotiationRoundSchema],
      default: [],
    },
    agentConstraints: {
      type: AgentConstraintsSchema,
      required: [true, 'Agent constraints are required'],
    },
    finalTerms: {
      type: FinalTermsSchema,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
      default: function () {
        // Default deadline: 24 hours from creation
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      },
    },
    completedAt: {
      type: Date,
    },
    langGraphRunId: {
      type: String,
      trim: true,
    },
    langGraphState: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NegotiationSessionSchema.index({ supplier: 1, status: 1 });
NegotiationSessionSchema.index({ product: 1 });
NegotiationSessionSchema.index({ deadline: 1 });
NegotiationSessionSchema.index({ status: 1 });
NegotiationSessionSchema.index({ langGraphRunId: 1 }, { sparse: true });

// Compound indexes
NegotiationSessionSchema.index({ supplier: 1, product: 1, createdAt: -1 });
NegotiationSessionSchema.index({ status: 1, deadline: 1 });

/**
 * Negotiation session model
 */
const NegotiationSession: Model<INegotiationSession> = mongoose.model<INegotiationSession>(
  'NegotiationSession',
  NegotiationSessionSchema
);

export default NegotiationSession;

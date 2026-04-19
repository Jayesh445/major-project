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
 * Agent offer/counter-offer subdocument schema
 */
const OfferSchema = new mongoose_1.Schema({
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
}, { _id: false });
/**
 * Negotiation round subdocument schema
 */
const NegotiationRoundSchema = new mongoose_1.Schema({
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
}, { _id: true });
/**
 * Agent constraints subdocument schema
 */
const AgentConstraintsSchema = new mongoose_1.Schema({
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
}, { _id: false });
/**
 * Final terms subdocument schema
 */
const FinalTermsSchema = new mongoose_1.Schema({
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
}, { _id: false });
/**
 * Negotiation session schema definition
 */
const NegotiationSessionSchema = new mongoose_1.Schema({
    supplier: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Supplier reference is required'],
    },
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});
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
const NegotiationSession = mongoose_1.default.model('NegotiationSession', NegotiationSessionSchema);
exports.default = NegotiationSession;

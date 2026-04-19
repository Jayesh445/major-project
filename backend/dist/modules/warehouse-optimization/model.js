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
 * Transfer recommendation subdocument schema
 */
const TransferRecommendationSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product reference is required'],
    },
    fromWarehouse: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: [true, 'From warehouse is required'],
    },
    toWarehouse: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { _id: true });
/**
 * Warehouse optimization recommendation schema definition
 */
const WarehouseOptimizationRecommendationSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
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
const WarehouseOptimizationRecommendation = mongoose_1.default.model('WarehouseOptimizationRecommendation', WarehouseOptimizationRecommendationSchema);
exports.default = WarehouseOptimizationRecommendation;

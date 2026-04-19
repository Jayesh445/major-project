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
const ReorderRecommendationSchema = new mongoose_1.Schema({
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouse: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
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
    generatedByRunId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AgentRun' },
    actedOnBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    actedOnAt: { type: Date },
    negotiationSessionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'NegotiationSession' },
    purchaseOrderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    notes: { type: String },
}, { timestamps: true });
// Compound index: most recent pending recommendations per product-warehouse
ReorderRecommendationSchema.index({ product: 1, warehouse: 1, status: 1, createdAt: -1 });
const ReorderRecommendation = mongoose_1.default.model('ReorderRecommendation', ReorderRecommendationSchema);
exports.default = ReorderRecommendation;

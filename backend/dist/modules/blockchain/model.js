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
 * Blockchain log schema definition
 */
const BlockchainLogSchema = new mongoose_1.Schema({
    eventType: {
        type: String,
        required: [true, 'Event type is required'],
        enum: {
            values: [
                'po_created',
                'po_submitted_for_approval',
                'po_approved',
                'po_sent',
                'po_sent_to_supplier',
                'po_received',
                'po_acknowledged',
                'goods_received',
                'po_cancelled',
                'negotiation_accepted',
                'negotiation_rejected',
                'inventory_adjustment',
                'smart_contract_executed',
            ],
            message: '{VALUE} is not a valid event type',
        },
    },
    referenceModel: {
        type: String,
        required: [true, 'Reference model is required'],
        enum: {
            values: ['PurchaseOrder', 'NegotiationSession', 'Inventory'],
            message: '{VALUE} is not a valid reference model',
        },
    },
    referenceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Reference ID is required'],
        refPath: 'referenceModel',
    },
    payload: {
        type: mongoose_1.Schema.Types.Mixed,
        required: [true, 'Payload is required'],
    },
    txHash: {
        type: String,
        required: [true, 'Transaction hash is required'],
        unique: true,
        trim: true,
        match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'],
    },
    blockNumber: {
        type: Number,
        min: [0, 'Block number cannot be negative'],
    },
    blockHash: {
        type: String,
        trim: true,
        match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid block hash format'],
    },
    networkName: {
        type: String,
        required: [true, 'Network name is required'],
        trim: true,
        default: 'ethereum-testnet',
    },
    confirmedAt: {
        type: Date,
    },
    confirmationStatus: {
        type: String,
        required: [true, 'Confirmation status is required'],
        enum: {
            values: ['pending', 'confirmed', 'failed'],
            message: '{VALUE} is not a valid confirmation status',
        },
        default: 'pending',
    },
    triggeredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// Indexes
BlockchainLogSchema.index({ txHash: 1 });
BlockchainLogSchema.index({ eventType: 1 });
BlockchainLogSchema.index({ referenceId: 1 });
BlockchainLogSchema.index({ confirmationStatus: 1 });
BlockchainLogSchema.index({ networkName: 1 });
BlockchainLogSchema.index({ blockHash: 1 }, { sparse: true });
// Compound indexes
BlockchainLogSchema.index({ referenceModel: 1, referenceId: 1 });
BlockchainLogSchema.index({ eventType: 1, createdAt: -1 });
BlockchainLogSchema.index({ confirmationStatus: 1, createdAt: -1 });
// Index for finding logs by block number
BlockchainLogSchema.index({ blockNumber: 1 }, { sparse: true });
/**
 * Blockchain log model
 */
const BlockchainLog = mongoose_1.default.model('BlockchainLog', BlockchainLogSchema);
exports.default = BlockchainLog;

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
 * Notification schema definition
 */
const NotificationSchema = new mongoose_1.Schema({
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
    },
    type: {
        type: String,
        required: [true, 'Notification type is required'],
        enum: {
            values: [
                'low_stock_alert',
                'reorder_triggered',
                'po_created',
                'po_approved',
                'po_received',
                'negotiation_started',
                'negotiation_completed',
                'negotiation_requires_action',
                'forecast_ready',
                'warehouse_capacity_alert',
                'blockchain_confirmed',
                'system_alert',
            ],
            message: '{VALUE} is not a valid notification type',
        },
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    relatedModel: {
        type: String,
        enum: {
            values: [
                'PurchaseOrder',
                'NegotiationSession',
                'Inventory',
                'DemandForecast',
                'Warehouse',
                'Product',
            ],
            message: '{VALUE} is not a valid related model',
        },
    },
    relatedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        refPath: 'relatedModel',
    },
    channel: {
        type: String,
        required: [true, 'Channel is required'],
        enum: {
            values: ['in_app', 'email', 'both'],
            message: '{VALUE} is not a valid channel',
        },
        default: 'both',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
    emailSent: {
        type: Boolean,
        default: false,
    },
    emailSentAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ isRead: 1 });
// Compound indexes
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Index for email sending jobs
NotificationSchema.index({ emailSent: 1, channel: 1 });
// Index for related documents
NotificationSchema.index({ relatedModel: 1, relatedId: 1 }, { sparse: true });
/**
 * Pre-save hook to set readAt timestamp
 *
 * Note: Pre-save hooks are commented out due to TypeScript compatibility issues.
 * Timestamp updates should be handled in the service layer.
 */
// NotificationSchema.pre('save', function (next) {
//   if (this.isModified('isRead') && this.isRead && !this.readAt) {
//     this.readAt = new Date();
//   }
//   next();
// });
/**
 * Pre-save hook to set emailSentAt timestamp
 */
// NotificationSchema.pre('save', function (next) {
//   if (this.isModified('emailSent') && this.emailSent && !this.emailSentAt) {
//     this.emailSentAt = new Date();
//   }
//   next();
// });
/**
 * Notification model
 */
const Notification = mongoose_1.default.model('Notification', NotificationSchema);
exports.default = Notification;

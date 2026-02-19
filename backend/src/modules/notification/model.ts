import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Notification types
 */
export type NotificationType =
  | 'low_stock_alert'
  | 'reorder_triggered'
  | 'po_created'
  | 'po_approved'
  | 'po_received'
  | 'negotiation_started'
  | 'negotiation_completed'
  | 'negotiation_requires_action'
  | 'forecast_ready'
  | 'warehouse_capacity_alert'
  | 'blockchain_confirmed'
  | 'system_alert';

/**
 * Related model types for polymorphic references
 */
export type RelatedModel =
  | 'PurchaseOrder'
  | 'NegotiationSession'
  | 'Inventory'
  | 'DemandForecast'
  | 'Warehouse'
  | 'Product';

/**
 * Notification channel types
 */
export type NotificationChannel = 'in_app' | 'email' | 'both';

/**
 * Notification document interface
 */
export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedModel?: RelatedModel;
  relatedId?: mongoose.Types.ObjectId;
  channel: NotificationChannel;
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification schema definition
 */
const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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
const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

export default Notification;

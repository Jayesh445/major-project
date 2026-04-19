import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Blockchain event types
 */
export type EventType =
  | 'po_created'
  | 'po_submitted_for_approval'
  | 'po_approved'
  | 'po_sent'
  | 'po_sent_to_supplier'
  | 'po_received'
  | 'po_acknowledged'
  | 'goods_received'
  | 'po_cancelled'
  | 'negotiation_accepted'
  | 'negotiation_rejected'
  | 'inventory_adjustment'
  | 'smart_contract_executed';

/**
 * Reference model types for polymorphic references
 */
export type ReferenceModel = 'PurchaseOrder' | 'NegotiationSession' | 'Inventory';

/**
 * Confirmation status types
 */
export type ConfirmationStatus = 'pending' | 'confirmed' | 'failed';

/**
 * Blockchain log document interface
 */
export interface IBlockchainLog extends Document {
  eventType: EventType;
  referenceModel: ReferenceModel;
  referenceId: mongoose.Types.ObjectId;
  payload: any;
  txHash: string;
  blockNumber?: number;
  blockHash?: string; // Hash of the block containing this transaction
  networkName: string;
  confirmedAt?: Date;
  confirmationStatus: ConfirmationStatus;
  triggeredBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Blockchain log schema definition
 */
const BlockchainLogSchema = new Schema<IBlockchainLog>(
  {
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
      type: Schema.Types.ObjectId,
      required: [true, 'Reference ID is required'],
      refPath: 'referenceModel',
    },
    payload: {
      type: Schema.Types.Mixed,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

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
const BlockchainLog: Model<IBlockchainLog> = mongoose.model<IBlockchainLog>(
  'BlockchainLog',
  BlockchainLogSchema
);

export default BlockchainLog;

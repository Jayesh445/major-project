/**
 * Backfill blockchain data from BlockchainLog to PurchaseOrder documents
 * This syncs all POs with their corresponding blockchain logs
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import PurchaseOrder from '@/modules/purchase-order/model';
import BlockchainLog from '@/modules/blockchain/model';

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  try {
    await mongoose.connect(mongoUri);
    console.log('[Backfill] Connected to MongoDB Atlas');
  } catch (err) {
    console.error('[Backfill] MongoDB connection error:', err);
    throw err;
  }
}

async function backfillBlockchainData() {
  try {
    await connectDB();
    console.log('[Backfill] Starting blockchain data backfill...');

    // Find all po_created blockchain logs
    const blockchainLogs = await BlockchainLog.find({
      eventType: 'po_created',
      referenceModel: 'PurchaseOrder',
    });

    console.log(`[Backfill] Found ${blockchainLogs.length} blockchain logs`);

    let updated = 0;
    let skipped = 0;

    for (const log of blockchainLogs) {
      try {
        const po = await PurchaseOrder.findById(log.referenceId);

        if (!po) {
          console.log(`[Backfill] ⚠️  PO not found for log: ${log.referenceId}`);
          skipped++;
          continue;
        }

        // Update PO with blockchain data
        po.blockchainTxHash = log.txHash;
        po.blockchainLoggedAt = log.confirmedAt || log.createdAt;

        await po.save();
        updated++;

        console.log(`[Backfill] ✓ Updated PO ${po.poNumber} with tx hash ${log.txHash.slice(0, 12)}...`);
      } catch (err) {
        console.error(`[Backfill] Error processing log ${log._id}:`, err);
        skipped++;
      }
    }

    console.log(`[Backfill] Complete!`);
    console.log(`[Backfill] Updated: ${updated}, Skipped: ${skipped}`);

    await mongoose.disconnect();
    console.log('[Backfill] MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('[Backfill] Fatal error:', err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  backfillBlockchainData();
}

export { backfillBlockchainData };

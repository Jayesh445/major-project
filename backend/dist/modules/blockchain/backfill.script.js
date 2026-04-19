"use strict";
/**
 * Backfill Script — Check existing pending transactions and update their status
 *
 * Purpose:
 *   When you enable the webhook, existing pending transactions (those created before webhook was set up)
 *   will continue using the polling worker. However, this script allows you to manually check all pending
 *   transactions RIGHT NOW and update their status immediately.
 *
 * Usage:
 *   npx ts-node src/modules/blockchain/backfill.script.ts
 *
 * What it does:
 *   1. Fetches all pending BlockchainLog entries
 *   2. For each, queries the blockchain for receipt
 *   3. Updates status to confirmed/failed if mined
 *   4. Reports summary statistics
 *
 * Safety:
 *   - Does NOT modify transactions that are already confirmed/failed
 *   - Uses same pollConfirmation() function as worker
 *   - Idempotent (safe to run multiple times)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.backfillPendingTransactions = backfillPendingTransactions;
const config_1 = require("@/config");
const service_1 = require("./service");
async function backfillPendingTransactions() {
    console.log('[Backfill] Connecting to database...');
    await config_1.database.connect();
    try {
        const pendingLogs = await (0, service_1.getPendingLogs)(1000); // Get up to 1000 pending logs
        console.log(`[Backfill] Found ${pendingLogs.length} pending transactions`);
        if (pendingLogs.length === 0) {
            console.log('[Backfill] No pending transactions to backfill');
            process.exit(0);
        }
        let confirmed = 0;
        let failed = 0;
        let stillPending = 0;
        let errors = 0;
        for (const log of pendingLogs) {
            try {
                const logId = log._id.toString();
                const txHash = log.txHash;
                console.log(`[Backfill] Checking ${txHash.slice(0, 12)}... (${log.eventType})`);
                const result = await (0, service_1.pollConfirmation)(txHash);
                if (result.status === 'confirmed' && result.blockNumber) {
                    await (0, service_1.updateLogStatus)(logId, 'confirmed', result.blockNumber);
                    console.log(`  ✓ Confirmed on block #${result.blockNumber}`);
                    confirmed++;
                }
                else if (result.status === 'failed') {
                    await (0, service_1.updateLogStatus)(logId, 'failed');
                    console.log(`  ✗ Failed`);
                    failed++;
                }
                else {
                    console.log(`  ⏳ Still pending on-chain`);
                    stillPending++;
                }
            }
            catch (err) {
                console.error(`  ⚠️ Error:`, err);
                errors++;
            }
        }
        console.log('\n[Backfill] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`[Backfill] Summary:`);
        console.log(`  ✓ Confirmed:     ${confirmed}`);
        console.log(`  ✗ Failed:        ${failed}`);
        console.log(`  ⏳ Still Pending: ${stillPending}`);
        console.log(`  ⚠️ Errors:       ${errors}`);
        console.log('[Backfill] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if (stillPending > 0) {
            console.log(`\n[Backfill] Note: ${stillPending} transactions are still pending on-chain.`);
            console.log(`[Backfill] These will be confirmed by the polling worker every 30 seconds.`);
            console.log(`[Backfill] Or they will be confirmed via webhook when Alchemy detects confirmation.`);
        }
        process.exit(errors > 0 ? 1 : 0);
    }
    catch (err) {
        console.error('[Backfill] Fatal error:', err);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    backfillPendingTransactions();
}

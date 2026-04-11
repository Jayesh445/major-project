/**
 * Confirmation worker — polls pending blockchain logs and updates their status.
 *
 * Runs every 30 seconds via node-cron.
 * Picks up to 20 pending logs, queries the chain for receipt, and updates MongoDB.
 * If a tx stays pending for > 5 minutes (10 poll cycles), marks it failed.
 */

import cron from 'node-cron';
import { pollConfirmation, getPendingLogs, updateLogStatus } from './service';
import { isBlockchainEnabled } from './constants';

let task: ReturnType<typeof cron.schedule> | null = null;
const MAX_RETRIES = 10; // 10 poll cycles × 30s = 5 minutes max wait

// Track retry counts in-memory (reset on restart — good enough for MVP)
const retryCount = new Map<string, number>();

async function pollPending() {
  if (!isBlockchainEnabled()) {
    return;
  }

  try {
    const pendingLogs = await getPendingLogs(20);
    if (pendingLogs.length === 0) return;

    for (const log of pendingLogs) {
      const logId = log._id.toString();
      const current = retryCount.get(logId) ?? 0;

      const result = await pollConfirmation(log.txHash);

      if (result.status === 'confirmed' && result.blockNumber) {
        await updateLogStatus(logId, 'confirmed', result.blockNumber);
        retryCount.delete(logId);
        console.log(
          `[BlockchainWorker] Confirmed: ${log.eventType} tx=${log.txHash.slice(0, 12)}... block=${result.blockNumber}`
        );
      } else if (result.status === 'failed') {
        await updateLogStatus(logId, 'failed');
        retryCount.delete(logId);
        console.log(`[BlockchainWorker] Failed: tx=${log.txHash.slice(0, 12)}...`);
      } else {
        // Still pending — increment retry count
        retryCount.set(logId, current + 1);
        if (current + 1 >= MAX_RETRIES) {
          await updateLogStatus(logId, 'failed');
          retryCount.delete(logId);
          console.log(
            `[BlockchainWorker] Gave up after ${MAX_RETRIES} retries: tx=${log.txHash.slice(0, 12)}...`
          );
        }
      }
    }
  } catch (err) {
    console.error('[BlockchainWorker] Poll error:', err);
  }
}

export function startConfirmationWorker() {
  if (task) {
    console.log('[BlockchainWorker] Already running');
    return;
  }

  if (!isBlockchainEnabled()) {
    console.log(
      '[BlockchainWorker] Skipped (SEPOLIA_RPC_URL / DEPLOYER_PRIVATE_KEY / SUPPLY_CHAIN_CONTRACT_ADDRESS not set — using offline fallback)'
    );
    return;
  }

  // Every 30 seconds
  task = cron.schedule('*/30 * * * * *', pollPending);
  console.log('[BlockchainWorker] Started — polling pending logs every 30s');

  // Run immediately on startup
  pollPending().catch((err) => console.error('[BlockchainWorker] Initial poll error:', err));
}

export function stopConfirmationWorker() {
  if (task) {
    task.stop();
    task = null;
    console.log('[BlockchainWorker] Stopped');
  }
}

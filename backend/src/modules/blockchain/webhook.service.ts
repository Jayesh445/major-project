/**
 * Alchemy Webhook Service — receives real-time transaction confirmations
 *
 * When a transaction is confirmed on-chain, Alchemy sends a webhook event.
 * This service validates the webhook signature and updates BlockchainLog status immediately.
 *
 * Fallback: If webhook is disabled, the polling worker (worker.ts) continues to work.
 */

import { createHmac, createHash } from 'crypto';
import BlockchainLog from './model';

/**
 * Validate Alchemy webhook signature to ensure the request is from Alchemy.
 * Alchemy signs each webhook with HMAC-SHA256 using your webhook signing key.
 */
export function verifyAlchemySignature(
  body: string,
  signature: string | undefined,
  signingKey: string | undefined
): boolean {
  if (!signature || !signingKey) {
    console.warn('[AlchemyWebhook] Missing signature or signing key — skipping verification');
    return true; // In development, allow unsigned webhooks
  }

  try {
    const hash = createHmac('sha256', signingKey).update(body).digest('hex');
    return hash === signature;
  } catch (err) {
    console.error('[AlchemyWebhook] Signature verification error:', err);
    return false;
  }
}

/**
 * Alchemy webhook payload structure for detailed block events with logs
 * This structure includes block information and all transaction logs
 */
export interface AlchemyWebhookLog {
  data: string;
  topics: string[];
  index: number;
  account: {
    address: string;
  };
  transaction: {
    hash: string;
    nonce: number;
    index: number;
    from: {
      address: string;
    };
    to: {
      address: string;
    };
    value: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gas: string;
    status: number; // 1 = success, 0 = failed
    gasUsed: string;
    cumulativeGasUsed: string;
    effectiveGasPrice: string;
    createdContract?: {
      address: string;
    };
  };
}

export interface AlchemyWebhookBlock {
  hash: string;
  number: number;
  timestamp: number;
  logs: AlchemyWebhookLog[];
}

export interface AlchemyWebhookEvent {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string; // 'block' or other event types
  block: AlchemyWebhookBlock;
}

/**
 * Handle incoming Alchemy webhook event with block and logs.
 * Processes all transactions in the block and updates BlockchainLog status.
 */
export async function handleAlchemyWebhook(webhookEvent: AlchemyWebhookEvent) {
  const { block } = webhookEvent;

  if (!block || !block.logs) {
    console.warn('[AlchemyWebhook] No block data in webhook event');
    return;
  }

  const blockNumber = block.number;
  const blockHash = block.hash;
  const timestamp = new Date(block.timestamp * 1000); // Convert Unix timestamp to Date

  console.log(
    `[AlchemyWebhook] Processing block #${blockNumber} with ${block.logs.length} logs`
  );

  // Track processed transactions to avoid duplicates
  const processedTxHashes = new Set<string>();

  try {
    // Process each log in the block
    for (const log of block.logs) {
      try {
        const txHash = log.transaction.hash;
        const txStatus = log.transaction.status;

        // Skip if we've already processed this transaction
        if (processedTxHashes.has(txHash)) {
          continue;
        }
        processedTxHashes.add(txHash);

        // Find the BlockchainLog entry for this tx
        const blockchainLog = await BlockchainLog.findOne({ txHash });

        if (!blockchainLog) {
          // Transaction not in our system - skip it
          continue;
        }

        // Skip if already confirmed or failed (don't re-process)
        if (blockchainLog.confirmationStatus !== 'pending') {
          continue;
        }

        // Update based on transaction status
        if (txStatus === 1) {
          // Transaction succeeded
          await BlockchainLog.findByIdAndUpdate(blockchainLog._id, {
            confirmationStatus: 'confirmed',
            blockNumber,
            blockHash,
            confirmedAt: timestamp,
          });

          console.log(
            `[AlchemyWebhook] ✓ Confirmed: ${blockchainLog.eventType} tx=${txHash.slice(
              0,
              12
            )}... block=${blockNumber}`
          );

          // Sync PO blockchain status if this is a po_created event
          if (blockchainLog.eventType === 'po_created' && blockchainLog.referenceModel === 'PurchaseOrder') {
            try {
              const { PurchaseOrderService } = await import('@/modules/purchase-order/service');
              const poService = new PurchaseOrderService();
              await poService.syncBlockchainStatus(blockchainLog.referenceId.toString());
            } catch (syncErr) {
              console.error('[AlchemyWebhook] Failed to sync PO blockchain status:', syncErr);
              // Don't block webhook processing
            }
          }
        } else if (txStatus === 0) {
          // Transaction failed
          await BlockchainLog.findByIdAndUpdate(blockchainLog._id, {
            confirmationStatus: 'failed',
            blockNumber,
            blockHash,
          });

          console.log(
            `[AlchemyWebhook] ✗ Failed: ${blockchainLog.eventType} tx=${txHash.slice(0, 12)}...`
          );
        }
      } catch (logErr) {
        console.error('[AlchemyWebhook] Error processing log:', logErr);
        // Continue processing other logs
      }
    }
  } catch (err) {
    console.error('[AlchemyWebhook] Error processing block:', err);
    throw err;
  }
}

/**
 * Get or generate Alchemy webhook signing key from environment.
 * Alchemy provides this when you create a webhook in their dashboard.
 */
export function getWebhookSigningKey(): string | undefined {
  return process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
}

/**
 * Check if webhook integration is enabled.
 * Webhook is optional — if signing key is not set, polling worker will continue to work.
 */
export function isWebhookEnabled(): boolean {
  return !!process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
}

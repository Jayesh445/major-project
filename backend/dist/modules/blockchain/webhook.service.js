"use strict";
/**
 * Alchemy Webhook Service — receives real-time transaction confirmations
 *
 * When a transaction is confirmed on-chain, Alchemy sends a webhook event.
 * This service validates the webhook signature and updates BlockchainLog status immediately.
 *
 * Fallback: If webhook is disabled, the polling worker (worker.ts) continues to work.
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAlchemySignature = verifyAlchemySignature;
exports.handleAlchemyWebhook = handleAlchemyWebhook;
exports.getWebhookSigningKey = getWebhookSigningKey;
exports.isWebhookEnabled = isWebhookEnabled;
const crypto_1 = require("crypto");
const model_1 = __importDefault(require("./model"));
/**
 * Validate Alchemy webhook signature to ensure the request is from Alchemy.
 * Alchemy signs each webhook with HMAC-SHA256 using your webhook signing key.
 */
function verifyAlchemySignature(body, signature, signingKey) {
    if (!signature || !signingKey) {
        console.warn('[AlchemyWebhook] Missing signature or signing key — skipping verification');
        return true; // In development, allow unsigned webhooks
    }
    try {
        const hash = (0, crypto_1.createHmac)('sha256', signingKey).update(body).digest('hex');
        return hash === signature;
    }
    catch (err) {
        console.error('[AlchemyWebhook] Signature verification error:', err);
        return false;
    }
}
/**
 * Handle incoming Alchemy webhook event with block and logs.
 * Processes all transactions in the block and updates BlockchainLog status.
 */
async function handleAlchemyWebhook(webhookEvent) {
    const { block } = webhookEvent;
    if (!block || !block.logs) {
        console.warn('[AlchemyWebhook] No block data in webhook event');
        return;
    }
    const blockNumber = block.number;
    const blockHash = block.hash;
    const timestamp = new Date(block.timestamp * 1000); // Convert Unix timestamp to Date
    console.log(`[AlchemyWebhook] Processing block #${blockNumber} with ${block.logs.length} logs`);
    // Track processed transactions to avoid duplicates
    const processedTxHashes = new Set();
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
                const blockchainLog = await model_1.default.findOne({ txHash });
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
                    await model_1.default.findByIdAndUpdate(blockchainLog._id, {
                        confirmationStatus: 'confirmed',
                        blockNumber,
                        blockHash,
                        confirmedAt: timestamp,
                    });
                    console.log(`[AlchemyWebhook] ✓ Confirmed: ${blockchainLog.eventType} tx=${txHash.slice(0, 12)}... block=${blockNumber}`);
                    // Sync PO blockchain status if this is a po_created event
                    if (blockchainLog.eventType === 'po_created' && blockchainLog.referenceModel === 'PurchaseOrder') {
                        try {
                            const { PurchaseOrderService } = await Promise.resolve().then(() => __importStar(require('@/modules/purchase-order/service')));
                            const poService = new PurchaseOrderService();
                            await poService.syncBlockchainStatus(blockchainLog.referenceId.toString());
                        }
                        catch (syncErr) {
                            console.error('[AlchemyWebhook] Failed to sync PO blockchain status:', syncErr);
                            // Don't block webhook processing
                        }
                    }
                }
                else if (txStatus === 0) {
                    // Transaction failed
                    await model_1.default.findByIdAndUpdate(blockchainLog._id, {
                        confirmationStatus: 'failed',
                        blockNumber,
                        blockHash,
                    });
                    console.log(`[AlchemyWebhook] ✗ Failed: ${blockchainLog.eventType} tx=${txHash.slice(0, 12)}...`);
                }
            }
            catch (logErr) {
                console.error('[AlchemyWebhook] Error processing log:', logErr);
                // Continue processing other logs
            }
        }
    }
    catch (err) {
        console.error('[AlchemyWebhook] Error processing block:', err);
        throw err;
    }
}
/**
 * Get or generate Alchemy webhook signing key from environment.
 * Alchemy provides this when you create a webhook in their dashboard.
 */
function getWebhookSigningKey() {
    return process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
}
/**
 * Check if webhook integration is enabled.
 * Webhook is optional — if signing key is not set, polling worker will continue to work.
 */
function isWebhookEnabled() {
    return !!process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
}

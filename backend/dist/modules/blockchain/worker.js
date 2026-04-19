"use strict";
/**
 * Confirmation worker — polls pending blockchain logs and updates their status.
 *
 * Runs every 30 seconds via node-cron.
 * Picks up to 20 pending logs, queries the chain for receipt, and updates MongoDB.
 * If a tx stays pending for > 5 minutes (10 poll cycles), marks it failed.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startConfirmationWorker = startConfirmationWorker;
exports.stopConfirmationWorker = stopConfirmationWorker;
const node_cron_1 = __importDefault(require("node-cron"));
const service_1 = require("./service");
const constants_1 = require("./constants");
let task = null;
const MAX_RETRIES = 10; // 10 poll cycles × 30s = 5 minutes max wait
// Track retry counts in-memory (reset on restart — good enough for MVP)
const retryCount = new Map();
async function pollPending() {
    if (!(0, constants_1.isBlockchainEnabled)()) {
        return;
    }
    try {
        const pendingLogs = await (0, service_1.getPendingLogs)(20);
        if (pendingLogs.length === 0)
            return;
        for (const log of pendingLogs) {
            const logId = log._id.toString();
            const current = retryCount.get(logId) ?? 0;
            const result = await (0, service_1.pollConfirmation)(log.txHash);
            if (result.status === 'confirmed' && result.blockNumber) {
                await (0, service_1.updateLogStatus)(logId, 'confirmed', result.blockNumber);
                retryCount.delete(logId);
                console.log(`[BlockchainWorker] Confirmed: ${log.eventType} tx=${log.txHash.slice(0, 12)}... block=${result.blockNumber}`);
            }
            else if (result.status === 'failed') {
                await (0, service_1.updateLogStatus)(logId, 'failed');
                retryCount.delete(logId);
                console.log(`[BlockchainWorker] Failed: tx=${log.txHash.slice(0, 12)}...`);
            }
            else {
                // Still pending — increment retry count
                retryCount.set(logId, current + 1);
                if (current + 1 >= MAX_RETRIES) {
                    await (0, service_1.updateLogStatus)(logId, 'failed');
                    retryCount.delete(logId);
                    console.log(`[BlockchainWorker] Gave up after ${MAX_RETRIES} retries: tx=${log.txHash.slice(0, 12)}...`);
                }
            }
        }
    }
    catch (err) {
        console.error('[BlockchainWorker] Poll error:', err);
    }
}
function startConfirmationWorker() {
    if (task) {
        console.log('[BlockchainWorker] Already running');
        return;
    }
    if (!(0, constants_1.isBlockchainEnabled)()) {
        console.log('[BlockchainWorker] Skipped (SEPOLIA_RPC_URL / DEPLOYER_PRIVATE_KEY / SUPPLY_CHAIN_CONTRACT_ADDRESS not set — using offline fallback)');
        return;
    }
    // Every 30 seconds
    task = node_cron_1.default.schedule('*/30 * * * * *', pollPending);
    console.log('[BlockchainWorker] Started — polling pending logs every 30s');
    // Run immediately on startup
    pollPending().catch((err) => console.error('[BlockchainWorker] Initial poll error:', err));
}
function stopConfirmationWorker() {
    if (task) {
        task.stop();
        task = null;
        console.log('[BlockchainWorker] Stopped');
    }
}

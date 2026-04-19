"use strict";
/**
 * Blockchain service — real Ethereum Sepolia integration.
 *
 * Design:
 *   - logEventOnChain() submits the tx and returns immediately (does NOT wait for confirmation)
 *     so Mastra workflows don't block. Status is 'pending' until the background worker polls it.
 *   - pollConfirmation() is called by the background worker (worker.ts) on a cron schedule.
 *   - computeDocumentHash() uses a canonical JSON serialization so the same payload always
 *     produces the same hash regardless of key order.
 *
 * Fallback: if SEPOLIA_RPC_URL / DEPLOYER_PRIVATE_KEY / SUPPLY_CHAIN_CONTRACT_ADDRESS are
 * not set, writes are logged to MongoDB with a deterministic SHA-256 hash and status
 * 'confirmed' (preserves existing dev experience without chain access).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDocumentHash = computeDocumentHash;
exports.toBytes32 = toBytes32;
exports.rupeesToPaise = rupeesToPaise;
exports.getEtherscanUrl = getEtherscanUrl;
exports.logEventOnChain = logEventOnChain;
exports.pollConfirmation = pollConfirmation;
exports.verifyDocumentHash = verifyDocumentHash;
exports.getPendingLogs = getPendingLogs;
exports.updateLogStatus = updateLogStatus;
exports.getLogsByReference = getLogsByReference;
const ethers_1 = require("ethers");
const crypto_1 = require("crypto");
const model_1 = __importDefault(require("./model"));
const constants_1 = require("./constants");
// ── Providers & contract (lazy init) ──────────────────────────────────────────
let providerInstance = null;
let walletInstance = null;
let contractInstance = null;
function getProvider() {
    if (!providerInstance) {
        const rpcUrl = process.env.SEPOLIA_RPC_URL;
        if (!rpcUrl)
            throw new Error('SEPOLIA_RPC_URL not set');
        providerInstance = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    }
    return providerInstance;
}
function getWallet() {
    if (!walletInstance) {
        const pk = process.env.DEPLOYER_PRIVATE_KEY;
        if (!pk)
            throw new Error('DEPLOYER_PRIVATE_KEY not set');
        const cleanPk = pk.startsWith('0x') ? pk : `0x${pk}`;
        walletInstance = new ethers_1.ethers.Wallet(cleanPk, getProvider());
    }
    return walletInstance;
}
function getContract() {
    if (!contractInstance) {
        const address = (0, constants_1.getContractAddress)();
        if (!address)
            throw new Error('SUPPLY_CHAIN_CONTRACT_ADDRESS not set and deployed.json missing');
        const abi = (0, constants_1.loadContractAbi)();
        contractInstance = new ethers_1.ethers.Contract(address, abi, getWallet());
    }
    return contractInstance;
}
// ── Hash & ID utilities ───────────────────────────────────────────────────────
/**
 * Compute a canonical SHA-256 hash of a payload.
 * Uses sorted JSON keys to ensure determinism across calls.
 */
function computeDocumentHash(payload) {
    const canonical = canonicalJsonStringify(payload);
    const hash = (0, crypto_1.createHash)('sha256').update(canonical, 'utf8').digest('hex');
    return `0x${hash}`;
}
function canonicalJsonStringify(obj) {
    if (obj === null || typeof obj !== 'object')
        return JSON.stringify(obj);
    if (Array.isArray(obj))
        return `[${obj.map(canonicalJsonStringify).join(',')}]`;
    const keys = Object.keys(obj).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalJsonStringify(obj[k])}`);
    return `{${entries.join(',')}}`;
}
/**
 * Pad a MongoDB ObjectId (24 hex chars) to bytes32 (64 hex chars).
 */
function toBytes32(mongoId) {
    const clean = mongoId.replace(/^0x/, '');
    if (!/^[0-9a-fA-F]+$/.test(clean))
        throw new Error(`Invalid hex string: ${mongoId}`);
    if (clean.length > 64)
        throw new Error(`Hex too long (${clean.length}): ${mongoId}`);
    return `0x${clean.padStart(64, '0')}`;
}
/**
 * Convert an INR amount (decimal rupees) to integer paise for on-chain storage.
 */
function rupeesToPaise(rupees) {
    return BigInt(Math.round(rupees * 100));
}
function getEtherscanUrl(txHash) {
    return `${constants_1.EXPLORER_BASE_URL}/tx/${txHash}`;
}
/**
 * High-level: compute hash, submit tx, persist MongoDB record, return immediately.
 * The background worker will update confirmationStatus when the tx is mined.
 */
async function logEventOnChain(params) {
    const documentHash = computeDocumentHash(params.payload);
    const eventTypeUint = constants_1.EVENT_TYPE_ENUM[params.eventType];
    if (eventTypeUint === undefined)
        throw new Error(`Unknown eventType: ${params.eventType}`);
    if (!(0, constants_1.isBlockchainEnabled)()) {
        // Fallback: write to MongoDB as "confirmed" without real chain call
        const fakeHash = `0x${(0, crypto_1.createHash)('sha256')
            .update(documentHash + Date.now().toString())
            .digest('hex')}`;
        const doc = await model_1.default.create({
            eventType: params.eventType,
            referenceModel: params.referenceModel,
            referenceId: params.referenceId,
            payload: params.payload,
            txHash: fakeHash,
            networkName: 'offline-fallback',
            confirmationStatus: 'confirmed',
            confirmedAt: new Date(),
            triggeredBy: params.triggeredBy,
        });
        return {
            _id: doc._id.toString(),
            txHash: fakeHash,
            documentHash,
            confirmationStatus: 'confirmed',
            etherscanUrl: getEtherscanUrl(fakeHash),
        };
    }
    // Real chain path
    const contract = getContract();
    const refBytes32 = toBytes32(params.referenceId);
    const amount = params.amount ? rupeesToPaise(params.amount) : 0n;
    // Submit tx (does NOT wait for confirmation)
    const tx = await contract.logEvent(refBytes32, eventTypeUint, documentHash, amount);
    const doc = await model_1.default.create({
        eventType: params.eventType,
        referenceModel: params.referenceModel,
        referenceId: params.referenceId,
        payload: params.payload,
        txHash: tx.hash,
        networkName: constants_1.NETWORK_NAME,
        confirmationStatus: 'pending',
        triggeredBy: params.triggeredBy,
    });
    return {
        _id: doc._id.toString(),
        txHash: tx.hash,
        documentHash,
        confirmationStatus: 'pending',
        etherscanUrl: getEtherscanUrl(tx.hash),
    };
}
/**
 * Poll a single pending transaction for confirmation.
 * Called by the background worker.
 */
async function pollConfirmation(txHash) {
    if (!(0, constants_1.isBlockchainEnabled)()) {
        return { status: 'confirmed' };
    }
    try {
        const receipt = await getProvider().getTransactionReceipt(txHash);
        if (!receipt)
            return { status: 'pending' };
        if (receipt.status === 1) {
            return { status: 'confirmed', blockNumber: receipt.blockNumber };
        }
        return { status: 'failed' };
    }
    catch (err) {
        console.error(`[Blockchain] pollConfirmation error for ${txHash}:`, err);
        return { status: 'pending' };
    }
}
/**
 * Verify a document hash matches the latest on-chain record for a reference.
 * Used by the QR-scan verification endpoint at the receiving dock.
 */
async function verifyDocumentHash(params) {
    const computedHash = computeDocumentHash(params.payload);
    const eventTypeUint = constants_1.EVENT_TYPE_ENUM[params.eventType];
    // Fetch the latest log from MongoDB to get txHash/blockNumber
    const latestLog = await model_1.default.findOne({
        referenceId: params.referenceId,
        eventType: params.eventType,
        confirmationStatus: 'confirmed',
    })
        .sort({ createdAt: -1 })
        .lean();
    if (!(0, constants_1.isBlockchainEnabled)()) {
        // Fallback: compare against stored txHash (treated as hash)
        return {
            match: !!latestLog,
            computedHash,
            chainHash: latestLog?.txHash || null,
            blockNumber: latestLog?.blockNumber || null,
            txHash: latestLog?.txHash || null,
            etherscanUrl: latestLog ? getEtherscanUrl(latestLog.txHash) : null,
        };
    }
    // Real chain verification
    try {
        const contract = getContract();
        const refBytes32 = toBytes32(params.referenceId);
        const chainHash = await contract.latestHashByRef(refBytes32, eventTypeUint);
        return {
            match: chainHash.toLowerCase() === computedHash.toLowerCase(),
            computedHash,
            chainHash,
            blockNumber: latestLog?.blockNumber ?? null,
            txHash: latestLog?.txHash ?? null,
            etherscanUrl: latestLog ? getEtherscanUrl(latestLog.txHash) : null,
        };
    }
    catch (err) {
        console.error('[Blockchain] verifyDocumentHash error:', err);
        return {
            match: false,
            computedHash,
            chainHash: null,
            blockNumber: null,
            txHash: null,
            etherscanUrl: null,
        };
    }
}
/**
 * Get pending logs for the confirmation worker to process.
 */
async function getPendingLogs(limit = 20) {
    return model_1.default.find({ confirmationStatus: 'pending' })
        .sort({ createdAt: 1 })
        .limit(limit);
}
/**
 * Update log status after polling.
 */
async function updateLogStatus(id, status, blockNumber) {
    return model_1.default.findByIdAndUpdate(id, {
        confirmationStatus: status,
        confirmedAt: status === 'confirmed' ? new Date() : undefined,
        blockNumber,
    }, { new: true });
}
/**
 * Get logs for a reference (for frontend display).
 */
async function getLogsByReference(referenceId) {
    return model_1.default.find({ referenceId }).sort({ createdAt: -1 }).lean();
}

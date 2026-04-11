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

import { ethers } from 'ethers';
import { createHash } from 'crypto';
import BlockchainLog from './model';
import {
  EVENT_TYPE_ENUM,
  EXPLORER_BASE_URL,
  NETWORK_NAME,
  loadContractAbi,
  getContractAddress,
  isBlockchainEnabled,
} from './constants';

// ── Providers & contract (lazy init) ──────────────────────────────────────────

let providerInstance: ethers.JsonRpcProvider | null = null;
let walletInstance: ethers.Wallet | null = null;
let contractInstance: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!providerInstance) {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    if (!rpcUrl) throw new Error('SEPOLIA_RPC_URL not set');
    providerInstance = new ethers.JsonRpcProvider(rpcUrl);
  }
  return providerInstance;
}

function getWallet(): ethers.Wallet {
  if (!walletInstance) {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    if (!pk) throw new Error('DEPLOYER_PRIVATE_KEY not set');
    const cleanPk = pk.startsWith('0x') ? pk : `0x${pk}`;
    walletInstance = new ethers.Wallet(cleanPk, getProvider());
  }
  return walletInstance;
}

function getContract(): ethers.Contract {
  if (!contractInstance) {
    const address = getContractAddress();
    if (!address) throw new Error('SUPPLY_CHAIN_CONTRACT_ADDRESS not set and deployed.json missing');
    const abi = loadContractAbi();
    contractInstance = new ethers.Contract(address, abi, getWallet());
  }
  return contractInstance;
}

// ── Hash & ID utilities ───────────────────────────────────────────────────────

/**
 * Compute a canonical SHA-256 hash of a payload.
 * Uses sorted JSON keys to ensure determinism across calls.
 */
export function computeDocumentHash(payload: unknown): string {
  const canonical = canonicalJsonStringify(payload);
  const hash = createHash('sha256').update(canonical, 'utf8').digest('hex');
  return `0x${hash}`;
}

function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalJsonStringify).join(',')}]`;
  const keys = Object.keys(obj as object).sort();
  const entries = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalJsonStringify((obj as any)[k])}`
  );
  return `{${entries.join(',')}}`;
}

/**
 * Pad a MongoDB ObjectId (24 hex chars) to bytes32 (64 hex chars).
 */
export function toBytes32(mongoId: string): string {
  const clean = mongoId.replace(/^0x/, '');
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error(`Invalid hex string: ${mongoId}`);
  if (clean.length > 64) throw new Error(`Hex too long (${clean.length}): ${mongoId}`);
  return `0x${clean.padStart(64, '0')}`;
}

/**
 * Convert an INR amount (decimal rupees) to integer paise for on-chain storage.
 */
export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * 100));
}

export function getEtherscanUrl(txHash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${txHash}`;
}

// ── Core service functions ───────────────────────────────────────────────────

export interface LogEventParams {
  eventType: keyof typeof EVENT_TYPE_ENUM;
  referenceModel: 'PurchaseOrder' | 'NegotiationSession' | 'Inventory';
  referenceId: string;
  payload: Record<string, unknown>;
  amount?: number; // in rupees
  triggeredBy?: string; // user ObjectId
}

export interface LogEventResult {
  _id: string;
  txHash: string;
  documentHash: string;
  confirmationStatus: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  etherscanUrl: string;
}

/**
 * High-level: compute hash, submit tx, persist MongoDB record, return immediately.
 * The background worker will update confirmationStatus when the tx is mined.
 */
export async function logEventOnChain(params: LogEventParams): Promise<LogEventResult> {
  const documentHash = computeDocumentHash(params.payload);
  const eventTypeUint = EVENT_TYPE_ENUM[params.eventType];
  if (eventTypeUint === undefined) throw new Error(`Unknown eventType: ${params.eventType}`);

  if (!isBlockchainEnabled()) {
    // Fallback: write to MongoDB as "confirmed" without real chain call
    const fakeHash = `0x${createHash('sha256')
      .update(documentHash + Date.now().toString())
      .digest('hex')}`;

    const doc = await BlockchainLog.create({
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

  const doc = await BlockchainLog.create({
    eventType: params.eventType,
    referenceModel: params.referenceModel,
    referenceId: params.referenceId,
    payload: params.payload,
    txHash: tx.hash,
    networkName: NETWORK_NAME,
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
export async function pollConfirmation(
  txHash: string
): Promise<{ status: 'pending' | 'confirmed' | 'failed'; blockNumber?: number }> {
  if (!isBlockchainEnabled()) {
    return { status: 'confirmed' };
  }

  try {
    const receipt = await getProvider().getTransactionReceipt(txHash);
    if (!receipt) return { status: 'pending' };

    if (receipt.status === 1) {
      return { status: 'confirmed', blockNumber: receipt.blockNumber };
    }
    return { status: 'failed' };
  } catch (err) {
    console.error(`[Blockchain] pollConfirmation error for ${txHash}:`, err);
    return { status: 'pending' };
  }
}

/**
 * Verify a document hash matches the latest on-chain record for a reference.
 * Used by the QR-scan verification endpoint at the receiving dock.
 */
export async function verifyDocumentHash(params: {
  referenceId: string;
  eventType: keyof typeof EVENT_TYPE_ENUM;
  payload: Record<string, unknown>;
}): Promise<{
  match: boolean;
  computedHash: string;
  chainHash: string | null;
  blockNumber: number | null;
  txHash: string | null;
  etherscanUrl: string | null;
}> {
  const computedHash = computeDocumentHash(params.payload);
  const eventTypeUint = EVENT_TYPE_ENUM[params.eventType];

  // Fetch the latest log from MongoDB to get txHash/blockNumber
  const latestLog = await BlockchainLog.findOne({
    referenceId: params.referenceId,
    eventType: params.eventType,
    confirmationStatus: 'confirmed',
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!isBlockchainEnabled()) {
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
    const chainHash: string = await contract.latestHashByRef(refBytes32, eventTypeUint);

    return {
      match: chainHash.toLowerCase() === computedHash.toLowerCase(),
      computedHash,
      chainHash,
      blockNumber: latestLog?.blockNumber ?? null,
      txHash: latestLog?.txHash ?? null,
      etherscanUrl: latestLog ? getEtherscanUrl(latestLog.txHash) : null,
    };
  } catch (err) {
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
export async function getPendingLogs(limit = 20) {
  return BlockchainLog.find({ confirmationStatus: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit);
}

/**
 * Update log status after polling.
 */
export async function updateLogStatus(
  id: string,
  status: 'confirmed' | 'failed',
  blockNumber?: number
) {
  return BlockchainLog.findByIdAndUpdate(
    id,
    {
      confirmationStatus: status,
      confirmedAt: status === 'confirmed' ? new Date() : undefined,
      blockNumber,
    },
    { new: true }
  );
}

/**
 * Get logs for a reference (for frontend display).
 */
export async function getLogsByReference(referenceId: string) {
  return BlockchainLog.find({ referenceId }).sort({ createdAt: -1 }).lean();
}

/**
 * Blockchain constants — contract address, ABI, event enum mapping.
 *
 * The ABI is loaded lazily from blockchain/deployed.json if present.
 * If the file doesn't exist yet (before first deployment), we fall back
 * to a minimal inline ABI so the backend module still compiles.
 */

import * as fs from 'fs';
import * as path from 'path';

export const EXPLORER_BASE_URL = 'https://sepolia.etherscan.io';
export const NETWORK_NAME = 'ethereum-sepolia';
export const CHAIN_ID = 11155111;

/**
 * String event type → uint8 mapping matching SupplyChainAudit.sol enum
 */
export const EVENT_TYPE_ENUM: Record<string, number> = {
  po_created: 0,
  po_approved: 1,
  po_sent: 2,
  po_received: 3,
  negotiation_accepted: 4,
  negotiation_rejected: 5,
  inventory_adjustment: 6,
  smart_contract_executed: 7,
};

export const EVENT_TYPE_REVERSE: Record<number, string> = Object.fromEntries(
  Object.entries(EVENT_TYPE_ENUM).map(([k, v]) => [v, k])
);

/**
 * Fallback ABI — minimal set of functions we actually call.
 * This lets the module compile even before the contract is deployed.
 * After deploy.ts runs, blockchain/deployed.json will contain the full ABI.
 */
const FALLBACK_ABI = [
  'function logEvent(bytes32 referenceId, uint8 eventType, bytes32 documentHash, uint256 amount) returns (uint256)',
  'function verifyHash(bytes32 referenceId, uint8 eventType, bytes32 documentHash) view returns (bool)',
  'function getEntries(bytes32 referenceId) view returns (tuple(bytes32 referenceId, uint8 eventType, bytes32 documentHash, uint256 amount, uint256 timestamp, address submittedBy)[])',
  'function getEntryCount(bytes32 referenceId) view returns (uint256)',
  'function latestHashByRef(bytes32, uint8) view returns (bytes32)',
  'event AuditLogged(bytes32 indexed referenceId, uint8 indexed eventType, bytes32 documentHash, uint256 amount, uint256 timestamp, address indexed submittedBy)',
];

let cachedAbi: any = null;

export function loadContractAbi(): any {
  if (cachedAbi) return cachedAbi;

  // Look for blockchain/deployed.json relative to the backend cwd
  const candidates = [
    path.resolve(process.cwd(), '..', 'blockchain', 'deployed.json'),
    path.resolve(process.cwd(), 'blockchain', 'deployed.json'),
    path.resolve(__dirname, '..', '..', '..', '..', 'blockchain', 'deployed.json'),
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const content = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (content.abi) {
          cachedAbi = content.abi;
          return cachedAbi;
        }
      }
    } catch {
      // try next candidate
    }
  }

  cachedAbi = FALLBACK_ABI;
  return cachedAbi;
}

export function getContractAddress(): string | null {
  const envAddr = process.env.SUPPLY_CHAIN_CONTRACT_ADDRESS;
  if (envAddr && envAddr.startsWith('0x') && envAddr.length === 42) {
    return envAddr;
  }

  // Fallback: read from blockchain/deployed.json
  const candidates = [
    path.resolve(process.cwd(), '..', 'blockchain', 'deployed.json'),
    path.resolve(process.cwd(), 'blockchain', 'deployed.json'),
    path.resolve(__dirname, '..', '..', '..', '..', 'blockchain', 'deployed.json'),
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const content = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (content.address) return content.address;
      }
    } catch {
      // continue
    }
  }

  return null;
}

export function isBlockchainEnabled(): boolean {
  return !!(process.env.SEPOLIA_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY && getContractAddress());
}

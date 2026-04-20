"use strict";
/**
 * Blockchain constants — contract address, ABI, event enum mapping.
 *
 * The ABI is loaded lazily from blockchain/deployed.json if present.
 * If the file doesn't exist yet (before first deployment), we fall back
 * to a minimal inline ABI so the backend module still compiles.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_TYPE_REVERSE = exports.EVENT_TYPE_ENUM = exports.CHAIN_ID = exports.NETWORK_NAME = exports.EXPLORER_BASE_URL = void 0;
exports.loadContractAbi = loadContractAbi;
exports.getContractAddress = getContractAddress;
exports.isBlockchainEnabled = isBlockchainEnabled;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.EXPLORER_BASE_URL = 'https://sepolia.etherscan.io';
exports.NETWORK_NAME = 'ethereum-sepolia';
exports.CHAIN_ID = 11155111;
/**
 * String event type → uint8 mapping matching SupplyChainAudit.sol enum
 * Maps workflow events to smart contract enums. Some events map to the same enum
 * value since the contract has limited event types.
 */
exports.EVENT_TYPE_ENUM = {
    po_created: 0,
    po_submitted_for_approval: 0, // Sent to blockchain as event type 0
    po_approved: 1,
    po_sent: 2,
    po_sent_to_supplier: 2, // Sent to blockchain as event type 2 (po_sent)
    po_received: 3,
    po_acknowledged: 3, // Sent to blockchain as event type 3 (po_received)
    goods_received: 3,
    po_cancelled: 0, // Sent to blockchain as event type 0
    negotiation_accepted: 4,
    negotiation_rejected: 5,
    inventory_adjustment: 6,
    smart_contract_executed: 7,
};
exports.EVENT_TYPE_REVERSE = Object.fromEntries(Object.entries(exports.EVENT_TYPE_ENUM).map(([k, v]) => [v, k]));
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
let cachedAbi = null;
function loadContractAbi() {
    if (cachedAbi)
        return cachedAbi;
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
        }
        catch {
            // try next candidate
        }
    }
    cachedAbi = FALLBACK_ABI;
    return cachedAbi;
}
function getContractAddress() {
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
                if (content.address)
                    return content.address;
            }
        }
        catch {
            // continue
        }
    }
    return null;
}
function isBlockchainEnabled() {
    return !!(process.env.SEPOLIA_RPC_URL && process.env.DEPLOYER_PRIVATE_KEY && getContractAddress());
}

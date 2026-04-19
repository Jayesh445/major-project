import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Blockchain routes live at /api/blockchain (not /api/v1)
const bcClient = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '')}/api/blockchain`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

bcClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Public client for the verify page (no auth)
const publicBcClient = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '')}/api/blockchain`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const qrClient = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '')}/api/qr`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

qrClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface VerifyResult {
  match: boolean;
  computedHash: string;
  chainHash: string | null;
  blockNumber: number | null;
  txHash: string | null;
  etherscanUrl: string | null;
  referenceId: string;
  eventType: string;
  documentName: string;
  amount?: number;
  payload?: any;
}

export interface BlockchainLogEntry {
  _id: string;
  eventType: string;
  referenceModel: string;
  referenceId: string;
  payload: any;
  txHash: string;
  blockNumber?: number;
  networkName: string;
  confirmationStatus: 'pending' | 'confirmed' | 'failed';
  confirmedAt?: string;
  createdAt: string;
  etherscanUrl?: string;
}

export interface QRResult {
  qrDataUrl: string;
  verifyUrl: string;
  referenceId: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const blockchainService = {
  // Public verification (no auth — for QR scans)
  verifyByReference: async (referenceId: string, eventType = 'po_created'): Promise<VerifyResult> => {
    const res = await publicBcClient.get(`/verify/${referenceId}?eventType=${eventType}&includePayload=true`);
    return res.data.data;
  },

  getLogsByReference: async (referenceId: string): Promise<BlockchainLogEntry[]> => {
    const res = await bcClient.get(`/logs/${referenceId}`);
    return res.data.data;
  },

  getLatestLogs: async (filters?: {
    eventType?: string;
    referenceModel?: string;
    status?: string;
    limit?: number;
  }): Promise<BlockchainLogEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.eventType) params.set('eventType', filters.eventType);
    if (filters?.referenceModel) params.set('referenceModel', filters.referenceModel);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.limit) params.set('limit', String(filters.limit));
    const res = await bcClient.get(`/logs?${params.toString()}`);
    return res.data.data;
  },

  getQRForPO: async (poId: string, eventType = 'po_created'): Promise<QRResult> => {
    const res = await qrClient.get(`/po/${poId}?type=${eventType}`);
    return res.data.data;
  },

  getPendingTransactions: async (): Promise<BlockchainLogEntry[]> => {
    const res = await bcClient.get('/logs?confirmationStatus=pending&limit=50');
    return res.data.data || [];
  },

  getTransactionStatus: async (txHash: string): Promise<BlockchainLogEntry> => {
    const res = await bcClient.get(`/logs/tx/${txHash}`);
    return res.data.data;
  },

  getTransactionWithLogs: async (referenceId: string): Promise<BlockchainLogEntry | null> => {
    const res = await bcClient.get(`/logs/${referenceId}?sort=createdAt&limit=1`);
    const logs = res.data.data as BlockchainLogEntry[];
    return logs && logs.length > 0 ? logs[0] : null;
  },
};

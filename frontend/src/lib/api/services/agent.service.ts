import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Agent routes live at /api/agents (not /api/v1)
const agentClient = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '')}/api/agents`,
  timeout: 120000, // 2 minutes — agent workflows take time
  headers: { 'Content-Type': 'application/json' },
});

agentClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentInfo {
  id: string;
  name: string;
  status: string;
  totalRuns: number;
}

export interface AgentStatusResponse {
  agents: AgentInfo[];
  recentNegotiations: any[];
  stats: {
    totalForecasts: number;
    totalOptimizations: number;
    totalNegotiations: number;
    totalBlockchainLogs: number;
  };
}

export interface NegotiationRound {
  roundNumber: number;
  agentOffer?: {
    unitPrice?: number;
    leadTimeDays?: number;
    paymentTermsDays?: number;
    quantity?: number;
  };
  supplierCounterOffer?: {
    unitPrice?: number;
    leadTimeDays?: number;
    paymentTermsDays?: number;
    quantity?: number;
  };
  agentReasoning?: string;
  status: string;
  timestamp: string;
}

export interface NegotiationSession {
  _id: string;
  supplier: { _id: string; companyName: string; contactEmail?: string; rating?: number };
  product: { _id: string; name: string; sku: string };
  initiatedBy: string;
  status: string;
  rounds: NegotiationRound[];
  agentConstraints: {
    maxUnitPrice: number;
    targetUnitPrice: number;
    maxLeadTimeDays: number;
    requiredQty: number;
  };
  finalTerms?: {
    unitPrice: number;
    leadTimeDays: number;
    paymentTermsDays: number;
    moq: number;
    savingsPercent: number;
  };
  deadline: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationTriggerInput {
  productId: string;
  warehouseId: string;
  requiredQty: number;
  maxUnitPrice: number;
  targetUnitPrice: number;
  maxLeadTimeDays: number;
}

export interface BlockchainLog {
  _id: string;
  eventType: string;
  referenceModel: string;
  referenceId: string;
  payload: any;
  txHash: string;
  blockNumber?: number;
  networkName: string;
  confirmationStatus: string;
  confirmedAt?: string;
  createdAt: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const agentService = {
  // Agent status
  getStatus: async (): Promise<AgentStatusResponse> => {
    const res = await agentClient.get('/status');
    return res.data.data;
  },

  // Negotiation
  triggerNegotiation: async (input: NegotiationTriggerInput) => {
    const res = await agentClient.post('/negotiation/trigger', input);
    return res.data.data;
  },
  getNegotiationSessions: async (status?: string): Promise<NegotiationSession[]> => {
    const params = status ? `?status=${status}` : '';
    const res = await agentClient.get(`/negotiation/sessions${params}`);
    return res.data.data;
  },
  getNegotiationSession: async (id: string): Promise<NegotiationSession> => {
    const res = await agentClient.get(`/negotiation/sessions/${id}`);
    return res.data.data;
  },

  // Procurement
  checkProcurement: async (productId: string, warehouseId: string) => {
    const res = await agentClient.post('/procurement/check', { productId, warehouseId });
    return res.data.data;
  },

  // Supplier Evaluation
  runSupplierEvaluation: async () => {
    const res = await agentClient.post('/supplier-evaluation/run');
    return res.data.data;
  },

  // Anomaly Detection
  runAnomalyScan: async () => {
    const res = await agentClient.post('/anomaly-detection/scan');
    return res.data.data;
  },

  // Smart Reorder
  runSmartReorder: async () => {
    const res = await agentClient.post('/smart-reorder/run');
    return res.data.data;
  },

  // Quality Control
  verifyGoodsReceipt: async (purchaseOrderId: string, receivedItems: any[]) => {
    const res = await agentClient.post('/quality-control/verify', { purchaseOrderId, receivedItems });
    return res.data.data;
  },

  // Blockchain
  getBlockchainLogs: async (filters?: { referenceModel?: string; eventType?: string }): Promise<BlockchainLog[]> => {
    const params = new URLSearchParams();
    if (filters?.referenceModel) params.set('referenceModel', filters.referenceModel);
    if (filters?.eventType) params.set('eventType', filters.eventType);
    const res = await agentClient.get(`/blockchain/logs?${params.toString()}`);
    return res.data.data;
  },
};

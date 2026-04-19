import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Agent routes live at /api/agents (not /api/v1)
const agentClient = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '')}/api/agents`,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

agentClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ────────────────────────────────────────────────────────────────────

export type AgentRunStatus = 'running' | 'success' | 'failed' | 'timeout';

export interface AgentRun {
  _id: string;
  agentId: string;
  workflowId: string;
  mastraRunId?: string;
  status: AgentRunStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  input: any;
  output?: any;
  error?: string;
  triggeredBy?: { _id: string; name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  stateful: boolean;
  model: string;
  framework: string;
  status: 'active' | 'inactive';
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number | null;
  avgDurationMs: number | null;
  avgDurationHuman: string | null;
  maxDurationMs: number | null;
  minDurationMs: number | null;
  lastRunAt: string | null;
}

export interface AgentStatusResponse {
  agents: AgentInfo[];
  recentNegotiations: any[];
  stats: {
    totalForecasts: number;
    totalOptimizations: number;
    totalNegotiations: number;
    totalBlockchainLogs: number;
    totalAgentRuns: number;
    totalSuccessfulRuns: number;
    overallSuccessRate: number | null;
    totalExecutionMs: number;
    totalExecutionHuman: string;
  };
}

export interface AgentMetadata {
  id: string;
  name: string;
  workflowId: string;
  description: string;
  longDescription: string;
  framework: string;
  model: string;
  category: string;
  stateful: boolean;
  steps: string[];
  tools: string[];
  inputs: { name: string; type: string; required: boolean; description: string }[];
  outputs: { name: string; type: string; description: string }[];
  triggeredBy: string;
}

export interface AgentDetailResponse {
  metadata: AgentMetadata;
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    timeoutRuns: number;
    successRate: number | null;
    avgDurationMs: number | null;
    avgDurationHuman: string | null;
    maxDurationMs: number | null;
    maxDurationHuman: string | null;
    minDurationMs: number | null;
    minDurationHuman: string | null;
    totalDurationMs: number;
    totalDurationHuman: string;
    firstRunAt: string | null;
    lastRunAt: string | null;
    statusBreakdown: Record<string, number>;
  };
  recentRuns: AgentRun[];
}

export interface NegotiationRound {
  roundNumber: number;
  agentOffer?: { unitPrice?: number; leadTimeDays?: number; paymentTermsDays?: number; quantity?: number };
  supplierCounterOffer?: { unitPrice?: number; leadTimeDays?: number; paymentTermsDays?: number; quantity?: number };
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

export type ReorderStatus = 'pending' | 'in_negotiation' | 'ordered' | 'rejected' | 'expired';
export type ReorderUrgency = 'critical' | 'high' | 'medium' | 'low';

export interface ReorderRecommendation {
  _id: string;
  product: { _id: string; name: string; sku: string; category: string; unit: string };
  warehouse: { _id: string; name: string; code: string };
  currentStock: number;
  availableStock: number;
  reorderPoint: number;
  safetyStock: number;
  avgDailyDemand: number;
  daysUntilStockout: number;
  pendingIncoming: number;
  recommendedQty: number;
  eoq: number;
  estimatedUnitPrice: number;
  estimatedTotalCost: number;
  urgency: ReorderUrgency;
  reason: string;
  supplierCount: number;
  minSupplierPrice: number;
  avgSupplierLeadTime: number;
  status: ReorderStatus;
  actedOnBy?: { _id: string; name: string; email: string };
  actedOnAt?: string;
  negotiationSessionId?: string;
  purchaseOrderId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  // Agent status & details
  getStatus: async (): Promise<AgentStatusResponse> => {
    const res = await agentClient.get('/status');
    return res.data.data;
  },

  getAgentDetails: async (agentId: string): Promise<AgentDetailResponse> => {
    const res = await agentClient.get(`/${agentId}`);
    return res.data.data;
  },

  getAgentRuns: async (agentId: string, filters?: { limit?: number; status?: string }): Promise<AgentRun[]> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.status) params.set('status', filters.status);
    const res = await agentClient.get(`/${agentId}/runs?${params.toString()}`);
    return res.data.data;
  },

  getAllRuns: async (limit = 30): Promise<AgentRun[]> => {
    const res = await agentClient.get(`/runs/all?limit=${limit}`);
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

  checkProcurement: async (productId: string, warehouseId: string) => {
    const res = await agentClient.post('/procurement/check', { productId, warehouseId });
    return res.data.data;
  },

  runSupplierEvaluation: async () => {
    const res = await agentClient.post('/supplier-evaluation/run');
    return res.data.data;
  },

  runAnomalyScan: async () => {
    const res = await agentClient.post('/anomaly-detection/scan');
    return res.data.data;
  },

  runSmartReorder: async () => {
    const res = await agentClient.post('/smart-reorder/run');
    return res.data.data;
  },

  getReorderRecommendations: async (filters?: {
    status?: string;
    urgency?: string;
  }): Promise<ReorderRecommendation[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.urgency) params.set('urgency', filters.urgency);
    const res = await agentClient.get(`/smart-reorder/recommendations?${params.toString()}`);
    return res.data.data;
  },

  orderReorderRecommendation: async (id: string) => {
    const res = await agentClient.post(`/smart-reorder/recommendations/${id}/order`);
    return res.data.data;
  },

  rejectReorderRecommendation: async (id: string, notes?: string) => {
    const res = await agentClient.post(`/smart-reorder/recommendations/${id}/reject`, { notes });
    return res.data.data;
  },

  verifyGoodsReceipt: async (purchaseOrderId: string, receivedItems: any[]) => {
    const res = await agentClient.post('/quality-control/verify', { purchaseOrderId, receivedItems });
    return res.data.data;
  },

  // Blockchain (admin only)
  getBlockchainLogs: async (filters?: { referenceModel?: string; eventType?: string }): Promise<BlockchainLog[]> => {
    const params = new URLSearchParams();
    if (filters?.referenceModel) params.set('referenceModel', filters.referenceModel);
    if (filters?.eventType) params.set('eventType', filters.eventType);
    const res = await agentClient.get(`/blockchain/logs?${params.toString()}`);
    return res.data.data;
  },
};

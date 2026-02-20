import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Optimization routes live at /api/warehouse-optimization (not /api/v1)
const optimizationClient = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '')}/api/warehouse-optimization`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

optimizationClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface TransferRecommendation {
  product: { _id: string; name: string; sku: string } | string;
  fromWarehouse: { _id: string; name: string; code: string } | string;
  toWarehouse: { _id: string; name: string; code: string } | string;
  quantity: number;
  reason: string;
  estimatedCostSaving?: number;
}

export interface OptimizationRecommendation {
  _id: string;
  generatedAt: string;
  generationDurationSeconds: number;
  transferRecommendations: TransferRecommendation[];
  reallocationSummary: string;
  predictedLogisticsCostReductionPercent?: number;
  predictedCapacityUtilizationImprovement?: number;
  status: 'pending' | 'accepted' | 'partially_accepted' | 'rejected';
}

export const optimizationService = {
  getLatest: async (): Promise<OptimizationRecommendation | null> => {
    const res = await optimizationClient.get('/latest');
    return res.data.data;
  },
  getAll: async (): Promise<OptimizationRecommendation[]> => {
    const res = await optimizationClient.get('/');
    return res.data.data;
  },
  updateStatus: async (id: string, status: string): Promise<OptimizationRecommendation> => {
    const res = await optimizationClient.patch(`/${id}/status`, { status });
    return res.data.data;
  },
};

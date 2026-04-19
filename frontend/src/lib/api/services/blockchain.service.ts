import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Create a separate client for blockchain endpoints (uses /api/blockchain without /v1)
const blockchainClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api/v1', '') + '/api/blockchain',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to blockchain requests
blockchainClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
blockchainClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const blockchainService = {
  // Get blockchain status (overall statistics)
  getStatus: async () => {
    const response = await blockchainClient.get('/status');
    return response.data.data;
  },

  // Get all blockchain logs (paginated)
  getLogs: async (limit = 50) => {
    const response = await blockchainClient.get('/logs', { params: { limit } });
    return response.data.data;
  },

  // Get logs for a specific PO
  getLogsByPO: async (purchaseOrderId: string) => {
    const response = await blockchainClient.get('/logs', {
      params: { purchaseOrderId },
    });
    return response.data.data;
  },

  // Get logs for a reference (used by verify page)
  getLogsByReference: async (referenceId: string) => {
    const response = await blockchainClient.get(`/logs/${referenceId}`);
    return response.data.data || [];
  },

  // Verify a document's blockchain hash
  verify: async (referenceId: string, eventType = 'po_created') => {
    const response = await blockchainClient.get(`/verify/${referenceId}`, {
      params: { eventType },
    });
    return response.data.data;
  },

  // Verify by reference (alias for verify, used by verify page)
  verifyByReference: async (referenceId: string, eventType = 'po_created') => {
    const response = await blockchainClient.get(`/verify/${referenceId}`, {
      params: { eventType },
    });
    return response.data.data;
  },

  // Get QR code for PO (if needed)
  getQRForPO: async (poId: string, eventType = 'po_created') => {
    // Return the QR code URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      qrUrl: `${baseUrl}/verify/${poId}?type=${eventType}`,
      poId,
      eventType,
    };
  },

  // Get latest logs with filters
  getLatestLogs: async (filters?: {
    eventType?: string;
    referenceModel?: string;
    status?: string;
    limit?: number;
  }) => {
    const response = await blockchainClient.get('/logs', { params: filters });
    return response.data.data || [];
  },
};

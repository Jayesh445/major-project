import apiClient from '../client';

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalWarehouses: number;
  activeSuppliers: number;
  avgWarehouseUtilisation: number;
}

export interface WarehouseStats {
  totalInventory: number;
  lowStockAlerts: number;
  pendingReceiving: number;
}

export interface ProcurementStats {
  pendingApprovals: number;
  openOrders: number;
  fulfilledThisMonth: number;
  totalSpendMTD: number;
}

export interface AgentStats {
  recentForecasts: any[];
  latestOptimization: any;
  totalForecasts: number;
  totalOptimizations: number;
}

export const dashboardService = {
  getAdminStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get('/dashboard/admin-stats');
    return res.data.data;
  },
  getWarehouseStats: async (): Promise<WarehouseStats> => {
    const res = await apiClient.get('/dashboard/warehouse-stats');
    return res.data.data;
  },
  getProcurementStats: async (): Promise<ProcurementStats> => {
    const res = await apiClient.get('/dashboard/procurement-stats');
    return res.data.data;
  },
  getAgentStats: async (): Promise<AgentStats> => {
    const res = await apiClient.get('/dashboard/agent-stats');
    return res.data.data;
  },
};

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/api/services/dashboard.service';

export const useAdminStats = () =>
  useQuery({
    queryKey: ['dashboard', 'admin-stats'],
    queryFn: dashboardService.getAdminStats,
    staleTime: 30_000,
  });

export const useWarehouseStats = () =>
  useQuery({
    queryKey: ['dashboard', 'warehouse-stats'],
    queryFn: dashboardService.getWarehouseStats,
    staleTime: 30_000,
  });

export const useProcurementStats = () =>
  useQuery({
    queryKey: ['dashboard', 'procurement-stats'],
    queryFn: dashboardService.getProcurementStats,
    staleTime: 30_000,
  });

export const useAgentStats = () =>
  useQuery({
    queryKey: ['dashboard', 'agent-stats'],
    queryFn: dashboardService.getAgentStats,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

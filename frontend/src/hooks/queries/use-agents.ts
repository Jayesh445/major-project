import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService, NegotiationTriggerInput } from '@/lib/api/services/agent.service';
import { toast } from 'sonner';

// ── Agent Status ─────────────────────────────────────────────────────────────

export const useAgentStatus = () =>
  useQuery({
    queryKey: ['agents', 'status'],
    queryFn: agentService.getStatus,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

// ── Negotiation ──────────────────────────────────────────────────────────────

export const useNegotiationSessions = (status?: string) =>
  useQuery({
    queryKey: ['agents', 'negotiations', status],
    queryFn: () => agentService.getNegotiationSessions(status),
    staleTime: 10_000,
  });

export const useNegotiationSession = (id: string) =>
  useQuery({
    queryKey: ['agents', 'negotiation', id],
    queryFn: () => agentService.getNegotiationSession(id),
    enabled: !!id,
  });

export const useTriggerNegotiation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NegotiationTriggerInput) => agentService.triggerNegotiation(input),
    onSuccess: () => {
      toast.success('Negotiation workflow triggered successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to trigger negotiation');
    },
  });
};

// ── Procurement ──────────────────────────────────────────────────────────────

export const useCheckProcurement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, warehouseId }: { productId: string; warehouseId: string }) =>
      agentService.checkProcurement(productId, warehouseId),
    onSuccess: () => {
      toast.success('Procurement check completed');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Procurement check failed');
    },
  });
};

// ── Supplier Evaluation ──────────────────────────────────────────────────────

export const useRunSupplierEvaluation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentService.runSupplierEvaluation,
    onSuccess: () => {
      toast.success('Supplier evaluation completed');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Supplier evaluation failed');
    },
  });
};

// ── Anomaly Detection ────────────────────────────────────────────────────────

export const useRunAnomalyScan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentService.runAnomalyScan,
    onSuccess: () => {
      toast.success('Anomaly scan completed');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Anomaly scan failed');
    },
  });
};

// ── Smart Reorder ────────────────────────────────────────────────────────────

export const useRunSmartReorder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentService.runSmartReorder,
    onSuccess: () => {
      toast.success('Smart reorder analysis completed');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Smart reorder failed');
    },
  });
};

// ── Quality Control ──────────────────────────────────────────────────────────

export const useVerifyGoodsReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseOrderId, receivedItems }: { purchaseOrderId: string; receivedItems: any[] }) =>
      agentService.verifyGoodsReceipt(purchaseOrderId, receivedItems),
    onSuccess: () => {
      toast.success('Goods receipt verified and logged to blockchain');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Verification failed');
    },
  });
};

// ── Blockchain ───────────────────────────────────────────────────────────────

export const useBlockchainLogs = (filters?: { referenceModel?: string; eventType?: string }) =>
  useQuery({
    queryKey: ['agents', 'blockchain', filters],
    queryFn: () => agentService.getBlockchainLogs(filters),
    staleTime: 30_000,
  });

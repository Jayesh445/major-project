import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blockchainService } from '@/lib/api/services/blockchain.service';

export const usePendingTransactions = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['blockchain', 'pending'],
    queryFn: () => blockchainService.getPendingTransactions(),
    staleTime: 0, // Always fetch fresh
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true,
  });
};

export const useTransactionStatus = (txHash: string) => {
  return useQuery({
    queryKey: ['blockchain', 'tx-status', txHash],
    queryFn: () => blockchainService.getTransactionStatus(txHash),
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    enabled: !!txHash,
  });
};

export const useTransactionWithLogs = (referenceId: string) => {
  return useQuery({
    queryKey: ['blockchain', 'tx-with-logs', referenceId],
    queryFn: () => blockchainService.getTransactionWithLogs(referenceId),
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    enabled: !!referenceId,
  });
};

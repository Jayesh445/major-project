import { useQuery } from '@tanstack/react-query';
import { blockchainService } from '@/lib/api/services/blockchain.service';

export const useVerifyReference = (referenceId: string, eventType = 'po_created') =>
  useQuery({
    queryKey: ['blockchain', 'verify', referenceId, eventType],
    queryFn: () => blockchainService.verifyByReference(referenceId, eventType),
    enabled: !!referenceId,
    staleTime: 30_000,
  });

export const useLogsByReference = (referenceId: string) =>
  useQuery({
    queryKey: ['blockchain', 'logs', referenceId],
    queryFn: () => blockchainService.getLogsByReference(referenceId),
    enabled: !!referenceId,
    staleTime: 15_000,
    refetchInterval: 20_000, // poll for confirmation updates
  });

export const useLatestBlockchainLogs = (filters?: {
  eventType?: string;
  referenceModel?: string;
  status?: string;
  limit?: number;
}) =>
  useQuery({
    queryKey: ['blockchain', 'latest', filters],
    queryFn: () => blockchainService.getLatestLogs(filters),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

export const useQRCode = (poId: string, eventType = 'po_created') =>
  useQuery({
    queryKey: ['qr', poId, eventType],
    queryFn: () => blockchainService.getQRForPO(poId, eventType),
    enabled: !!poId,
    staleTime: Infinity,
  });

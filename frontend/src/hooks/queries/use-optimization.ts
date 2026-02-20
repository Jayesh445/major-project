import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizationService } from '@/lib/api/services/optimization.service';
import { useToast } from '@/hooks/use-toast';

export const useLatestOptimization = () =>
  useQuery({
    queryKey: ['optimization', 'latest'],
    queryFn: optimizationService.getLatest,
    staleTime: 60_000,
  });

export const useAllOptimizations = () =>
  useQuery({
    queryKey: ['optimization', 'all'],
    queryFn: optimizationService.getAll,
    staleTime: 60_000,
  });

export const useUpdateOptimizationStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      optimizationService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization'] });
      toast({ title: 'Status updated', description: 'Recommendation status has been updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    },
  });
};

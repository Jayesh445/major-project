import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poService } from '@/lib/api/services/purchase-order.service';
import { useToast } from '@/hooks/use-toast';
import { POQueryParams, CreatePODto, UpdatePODto } from '@/types';

export const usePurchaseOrders = (params?: POQueryParams) => {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => poService.getAll(params),
  });
};

export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => poService.getById(id),
    enabled: !!id,
  });
};

export const useCreatePO = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreatePODto) => poService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({
        title: 'PO created',
        description: 'Purchase Order created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create PO',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePO = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePODto }) => 
      poService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', data._id] });
      toast({
        title: 'PO updated',
        description: 'Purchase Order updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update PO',
        variant: 'destructive',
      });
    },
  });
};

export const useApprovePO = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => poService.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', data._id] });
      toast({
        title: 'PO Approved',
        description: 'Purchase Order has been approved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve PO',
        variant: 'destructive',
      });
    },
  });
};

export const useRejectPO = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      poService.reject(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', data._id] });
      toast({
        title: 'PO Rejected',
        description: 'Purchase Order has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject PO',
        variant: 'destructive',
      });
    },
  });
};

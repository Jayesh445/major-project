import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/lib/api/services/inventory.service';
import { useToast } from '@/hooks/use-toast';
import { InventoryQueryParams, StockAdjustmentDto, StockTransferDto } from '@/types';

export const useInventory = (params?: InventoryQueryParams) => {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryService.getAll(params),
  });
};

export const useProductInventory = (productId: string) => {
  return useQuery({
    queryKey: ['inventory', 'product', productId],
    queryFn: () => inventoryService.getByProduct(productId),
    enabled: !!productId,
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: StockAdjustmentDto) => inventoryService.adjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock affects product status
      toast({
        title: 'Stock adjusted',
        description: 'Inventory levels have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to adjust stock',
        variant: 'destructive',
      });
    },
  });
};

export const useTransferStock = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: StockTransferDto) => inventoryService.transferStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Stock transferred',
        description: 'Stock transfer initiated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to transfer stock',
        variant: 'destructive',
      });
    },
  });
};

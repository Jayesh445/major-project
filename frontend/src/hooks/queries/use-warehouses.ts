import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from '@/lib/api/services/warehouse.service';
import { useToast } from '@/hooks/use-toast';
import { WarehouseQueryParams, CreateWarehouseDto, UpdateWarehouseDto } from '@/types';

export const useWarehouses = (params?: WarehouseQueryParams) => {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: () => warehouseService.getAll(params),
  });
};

export const useWarehouse = (id: string) => {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => warehouseService.getById(id),
    enabled: !!id,
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateWarehouseDto) => warehouseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({
        title: 'Warehouse created',
        description: 'Warehouse added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create warehouse',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseDto }) => 
      warehouseService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', data._id] });
      toast({
        title: 'Warehouse updated',
        description: 'Warehouse details updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update warehouse',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => warehouseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({
        title: 'Warehouse deleted',
        description: 'Warehouse removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete warehouse',
        variant: 'destructive',
      });
    },
  });
};

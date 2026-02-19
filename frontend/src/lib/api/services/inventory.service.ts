import apiClient from '../client';
import { 
  InventoryItem, 
  StockAdjustmentDto, 
  StockTransferDto, 
  InventoryQueryParams 
} from '@/types/inventory.types';
import { PaginatedResponse } from '@/types/index';

export const inventoryService = {
  getAll: async (params?: InventoryQueryParams): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await apiClient.get('/inventory', { params });
    return response.data.data;
  },

  getByProduct: async (productId: string): Promise<InventoryItem[]> => {
    const response = await apiClient.get(`/inventory/product/${productId}`);
    return response.data.data;
  },

  adjustStock: async (data: StockAdjustmentDto): Promise<InventoryItem> => {
    const response = await apiClient.post('/inventory/adjust', data);
    return response.data.data;
  },

  transferStock: async (data: StockTransferDto): Promise<void> => {
    await apiClient.post('/inventory/transfer', data);
  },
};

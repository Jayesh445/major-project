import apiClient from '../client';
import { 
  Warehouse, 
  CreateWarehouseDto, 
  UpdateWarehouseDto, 
  WarehouseQueryParams 
} from '@/types/warehouse.types';
import { PaginatedResponse } from '@/types/index';

export const warehouseService = {
  getAll: async (params?: WarehouseQueryParams): Promise<PaginatedResponse<Warehouse>> => {
    const response = await apiClient.get('/warehouses', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Warehouse> => {
    const response = await apiClient.get(`/warehouses/${id}`);
    return response.data.data;
  },

  create: async (data: CreateWarehouseDto): Promise<Warehouse> => {
    const response = await apiClient.post('/warehouses', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateWarehouseDto): Promise<Warehouse> => {
    const response = await apiClient.put(`/warehouses/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  },
};

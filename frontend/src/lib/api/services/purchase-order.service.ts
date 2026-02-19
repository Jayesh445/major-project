import apiClient from '../client';
import { 
  PurchaseOrder, 
  CreatePODto, 
  UpdatePODto, 
  POQueryParams 
} from '@/types/purchase-order.types';
import { PaginatedResponse } from '@/types/index';

export const poService = {
  getAll: async (params?: POQueryParams): Promise<PaginatedResponse<PurchaseOrder>> => {
    const response = await apiClient.get('/purchase-orders', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePODto): Promise<PurchaseOrder> => {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdatePODto): Promise<PurchaseOrder> => {
    const response = await apiClient.put(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  approve: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string, reason: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${id}/reject`, { reason });
    return response.data.data;
  },
};

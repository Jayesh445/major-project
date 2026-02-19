import apiClient from '../client';
import { 
  Supplier, 
  CreateSupplierDto, 
  UpdateSupplierDto, 
  SupplierQueryParams 
} from '@/types/supplier.types';
import { PaginatedResponse } from '@/types/index';

export const supplierService = {
  getAll: async (params?: SupplierQueryParams): Promise<PaginatedResponse<Supplier>> => {
    const response = await apiClient.get('/suppliers', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSupplierDto): Promise<Supplier> => {
    const response = await apiClient.post('/suppliers', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateSupplierDto): Promise<Supplier> => {
    const response = await apiClient.put(`/suppliers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};

import apiClient from '../client';
import { 
  Product, 
  CreateProductDto, 
  UpdateProductDto, 
  ProductQueryParams 
} from '@/types/product.types';
import { PaginatedResponse } from '@/types/index';

export const productService = {
  getAll: async (params?: ProductQueryParams): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get('/products', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateProductDto): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products/low-stock');
    return response.data.data;
  },
};

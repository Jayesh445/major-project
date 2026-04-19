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
    const response = await apiClient.put(`/purchase-orders/${id}/approve`, {});
    return response.data.data;
  },

  reject: async (id: string, reason: string): Promise<PurchaseOrder> => {
    const response = await apiClient.put(`/purchase-orders/${id}/reject`, { reason });
    return response.data.data;
  },

  submitForApproval: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.put(`/purchase-orders/${id}/submit-for-approval`, {});
    return response.data.data;
  },

  sendToSupplier: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.put(`/purchase-orders/${id}/send`, {});
    return response.data.data;
  },

  acknowledge: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.put(`/purchase-orders/${id}/acknowledge`, {});
    return response.data.data;
  },

  receive: async (id: string, po?: any): Promise<PurchaseOrder> => {
    // Auto-receive all line items
    const lineItems = po?.lineItems?.map((item: any) => ({
      lineItemId: item._id,
      receivedQty: item.orderedQty - item.receivedQty, // Receive remaining qty
    })) || [];

    const response = await apiClient.put(`/purchase-orders/${id}/receive`, {
      lineItems,
      notes: "Received via dashboard",
    });
    return response.data.data;
  },

  cancel: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.delete(`/purchase-orders/${id}`);
    return response.data.data;
  },

  getPending: async (): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get('/purchase-orders/pending');
    return response.data.data;
  },

  getAnalytics: async (): Promise<any> => {
    const response = await apiClient.get('/purchase-orders/analytics');
    return response.data.data;
  },
};

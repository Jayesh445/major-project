import { QueryParams } from './index';

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'received' | 'cancelled' | 'rejected';

export interface POLineItem {
  product: string; // Product ID
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: string | any; // Supplier ID or object
  warehouse: string | any;
  items: POLineItem[];
  status: POStatus;
  totalAmount: number;
  createdBy: string;
  approvedBy?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePODto {
  supplier: string;
  warehouse: string;
  items: {
    product: string;
    quantity: number;
    unitPrice: number;
  }[];
  expectedDeliveryDate?: string;
}

export interface UpdatePODto {
  status?: POStatus;
  items?: {
    product: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface POQueryParams extends QueryParams {
  status?: POStatus;
  supplier?: string;
  warehouse?: string;
}

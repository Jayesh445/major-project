import { QueryParams } from './index';

export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitPrice: number;
  reorderPoint: number;
  safetyStock: number;
  reorderQty: number;
  leadTimeDays: number;
  primarySupplier: string; // Supplier ID
  imageUrl?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit?: string;
  unitPrice: number;
  reorderPoint?: number;
  safetyStock?: number;
  reorderQty?: number;
  leadTimeDays?: number;
  primarySupplier?: string;
  imageUrl?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: Product['status'];
}

export interface ProductQueryParams extends QueryParams {
  category?: string;
  status?: string;
  supplier?: string;
}

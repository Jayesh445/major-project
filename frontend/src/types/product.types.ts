import { QueryParams } from './index';

export type ProductCategory =
  | 'writing_instruments'
  | 'paper_products'
  | 'office_supplies'
  | 'art_supplies'
  | 'filing_storage'
  | 'desk_accessories'
  | 'other';

export type ProductUnit = 'piece' | 'pack' | 'box' | 'ream' | 'set' | 'kg' | 'liter';

export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  unit: ProductUnit;
  unitPrice: number;
  reorderPoint: number;
  safetyStock: number;
  reorderQty: number;
  leadTimeDays: number;
  primarySupplier?: string | { _id: string; companyName: string };
  alternateSuppliers?: string[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  unit?: ProductUnit;
  unitPrice: number;
  reorderPoint?: number;
  safetyStock?: number;
  reorderQty?: number;
  leadTimeDays?: number;
  primarySupplier?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQueryParams extends QueryParams {
  category?: string;
  isActive?: string;
  supplier?: string;
}

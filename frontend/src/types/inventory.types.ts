import { QueryParams } from './index';

export interface InventoryItem {
  _id: string;
  product: string | any; // Product ID or populated object
  warehouse: string | any; // Warehouse ID or populated object
  quantity: number;
  zone?: string;
  lastUpdated: string;
}

export interface StockAdjustmentDto {
  productId: string;
  warehouseId: string;
  quantity: number;
  type: 'in' | 'out' | 'set';
  reason: string;
}

export interface StockTransferDto {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
}

export interface InventoryQueryParams extends QueryParams {
  warehouse?: string;
  product?: string;
  lowStock?: boolean;
}

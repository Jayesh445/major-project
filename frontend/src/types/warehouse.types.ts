import { QueryParams } from './index';

export interface Warehouse {
  _id: string;
  name: string;
  location: string;
  capacity: number;
  manager: string; // User ID
  zones: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  location: string;
  capacity: number;
  manager: string;
  zones?: string[];
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {
  status?: Warehouse['status'];
}

export interface WarehouseQueryParams extends QueryParams {
  status?: string;
}

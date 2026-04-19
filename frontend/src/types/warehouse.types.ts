import { QueryParams } from './index';

export type ZoneType = 'bulk' | 'fast_moving' | 'slow_moving' | 'fragile' | 'general';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  coordinates?: Coordinates;
}

export interface Zone {
  _id?: string;
  zoneCode: string;
  type: ZoneType;
  capacityUnits: number;
  currentLoad: number;
}

export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  location: Location;
  totalCapacity: number;
  usedCapacity: number;
  zones: Zone[];
  manager?: string | { _id: string; name: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  code: string;
  location: Location;
  totalCapacity: number;
  usedCapacity?: number;
  zones?: Zone[];
  manager?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseDto extends Partial<CreateWarehouseDto> {}

export interface WarehouseQueryParams extends QueryParams {
  isActive?: string;
}

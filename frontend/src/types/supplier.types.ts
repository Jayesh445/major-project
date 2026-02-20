import { QueryParams } from './index';

export interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'blacklisted';
  rating: number;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {
  status?: Supplier['status'];
}

export interface SupplierQueryParams extends QueryParams {
  status?: string;
}

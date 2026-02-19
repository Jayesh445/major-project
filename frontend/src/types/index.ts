export * from './auth.types';
export * from './user.types';
export * from './product.types';
export * from './inventory.types';
export * from './purchase-order.types';
export * from './supplier.types';
export * from './warehouse.types';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

import { QueryParams } from './index';

export interface CatalogProduct {
  product: string | { _id: string; name: string; sku: string };
  unitPrice: number;
  leadTimeDays: number;
  moq: number;
}

export interface ContractTerms {
  paymentTermsDays: number;
  deliveryTerms: string;
  returnPolicy: string;
  validUntil?: string;
}

export interface NegotiationStats {
  totalNegotiations: number;
  acceptedOffers: number;
  averageSavingsPercent: number;
}

export interface Supplier {
  _id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  catalogProducts: CatalogProduct[];
  currentContractTerms?: ContractTerms;
  rating: number;
  isApproved: boolean;
  negotiationStats: NegotiationStats;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  rating?: number;
  isApproved?: boolean;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

export interface SupplierQueryParams extends QueryParams {
  isApproved?: string;
  minRating?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

import { QueryParams } from './index';

export type POStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_supplier'
  | 'acknowledged'
  | 'partially_received'
  | 'fully_received'
  | 'cancelled';

export type TriggeredBy = 'auto_replenishment' | 'manual' | 'negotiation_agent';

export interface POLineItem {
  _id?: string;
  product: string | { _id: string; name: string; sku: string };
  sku: string;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: string | { _id: string; companyName: string; contactEmail?: string };
  warehouse: string | { _id: string; name: string; code: string };
  lineItems: POLineItem[];
  totalAmount: number;
  currency: string;
  status: POStatus;
  triggeredBy: TriggeredBy;
  triggeredAt: string;
  blockchainTxHash?: string;
  blockchainLoggedAt?: string;
  negotiationSession?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePODto {
  supplier: string;
  warehouse: string;
  lineItems: {
    product: string;
    sku: string;
    orderedQty: number;
    unitPrice: number;
  }[];
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface UpdatePODto {
  status?: POStatus;
  notes?: string;
}

export interface POQueryParams extends QueryParams {
  status?: POStatus;
  supplier?: string;
  warehouse?: string;
}

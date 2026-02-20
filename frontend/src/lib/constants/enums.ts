export enum UserRole {
  ADMIN = 'admin',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  PROCUREMENT_OFFICER = 'procurement_officer',
  SUPPLIER = 'supplier',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum POStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SENT = 'sent',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
}

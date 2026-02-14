/**
 * Barrel export file for all Mongoose models
 *
 * This file provides a centralized export point for all models,
 * making it easy to import them throughout the application.
 *
 * Usage:
 * import { User, Product, Warehouse } from '@/modules';
 */

// User and Authentication
export { default as User } from './user/model';
export type { IUser, UserRole, INotificationPreferences } from './user/model';

// Warehouse Management
export { default as Warehouse } from './warehouse/model';
export type { IWarehouse, ILocation, IZone, ICoordinates, ZoneType } from './warehouse/model';

// Supplier Management
export { default as Supplier } from './supplier/model';
export type {
  ISupplier,
  ICatalogProduct,
  IContractTerms,
  INegotiationStats,
} from './supplier/model';

// Product Catalog
export { default as Product } from './product/model';
export type { IProduct, ProductCategory, ProductUnit } from './product/model';

// Inventory Management
export { default as Inventory } from './inventory/model';
export type { IInventory, ITransaction, TransactionType } from './inventory/model';

// Purchase Orders
export { default as PurchaseOrder } from './purchase-order/model';
export type { IPurchaseOrder, ILineItem, POStatus, TriggeredBy } from './purchase-order/model';

// Negotiation Sessions
export { default as NegotiationSession } from './negotiation/model';
export type {
  INegotiationSession,
  INegotiationRound,
  IAgentConstraints,
  IFinalTerms,
  InitiatedBy,
  NegotiationStatus,
  RoundStatus,
} from './negotiation/model';

// Demand Forecasting
export { default as DemandForecast } from './forecast/model';
export type { IDemandForecast, IDailyForecast } from './forecast/model';

// Blockchain Logging
export { default as BlockchainLog } from './blockchain/model';
export type {
  IBlockchainLog,
  EventType,
  ReferenceModel,
  ConfirmationStatus,
} from './blockchain/model';

// Notifications
export { default as Notification } from './notification/model';
export type {
  INotification,
  NotificationType,
  RelatedModel,
  NotificationChannel,
} from './notification/model';

// Warehouse Optimization
export { default as WarehouseOptimizationRecommendation } from './warehouse-optimization/model';
export type {
  IWarehouseOptimizationRecommendation,
  ITransferRecommendation,
  RecommendationStatus,
} from './warehouse-optimization/model';

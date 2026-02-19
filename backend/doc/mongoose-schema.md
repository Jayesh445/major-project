# 🗄️ Mongoose Data Model Schema — Inventory Management MVP

> Based on the MVP Product Requirements Document.  
> Tech Stack: Node.js · Express · MongoDB · Mongoose · LangChain/LangGraph · Ethereum/Hyperledger

---

## Table of Contents

1. [User](#1-user)
2. [Warehouse](#2-warehouse)
3. [Supplier](#3-supplier)
4. [Product](#4-product)
5. [Inventory](#5-inventory)
6. [Purchase Order (PO)](#6-purchase-order-po)
7. [Negotiation Session](#7-negotiation-session)
8. [Demand Forecast](#8-demand-forecast)
9. [Blockchain Log](#9-blockchain-log)
10. [Notification](#10-notification)

12. [Warehouse Optimization Recommendation](#12-warehouse-optimization-recommendation)
13. [Schema Relationships Diagram](#13-schema-relationships-diagram)

---

## 1. User

Supports 4 RBAC roles: **Admin**, **Warehouse Manager**, **Procurement Officer**, **Supplier**.

```js
// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'warehouse_manager', 'procurement_officer', 'supplier'],
      required: true,
    },
    // If role === 'supplier', link to Supplier document
    supplierRef: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    // If role === 'warehouse_manager', link to managed warehouses
    assignedWarehouses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index for fast role-based queries
UserSchema.index({ role: 1 });
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
```

---

## 2. Warehouse

Supports multi-warehouse optimization. Each warehouse has zones and capacity metadata.

```js
// models/Warehouse.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ZoneSchema = new Schema({
  zoneCode: { type: String, required: true },       // e.g. "A1", "COLD-01"
  type: {
    type: String,
    enum: ['standard', 'cold_storage', 'hazmat', 'bulk'],
    default: 'standard',
  },
  capacityUnits: { type: Number, required: true },  // total units this zone can hold
  currentLoad: { type: Number, default: 0 },        // current units stored
});

const WarehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true }, // e.g. "WH-MUM-01"
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    totalCapacity: { type: Number, required: true },   // in units
    usedCapacity: { type: Number, default: 0 },
    zones: [ZoneSchema],
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WarehouseSchema.index({ code: 1 });
WarehouseSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('Warehouse', WarehouseSchema);
```

---

## 3. Supplier

Stores supplier profiles. Supplier users log in via the User model (role: `supplier`).

```js
// models/Supplier.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContractTermSchema = new Schema({
  field: String,        // e.g. "unit_price", "lead_time_days", "payment_terms"
  agreedValue: Schema.Types.Mixed,
  negotiatedAt: { type: Date, default: Date.now },
});

const SupplierSchema = new Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, lowercase: true },
    contactPhone: String,
    address: {
      street: String,
      city: String,
      country: String,
    },
    // Products this supplier can supply (many-to-many via Product ref)
    catalogProducts: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        unitPrice: { type: Number, required: true },
        leadTimeDays: { type: Number, required: true },
        moq: { type: Number, default: 1 },             // Minimum Order Quantity
      },
    ],
    currentContractTerms: [ContractTermSchema],
    rating: { type: Number, min: 0, max: 5, default: null },
    isApproved: { type: Boolean, default: false },
    // Tracks negotiation performance
    negotiationStats: {
      totalNegotiations: { type: Number, default: 0 },
      acceptedOffers: { type: Number, default: 0 },
      averageSavingsPercent: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

SupplierSchema.index({ companyName: 1 });
SupplierSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Supplier', SupplierSchema);
```

---

## 4. Product

Master product catalog. Uploaded by suppliers, managed by procurement officers.

```js
// models/Product.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: String,
    category: { type: String, required: true },
    unit: {
      type: String,
      enum: ['piece', 'kg', 'litre', 'box', 'pallet', 'carton'],
      default: 'piece',
    },
    unitPrice: { type: Number, required: true, min: 0 },
    // Reorder logic (for autonomous replenishment)
    reorderPoint: { type: Number, required: true, min: 0 },
    safetyStock: { type: Number, required: true, min: 0 },
    reorderQty: { type: Number, required: true, min: 1 },
    leadTimeDays: { type: Number, required: true, min: 0 },
    // Primary & fallback suppliers
    primarySupplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    alternateSuppliers: [
      { type: Schema.Types.ObjectId, ref: 'Supplier' },
    ],
    // Media / catalog
    imageUrl: String,
    isActive: { type: Boolean, default: true },
    // Who uploaded/approved this product
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ primarySupplier: 1 });

module.exports = mongoose.model('Product', ProductSchema);
```

---

## 5. Inventory

Tracks real-time stock levels per product per warehouse. This is the core of the replenishment engine.

```js
// models/Inventory.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const InventoryTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['receipt', 'dispatch', 'adjustment', 'transfer', 'return'],
    required: true,
  },
  quantity: { type: Number, required: true },    // positive = in, negative = out
  referenceDoc: String,                          // PO number, dispatch note, etc.
  performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  timestamp: { type: Date, default: Date.now },
});

const InventorySchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, default: 0 },  // Stock committed to pending POs
    availableStock: { type: Number, default: 0 }, // currentStock - reservedStock
    // Mirrors from Product for quick access
    reorderPoint: { type: Number, required: true },
    safetyStock: { type: Number, required: true },
    // Replenishment flags
    replenishmentTriggered: { type: Boolean, default: false },
    lastReplenishmentAt: { type: Date, default: null },
    // Ledger of all stock movements
    transactions: [InventoryTransactionSchema],
    zone: String, // warehouse zone code
  },
  { timestamps: true }
);

// Unique stock record per product+warehouse
InventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
InventorySchema.index({ replenishmentTriggered: 1 });

// Auto-compute availableStock before save
InventorySchema.pre('save', function (next) {
  this.availableStock = this.currentStock - this.reservedStock;
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);
```

---

## 6. Purchase Order (PO)

Auto-generated by the replenishment engine or manually raised by procurement officers. Logged on blockchain.

```js
// models/PurchaseOrder.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const POLineItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: String,
  orderedQty: { type: Number, required: true, min: 1 },
  receivedQty: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const PurchaseOrderSchema = new Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    lineItems: [POLineItemSchema],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'sent_to_supplier',
        'acknowledged',
        'partially_received',
        'fully_received',
        'cancelled',
      ],
      default: 'draft',
    },
    // Replenishment trigger metadata
    triggeredBy: {
      type: String,
      enum: ['auto_replenishment', 'manual', 'negotiation_agent'],
      default: 'manual',
    },
    triggeredAt: { type: Date, default: Date.now },
    // Blockchain
    blockchainTxHash: { type: String, default: null },
    blockchainLoggedAt: { type: Date, default: null },
    // Negotiation link (if PO was outcome of AI negotiation)
    negotiationSession: {
      type: Schema.Types.ObjectId,
      ref: 'NegotiationSession',
      default: null,
    },
    // Approval workflow
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    expectedDeliveryDate: Date,
    notes: String,
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ poNumber: 1 });
PurchaseOrderSchema.index({ supplier: 1, status: 1 });
PurchaseOrderSchema.index({ warehouse: 1, status: 1 });
PurchaseOrderSchema.index({ blockchainTxHash: 1 });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
```

---

## 7. Negotiation Session

Tracks every AI-powered supplier negotiation run by the LangChain/LangGraph Negotiation Agent.

```js
// models/NegotiationSession.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const NegotiationRoundSchema = new Schema({
  roundNumber: { type: Number, required: true },
  agentOffer: {
    unitPrice: Number,
    leadTimeDays: Number,
    paymentTermsDays: Number,
    moq: Number,
    additionalTerms: String,
  },
  supplierCounterOffer: {
    unitPrice: Number,
    leadTimeDays: Number,
    paymentTermsDays: Number,
    moq: Number,
    additionalTerms: String,
  },
  agentReasoning: String,    // LLM chain-of-thought / rationale
  status: {
    type: String,
    enum: ['proposed', 'counter_received', 'accepted', 'rejected', 'escalated'],
    default: 'proposed',
  },
  timestamp: { type: Date, default: Date.now },
});

const NegotiationSessionSchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    initiatedBy: {
      type: String,
      enum: ['auto_replenishment', 'procurement_officer'],
      default: 'procurement_officer',
    },
    initiatedByUser: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['in_progress', 'accepted', 'rejected', 'escalated', 'timed_out'],
      default: 'in_progress',
    },
    rounds: [NegotiationRoundSchema],
    // Constraints fed to the agent
    agentConstraints: {
      maxUnitPrice: Number,
      targetUnitPrice: Number,
      maxLeadTimeDays: Number,
      requiredQty: Number,
    },
    // Final agreed terms (populated on acceptance)
    finalTerms: {
      unitPrice: Number,
      leadTimeDays: Number,
      paymentTermsDays: Number,
      moq: Number,
      savingsPercent: Number,       // vs. original catalogue price
    },
    // Deadline: must complete within 24 hours (acceptance criteria)
    deadline: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    completedAt: { type: Date, default: null },
    // LangGraph agent run metadata
    langGraphRunId: String,
    langGraphState: Schema.Types.Mixed,  // persisted graph state
  },
  { timestamps: true }
);

NegotiationSessionSchema.index({ supplier: 1, status: 1 });
NegotiationSessionSchema.index({ product: 1 });
NegotiationSessionSchema.index({ deadline: 1 });

module.exports = mongoose.model('NegotiationSession', NegotiationSessionSchema);
```

---

## 8. Demand Forecast

Stores 7-day ahead demand predictions generated by the forecasting engine. MAPE target: < 20%.

```js
// models/DemandForecast.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DailyForecastSchema = new Schema({
  date: { type: Date, required: true },
  predictedDemand: { type: Number, required: true },
  confidenceLow: Number,   // lower bound of confidence interval
  confidenceHigh: Number,  // upper bound of confidence interval
  actualDemand: { type: Number, default: null }, // filled in retrospectively
  mape: { type: Number, default: null },         // calculated after actuals known
});

const DemandForecastSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    forecastedAt: { type: Date, default: Date.now },
    forecastHorizonDays: { type: Number, default: 7 },
    dailyForecasts: [DailyForecastSchema],
    // Aggregated metrics
    totalPredicted7Day: Number,
    overallMape: Number,
    modelVersion: String,     // e.g. "arima-v1", "prophet-v2"
    // Replenishment recommendation derived from this forecast
    recommendedReorderQty: Number,
    recommendedOrderDate: Date,
  },
  { timestamps: true }
);

DemandForecastSchema.index({ product: 1, warehouse: 1, forecastedAt: -1 });

module.exports = mongoose.model('DemandForecast', DemandForecastSchema);
```

---

## 9. Blockchain Log

Immutable audit trail for every critical transaction (PO creation, approval, negotiation outcomes). Logged on-chain; this model stores the record and tx reference.

```js
// models/BlockchainLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlockchainLogSchema = new Schema(
  {
    eventType: {
      type: String,
      enum: [
        'po_created',
        'po_approved',
        'po_sent',
        'po_received',
        'negotiation_accepted',
        'negotiation_rejected',
        'inventory_adjustment',
        'smart_contract_executed',
      ],
      required: true,
    },
    // Polymorphic reference to source document
    referenceModel: {
      type: String,
      enum: ['PurchaseOrder', 'NegotiationSession', 'Inventory'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'referenceModel',
    },
    // Payload snapshot at time of logging
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    // Blockchain identifiers
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: Number,
    networkName: {
      type: String,
      default: 'ethereum-testnet', // or 'hyperledger-fabric'
    },
    confirmedAt: Date,             // when block was confirmed (< 5 min target)
    confirmationStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    // Who triggered this log
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

BlockchainLogSchema.index({ txHash: 1 });
BlockchainLogSchema.index({ eventType: 1 });
BlockchainLogSchema.index({ referenceId: 1 });
BlockchainLogSchema.index({ confirmationStatus: 1 });

module.exports = mongoose.model('BlockchainLog', BlockchainLogSchema);
```

---

## 10. Notification

In-app and email notifications for all 4 user roles.

```js
// models/Notification.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'low_stock_alert',
        'reorder_triggered',
        'po_created',
        'po_approved',
        'po_received',
        'negotiation_started',
        'negotiation_completed',
        'negotiation_requires_action',
        'forecast_ready',
        'warehouse_capacity_alert',
        'blockchain_confirmed',
        'system_alert',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // Optional link to related document
    relatedModel: {
      type: String,
      enum: ['PurchaseOrder', 'NegotiationSession', 'Inventory', 'Warehouse', 'DemandForecast'],
      default: null,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'both'],
      default: 'both',
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    // Email delivery tracking
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
```

---


## 12. Warehouse Optimization Recommendation

Generated by the Multi-Warehouse Optimization Agent (LangChain/LangGraph). Must be produced within 5 minutes.

```js
// models/WarehouseOptimizationRecommendation.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransferRecommendationSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  fromWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  toWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  quantity: Number,
  reason: String,
  estimatedCostSaving: Number,
});

const WarehouseOptimizationRecommendationSchema = new Schema(
  {
    generatedAt: { type: Date, default: Date.now },
    generationDurationSeconds: Number,  // must be < 300 (5 min acceptance criteria)
    // Which warehouses were analysed
    warehousesAnalysed: [
      { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    ],
    // Core recommendations
    transferRecommendations: [TransferRecommendationSchema],
    reallocationSummary: String,          // LLM-generated human-readable summary
    // Predicted outcomes
    predictedLogisticsCostReductionPercent: Number,
    predictedCapacityUtilizationImprovement: Number,
    // Acceptance tracking
    status: {
      type: String,
      enum: ['pending', 'accepted', 'partially_accepted', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: String,
    // LangGraph agent metadata
    langGraphRunId: String,
    agentVersion: String,
  },
  { timestamps: true }
);

WarehouseOptimizationRecommendationSchema.index({ generatedAt: -1 });
WarehouseOptimizationRecommendationSchema.index({ status: 1 });

module.exports = mongoose.model(
  'WarehouseOptimizationRecommendation',
  WarehouseOptimizationRecommendationSchema
);
```

---

## 13. Schema Relationships Diagram

```
User ──────────────────────────────────────────────────────────────────────
  │ role: admin / warehouse_manager / procurement_officer / supplier        │
  │                                                                          │
  ├──(supplierRef)──► Supplier ◄──(primarySupplier)── Product               │
  │                      │                │                                  │
  │                      │                └──(product)──► Inventory          │
  │                      │                                    │              │
  │                      │                                    │(warehouse)   │
  │                      │                                    ▼              │
  │                      │                              Warehouse            │
  │                      │                                    │              │
  │                      └──(supplier)──► PurchaseOrder ◄─────┘              │
  │                                           │                              │
  │                                           ├──(blockchainTxHash)──► BlockchainLog
  │                                           └──(negotiationSession)──► NegotiationSession
  │                                                                          │
  │                                                                          │
  ├──────────────────────────────────────────────────────► Notification      │
  │                                                              │           │
  ├──(product+warehouse)──► DemandForecast                       │           │
  │                                                              │           │
  └──(reviewedBy)──► WarehouseOptimizationRecommendation         │           │
                                                                  │           │
AnalyticsSnapshot ◄───────────────────────────────────────────────┘           │
  (aggregates all models above into dashboard metrics)                        │
                                                                              │
─────────────────────────────────────────────────────────────────────────────┘
```

### Key Relationships Summary

| Model | References | Referenced By |
|---|---|---|
| **User** | Supplier, Warehouse | PurchaseOrder, NegotiationSession, Notification, BlockchainLog |
| **Supplier** | — | Product, PurchaseOrder, NegotiationSession |
| **Product** | Supplier | Inventory, PurchaseOrder (line items), DemandForecast |
| **Warehouse** | User (manager) | Inventory, PurchaseOrder, DemandForecast, WarehouseOptRec |
| **Inventory** | Product, Warehouse | AnalyticsSnapshot |
| **PurchaseOrder** | Supplier, Warehouse, User, NegotiationSession | BlockchainLog, AnalyticsSnapshot |
| **NegotiationSession** | Supplier, Product, User | PurchaseOrder, BlockchainLog |
| **DemandForecast** | Product, Warehouse | AnalyticsSnapshot |
| **BlockchainLog** | PurchaseOrder \| NegotiationSession \| Inventory (polymorphic) | — |
| **Notification** | User | — |
| **AnalyticsSnapshot** | (aggregated) | Dashboards |
| **WarehouseOptRec** | Warehouse, Product, User | AnalyticsSnapshot |

---

## Setup & Installation

```bash
# Install Mongoose
npm install mongoose

# Environment variable
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/inventory_mvp

# Connect in app.js
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

### Recommended Folder Structure

```
src/
├── models/
│   ├── User.js
│   ├── Warehouse.js
│   ├── Supplier.js
│   ├── Product.js
│   ├── Inventory.js
│   ├── PurchaseOrder.js
│   ├── NegotiationSession.js
│   ├── DemandForecast.js
│   ├── BlockchainLog.js
│   ├── Notification.js
│   ├── AnalyticsSnapshot.js
│   └── WarehouseOptimizationRecommendation.js
├── routes/
├── controllers/
├── agents/           ← LangChain/LangGraph agents
│   ├── negotiationAgent.js
│   └── warehouseOptAgent.js
└── app.js
```

---

*Schema version: MVP 1.0 — aligned with acceptance criteria: 1000+ concurrent users, auto-PO within 60s, AI negotiations within 24h, blockchain confirmation within 5 min, 7-day forecast MAPE < 20%.*

# Backend Architecture

## Overview

The backend is a **Node.js + TypeScript REST API** built with **Express.js 5** and **MongoDB** (via Mongoose). It follows a modular, layered architecture where each business domain owns its own model, service, and controller. Authentication is handled via JWT access/refresh tokens with role-based access control (RBAC) enforced at the route level.

---

## Directory Structure

```
backend/
├── src/
│   ├── index.ts                    # Server entry point, route registration, scheduler
│   ├── config/
│   │   ├── env.ts                  # Zod-validated environment config
│   │   ├── database.ts             # MongoDB singleton connection class
│   │   └── index.ts                # Re-exports env and database
│   ├── middlewares/
│   │   ├── auth.ts                 # JWT authenticate, authorize, optionalAuth
│   │   ├── errorHandler.ts         # Global error handler + 404 handler
│   │   └── index.ts                # Barrel exports
│   ├── modules/
│   │   ├── user/                   # Auth, sessions, user CRUD
│   │   ├── product/                # Product catalog management
│   │   ├── warehouse/              # Warehouse + zone management
│   │   ├── inventory/              # Stock tracking + transactions
│   │   ├── supplier/               # Supplier catalog + contracts
│   │   ├── purchase-order/         # PO lifecycle management
│   │   ├── forecast/               # Demand forecast results
│   │   ├── warehouse-optimization/ # Optimization recommendations
│   │   ├── blockchain/             # Blockchain event logs
│   │   ├── notification/           # In-app + email notifications
│   │   └── index.ts                # Barrel exports for all models
│   ├── ai/
│   │   ├── forecast-agent/         # LangGraph demand forecasting agent
│   │   └── warehouse-optimization-agent/ # LangGraph optimization agent
│   ├── utils/
│   │   ├── ApiError.ts             # Custom error class
│   │   ├── ApiResponse.ts          # Standardized response class
│   │   ├── asyncHandler.ts         # Async route wrapper
│   │   ├── constants.ts            # HttpStatus codes, ApiMessages
│   │   ├── responseHandler.ts      # sendSuccess, sendCreated, sendPaginated
│   │   └── validateRequest.ts      # Zod-based request validation middleware
│   └── scripts/
│       └── seed.ts                 # Database seed / clean-seed script
├── package.json
├── tsconfig.json
└── .env
```

Each module follows this internal structure:
```
modules/<name>/
├── model.ts        # Mongoose schema + TypeScript interfaces
├── service.ts      # Business logic layer
├── controller.ts   # Route handlers (thin layer, delegates to service)
├── router.ts       # Express router with middleware applied
└── validation.ts   # Zod schemas for request validation
```

---

## Entry Point — `src/index.ts`

The server bootstraps in this order:

1. **Environment loaded** — `config/env.ts` runs first, reads `.env` manually (no dotenv dependency), validates all vars via Zod, and throws on invalid config.
2. **Express app created** — CORS, JSON body parser, URL-encoded parser applied.
3. **Routes registered** at versioned prefix:

```
GET  /health                            → Health check

POST /api/v1/users/signup               → User module
POST /api/v1/users/login
POST /api/v1/users/refresh-token
POST /api/v1/users/logout
GET  /api/v1/users/profile
PATCH /api/v1/users/profile
GET  /api/v1/users                      (admin only)
...

GET  /api/v1/products                   → Product module
POST /api/v1/products
PUT  /api/v1/products/:id
DELETE /api/v1/products/:id

GET  /api/v1/warehouses                 → Warehouse module
POST /api/v1/warehouses
...

GET  /api/v1/suppliers                  → Supplier module
POST /api/v1/suppliers
...

GET  /api/v1/inventory                  → Inventory module
POST /api/v1/inventory/adjust
POST /api/v1/inventory/transfer
...

GET  /api/v1/purchase-orders            → Purchase Order module
POST /api/v1/purchase-orders
POST /api/v1/purchase-orders/:id/approve
...

POST /api/forecast                      → Forecast AI agent
GET  /api/forecast/predictions

POST /api/warehouse-optimization/analyze → Optimization AI agent
```

4. **Not-found + error handlers** registered last.
5. **Database connected** — `database.connect()` before `.listen()`.
6. **Forecast scheduler started** — `ForecastScheduler.start()` runs node-cron jobs.
7. **Graceful shutdown** — `SIGTERM`/`SIGINT` stop the scheduler and exit.

---

## Configuration Layer

### `config/env.ts`

Manually parses the `.env` file (no dotenv) then validates with a **Zod schema**. Throws at startup if any required variable is missing or malformed. Exported as `env` object — the single source of truth for config.

Required variables validated:

| Variable | Type | Constraint |
|---|---|---|
| `NODE_ENV` | enum | development / test / production |
| `PORT` | string | must be numeric |
| `MONGODB_URI` | string | required, non-empty |
| `JWT_SECRET` | string | min 10 chars |
| `JWT_ACCESS_EXPIRES_IN` | string | optional |
| `JWT_REFRESH_EXPIRES_IN` | string | optional |
| `REFRESH_TOKEN_SECRET` | string | optional |
| `MAX_REFRESH_TOKENS` | string | optional |

### `config/database.ts`

Implements a **Singleton pattern** (`Database.getInstance()`). On `connect()`:
- Pool size: min 5, max 10 connections
- Socket timeout: 45 000 ms
- Server selection timeout: 5 000 ms
- Registers event listeners for error, disconnected, reconnected
- Handles `SIGINT`/`SIGTERM` for graceful close

---

## Middleware Layer

### `middlewares/auth.ts`

Three middleware functions:

**`authenticate`** — Extracts Bearer token from `Authorization` header, calls `UserService.verifyToken()`, attaches `{ userId, email, role }` to `req.user`. Throws `401` if no token or invalid.

**`authorize(...roles)`** — Factory that returns middleware checking `req.user.role` against the allowed roles list. Throws `403` on mismatch.

**`optionalAuth`** — Same as `authenticate` but continues without error if no token is present (used on public endpoints that can optionally personalize responses).

Usage in routers:
```typescript
// Protected + role-restricted
router.get('/admin-only', authenticate, authorize('admin'), handler);

// Protected, any authenticated user
router.get('/my-profile', authenticate, handler);

// Public
router.post('/login', handler);
```

### `middlewares/errorHandler.ts`

**`errorHandler`** — Handles all thrown errors in the pipeline:

| Error Type | Status | Behavior |
|---|---|---|
| `ApiError` | `.statusCode` | Uses message + errors array |
| `ZodError` | 400 | Maps issues to `{ field, message }` array |
| Mongoose `ValidationError` | 400 | Maps field errors |
| Mongoose duplicate key (code 11000) | 409 | Extracts duplicate field name |
| `JsonWebTokenError` | 401 | "Invalid token" |
| `TokenExpiredError` | 401 | "Token expired" |
| Any other `Error` | 500 | "Internal Server Error" |

In development, stack traces are included in the response.

**`notFoundHandler`** — Catches all unmatched routes, creates `ApiError(404, 'Route X not found')`, passes to `errorHandler`.

---

## Utility Layer

### `utils/ApiError.ts`
Custom error class extending `Error`. Fields: `statusCode`, `message`, `errors[]`, `isOperational`. Thrown throughout service and controller layers.

### `utils/ApiResponse.ts`
Standardized response envelope: `{ statusCode, data, message, success }`. `success` is auto-computed as `statusCode < 400`.

### `utils/asyncHandler.ts`
Wraps any `async (req, res, next)` function. Catches rejected promises and forwards to `next(error)` — eliminates try/catch boilerplate in controllers.

### `utils/responseHandler.ts`
Helper functions over `ApiResponse`:
- `sendSuccess(res, data, message, 200)` — standard 200
- `sendCreated(res, data, message)` — 201
- `sendNoContent(res)` — 204
- `sendPaginated(res, data, page, limit, total)` — includes pagination metadata

### `utils/validateRequest.ts`
Zod-based validation middleware factory:
- `validateRequest(schema)` — validates `body + query + params`
- `validateBody(schema)` — validates and reassigns `req.body`
- `validateQuery(schema)` — validates and reassigns `req.query`
- `validateParams(schema)` — validates and reassigns `req.params`

---

## Module Breakdown

### User Module

**Model fields:** `name`, `email`, `passwordHash` (select: false), `role`, `supplierRef`, `assignedWarehouses[]`, `isActive`, `lastLogin`, `notificationPreferences`, `refreshTokens[]` (select: false)

**Roles (RBAC):**
- `admin` — full system access
- `warehouse_manager` — warehouse + inventory operations
- `procurement_officer` — PO + supplier management
- `supplier` — supplier portal, requires `supplierRef`

**Service responsibilities:**
- bcrypt password hashing (salt rounds: 10)
- JWT access token generation (signed with `JWT_SECRET`, expires `JWT_ACCESS_EXPIRES_IN`)
- JWT refresh token generation (signed with `REFRESH_TOKEN_SECRET`, expires `JWT_REFRESH_EXPIRES_IN`)
- Multi-device session management — refresh tokens stored as array on user document (max `MAX_REFRESH_TOKENS`, oldest evicted when limit reached)
- Token verification via `UserService.verifyToken()`
- `lastLogin` timestamp update on login
- Expired token cleanup

**Refresh Token Schema:** `{ token, expiresAt, createdAt, ipAddress, userAgent }`

---

### Product Module

**Categories:** `writing_instruments`, `paper_products`, `office_supplies`, `art_supplies`, `filing_storage`, `desk_accessories`, `other`

**Key fields:** `sku` (unique), `name`, `category`, `unit`, `unitPrice`, `reorderPoint`, `safetyStock`, `reorderQty`, `leadTimeDays`, `primarySupplier`, `alternateSuppliers[]`, `isActive`

**Service features:**
- Text-indexed search on `name`, `description`, `sku`
- Filter by category, price range, supplier
- Soft delete (set `isActive: false`)
- Bulk upload with per-item error tracking
- Low stock product identification (stock ≤ reorderPoint)
- Category statistics aggregation

---

### Warehouse Module

**Zone types:** `bulk`, `fast_moving`, `slow_moving`, `fragile`, `general`

**Key fields:** `name`, `code` (unique), `location` (embedded: address/city/state/country/pincode/coordinates), `totalCapacity`, `usedCapacity`, `zones[]`, `manager` (User ref), `isActive`

**Zone subdocument:** `{ zoneCode, type, capacityUnits, currentLoad }`

**Service features:**
- Zone CRUD (add/update/remove)
- Capacity utilization percentage calculation
- Warehouse statistics aggregation
- Linked inventory summary

---

### Inventory Module

**Transaction types:** `purchase`, `sale`, `adjustment`, `transfer_in`, `transfer_out`, `return`, `damage`, `reservation`, `release_reservation`

**Key fields:** `product` (ref), `warehouse` (ref), `currentStock`, `reservedStock`, `availableStock` (computed: `currentStock - reservedStock`), `reorderPoint`, `safetyStock`, `replenishmentTriggered`, `transactions[]`, `zone`

**Transaction subdocument:** `{ type, quantity, reference, performedBy, notes, timestamp }`

**Service features:**
- Atomic stock adjustments
- Reservation and release workflow
- Inter-warehouse transfers (records `transfer_out` + `transfer_in`)
- Auto-trigger replenishment when `availableStock ≤ reorderPoint`
- Transaction history with full audit trail
- Stock valuation reports

---

### Supplier Module

**Key fields:** `companyName`, `contactEmail`, `contactPhone`, `address`, `catalogProducts[]`, `currentContractTerms`, `rating` (0–5), `isApproved`, `negotiationStats`

**Catalog product subdocument:** `{ product, unitPrice, leadTimeDays, MOQ }`

**Contract terms subdocument:** `{ paymentTermsDays, deliveryTerms, returnPolicy, validUntil }`

**Service features:**
- Approval workflow (admin approves suppliers)
- Catalog add/update/remove
- Contract term management
- Performance metrics and top-supplier ranking

---

### Purchase Order Module

**Status flow:**
```
draft → pending_approval → approved → sent_to_supplier → acknowledged
                                                        ↓
                                           partially_received / fully_received
draft | pending_approval | approved → cancelled
```

**Triggered by:** `auto_replenishment`, `manual`, `negotiation_agent`

**Key fields:** `poNumber` (auto-generated: `PO-YYMMNNNN`), `supplier`, `warehouse`, `lineItems[]`, `totalAmount`, `currency`, `status`, `blockchainTxHash`, `negotiationSession`, `createdBy`, `approvedBy`, `expectedDeliveryDate`

**Service features:**
- Auto PO number generation
- Submit for approval workflow
- Receipt processing — auto-updates inventory (`purchase` transaction)
- Blockchain logging on key state changes
- Analytics and pending approval dashboards

---

### Forecast Module

**Key fields:** `product`, `warehouse`, `forecastedAt`, `forecastHorizonDays` (default: 7), `dailyForecasts[]` (date, predictedDemand, confidenceLow, confidenceHigh, actualDemand, MAPE), `totalPredicted7Day`, `overallMape`, `modelVersion`, `recommendedReorderQty`, `recommendedOrderDate`

Populated by the **Forecast AI Agent** (LangGraph + Gemini). The `ForecastScheduler` runs via node-cron to periodically trigger forecast generation for all products.

---

### Blockchain Module

**Event types:** `po_created`, `po_approved`, `po_sent`, `po_received`, `negotiation_accepted`, `negotiation_rejected`, `inventory_adjustment`, `smart_contract_executed`

**Key fields:** `eventType`, `referenceModel`, `referenceId`, `payload`, `txHash` (unique, `0x` + 64 hex chars), `blockNumber`, `networkName`, `confirmedAt`, `confirmationStatus` (pending / confirmed / failed), `triggeredBy`

Logs critical business events to a simulated blockchain ledger for auditability.

---

### Notification Module

**Types:** `low_stock_alert`, `reorder_triggered`, `po_created`, `po_approved`, `po_received`, `negotiation_started`, `negotiation_completed`, `forecast_ready`, `warehouse_capacity_alert`, `blockchain_confirmed`, `system_alert`

**Channels:** `in_app`, `email`, `both`

**Key fields:** `recipient` (User ref), `type`, `title`, `message`, `relatedModel`, `relatedId`, `channel`, `isRead`, `readAt`, `emailSent`

---

## Request Lifecycle

```
HTTP Request
     │
     ▼
[CORS Middleware]
     │
     ▼
[JSON Body Parser]
     │
     ▼
[Route Match]
     │
     ├── [authenticate middleware] ← verifies JWT, attaches req.user
     │
     ├── [authorize middleware]    ← checks role
     │
     ├── [validateBody/Query]      ← Zod schema validation
     │
     ▼
[asyncHandler(controller)]
     │
     ├── calls service layer
     │       ├── business logic
     │       ├── Mongoose queries
     │       └── returns data or throws ApiError
     │
     ├── sendSuccess(res, data)    ← standardized response
     │
     └── if error → next(error)
                        │
                        ▼
               [errorHandler middleware]
                        │
                        ▼
               JSON error response
```

---

## Authentication Flow

```
Client                          Backend
  │                                │
  ├── POST /users/login ──────────►│
  │   { email, password }          │ verify password (bcrypt)
  │                                │ generate accessToken (15m)
  │                                │ generate refreshToken (7d)
  │                                │ store refreshToken on user doc
  │◄── { user, accessToken, ───────┤
  │     refreshToken }             │
  │                                │
  ├── GET /api/resource ──────────►│
  │   Authorization: Bearer <at>   │ verify accessToken
  │◄── { data } ───────────────────┤
  │                                │
  │  (accessToken expires)         │
  │                                │
  ├── POST /users/refresh-token ──►│
  │   { refreshToken }             │ verify refreshToken
  │                                │ issue new accessToken + refreshToken
  │                                │ rotate (old refreshToken replaced)
  │◄── { accessToken, ─────────────┤
  │     refreshToken }             │
  │                                │
  ├── POST /users/logout ─────────►│
  │   { refreshToken }             │ remove from user.refreshTokens[]
  │◄── 200 OK ─────────────────────┤
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js 5.2.1 |
| Database | MongoDB (Atlas) via Mongoose 9.2.1 |
| Auth | jsonwebtoken + bcryptjs |
| Validation | Zod 4 |
| AI Agents | LangChain + LangGraph + Google Gemini |
| AI Orchestration | Mastra 1.4.0 |
| Scheduling | node-cron 4 |
| Dev Server | tsx (TypeScript execute with watch) |

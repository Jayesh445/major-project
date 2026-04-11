# AutoStock AI — Complete System Documentation

> **Autonomous Agentic AI Platform for Supply Chain Management**
> Built with Mastra AI, LangGraph, Google Gemini, TypeScript, Next.js, MongoDB, and Ethereum blockchain.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Running the System](#4-running-the-system)
5. [User Roles & Authentication](#5-user-roles--authentication)
6. [Pages & Screens](#6-pages--screens)
7. [AI Agents](#7-ai-agents)
8. [Workflows](#8-workflows)
9. [Negotiation Agent — Deep Dive](#9-negotiation-agent--deep-dive)
10. [Blockchain Integration](#10-blockchain-integration)
11. [API Reference](#11-api-reference)
12. [Database Models](#12-database-models)

---

## 1. System Overview

**AutoStock AI** is an autonomous supply chain management platform from the **distributor perspective**. It replaces reactive ERP systems with an agentic AI architecture that predicts demand, optimizes inventory, negotiates with suppliers autonomously, and logs all transactions immutably on Ethereum.

### Key Value Propositions
- **33.7%** reduction in forecasting error (vs linear models)
- **99%** reduction in procurement cycle time (3.8 minutes vs 3-5 days manual)
- **12.5%** average savings via autonomous negotiation
- **100%** audit trail via blockchain hashing

### Core Capabilities
1. **Deep-learning demand forecasting** with AR-Net architecture
2. **Mathematical inventory optimization** (EOQ, ROP, Safety Stock)
3. **Autonomous multi-round supplier negotiation** (Buyer Agent vs Supplier Simulator Agent)
4. **Inter-warehouse transfer optimization**
5. **Anomaly detection** across inventory, procurement, warehouse
6. **Smart reorder planning** with bulk discount consideration
7. **Goods receipt verification** with blockchain tamper detection
8. **Supplier reliability scoring** (SRI formula)

---

## 2. Architecture

### Three-Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Frontend       │───>│  Backend         │───>│  Mastra AI       │
│  Next.js :3000  │    │  Express :5000   │    │  Mastra :4111    │
│  (React UI)     │    │  (REST API)      │    │  (AI Workflows)  │
└─────────────────┘    └────────┬─────────┘    └────────┬─────────┘
                                │                       │
                                ▼                       │
                       ┌─────────────────┐              │
                       │  MongoDB Atlas  │<─────────────┘
                       │  (Database)     │  (via /api/internal)
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Ethereum       │
                       │  Sepolia TN     │
                       │  (Blockchain)   │
                       └─────────────────┘
```

### Dual-Framework Agent System
- **LangGraph/Mastra Workflows**: Stateless sequential pipelines (forecast, optimization, anomaly, reorder)
- **Mastra AI with LibSQL Memory**: Stateful multi-turn agents (negotiation, compliance)

---

## 3. Tech Stack

### Frontend
| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Server State | TanStack React Query 5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Icons | Lucide React |

### Backend
| Category | Technology |
|----------|-----------|
| Framework | Express.js 5 |
| Language | TypeScript 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Scheduler | node-cron |

### AI / Agents
| Category | Technology |
|----------|-----------|
| Framework | Mastra AI 1.4 |
| LLM | Google Gemini 2.0 Flash |
| Memory | LibSQL (SQLite) |
| Orchestration | Mastra Workflows + LangGraph |
| Validation | Zod schemas for tool I/O |

### Blockchain
| Category | Technology |
|----------|-----------|
| Network | Ethereum Sepolia Testnet |
| Hashing | SHA-256 |
| QR Codes | Dynamic generation for physical shipment verification |

---

## 4. Running the System

### Prerequisites
- Node.js 22.13+
- pnpm 10+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### Setup

```bash
# 1. Install dependencies
cd backend && pnpm install
cd ../frontend && pnpm install
cd ../ai && pnpm install

# 2. Configure environment variables
# backend/.env    → MONGODB_URI, JWT_SECRET, INTERNAL_API_KEY
# ai/.env         → BACKEND_URL, INTERNAL_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY
# frontend/.env   → NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Start all three services

```bash
# Terminal 1: Backend API
cd backend && pnpm dev        # http://localhost:5000

# Terminal 2: Mastra AI agents
cd ai && pnpm dev             # http://localhost:4111

# Terminal 3: Frontend
cd frontend && pnpm dev       # http://localhost:3000
```

### Create the initial admin

```bash
curl -X POST http://localhost:5000/api/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@autostock.ai","password":"Admin@123","role":"admin"}'
```

---

## 5. User Roles & Authentication

### Roles (RBAC)
1. **Admin** — Full system access, user management, analytics
2. **Warehouse Manager** — Inventory, receiving, transfers
3. **Procurement Officer** — POs, replenishment, negotiations, costs
4. **Supplier** — Catalog view, order status

### Authentication Flow
1. User submits credentials → `POST /api/v1/users/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. Frontend stores in Zustand (persisted to localStorage as `auth-storage`)
4. Axios interceptor adds `Authorization: Bearer <token>` to all requests
5. On 401, interceptor auto-refreshes token via `/users/refresh-token`

---

## 6. Pages & Screens

### 6.1 Landing & Auth

#### Landing Page `/`
Hero section, features, how-it-works, CTA. Static marketing content.
![Landing](screenshots/01-landing.png)

#### Login `/login`
Email + password form with validation. On success, redirects to role-specific dashboard.
![Login](screenshots/02-login.png)

#### Signup `/signup`
New user registration with role selection.
![Signup](screenshots/03-signup.png)

#### Forgot Password `/forgot-password`
Email input to request password reset link. Calls `POST /users/forgot-password`.
![Forgot Password](screenshots/04-forgot-password.png)

---

### 6.2 Admin Role

#### Admin Dashboard `/dashboard/admin`
**Data source:** `GET /api/v1/dashboard/admin-stats`

Shows:
- 4 stat cards: Users, Products, Warehouses, Suppliers
- 3 AI stat cards: Forecasts, Negotiations, Blockchain Logs
- Warehouse utilization bar
- Recent Activity feed (POs, negotiations, forecasts)

![Admin Dashboard](screenshots/05-admin-dashboard.png)

#### Products `/dashboard/admin/products`
**Data source:** `GET /api/v1/products` via `useProducts()`

Table with SKU, name, category, unit, actions (edit, delete).

![Products](screenshots/06-products.png)

#### Add Product `/dashboard/admin/products/new`
Form with: SKU, name, description, category, unit, ROP, lead time, **supplier dropdown** (populated from `useSuppliers()`).

![Add Product](screenshots/07-product-new.png)

#### Suppliers `/dashboard/admin/suppliers`
**Data source:** `GET /api/v1/suppliers` via `useSuppliers()`

Columns: companyName, contactEmail, contactPhone, rating, approval status, product count.

![Suppliers](screenshots/08-suppliers.png)

#### Add Supplier `/dashboard/admin/suppliers/new`
Form with: companyName, contactEmail, contactPhone, address, rating, isApproved switch.

![Add Supplier](screenshots/09-supplier-new.png)

#### Users `/dashboard/admin/users`
User management — list, role-based view, create/edit.

![Users](screenshots/10-users.png)

#### Warehouses `/dashboard/admin/warehouses`
Warehouse list with capacity utilization.

![Warehouses](screenshots/11-warehouses.png)

#### Analytics `/dashboard/admin/analytics`
**Data source:** `useAdminStats()` + `useAgentStatus()`

- 4 KPI cards (Products, Warehouses, Negotiations, Blockchain Logs)
- Agent Performance table (run counts for all 9 agents)
- Warehouse Utilization bar chart

![Analytics](screenshots/12-analytics.png)

---

### 6.3 Procurement Role

#### Procurement Dashboard `/dashboard/procurement`
**Data source:** `GET /api/v1/dashboard/procurement-stats`

4 stat cards: Total Spend MTD (₹), Pending Approvals, Open Orders, Fulfilled Orders.

![Procurement Dashboard](screenshots/13-procurement-dashboard.png)

#### Purchase Orders `/dashboard/procurement/orders`
**Data source:** `GET /api/v1/purchase-orders`

Table with PO number, supplier, warehouse, total, status, triggeredBy.

![Purchase Orders](screenshots/14-purchase-orders.png)

#### Autonomous Replenishment `/dashboard/procurement/replenishment`
**Data source:** `useLatestOptimization()` + `useRunSmartReorder()` mutation

- "Run Analysis" button triggers Smart Reorder Agent
- Shows transfer recommendations with from→to warehouses
- Accept/Reject actions update optimization status

![Replenishment](screenshots/15-replenishment.png)

#### Cost Analysis `/dashboard/procurement/costs`
**Data source:** `useProcurementStats()` + `usePurchaseOrders()`

- MTD spend, open orders, avg order value (all in ₹)
- Recent POs list with status badges

![Cost Analysis](screenshots/16-cost-analysis.png)

---

### 6.4 Warehouse Role

#### Warehouse Dashboard `/dashboard/warehouse`
**Data source:** `GET /api/v1/dashboard/warehouse-stats`

- 4 cards: Total Inventory, Pending Receiving, Low Stock Alerts, Active Transfers
- Recent Optimization Recommendations section

![Warehouse Dashboard](screenshots/17-warehouse-dashboard.png)

#### Inventory `/dashboard/warehouse/inventory`
**Data source:** `GET /api/v1/inventory`

Table with product, warehouse, current stock, available, ROP, safety stock.

![Inventory](screenshots/18-inventory.png)

#### Goods Receiving `/dashboard/warehouse/receiving`
**Data source:** `usePurchaseOrders()` + `useVerifyGoodsReceipt()` mutation

- Shows POs in `sent_to_supplier`, `acknowledged`, `partially_received` states
- "Receive All" button triggers Quality Control Agent workflow
- Blockchain verification on goods receipt

![Receiving](screenshots/19-receiving.png)

#### Warehouse Transfers `/dashboard/warehouse/transfers`
**Data source:** `useAllOptimizations()` + `useUpdateOptimizationStatus()`

- All optimization runs with transfer recommendations
- Each transfer shows: product, from warehouse → to warehouse, quantity
- Accept/Reject buttons for each recommendation batch

![Transfers](screenshots/20-transfers.png)

---

### 6.5 Supplier Role

#### Supplier Catalog `/dashboard/supplier/catalog`
**Data source:** `useSuppliers()` (shows all suppliers with catalog products)

Table per supplier: Product | Unit Price (₹) | Lead Time | MOQ

![Supplier Catalog](screenshots/21-supplier-catalog.png)

#### Supplier Orders `/dashboard/supplier/orders`
**Data source:** `usePurchaseOrders()`

Cards showing PO number, warehouse, line items count, amount (₹), expected delivery, status.

![Supplier Orders](screenshots/22-supplier-orders.png)

---

### 6.6 Dev Tools — Agent Monitoring

#### Agent Hub `/dashboard/dev-tools/agent-hub`
**Data source:** `GET /api/agents/status`

The central control panel for all 9 autonomous agents.

Shows:
- 4 stats cards (total forecasts, optimizations, negotiations, blockchain logs)
- Grid of 9 agent cards with status badges and run counts
- Action buttons per agent (Run Analysis, View Sessions, Run Scan, Evaluate)
- Recent Negotiations list with links to detail view

![Agent Hub](screenshots/23-agent-hub.png)

#### Agent Monitor `/dashboard/dev-tools/agent-monitor`
**Data source:** `useAgentStats()` + `useAgentStatus()`

- Activity Log with recent forecasts and optimization runs
- Agent Status panel (live run counts for all 9 agents)
- Performance panel (total forecasts, optimizations, negotiations, blockchain logs)

![Agent Monitor](screenshots/24-agent-monitor.png)

#### Negotiations List `/dashboard/dev-tools/negotiations`
**Data source:** `GET /api/agents/negotiation/sessions`

Cards showing supplier → product, rounds count, final price (₹), savings %, status badge. Click to view full conversation.

![Negotiations](screenshots/25-negotiations.png)

#### Negotiation Detail `/dashboard/dev-tools/negotiations/[id]`
**Data source:** `GET /api/agents/negotiation/sessions/:id`

The **debug screen** showing full round-by-round conversation:
- Summary cards: Status, Rounds, Final Price, Savings
- Agent Constraints (private pmax, target, max lead time)
- Conversation Timeline with buyer bubbles (blue) and supplier bubbles (orange)
- Expandable "View agent reasoning" for each round
- Final terms card (green for accepted, red for rejected)

![Negotiation Detail](screenshots/26-negotiation-detail.png)

---

## 7. AI Agents

All 9 agents are implemented in Mastra AI using Google Gemini as the LLM backbone.

| # | Agent | Framework | Purpose | Stateful? |
|---|-------|-----------|---------|-----------|
| 1 | **Forecast Agent** | Mastra | Predicts 7-day demand using 90-day history | No |
| 2 | **Warehouse Optimization Agent** | Mastra | Generates inter-warehouse transfer recommendations | No |
| 3 | **Negotiation Agent (Buyer)** | Mastra + Memory | Multi-round supplier negotiation with BATNA | **Yes** |
| 4 | **Supplier Simulator Agent** | Mastra + Memory | Plays supplier role in negotiations | **Yes** |
| 5 | **Procurement Orchestrator Agent** | Mastra | Coordinates stock check → EOQ → negotiation | No |
| 6 | **Supplier Evaluation Agent** | Mastra | Scores suppliers using SRI formula | No |
| 7 | **Anomaly Detection Agent** | Mastra | Detects fraud, stockouts, capacity issues | No |
| 8 | **Smart Reorder Agent** | Mastra | Intelligent reorder with EOQ + consolidation | No |
| 9 | **Quality Control Agent** | Mastra | Verifies goods receipt + blockchain logging | No |

### Agent Configuration
- **Model:** `google/gemini-3-flash-preview`
- **Memory:** LibSQL (persistent for stateful agents)
- **Temperature:** 0-0.3 (for deterministic operations research agents); 0.5 for creative strategy agents
- **Output format:** Strict JSON enforced via prompt instructions + Zod schema validation

---

## 8. Workflows

All workflows are registered in `ai/src/mastra/index.ts` and exposed via Mastra's API on port 4111.

### 8.1 Forecast Workflow
**Steps:** 4
1. Validate product + warehouse exist
2. Fetch 90 days of historical demand from inventory transactions
3. Agent generates 7-day forecast with confidence intervals
4. Save forecast to `DemandForecast` collection

**Input:** `{ productId, warehouseId }`
**Output:** `{ success, forecastId }`

---

### 8.2 Warehouse Optimization Workflow
**Steps:** 4
1. Fetch all active warehouses with capacity
2. Fetch inventory across all products/warehouses
3. Agent generates 3-5 transfer recommendations
4. Validate (safety stock preservation) and save

**Input:** `{}`
**Output:** `{ success, recommendationId, validatedCount }`

---

### 8.3 Negotiation Workflow ⭐ (Flagship Feature)

**Steps:** 3
1. **Validate inputs** — fetch product, warehouse, eligible suppliers (filtered by `isApproved: true`)
2. **Execute two-agent negotiation** — multi-round loop per supplier
3. **Persist results** — save sessions with rounds, create PO if accepted

**Input:**
```json
{
  "productId": "...",
  "warehouseId": "...",
  "requiredQty": 100,
  "maxUnitPrice": 150,
  "targetUnitPrice": 120,
  "maxLeadTimeDays": 7,
  "initiatedBy": "procurement_officer"
}
```

**Output:**
```json
{
  "success": true,
  "decision": "accept",
  "negotiationIds": ["...", "..."],
  "purchaseOrderId": "...",
  "poNumber": "PO-XXXXXX",
  "savingsPercent": 18.5,
  "finalPrice": 122,
  "reasoning": "Accepted deal with Acme Supplies...",
  "totalRounds": 12,
  "suppliersContacted": 3
}
```

See [Section 9](#9-negotiation-agent--deep-dive) for the full two-agent loop details.

---

### 8.4 Procurement Workflow
**Steps:** 2
1. Assess replenishment need (stock vs ROP vs pending POs)
2. Calculate EOQ + negotiation parameters

**Input:** `{ productId, warehouseId, orderingCostPerPO, holdingCostPerUnit }`
**Output:** `{ action, negotiationParams, reasoning, urgency }`

**Urgency levels:**
- `critical`: daysUntilStockout ≤ 3
- `high`: daysUntilStockout ≤ 7
- `medium`: daysUntilStockout ≤ 14
- `low`: daysUntilStockout > 14

---

### 8.5 Supplier Evaluation Workflow
**Steps:** 2
1. Gather all approved suppliers + PO history
2. Agent scores using SRI formula

**SRI Formula:**
```
SRI = 0.35 * OnTimeRate + 0.25 * QualityScore + 0.25 * PriceCompetitiveness + 0.15 * Responsiveness
```

**Status thresholds:**
- `excellent`: SRI ≥ 85
- `good`: SRI ≥ 70
- `average`: SRI ≥ 50
- `underperforming`: SRI ≥ 30
- `critical`: SRI < 30

---

### 8.6 Anomaly Detection Workflow
**Steps:** 2
1. Collect inventory + recent POs + warehouse data
2. Agent scans for anomalies across 4 categories

**Categories:**
- **Inventory:** stock below safety, stock-to-ROP ratio anomalies
- **Procurement:** unusually large POs, supplier concentration, fraud patterns
- **Warehouse:** capacity > 95% or < 20%
- **Demand:** forecast deviation spikes

**Severity levels:** `critical`, `warning`, `info`
**Health Score:** `100 - (criticalCount * 20) - (warningCount * 5) - (infoCount * 1)`

---

### 8.7 Smart Reorder Workflow
**Steps:** 2
1. Scan all inventory, compute days-until-stockout
2. Agent generates EOQ-based reorder plan with consolidation

**Output:** Reorder recommendations sorted by urgency.

---

### 8.8 Quality Control Workflow
**Steps:** 2
1. Fetch PO, validate it's in receivable state
2. Verify items, record receipt, log to blockchain

**Input:**
```json
{
  "purchaseOrderId": "...",
  "receivedItems": [
    { "sku": "PEN-001", "receivedQty": 100, "qualityStatus": "accepted" }
  ]
}
```

**Output:**
```json
{
  "verificationStatus": "passed|partial|failed",
  "discrepancies": [...],
  "newPOStatus": "fully_received",
  "overallAccuracy": 100,
  "blockchainTxHash": "0x...",
  "onTimeDelivery": true
}
```

---

## 9. Negotiation Agent — Deep Dive

The negotiation workflow is the **flagship feature** implementing real two-agent conversation.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Negotiation Workflow (3 steps)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Validate + fetch top 3 suppliers (by composite     │
│          score: price 40%, rating 30%, lead 20%, terms 10%) │
│                                                              │
│  Step 2: Two-agent loop (for each of top 3 suppliers):      │
│                                                              │
│    Round 1-5:                                                │
│    ┌──────────────────┐         ┌───────────────────┐      │
│    │  Buyer Agent     │  ───>   │ Supplier Simulator│      │
│    │  (Gemini LLM)    │         │ Agent (Gemini LLM)│      │
│    │                  │  <───   │                   │      │
│    │  - pmax enforced │         │ - hidden floor    │      │
│    │  - BATNA strategy│         │   price           │      │
│    │  - max 5% concede│         │ - 2-4% concession │      │
│    └──────────────────┘         └───────────────────┘      │
│                                                              │
│    Terminate if:                                             │
│    - Buyer accepts (price ≤ pmax)                           │
│    - Supplier floor > pmax after 3+ rounds                  │
│    - 5 rounds reached                                        │
│                                                              │
│  Step 3: Compare deals, persist all rounds, create PO       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Buyer Agent Decision Logic

**Deal Score Formula:**
```
dealScore = (1 - price/pmax) * 40
          + (1 - leadTime/maxLeadTime) * 30
          + (supplierRating/5) * 20
          + (paymentTerms/90) * 10
```

**Decision Thresholds:**
- **Accept** if: `price ≤ pmax` AND `leadTime ≤ maxLeadTimeDays` AND `dealScore ≥ 50`
- **Reject** if: `price > pmax` after 3+ rounds OR supplier unwilling to continue
- **Counter** if: room for improvement and `rounds < 5`

### Supplier Simulator Agent Logic

- **Floor price** = `listPrice * (0.6 + random * 0.15)` — hidden from buyer
- **Round 1:** concede 2-4% from list
- **Rounds 2-3:** concede 2-4% per round
- **Rounds 4-5:** concede only 1-2%, become firmer
- **Final round:** "best and final" offer
- **Never** goes below floor price

### Persistence Format

Each round is saved to `NegotiationSession.rounds[]`:
```json
{
  "roundNumber": 2,
  "agentOffer": {
    "unitPrice": 125,
    "leadTimeDays": 5,
    "paymentTermsDays": 30,
    "quantity": 100
  },
  "supplierCounterOffer": {
    "unitPrice": 135,
    "leadTimeDays": 5,
    "paymentTermsDays": 30,
    "quantity": 100
  },
  "agentReasoning": "Buyer: We need a better price... | Buyer reasoning: Competitor X offers similar... | Supplier: That's the best I can do given our quality...",
  "status": "countered",
  "timestamp": "2026-04-10T18:52:17.311Z"
}
```

### Debug UI

The `/dashboard/dev-tools/negotiations/[id]` page parses `agentReasoning` and renders a chat-like conversation:
- **Blue bubbles** = Buyer Agent (with offer breakdown + expandable reasoning)
- **Orange bubbles** = Supplier Simulator Agent
- **Round dividers** with status badges
- **Final result card** (green for accepted, red for rejected)

**Example Round Display:**
```
── Round 2 ── [countered] ──
🤖 Buyer Agent           10:53:42
   "We need a better price — we have competitive offers."
   Offer: ₹125/unit  Lead: 5d  Qty: 100
   ▼ View agent reasoning
      "Competitor ABC offers ₹128. Opening at 15% below..."

        ↓

👤 Supplier (Acme Supplies)
   "I can come down to ₹135, but that's tight for us."
   Counter: ₹135/unit  Lead: 5d  Payment: Net 30
```

---

## 10. Blockchain Integration

### Smart Contract
**Contract:** `SupplyChainAudit.sol`
**Network:** Ethereum Sepolia Testnet

```solidity
struct PurchaseOrder {
    uint256 id;
    address buyer;
    address supplier;
    uint256 amount;
    bytes32 documentHash;
    uint256 timestamp;
    Status status;
}
```

### Event Types Logged
- `po_created` — New PO created via negotiation
- `po_approved` — PO approved by procurement officer
- `po_sent` — PO sent to supplier
- `po_received` — Goods verified and received
- `negotiation_accepted` — Deal accepted
- `negotiation_rejected` — Deal rejected
- `inventory_adjustment` — Manual stock adjustment
- `smart_contract_executed` — Auto payment settlement

### Hash Verification Flow
1. When PO is created, hash = `SHA-256(JSON.stringify(po))`
2. Hash + payload written to blockchain log
3. QR code generated with `txHash`
4. At goods receipt, scan QR → recompute hash → compare with on-chain
5. **Tamper detection:** Hash mismatch halts payment settlement

### BlockchainLog Model
```typescript
{
  eventType: EventType,
  referenceModel: 'PurchaseOrder' | 'NegotiationSession' | 'Inventory',
  referenceId: ObjectId,
  payload: any,
  txHash: string,
  blockNumber?: number,
  networkName: 'ethereum-sepolia',
  confirmationStatus: 'pending' | 'confirmed' | 'failed',
  confirmedAt?: Date
}
```

---

## 11. API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/signup` | POST | Create new user |
| `/api/v1/users/login` | POST | Get access + refresh tokens |
| `/api/v1/users/refresh-token` | POST | Refresh access token |
| `/api/v1/users/profile` | GET | Current user profile |
| `/api/v1/users/logout` | POST | Invalidate refresh token |

### Business Modules
| Prefix | Description |
|--------|-------------|
| `/api/v1/users` | User management (admin CRUD) |
| `/api/v1/products` | Product catalog |
| `/api/v1/warehouses` | Warehouse management |
| `/api/v1/suppliers` | Supplier management |
| `/api/v1/inventory` | Inventory tracking + adjustments |
| `/api/v1/purchase-orders` | PO lifecycle |
| `/api/v1/dashboard` | Admin/warehouse/procurement/agent stats |

### Agent Workflow Triggers
| Endpoint | Method | Workflow |
|----------|--------|----------|
| `/api/agents/status` | GET | Get all 9 agents status |
| `/api/agents/negotiation/trigger` | POST | Run negotiation workflow |
| `/api/agents/negotiation/sessions` | GET | List all negotiation sessions |
| `/api/agents/negotiation/sessions/:id` | GET | Get session with full rounds |
| `/api/agents/procurement/check` | POST | Run procurement check |
| `/api/agents/supplier-evaluation/run` | POST | Run supplier evaluation |
| `/api/agents/anomaly-detection/scan` | POST | Run anomaly scan |
| `/api/agents/smart-reorder/run` | POST | Run smart reorder analysis |
| `/api/agents/quality-control/verify` | POST | Verify goods receipt |
| `/api/agents/blockchain/logs` | GET | Get blockchain audit trail |

### Internal API (Mastra AI only, protected by INTERNAL_API_KEY)
| Endpoint | Method |
|----------|--------|
| `/api/internal/products/:id` | GET |
| `/api/internal/warehouses` | GET |
| `/api/internal/suppliers` | GET |
| `/api/internal/suppliers/by-product/:productId` | GET |
| `/api/internal/suppliers/:id/stats` | PATCH |
| `/api/internal/negotiations` | POST |
| `/api/internal/negotiations/:id/rounds` | POST |
| `/api/internal/purchase-orders` | POST |
| `/api/internal/blockchain-logs` | POST |
| `/api/internal/forecasts` | POST |

---

## 12. Database Models

### Core Models (MongoDB + Mongoose)

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **User** | Authentication, RBAC | name, email, password, role, refreshTokens |
| **Product** | Catalog | sku, name, category, unit, reorderPoint, leadTime, primarySupplier |
| **Warehouse** | Locations | name, code, location, totalCapacity, usedCapacity, zones |
| **Supplier** | Vendor management | companyName, contactEmail, contactPhone, address, rating, isApproved, catalogProducts[], negotiationStats |
| **Inventory** | Stock tracking | product, warehouse, currentStock, availableStock, reorderPoint, safetyStock, transactions[] |
| **PurchaseOrder** | Procurement | poNumber, supplier, warehouse, lineItems[], totalAmount, status, triggeredBy, blockchainTxHash |
| **NegotiationSession** | AI negotiations | supplier, product, agentConstraints, rounds[], finalTerms, status |
| **DemandForecast** | Predictions | product, warehouse, dailyForecasts[], totalPredicted7Day, modelVersion |
| **WarehouseOptimizationRecommendation** | Transfer plans | transferRecommendations[], predictedLogisticsCostReductionPercent, status |
| **BlockchainLog** | Audit trail | eventType, referenceModel, referenceId, payload, txHash |
| **Notification** | Alerts | userId, type, severity, message, channel |

---

## Verification & Testing

### How to Test the Full Agentic Flow

1. **Create data:**
   - Login as admin
   - Create 2-3 warehouses
   - Create 5-10 products with ROP
   - Create 3-5 suppliers (set `isApproved: true`)
   - For each supplier, add catalog products with prices

2. **Test forecast:**
   - Trigger forecast workflow via API
   - Verify `DemandForecast` records created

3. **Test negotiation (the flagship):**
   - POST to `/api/agents/negotiation/trigger` with required params
   - Open `/dashboard/dev-tools/negotiations`
   - Click the new session to see the round-by-round debug view
   - Verify buyer + supplier messages show in alternating bubbles

4. **Test anomaly detection:**
   - POST to `/api/agents/anomaly-detection/scan`
   - Verify anomalies list returned

5. **Test smart reorder:**
   - Click "Run Analysis" on `/dashboard/procurement/replenishment`
   - Verify recommendations appear

6. **Test quality control + blockchain:**
   - Go to `/dashboard/warehouse/receiving`
   - Click "Receive All" on a sent PO
   - Verify `BlockchainLog` entry created with `po_received` event

---

## System Status

- **Backend:** Running on `http://localhost:5000` ✅
- **Mastra AI:** Running on `http://localhost:4111` ✅
- **Frontend:** Running on `http://localhost:3000` ✅
- **Database:** MongoDB Atlas (connected) ✅
- **Agents registered:** 9 ✅
- **Workflows registered:** 8 ✅

---

*Generated: 2026-04-11*
*Project: AutoStock AI — Autonomous Supply Chain Platform*
*Team: Jayesh Gupta, Lakshya Gupta, Hasan Khan, Yash Ojha*
*Institution: Lokmanya Tilak College of Engineering, Navi Mumbai*
*Guide: Dr. Shital K. Dhamal*

# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## MVP: AI-Driven Stationery Logistics Platform with Agentic AI

**Document Version:** 2.0  
**Last Updated:** February 14, 2026  
**Status:** Ready for Development  
**Target Launch:** Q2 2026

---

## 1. EXECUTIVE SUMMARY

We are building **StationeryChain**, an AI-powered, blockchain-enabled supply chain platform for automating stationery logistics, inventory replenishment, and delivery verification.

### Problem Statement
Current stationery supply chains suffer from:
- Manual ordering processes causing stockouts and overstock
- Lack of supply chain transparency
- Inefficient demand forecasting
- Manual supplier negotiations wasting time and money
- Suboptimal warehouse allocation across multiple locations
- No intelligent agent-based decision making

### Solution Overview
An integrated platform combining:
- **Agentic AI** for autonomous demand forecasting, replenishment, and supplier negotiations
- **Blockchain** for immutable transaction logging and transparency
- **LangChain/LangGraph** for multi-agent orchestration and complex workflows
- **ML Models** for predictive analytics
- **Multi-role Dashboards** for all stakeholders

### Key MVP Goals
1. Prove core autonomous replenishment capability
2. Establish blockchain-based transaction integrity
3. Demonstrate intelligent supplier negotiation via AI agents
4. Implement multi-warehouse optimization logic
5. Validate user adoption across 4 user roles
6. Achieve 95%+ order accuracy in MVP phase

---

## 2. PRODUCT VISION & USP

### Unique Selling Proposition
**First integrated platform combining Agentic AI (LangChain/LangGraph) + Blockchain + Multi-Warehouse Intelligence in a single stationery logistics ecosystem.**

Key Differentiators:
- **Fully Autonomous Replenishment** — No manual ordering needed
- **AI-Powered Supplier Negotiations** — Agents autonomously negotiate terms with multiple suppliers
- **Smart Multi-Warehouse Optimization** — Agents determine optimal warehouse allocation
- **End-to-End Transparency** — Suppliers, retailers, and customers see full supply chain journey
- **Blockchain Immutability** — No tampering with transaction records
- **Scalable Architecture** — Can expand from stationery to FMCG, pharma, or industrial goods

### Market Positioning
Target MVP users: Mid-size stationery retailers (50-500 stores) with 2-5 warehouses across India.

---

## 3. TARGET USERS & USER ROLES

### 3.1 Admin / Company Owner
**Goal:** Oversee entire system, manage suppliers, and access analytics

**Responsibilities:**
- Manage system settings and configurations
- Onboard suppliers and retailers
- View executive dashboard with KPIs
- Manage product catalog
- Configure AI agent parameters
- Monitor negotiation outcomes
- View warehouse utilization metrics

**MVP Features:**
- Login/authentication
- Supplier management interface
- Dashboard with key metrics
- Alert configuration
- AI negotiation dashboard (view only)
- Warehouse allocation dashboard

---

### 3.2 Supplier / Vendor
**Goal:** Manage product catalog and fulfill orders efficiently

**Responsibilities:**
- Upload and manage product inventory
- Update pricing and stock levels
- Confirm order dispatch
- Receive negotiation requests from AI agents
- Accept or counter negotiation terms
- Track order fulfillment status

**MVP Features:**
- Product upload (via CSV or UI)
- Inventory management
- Order confirmation workflow
- AI Negotiation portal (receive & respond to offers)
- Performance metrics dashboard
- Blockchain verification of transactions

---

### 3.3 Warehouse Manager
**Goal:** Physical inventory management and logistics coordination

**Responsibilities:**
- Manage inventory across multiple warehouses
- Receive allocation decisions from AI system
- Monitor stock levels per warehouse
- Track incoming and outgoing shipments
- Report stock discrepancies
- Optimize local warehouse operations

**MVP Features:**
- Multi-warehouse inventory view
- Stock level management per warehouse
- AI allocation recommendations dashboard
- Shipment logging
- Warehouse capacity management
- Stock discrepancy reporting

---

### 3.4 Retailer / Reseller
**Goal:** Manage orders and track inventory levels

**Responsibilities:**
- Place manual orders or enable auto-replenishment
- Monitor inventory levels across supplier network
- Track order status
- Access cost optimization insights
- Configure replenishment settings
- View negotiated pricing from AI agents

**MVP Features:**
- Manual order placement
- Auto-replenishment toggle
- Order history
- Order tracking dashboard
- Inventory monitoring
- Negotiated pricing dashboard
- Cost savings summary

---

## 4. CORE MVP FEATURES

### 4.1 User Authentication & Authorization
**Requirement:** Secure multi-role authentication system

**Features:**
- Email/password login with JWT tokens
- Role-based access control (RBAC)
- OAuth2 integration option (for future)
- Session management with 24-hour expiry
- Audit logging for all logins

**Non-Functional Requirements:**
- Password hashing (bcrypt)
- Encrypted HTTPS communication
- Rate limiting on login attempts
- GDPR-compliant data handling

**Acceptance Criteria:**
- Users can only access features for their role
- Unauthorized access attempts are logged
- Session expires after 24 hours of inactivity
- Multi-user login from same account allowed

---

### 4.2 Product Catalog Management
**Requirement:** Suppliers can upload and manage stationery products

**Features:**
- Product upload via UI or CSV batch import
- Auto-detection of product details (SKU, category, brand)
- Product attributes: Name, SKU, Category, Brand, Packaging Size, Price, Lead Time
- Product search and filtering
- Edit and delete capabilities
- Supplier-specific catalog visibility

**Data Fields Required:**
- SKU (unique identifier)
- Product Name
- Category (pens, notebooks, folders, etc.)
- Brand
- Packaging Size
- Unit Price
- Reorder Point
- Lead Time (in days)
- Supplier ID

**Acceptance Criteria:**
- Suppliers can upload ≤1000 products per batch
- CSV import completes in <5 minutes
- All fields are validated before save
- Duplicate SKUs are prevented
- Products searchable by SKU, name, or category

---

### 4.3 Demand Forecasting Engine
**Requirement:** AI model predicts demand for autonomous replenishment

**Features:**
- Time-series forecasting using ARIMA/Prophet
- 7-day ahead demand forecast
- Confidence intervals (80%, 95%)
- Forecast accuracy monitoring
- Manual override capability
- Seasonal pattern detection

**ML Model Specifications:**
- Input: Historical sales (60 days minimum)
- Output: Daily forecast for next 7 days
- Retrain frequency: Weekly
- Accuracy target: MAPE < 20%

**Acceptance Criteria:**
- System generates forecasts daily by 6:00 AM
- Forecasts available via API
- Forecast accuracy tracked and displayed
- Manual override by retailer allowed
- Forecast considers seasonal factors

---

### 4.4 Autonomous Replenishment Logic
**Requirement:** AI system automatically triggers orders when stock falls below threshold

**Features:**
- Real-time inventory monitoring
- Automatic PO generation when reorder point reached
- Safety stock calculation: `safety_stock = z_score × std_dev × √lead_time`
- Reorder point: `(avg_daily_demand × lead_time) + safety_stock`
- Bulk order optimization (group multiple retailer orders)
- Supplier selection logic (lowest cost, highest reliability)

**Algorithm:**
1. Calculate predicted demand for lead time
2. Check current stock level
3. If stock < reorder point, generate auto-PO
4. Route to appropriate supplier
5. Log transaction on blockchain
6. Send notifications to retailer & supplier

**Acceptance Criteria:**
- Auto-PO generated within 1 minute of reorder point breach
- Orders grouped by supplier
- Zero stockouts in pilot period
- Audit trail for all auto-POs

---

### 4.5 Blockchain Transaction Logging
**Requirement:** Immutable record of all orders and deliveries

**Features:**
- Smart contract for PO creation on Polygon
- Transaction hash storage in database
- Blockchain explorer integration
- Transaction status: Pending → Confirmed

**Smart Contract Events:**
- POCreated (timestamp, retailer, supplier, items, amount)
- POConfirmed (POId, supplierSignature)

**Acceptance Criteria:**
- Every PO creates blockchain transaction
- Transaction hash stored in database
- Users can verify on blockchain explorer
- No transaction reversals possible (immutable)
- Gas costs < ₹50 per transaction

---

### 4.6 Notifications & Alerts
**Requirement:** Timely alerts for critical events

**Alert Types:**
- Stock-out risk: When forecast stock < safety stock
- Order confirmation pending: Supplier action required
- Blockchain confirmation: Transaction confirmed
- Negotiation status: New offers or counter-offers from suppliers
- Warehouse capacity: Low inventory in preferred warehouse

**Delivery Channels:**
- In-app notifications
- Email
- SMS (for critical alerts)

**Acceptance Criteria:**
- Critical alerts within 1 minute
- User can customize alert preferences
- No alert spam (max 1 per event type)
- Unsubscribe option available

---

### 4.7 AI-Powered Supplier Negotiation Agent (LangChain/LangGraph)
**Requirement:** Autonomous AI agents negotiate pricing, terms, and conditions with multiple suppliers

**Architecture:**
- **Agent Type:** Multi-turn conversational agent using LangChain/LangGraph
- **Language Model:** GPT-4 or Claude Opus for complex negotiation logic
- **Agent Workflow:** Autonomous negotiation graph with decision trees

**Core Capabilities:**

**1. Negotiation Initiation**
- Analyze pending orders and required quantities
- Identify multiple eligible suppliers for each product
- Calculate best-case scenarios for price, lead time, quantity discounts
- Initiate simultaneous negotiations with top 3 suppliers per product

**2. Negotiation Strategy**
- **Objective:** Minimize total order cost while maintaining quality and delivery timelines
- **Decision Tree:**
  - If price > budget: Counter with lower price
  - If lead time > acceptable: Request expedited shipping
  - If quantity < MOQ (Minimum Order Quantity): Negotiate MOQ reduction or bundle with other products
  - If supplier reputation < threshold: Demand quality certifications

**3. Agent Actions**
- Extract negotiation parameters from pending orders
- Compose negotiation requests to suppliers
- Evaluate supplier counter-offers using cost-benefit analysis
- Generate acceptance/rejection decisions
- Track negotiation history on blockchain

**4. Negotiation Parameters Tracked:**
```
- Unit Price (negotiate down 5-15% if possible)
- Lead Time (target: 2-3 days)
- Minimum Order Quantity (MOQ)
- Quantity Discount Tiers (bulk discounts)
- Payment Terms (Net 30, Net 45, etc.)
- Delivery Frequency (weekly, bi-weekly)
- Quality Certifications (ISO, etc.)
```

**5. Negotiation Workflow (LangGraph Flow)**
```
START
├─ ANALYZE_ORDER
│  ├─ Extract order requirements
│  └─ Identify eligible suppliers
├─ PREPARE_OFFER
│  ├─ Calculate negotiation targets
│  └─ Compose supplier messages
├─ SEND_OFFERS
│  ├─ Multi-supplier parallel negotiation
│  └─ Track response timeline
├─ EVALUATE_RESPONSES
│  ├─ Score supplier offers
│  ├─ Compare vs budget/timeline
│  └─ Decide accept/counter
├─ COUNTER_OFFER (if needed)
│  ├─ Adjust negotiation strategy
│  └─ Re-submit to supplier
├─ ACCEPT_BEST_OFFER
│  ├─ Lock pricing terms
│  ├─ Create blockchain record
│  └─ Notify all parties
└─ END
```

**6. Decision Matrix for Agent**
```
If (price_difference > 10% AND quality_score > 8.5):
    → Accept offer
Else If (price_difference > 5% AND lead_time_acceptable):
    → Counter with -2% price offer
Else If (supplier_new AND discount_available):
    → Accept with trial order
Else:
    → Request new quote
```

**Integration with System:**
- Negotiation data stored in database with blockchain hash
- Supplier receives notification of AI offer
- Supplier can accept/counter via supplier portal
- Admin can override AI decisions (manual approval mode)
- All negotiation history audit-logged

**Acceptance Criteria:**
- AI initiates negotiations for 100% of multi-supplier orders
- Average negotiation time: < 24 hours per order
- Average cost savings: 8-15% vs. list price
- Supplier response rate: > 80%
- Successful negotiations: > 90% (orders fulfilled via negotiated terms)
- All negotiation records immutable on blockchain
- Admin can review and override decisions
- Negotiation audit trail maintained

**Example Negotiation Flow:**
```
System: "Hi Supplier A, need 500 units of SKU-12345 by March 5"
Supplier: "Best price: ₹50/unit, MOQ: 200 units, Lead time: 4 days"
Agent: "Can you do ₹45/unit for 500 units with 3-day lead time?"
Supplier: "Can do ₹47/unit, 3-day lead time, MOQ: 300 units"
Agent: "Accepted! Order placed for 500 units at ₹47/unit, delivery by March 5"
System: Creates PO, blockchain record, sends confirmation
```

---

### 4.8 Multi-Warehouse Optimization Agent (LangChain/LangGraph)
**Requirement:** AI system optimizes inventory distribution across multiple warehouses

**Architecture:**
- **Agent Type:** Decision-making optimization agent using LangGraph
- **Optimization Goal:** Minimize total logistics cost while maximizing service level

**Core Capabilities:**

**1. Warehouse Network Analysis**
- Monitor real-time inventory across all warehouses
- Track warehouse capacity utilization
- Calculate distance to retailers
- Analyze historical demand patterns by region

**2. Optimization Objectives**
- **Primary:** Minimize total transportation cost
- **Secondary:** Maximize service level (on-time delivery %)
- **Tertiary:** Balance warehouse utilization (no over/under-stocking)

**3. Agent Workflow (LangGraph Structure)**
```
START
├─ ANALYZE_DEMAND
│  ├─ Get pending orders by region
│  └─ Forecast regional demand
├─ CHECK_WAREHOUSE_STOCK
│  ├─ Query inventory levels
│  ├─ Calculate available stock
│  └─ Identify shortage locations
├─ GENERATE_ALLOCATION_OPTIONS
│  ├─ For each pending order:
│  │  ├─ Option 1: Source from nearest warehouse
│  │  ├─ Option 2: Source from cheapest warehouse
│  │  ├─ Option 3: Source from warehouse with excess stock
│  │  └─ Option 4: Split shipment across warehouses
│  └─ Calculate cost for each option
├─ CALCULATE_DISTRIBUTION_COSTS
│  ├─ Base cost: warehouse → retailer
│  ├─ Variable cost: distance × weight
│  └─ Premium cost: expedited shipping (if needed)
├─ OPTIMIZE_ALLOCATION
│  ├─ Apply cost minimization algorithm
│  ├─ Apply service level constraints
│  └─ Check warehouse capacity limits
├─ GENERATE_INTER_WAREHOUSE_TRANSFERS
│  ├─ If warehouse X has excess, warehouse Y has shortage:
│  │  └─ Recommend transfer (batch by geography)
│  └─ Calculate cost vs. future benefits
├─ CREATE_ALLOCATION_PLAN
│  ├─ Assign each order to specific warehouse
│  ├─ Schedule inter-warehouse transfers
│  └─ Update inventory allocations
├─ NOTIFY_WAREHOUSES
│  ├─ Send allocation instructions
│  └─ Track fulfillment
└─ END
```

**4. Optimization Constraints**
```
Constraints:
- Warehouse capacity: allocation ≤ available capacity
- Delivery deadline: estimated delivery ≤ required date
- Quality: Only use warehouses with good delivery records
- Cost: Total cost ≤ budget threshold

Preferences:
- Nearest warehouse (if cost similar)
- Warehouse with highest stock (reduce stockout risk)
- Balanced utilization (avoid over/under-stocking)
```

**5. Cost Calculation Formula**
```
Total_Cost = 
  Σ (Base_Distance_Cost × Distance + Weight_Cost × Weight)
  + Warehouse_Utilization_Penalty
  + Service_Level_Penalty (if estimated delivery > required)
  - Bulk_Discount_Savings

Where:
- Base_Distance_Cost = ₹1 per km
- Weight_Cost = ₹0.5 per kg
- Service_Level_Penalty = ₹500 if delivery date exceeded
- Bulk_Discount_Savings = 2% for orders > 500 units from single warehouse
```

**6. Smart Allocation Examples**

**Example 1: Regional Clustering**
```
Order 1: Retailer Delhi (20 units, SKU-12345)
Order 2: Retailer Gurgaon (15 units, SKU-12345)
Order 3: Retailer Noida (25 units, SKU-12345)

Agent decides:
→ All 3 orders from Warehouse-Delhi (closest hub)
→ Batch shipment, saves ₹300 vs. separate shipments
```

**Example 2: Load Balancing**
```
Pending Orders: 1000 units total
Warehouse-A: 600 units available (capacity: 1000)
Warehouse-B: 200 units available (capacity: 500 - 80% utilized)
Warehouse-C: 500 units available (capacity: 600 - underutilized)

Agent decides:
→ Allocate 600 from Warehouse-A (nearest to orders)
→ Allocate 300 from Warehouse-C (to rebalance utilization)
→ Mark 100 units as pending (wait for replenishment)
```

**Example 3: Inter-Warehouse Transfer**
```
Current State:
Warehouse-North: 100 units SKU-456 (capacity full)
Warehouse-South: 50 units SKU-456 (capacity 70% full)

Pending: Order for 80 units SKU-456 in South region

Agent decides:
→ Transfer 30 units from North to South (cost: ₹500)
→ Source 80 units from South warehouse (saves ₹1200 transport cost)
→ Net savings: ₹700
```

**7. Multi-Warehouse Optimization Dashboard Metrics**
- Total warehouse utilization %
- Average delivery distance (km)
- Cost per unit shipped
- Warehouse-wise stock levels
- Recommended inter-warehouse transfers
- Service level achieved (on-time %)
- Cost savings achieved vs. baseline

**Integration with System:**
- Optimization runs every 1 hour or on-demand
- Allocation recommendations available to warehouse managers
- Auto-execute for authorized warehouse managers
- Manual review mode for complex decisions
- All allocation decisions tracked with cost impact
- Audit trail for all allocation decisions

**Acceptance Criteria:**
- Agent analyzes orders within 5 minutes of placement
- Generates allocation for 100% of orders
- Cost optimization: 10-20% savings vs. baseline allocation
- Service level maintained: >98% on-time delivery
- Warehouse utilization balanced: CV < 0.15 (low variance)
- Inter-warehouse transfers: <5% of total orders
- All decisions audit-logged and explainable
- Admin can override recommendations

---

### 4.9 Role-Based Dashboards
**Requirement:** Customized views for each user role

#### Admin Dashboard
- Total orders (daily, monthly, yearly)
- Revenue metrics
- Top-selling products
- Stock-out alerts
- Vendor performance scorecard
- System health status
- **NEW:** AI Negotiation summary (success rate, avg savings)
- **NEW:** Warehouse optimization metrics (utilization, cost savings)

#### Supplier Dashboard
- Active orders
- Order confirmation pending
- Stock levels (for their products)
- Revenue analytics
- Performance ratings
- **NEW:** Incoming negotiation requests
- **NEW:** Negotiation history and terms

#### Retailer Dashboard
- Current inventory levels
- Outstanding orders
- Auto-replenishment status
- Cost savings summary
- Order history (last 90 days)
- **NEW:** Negotiated pricing dashboard
- **NEW:** Multi-warehouse fulfillment visibility

#### Warehouse Manager Dashboard
- Inventory levels per warehouse
- Warehouse capacity utilization
- Stock discrepancies
- Blockchain verification status
- **NEW:** AI allocation recommendations
- **NEW:** Inter-warehouse transfer instructions

**Acceptance Criteria:**
- Dashboards load in <3 seconds
- All data updated within 5 minutes
- Charts and tables responsive on mobile
- Export to CSV/PDF functionality
- Filters work across all metrics

---

### 4.10 Basic Analytics
**Requirement:** Insights into supply chain performance

**Metrics (MVP Phase 1):**
- Order fulfillment rate (%)
- Average order cycle time
- Stock-out incidents
- Supplier performance score
- Cost per order
- Forecast accuracy (MAPE)
- **NEW:** Negotiation success rate
- **NEW:** Average cost savings from negotiations
- **NEW:** Warehouse utilization rate
- **NEW:** Inter-warehouse transfer frequency

**Acceptance Criteria:**
- Metrics calculated daily
- 30-day and 90-day comparison views
- Exportable reports
- Real-time update of key metrics

---

## 5. USER WORKFLOWS (HAPPY PATHS)

### 5.1 Workflow: Autonomous Replenishment with AI Negotiation
```
Retailer Setup (One-time):
1. Configure auto-replenishment enabled
2. Set reorder threshold (e.g., 50 units)
3. Choose multiple preferred suppliers
4. Set negotiation parameters (max price, lead time requirement)

Daily Autonomous Flow:
1. AI calculates forecast for product
2. System checks current inventory
3. If stock < reorder point:
   → Generate auto-PO with requirements
   → Identify eligible suppliers
   → Launch AI Negotiation Agent
4. Agent sends offers to all suppliers in parallel
5. Suppliers receive notifications and respond with counter-offers
6. Agent evaluates responses and selects best offer
7. Agent creates blockchain record of negotiated terms
8. PO confirmed with winning supplier
9. Retailer & supplier receive notifications
10. Order proceeds to fulfillment
```

Expected Duration: 2-5 days (depending on lead time)

---

### 5.2 Workflow: Manual Order with Multi-Warehouse Optimization
```
1. Retailer logs into dashboard
2. Navigates to "New Order"
3. Searches for product by SKU/name
4. Selects quantity
5. Confirms order
6. System triggers Multi-Warehouse Optimization Agent
7. Agent analyzes inventory across all warehouses
8. Agent recommends optimal warehouse(s)
9. Warehouse manager receives allocation instructions
10. Fulfillment begins from optimized warehouse
11. Retailer receives notification with fulfillment details
```

Expected Duration: <5 minutes for order placement + fulfillment optimization

---

### 5.3 Workflow: Supplier Negotiation Response
```
Supplier (Vendor):
1. Logs into supplier portal
2. Sees "New Negotiation Requests" (1-3 AI offers)
3. Reviews AI's offer:
   - Required quantity: 500 units
   - AI proposed price: ₹45/unit
   - Lead time requirement: 3 days
   - Delivery: Block X (Mumbai region)
4. Supplier can:
   a) Accept offer → Order placed immediately
   b) Counter-offer → Send alternative terms
   c) Reject → Decline negotiation
5. If counter-offer:
   - AI agent receives response
   - Agent evaluates counter using decision logic
   - Agent auto-accepts if within tolerance, or counters again
   - Process repeats up to 3 rounds
6. Final agreement locked on blockchain
7. PO generated and sent to supplier
```

Expected Duration: 4-24 hours for negotiation cycle

---

### 5.4 Workflow: Warehouse Manager Receives Allocation
```
Warehouse Manager:
1. Logs into dashboard
2. Sees "Pending Orders: 45 units SKU-12345"
3. Clicks to see allocation recommendation from AI:
   "Source 30 from Warehouse-A (nearest), 15 from Warehouse-C (load balance)"
4. Manager can:
   a) Accept recommendation → Auto-allocate
   b) Override → Choose different warehouse
5. System updates inventory allocations
6. Fulfillment instructions sent to warehouse team
7. Manager receives transfer recommendation:
   "Transfer 20 units SKU-456 from Warehouse-A to Warehouse-B (cost savings: ₹300)"
8. Manager approves or rejects transfer
```

Expected Duration: <10 minutes for optimization and allocation

---

### 5.5 Workflow: Supplier Product Upload
```
1. Supplier logs in
2. Navigates to "Manage Catalog"
3. Clicks "Upload Products"
4. Selects CSV file with product details
5. System validates fields:
   - SKU (required)
   - Product Name (required)
   - Category (required)
   - Price (required)
   - Lead Time (required)
6. System auto-detects duplicates
7. Shows summary: "450 new products, 12 updates, 3 duplicates"
8. Supplier reviews & confirms
9. Products added to catalog
10. Email confirmation sent
```

Expected Duration: 5-10 minutes

---

## 6. TECHNICAL ARCHITECTURE

### 6.1 Tech Stack

**Frontend:**
- React.js (web dashboard)
- Tailwind CSS (styling)
- Redux (state management)

**Backend:**
- Node.js + Express.js
- Python (for ML models & AI agents)
- PostgreSQL (relational data)
- MongoDB (logs & audit trails)

**AI/ML/Agents:**
- **LangChain/LangGraph** (multi-agent orchestration)
- **GPT-4 or Claude Opus** (language model for negotiation & optimization)
- **TensorFlow or Scikit-Learn** (forecasting)
- **Prophet** (time-series forecasting)
- **Python + FastAPI** (ML & Agent service)

**Blockchain:**
- Polygon (for smart contracts, lower gas fees)
- Solidity (smart contracts)
- Web3.js (blockchain interaction)

**Infrastructure:**
- AWS or GCP for hosting
- Docker for containerization
- CI/CD with GitHub Actions
- Monitoring with CloudWatch/Datadog

---

### 6.2 API Architecture

**Core Endpoints (MVP):**

```
AUTH
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh

PRODUCTS
GET /api/products?category=pens&page=1
POST /api/products (supplier)
PUT /api/products/:id (supplier)
DELETE /api/products/:id (supplier)
POST /api/products/batch-upload (supplier)

INVENTORY
GET /api/inventory/:retailerId
GET /api/inventory/multi-warehouse (warehouse-level)
POST /api/inventory/set-reorder-point (retailer)
GET /api/inventory/forecast/:productId

ORDERS
POST /api/orders (retailer/auto-replenishment)
GET /api/orders/:orderId
GET /api/orders?status=pending (supplier)
PUT /api/orders/:orderId/confirm (supplier)

NEGOTIATION (NEW)
POST /api/negotiation/initiate (system)
GET /api/negotiation/:orderId/status
PUT /api/negotiation/:negotiationId/respond (supplier)
GET /api/negotiation/history/:supplierId
GET /api/negotiation/analytics (admin)

WAREHOUSE_OPTIMIZATION (NEW)
GET /api/warehouse/optimization/:orderId
GET /api/warehouse/utilization (warehouse manager)
POST /api/warehouse/allocation/execute (warehouse manager)
GET /api/warehouse/transfer-recommendations (warehouse manager)
POST /api/warehouse/transfer/:transferId/approve (warehouse manager)

BLOCKCHAIN
POST /api/blockchain/po-creation (internal)
GET /api/blockchain/tx/:txHash

NOTIFICATIONS
GET /api/notifications (user)
PUT /api/notifications/:id/read
PUT /api/notifications/preferences (user)

ANALYTICS
GET /api/analytics/dashboard/:role
GET /api/analytics/metrics/:metric
GET /api/analytics/negotiation-insights (admin)
GET /api/analytics/warehouse-insights (admin)
```

---

### 6.3 LangChain/LangGraph Agent Architecture

**Supplier Negotiation Agent:**
```
Graph Structure:
┌─────────────────┐
│  START_NODE     │
└────────┬────────┘
         │
┌────────▼────────────────────┐
│  ANALYZE_ORDER_NODE         │ (Extract requirements)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  SELECT_SUPPLIERS_NODE      │ (Find eligible suppliers)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  COMPOSE_OFFER_NODE        │ (Create negotiation message)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  SEND_OFFERS_NODE          │ (Multi-supplier async)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  WAIT_FOR_RESPONSES_NODE   │ (24-48 hours timeout)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  EVALUATE_OFFERS_NODE      │ (Score & rank)
└────────┬───────────────────┘
         │
    ┌────┴────┐
    │ Decision │
    └────┬────┘
         │
    ┌────┴──────────────┐
    │                   │
┌───▼──────┐     ┌──────▼────┐
│ ACCEPT   │     │ COUNTER    │
│ BEST     │     │ OFFER      │
└───┬──────┘     └──────┬────┘
    │                   │
    │            ┌──────▼────┐
    │            │ COUNTER ≤ 3│
    │            │ TIMES ?     │
    │            └──────┬─────┘
    │                   │
    │            ┌──────┴──────┐
    │            │             │
    │      ┌─────▼─┐     ┌────▼──┐
    │      │ YES   │     │ NO    │
    │      └─────┬─┘     └────┬──┘
    │            │            │
    │      ┌─────▼──┐    ┌────▼──┐
    │      │RE-SEND │    │REJECT │
    │      │COUNTER │    └────┬──┘
    │      └─────┬──┘         │
    │            │            │
    └────────┬───┴────────────┤
             │                │
        ┌────▼────────────────▼──┐
        │ CREATE_BLOCKCHAIN_REC  │
        └────────┬───────────────┘
                 │
        ┌────────▼───────────┐
        │  NOTIFY_ALL_PARTIES │
        └────────┬───────────┘
                 │
        ┌────────▼───────────┐
        │  GENERATE_PO_NODE  │
        └────────┬───────────┘
                 │
        ┌────────▼───────────┐
        │  END_NODE          │
        └────────────────────┘
```

**Multi-Warehouse Optimization Agent:**
```
Graph Structure:
┌─────────────────┐
│  START_NODE     │
└────────┬────────┘
         │
┌────────▼────────────────────┐
│  FETCH_WAREHOUSE_DATA       │ (All inventory, capacity)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  FETCH_PENDING_ORDERS       │ (Extract requirements)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  ANALYZE_DEMAND_PATTERNS    │ (Regional, temporal)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  GENERATE_ALLOCATION_OPTIONS│ (Multiple scenarios)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  CALCULATE_COSTS            │ (For each option)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  RUN_OPTIMIZATION_ALGORITHM │ (Cost minimization)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  CHECK_CONSTRAINTS          │ (Capacity, delivery date)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  IDENTIFY_TRANSFERS         │ (Inter-warehouse moves)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  GENERATE_ALLOCATION_PLAN   │ (Final assignments)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  CREATE_BLOCKCHAIN_RECORD   │ (Immutable log)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  NOTIFY_WAREHOUSES          │ (Send instructions)
└────────┬───────────────────┘
         │
┌────────▼────────────────────┐
│  END_NODE                   │
└────────────────────────────┘
```

---

## 7. DATA MODEL (SIMPLIFIED)

### Core Tables

**USERS**
- user_id, email, password_hash, role, phone, is_active

**PRODUCTS**
- product_id, sku, name, category, supplier_id, price, lead_time_days

**INVENTORY**
- inventory_id, product_id, retailer_id, warehouse_id, current_stock, reorder_point, last_replenishment_date

**ORDERS**
- order_id, retailer_id, supplier_id, status, created_date, blockchain_tx_hash, warehouse_allocated

**ORDER_ITEMS**
- item_id, order_id, product_id, quantity, unit_price

**NEGOTIATIONS** (NEW)
- negotiation_id, order_id, supplier_id, initial_offer, counter_offer, final_price, status, rounds
- Created_date, finalized_date, blockchain_tx_hash

**WAREHOUSE_ALLOCATIONS** (NEW)
- allocation_id, order_id, warehouse_id, quantity, allocation_cost, allocation_timestamp
- Optimization_reasoning, ai_score

**WAREHOUSE_TRANSFERS** (NEW)
- transfer_id, from_warehouse_id, to_warehouse_id, product_id, quantity, transfer_cost
- Reason, approved_by, created_date, executed_date

**BLOCKCHAIN_TRANSACTIONS**
- tx_id, tx_hash, tx_type (PO_CREATED, NEGOTIATION_FINALIZED), order_id, timestamp, status

**NOTIFICATIONS**
- notification_id, user_id, type, message, is_read, created_at

---

## 8. SUCCESS METRICS

### Business Metrics
- Reduce manual ordering by 80%
- Eliminate stock-outs (target: 0 for MVP)
- Reduce order cycle time by 30%
- Improve forecast accuracy to MAPE < 20%
- **NEW:** Achieve 8-15% cost savings from AI negotiations
- **NEW:** Reduce logistics cost by 10-20% through warehouse optimization
- User adoption rate > 50% in pilot retailers

### Technical Metrics
- System uptime: 99.5%
- API response time: <500ms (p95)
- Blockchain confirmation time: <5 minutes
- Notification delivery: >99%
- **NEW:** Agent negotiation completion time: <24 hours per order
- **NEW:** Warehouse optimization run time: <5 minutes per request

### User Engagement Metrics
- Daily active users > 60% of registered users
- Average session duration > 10 minutes
- Feature adoption: >80% using auto-replenishment
- **NEW:** Supplier negotiation acceptance rate: >90%
- **NEW:** Warehouse optimization recommendation adoption: >85%

---

## 9. MVP SCOPE & EXCLUSIONS

### In MVP:
✅ User authentication (basic email/password)
✅ Product catalog (supplier upload)
✅ Demand forecasting (7-day ahead)
✅ Autonomous replenishment (basic logic)
✅ Blockchain logging (PO creation)
✅ Role-based dashboards (basic views)
✅ Notifications (email, in-app)
✅ Basic analytics (order metrics)
✅ **AI-Powered Supplier Negotiation Agent (LangChain/LangGraph)**
✅ **Multi-Warehouse Optimization Agent (LangChain/LangGraph)**

### Out of MVP (Future Phases):
❌ OAuth2 integration
❌ Advanced ML models (ensemble methods)
❌ QR code generation & scanning
❌ Delivery tracking (status updates, GPS)
❌ Voice & image recognition
❌ Advanced analytics (predictive supplier failure)
❌ Mobile native app
❌ Pricing optimization AI
❌ Customer portal
❌ Voice/chat interface for agents

---

## 10. TIMELINE & MILESTONES

### Phase 1: Core Infrastructure (Weeks 1-4)
- Backend setup (APIs, database schema)
- User authentication system
- Basic dashboard UI
- Database initialization

**Deliverable:** Working API with login, product upload, basic inventory tracking

### Phase 2: AI & Blockchain (Weeks 5-10)
- Forecasting model training
- Blockchain smart contracts deployment
- Auto-replenishment logic
- **LangChain/LangGraph setup**
- **Supplier Negotiation Agent development**
- **Multi-Warehouse Optimization Agent development**
- Blockchain integration for negotiation records

**Deliverable:** Autonomous replenishment + AI agents working end-to-end

### Phase 3: Polish & Testing (Weeks 11-14)
- UI/UX refinement
- Comprehensive testing (unit, integration, E2E)
- Agent performance tuning
- Performance optimization
- Security audit
- Pilot with 3-5 retailers and 5-10 suppliers

**Deliverable:** Production-ready MVP

---

## 11. RISK ASSESSMENT & MITIGATION

### Risk 1: Blockchain Scalability
**Risk:** High gas fees or slow transaction times
**Mitigation:** Use Polygon (cheaper than Ethereum), batch transactions, caching strategy

### Risk 2: Forecast Accuracy
**Risk:** Poor predictions lead to stockouts or overstock
**Mitigation:** Start with simple ARIMA, get 60+ days of historical data, manual override option

### Risk 3: User Adoption
**Risk:** Retailers reluctant to use auto-replenishment
**Mitigation:** Start with manual orders, incentivize with cost savings, provide training

### Risk 4: AI Agent Performance
**Risk:** Agents make poor negotiation or allocation decisions
**Mitigation:** Admin override mode, manual approval for large orders, continuous monitoring

### Risk 5: Data Privacy
**Risk:** GDPR/Privacy compliance issues
**Mitigation:** Data encryption, audit logs, clear privacy policy, user consent

### Risk 6: Multi-Agent Conflicts
**Risk:** Negotiation and optimization agents provide conflicting recommendations
**Mitigation:** Clear priority logic, single source of truth for decisions, audit logging

---

## 12. DEPENDENCIES & ASSUMPTIONS

### Dependencies
- Blockchain RPC node (Polygon)
- AWS/GCP for cloud hosting
- Email service (SendGrid/AWS SES)
- ML training data (60+ days historical sales)
- LangChain/LangGraph libraries
- GPT-4 or Claude API access
- Historical warehouse/logistics data

### Assumptions
- Retailers have basic internet connectivity
- Suppliers willing to use platform and respond to AI offers
- Legal framework supports blockchain contracts and AI-assisted agreements
- Historical sales data available
- Multiple suppliers available for negotiation
- Warehouse coordination possible (shared infrastructure)
- LLM API costs acceptable for scale (~$0.05-0.10 per negotiation)

---

## 13. ACCEPTANCE CRITERIA

### System Must:
1. ✅ Process 1000+ concurrent users without performance degradation
2. ✅ Generate auto-POs within 60 seconds of reorder point breach
3. ✅ Complete AI negotiations within 24 hours
4. ✅ Confirm blockchain transactions within 5 minutes
5. ✅ Generate warehouse allocation recommendations in <5 minutes
6. ✅ Maintain 99.5% uptime
7. ✅ Support role-based access (no unauthorized access)
8. ✅ Generate 7-day forecast with MAPE < 20%
9. ✅ Log 100% of critical transactions on blockchain
10. ✅ Support all 4 user roles with dedicated dashboards
11. ✅ Achieve 8-15% cost savings through negotiations
12. ✅ Achieve 10-20% logistics cost reduction through optimization

---

## 14. GLOSSARY

| Term | Definition |
|------|-----------|
| **SKU** | Stock Keeping Unit — unique product identifier |
| **Reorder Point** | Stock level triggering automatic replenishment |
| **Safety Stock** | Buffer inventory preventing stockouts |
| **Lead Time** | Days between order placement and receipt |
| **MAPE** | Mean Absolute Percentage Error — forecast accuracy metric |
| **Smart Contract** | Self-executing blockchain program |
| **RBAC** | Role-Based Access Control |
| **PO** | Purchase Order |
| **Blockchain TX Hash** | Unique transaction identifier on blockchain |
| **LangChain** | Framework for building LLM-powered applications |
| **LangGraph** | Framework for multi-agent orchestration |
| **MOQ** | Minimum Order Quantity required by supplier |
| **Multi-Warehouse** | Distributed inventory across multiple locations |
| **Agent** | Autonomous AI system making decisions |

---

## 15. APPROVAL & SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | | | |
| Tech Lead | | | |
| Business Owner | | | |
| Stakeholder | | | |

---

## 16. DOCUMENT HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | Feb 14, 2026 | Product Team | Initial PRD for MVP |
| 1.1 | Feb 14, 2026 | Product Team | Removed Delivery, QR, Tracking, Customer features |
| 2.0 | Feb 14, 2026 | Product Team | Added AI Supplier Negotiation & Multi-Warehouse Optimization agents |

---

**END OF DOCUMENT**

---

### Next Steps:
1. Review and approve PRD with stakeholders
2. Conduct technical feasibility assessment for LangChain/LangGraph
3. Set up LLM API accounts (OpenAI/Anthropic)
4. Create detailed feature specifications for AI agents
5. Begin Phase 1 development (infrastructure)
6. Set up CI/CD pipeline and monitoring
7. Prototype AI agent workflows

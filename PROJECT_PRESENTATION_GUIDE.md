# AutoStock AI - Complete Project Presentation Guide

## 📋 Executive Summary

**AutoStock AI** is an intelligent supply chain and procurement automation platform that uses AI agents, real-time forecasting, and blockchain for transparent, auditable supply chain operations.

**Problem Solved:**
- Manual procurement processes are slow and error-prone
- Demand forecasting lacks intelligence
- Supplier negotiations are time-consuming
- No transparent audit trail for compliance
- Warehouse optimization is manual and inefficient

**Solution:**
- AI-powered demand forecasting agent
- Autonomous procurement negotiation agent
- Intelligent warehouse optimization
- Blockchain-based immutable audit trail
- Real-time dashboards for 4 different roles

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOSTOCK AI PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   FRONTEND       │  │    BACKEND API   │  │     BLOCKCHAIN   │
│  │  (Next.js React) │  │  (Express.js)    │  │  (Solidity)      │
│  │                  │  │                  │  │                  │
│  │ 4 Role          │  │ 10+ Modules      │  │ SupplyChainAudit │
│  │ Dashboards      │  │ Database: MongoDB│  │ Smart Contract   │
│  │                  │  │                  │  │                  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│         │                      │                       │         │
│         └──────────────────────┼───────────────────────┘         │
│                                │                                 │
│  ┌─────────────────────────────▼──────────────────────────┐    │
│  │              AI AGENTS LAYER (Mastra)                 │    │
│  │                                                        │    │
│  │  ┌────────────────┐  ┌──────────────────────────────┐ │    │
│  │  │ Forecast Agent │  │ Negotiation Agent (Mastra)   │ │    │
│  │  │ (LangGraph)    │  │ - Multi-turn conversation   │ │    │
│  │  │                │  │ - Price extraction          │ │    │
│  │  │ • Demand       │  │ - Deal scoring              │ │    │
│  │  │   prediction   │  │ - PO generation             │ │    │
│  │  │ • Seasonality  │  │ - LibSQL memory persistence │ │    │
│  │  │ • Confidence   │  │ - Blockchain logging        │ │    │
│  │  │   intervals    │  │                              │ │    │
│  │  └────────────────┘  └──────────────────────────────┘ │    │
│  │                                                        │    │
│  │  ┌────────────────────────────────────────────────┐   │    │
│  │  │ Warehouse Optimization Agent (LangGraph)       │   │    │
│  │  │ • Zone utilization analysis                    │   │    │
│  │  │ • Product placement recommendations            │   │    │
│  │  │ • Movement pattern analysis                    │   │    │
│  │  │ • Cost savings estimation                      │   │    │
│  │  └────────────────────────────────────────────────┘   │    │
│  │                                                        │    │
│  │  LLM: Google Gemini 2.0 Flash (1M token context)    │    │
│  │  Memory: LibSQL (persistent conversation state)      │    │
│  │  Frameworks: Mastra + LangGraph                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              DATA PERSISTENCE LAYER                    │    │
│  │  MongoDB: Products, Inventory, Orders, Forecasts     │    │
│  │  LibSQL: Agent conversation history & memory         │    │
│  │  Blockchain: Immutable audit trail (hashes)          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Features & Workflows

### 1. **Demand Forecasting Pipeline**

```
Historical Inventory Data (90 days)
           │
           ▼
┌──────────────────────────────────┐
│  Forecast Agent (LangGraph)      │
│  ─────────────────────────────   │
│  Input:                          │
│  • Product ID                    │
│  • Warehouse ID                  │
│  • Historical transactions       │
│  • Seasonal patterns             │
└──────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Google Gemini Analysis          │
│  ─────────────────────────────   │
│  • Pattern recognition           │
│  • Trend analysis                │
│  • Confidence calculation        │
└──────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  7-Day Forecast Output:          │
│  • Daily demand predictions      │
│  • Confidence intervals (low/hi) │
│  • Recommended reorder quantity  │
│  • Reorder date recommendation   │
└──────────────────────────────────┘
           │
           ▼
MongoDB (DemandForecast collection)
           │
           ├──► Frontend Dashboard (visibility)
           ├──► Procurement Officer (action trigger)
           └──► Negotiation Agent (budget planning)
```

**Execution:** Automatic scheduler (node-cron) runs every 6 hours for all products

---

### 2. **AI-Powered Procurement Negotiation**

```
LOW STOCK ALERT
     │
     ▼
┌──────────────────────────────────────────────────┐
│  Negotiation Agent (Mastra AI + Gemini)         │
│  ────────────────────────────────────────────    │
│  Triggered when: Inventory < Reorder Point (ROP)│
└──────────────────────────────────────────────────┘
     │
     ├─────────────────────┬─────────────────────┐
     ▼                     ▼                     ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│Supplier 1│         │Supplier 2│         │Supplier 3│
│          │         │          │         │          │
│ Sends:   │         │ Sends:   │         │ Sends:   │
│ • Quote  │         │ • Quote  │         │ • Quote  │
│ • MOQ    │         │ • MOQ    │         │ • MOQ    │
│ • Terms  │         │ • Terms  │         │ • Terms  │
└──────────┘         └──────────┘         └──────────┘
     │                     │                     │
     └─────────────────────┼─────────────────────┘
                           │
                           ▼
                 ┌──────────────────────┐
                 │ Negotiation Logic:   │
                 │ • Extract prices     │
                 │ • Compare offers     │
                 │ • Counter-offer      │
                 │ • Budget enforcement │
                 │ • BATNA strategy     │
                 └──────────────────────┘
                           │
                    BEST DEAL FOUND
                           │
                           ▼
                 ┌──────────────────────┐
                 │ Generate Purchase    │
                 │ Order PDF            │
                 └──────────────────────┘
                           │
                           ▼
           ┌───────────────┬──────────────┐
           │               │              │
           ▼               ▼              ▼
      MongoDB      Blockchain       Email
     (PO stored)   (Hash logged)  (Sent to supplier)
```

**Key Features:**
- **Multi-turn negotiation** with persistent memory (LibSQL)
- **Price extraction** from unstructured supplier messages
- **Automated counter-offers** using System 2 thinking
- **Budget constraint enforcement** (hard pmax ceiling)
- **BATNA scoring** across multiple suppliers
- **Auto-generation** of Purchase Order on deal closure

---

### 3. **Warehouse Optimization**

```
Warehouse Data Collection
     │
     ├─ Zone utilization metrics
     ├─ Current inventory placement
     ├─ Movement history (30 days)
     ├─ Transaction frequency
     └─ Space constraints
     │
     ▼
┌──────────────────────────────────────────┐
│  Warehouse Optimization Agent (LangGraph)│
│  ──────────────────────────────────────  │
│  • Analyzes zone efficiency              │
│  • Identifies hot/cold products          │
│  • Calculates movement costs             │
│  • Recommends relocations                │
└──────────────────────────────────────────┘
     │
     ▼
Recommendations Generated:
     ├─ Zone reassignments (cold storage for slow-movers)
     ├─ Product relocations (high-velocity to pick zones)
     └─ Capacity expansion suggestions
     │
     ▼
┌──────────────────────────────────────┐
│  Dashboard Display for:              │
│  • Admin (oversee recommendations)   │
│  • Warehouse Manager (approve/reject)│
└──────────────────────────────────────┘
     │
     ▼
MongoDB + Blockchain Hash Logging
```

---

### 4. **Blockchain Audit Trail**

```
Every supply chain event creates an immutable record:

┌─────────────────────────────────────────────┐
│  SupplyChainAudit Smart Contract (Solidity) │
│  ─────────────────────────────────────────  │
│  Network: Ethereum Sepolia Testnet          │
└─────────────────────────────────────────────┘
           │
           ▼
Event Types Tracked:
    ├─ PO_CREATED ─────────────────┐
    ├─ PO_APPROVED                 │
    ├─ PO_SENT                     │
    ├─ PO_RECEIVED                 │
    ├─ NEGOTIATION_ACCEPTED        │──► Immutable on-chain record
    ├─ NEGOTIATION_REJECTED        │
    ├─ INVENTORY_ADJUSTMENT        │
    └─ SMART_CONTRACT_EXECUTED ────┘
           │
What's Stored On-Chain:
    ├─ Document Hash (SHA-256)
    ├─ Reference ID (MongoDB ObjectId)
    ├─ Event Type (enum)
    ├─ Amount (if applicable)
    ├─ Timestamp (block time)
    └─ Submitter address (who logged it)
           │
           ▼
Full documents stay OFF-CHAIN in MongoDB
(only hashes live on blockchain)
           │
           ▼
Verification:
    ├─ Scan QR code on shipment
    ├─ Fetch hash from blockchain
    ├─ Validate with MongoDB record
    └─ Detect tampering (hash mismatch)
```

**Smart Contract Functions:**
- `logEvent()` - Record single event with hash
- `logEventsBatch()` - Batch logging (gas optimization)
- `verifyHash()` - Verify document integrity
- `getEntries()` - Retrieve full audit trail
- `addSubmitter()` - Whitelist approved submitters

---

## 🎨 Frontend Architecture (4 Role-Based Dashboards)

### **Total Screens: 32** across 4 roles

```
┌──────────────────────────────────────────────────────────┐
│                   AUTOSTOCK AI FRONTEND                   │
│                  (Next.js App Router)                     │
└──────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │   AUTH   │       │SHARED   │       │ADMIN    │
   │ SCREENS  │       │PLATFORM │       │SCREENS  │
   └─────────┘       └─────────┘       └─────────┘
        │                  │                  │
    Login               • Notifications   • Dashboard
    Unauthorized        • Blockchain      • Partner Mgmt
    Role selector         Viewer          • Negotiation
                       • Settings         Oversight
                                         • Warehouse
                                           Oversight
                                         • Analytics
        │
        ├─────────────────┬─────────────────┬──────────────┐
        │                 │                 │              │
        ▼                 ▼                 ▼              ▼
    ┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
    │SUPPLIER │     │WAREHOUSE│     │ RETAILER │     │  FUTURE │
    │PORTAL   │     │MANAGER  │     │ DASHBOARD│     │ SCREENS │
    └─────────┘     └─────────┘     └──────────┘     └─────────┘
        │                 │                 │
    • Dashboard        • Dashboard        • Dashboard
    • Catalog Mgmt     • Inventory        • Inventory
    • Bulk Upload      • Stock Mgmt       • Forecast
    • Orders Queue     • Allocations      • Manual Orders
    • Negotiation      • Transfers        • Order History
      Response         • Receiving        • Replenish
    • Performance      • Operations       Settings
      Metrics          • Movements        • Pricing &
                                           Savings
```

---

### **ADMIN DASHBOARD** (Screen: A01)

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD - System Overview & Control Center     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ KEY METRICS ROW                                  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Total Orders: 245  │ Pending Negotiations: 12   │  │
│  │ Low Stock Alerts: 8 │ Supplier Performance: 94% │  │
│  │ Warehouse Util: 87% │ Avg Negotiation Rounds: 3 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ CHARTS SECTION                                   │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ [Order Trends Chart]    [Supplier Rankings]     │  │
│  │ [Forecast Accuracy]     [Cost Savings Trend]    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ RECENT ACTIVITIES                                │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ • PO#2045 Negotiation complete (saved ₹5,000)  │  │
│  │ • Warehouse optimization suggested (WH-03)     │  │
│  │ • Forecast alert: Low stock SKU-891 in WH-02   │  │
│  │ • Negotiation round 3: Supplier-A counter-offer│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Manage Partners] [View Negotiations] [Settings]      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Admin Screens (7 total):**
1. Dashboard (overview + metrics)
2. Partner Management (suppliers & retailers)
3. Supplier Scorecard (performance tracking)
4. Negotiation Oversight (monitor agent + override)
5. Warehouse Optimization Oversight (review recommendations)
6. Alert Configuration (set thresholds)
7. Analytics & Reporting (export data)

---

### **SUPPLIER PORTAL** (6 screens)

```
┌─────────────────────────────────────────────────────────┐
│  SUPPLIER DASHBOARD                                     │
├─────────────────────────────────────────────────────────┤
│  Dashboard │ Catalog │ Orders │ Negotiations │ Performance
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ QUICK METRICS                                    │  │
│  │ Pending Orders: 5  │  Response Time: 2.3 hrs   │  │
│  │ Active Negotiations: 2  │  Reliability Score: 96%│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ YOUR CATALOG                                     │  │
│  │ [+ Add Products] [Bulk Upload CSV] [Export]     │  │
│  │                                                  │  │
│  │ SKU    │ Name        │ Price │ Stock │ Actions  │  │
│  │ SKU001 │ Widget A    │ $5.50 │  200 │ [Edit]   │  │
│  │ SKU002 │ Widget B    │ $3.20 │  450 │ [Edit]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ INCOMING ORDERS (Awaiting confirmation)         │  │
│  │                                                  │  │
│  │ PO#2045 │ 15 units Widget A │ [Accept] [Reject]│  │
│  │ PO#2046 │ 8 units Widget B  │ [Accept] [Reject]│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ACTIVE NEGOTIATIONS                              │  │
│  │                                                  │  │
│  │ Negotiation #NEG-12                              │  │
│  │ Status: Awaiting Your Response                  │  │
│  │ Current Offer: ₹4.80/unit, 7-day delivery      │  │
│  │ Our Best: ₹4.50/unit                            │  │
│  │ [View Details] [Respond] [Accept] [Decline]    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘

Supplier Screens:
1. Dashboard (KPIs + quick actions)
2. Catalog Management (CRUD products + bulk upload)
3. Orders Queue (incoming POs + confirmation)
4. Negotiation Response (interactive chat interface)
5. Performance Metrics (on-time rate, quality, reliability)
```

---

### **WAREHOUSE MANAGER DASHBOARD** (7 screens)

```
┌─────────────────────────────────────────────────────────┐
│  WAREHOUSE DASHBOARD                                    │
├─────────────────────────────────────────────────────────┤
│  Overview │ Inventory │ Stock Mgmt │ Allocations │ Transfers
├─────────────────────────────────────────────────────────┤
│                                                          │
│  WAREHOUSE SELECTION: [WH-01 (Primary)] [WH-02] [WH-03]│
│                                                          │
│  ┌────────────────────────────────────┐                │
│  │ ZONE UTILIZATION (WH-01)           │                │
│  │                                    │                │
│  │ Zone A (Cold Storage): 92% Full    │                │
│  │ Zone B (Pick Zone): 78% Full       │                │
│  │ Zone C (Bulk Storage): 65% Full    │                │
│  │ Zone D (Returns): 45% Full         │                │
│  │                                    │                │
│  │ ⚠️ Optimization suggested for B & C│                │
│  │ [Review Recommendations]           │                │
│  └────────────────────────────────────┘                │
│                                                          │
│  ┌────────────────────────────────────┐                │
│  │ INVENTORY BY ZONE                  │                │
│  │ ┌──────────┬──────────┬──────────┐ │                │
│  │ │Zone      │Items     │Cost      │ │                │
│  │ ├──────────┼──────────┼──────────┤ │                │
│  │ │Zone A    │245 SKUs  │₹1.2M     │ │                │
│  │ │Zone B    │189 SKUs  │₹980K     │ │                │
│  │ │Zone C    │312 SKUs  │₹2.1M     │ │                │
│  │ └──────────┴──────────┴──────────┘ │                │
│  └────────────────────────────────────┘                │
│                                                          │
│  ┌────────────────────────────────────┐                │
│  │ PENDING ALLOCATIONS (3)             │                │
│  │ [Alloc-089] 45 units SKU-234      │                │
│  │ [Alloc-090] 120 units SKU-456     │                │
│  │ [Alloc-091] 23 units SKU-789      │                │
│  │ [Review All]                      │                │
│  └────────────────────────────────────┘                │
│                                                          │
│  ┌────────────────────────────────────┐                │
│  │ TRANSFERS IN PROGRESS (2)           │                │
│  │ [Transfer-W01→W02] 150 units       │  [Track]      │
│  │ [Transfer-W02→W03] 200 units       │  [Track]      │
│  └────────────────────────────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘

Warehouse Screens:
1. Dashboard (zone utilization + metrics)
2. Multi-warehouse Inventory (location view)
3. Stock Management (manual adjustments)
4. Allocation Recommendations (AI + approve/reject)
5. Allocation Review (detailed + override)
6. Transfer Recommendations (inter-warehouse moves)
7. Receiving & Operations (shipment verification)
```

---

### **RETAILER DASHBOARD** (6 screens)

```
┌─────────────────────────────────────────────────────────┐
│  RETAILER DASHBOARD - Procurement & Forecasting         │
├─────────────────────────────────────────────────────────┤
│  Dashboard │ Inventory │ Forecast │ Orders │ Replenish
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ INVENTORY HEALTH                                │  │
│  │ Total SKUs: 456  │  Low Stock Items: 8         │  │
│  │ Total Value: ₹12.5M  │  Forecast Accuracy: 94%│  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ LOW STOCK ALERTS (Need Attention)               │  │
│  │ SKU-891 (Widget X): 12 units left → ROP: 50   │  │
│  │ SKU-456 (Gadget Y): 5 units left → ROP: 30    │  │
│  │ [AUTO-REPLENISH ENABLED] [Manual Order]        │  │
│  │ ⬆️ AI Negotiation in progress for both items   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 7-DAY DEMAND FORECAST (Visibility)              │  │
│  │                                                  │  │
│  │ SKU-891 Forecast Chart:                         │  │
│  │ Mon: 45 units  │ Tue: 52  │ Wed: 48 │ Thu: 55  │  │
│  │ Fri: 62        │ Sat: 78  │ Sun: 35             │  │
│  │ Confidence: 92%                                  │  │
│  │                                                  │  │
│  │ → Estimated stockout if not reordered: Friday  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ RECENT PURCHASE ORDERS                          │  │
│  │ PO#2043 | SKU-789 | 100 units | ₹8,500 | Shipped
│  │ PO#2044 | SKU-234 | 75 units  | ₹6,200 | Negotiating
│  │ PO#2045 | SKU-891 | 120 units | ₹9,800 | Negotiating
│  │ [Create New Order] [View History]               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ REPLENISHMENT SETTINGS                          │  │
│  │ Auto-Replenish: ENABLED                         │  │
│  │ Reorder Point Strategy: Dynamic Safety Stock   │  │
│  │ [Configure]                                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ NEGOTIATED PRICING & SAVINGS                    │  │
│  │ Total Savings This Month: ₹23,450               │  │
│  │ Average Negotiation Rounds: 3.2                 │  │
│  │ Supplier Cost Variance: -2.3%                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘

Retailer Screens:
1. Dashboard (inventory health + KPIs)
2. Inventory Monitoring (with forecast visibility)
3. Manual Order Creation (when auto-replenish off)
4. Order History & Tracking (lifecycle view)
5. Auto-Replenishment Settings (configure triggers)
6. Pricing & Savings (negotiation outcomes)
```

---

## 🤖 AI & Mastra Framework Integration

### **Architecture Layers:**

```
┌────────────────────────────────────────────────┐
│         MASTRA AI FRAMEWORK (ai/)              │
│  ─────────────────────────────────────────   │
│  Standalone Node.js process with Gemini 2.0   │
└────────────────────────────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────────┐ ┌──────────────────────┐
│ Agents      │ │ Memory & Persistence │
├─────────────┤ ├──────────────────────┤
│ • Forecast  │ │ LibSQL Database      │
│ • Warehouse │ │ • Conversation hist  │
│ • Negotiation
│ • Reorder   │ │ • Agent state        │
│ • Quality   │ │ • Decision logs      │
│ • Compliance│ │                      │
└─────────────┘ └──────────────────────┘
           │
           ▼
     ┌──────────────────────┐
     │ Google Gemini 2.0    │
     │ Flash LLM            │
     │ • 1M token context   │
     │ • Natural language   │
     │ • Tool use           │
     └──────────────────────┘
           │
           ▼
   Backend API Routes
   (HTTP integration)
```

### **Negotiation Agent Flow (Detailed):**

```
1. TRIGGER EVENT
   └─ Inventory < ROP for Product X
      └─ Procurement officer initializes negotiation
         └─ Budget: ₹100,000 (pmax = hidden from supplier)

2. SUPPLIER IDENTIFICATION
   └─ Query supplier catalog
      └─ Filter: Can supply Product X
         └─ Get 3 suppliers with contact emails

3. MULTI-TURN NEGOTIATION (Mastra)
   
   Round 1:
   ┌─────────────────────────────────────────┐
   │ Message from Buyer Agent to Suppliers:  │
   │ "RFQ for 100 units of Product X        │
   │  Needed by: [date]                      │
   │  Quality specs: [details]               │
   │  Please provide quote"                  │
   └─────────────────────────────────────────┘
          │
          ├──► Supplier A: "₹5.50/unit, MOQ 50, 7 days"
          ├──► Supplier B: "₹5.20/unit, MOQ 100, 5 days"
          └──► Supplier C: "₹5.80/unit, MOQ 25, 10 days"
   
   Analysis:
   ├─ Price extraction (NLP on responses)
   ├─ Terms comparison (MOQ, delivery)
   └─ Initial ranking (price × reliability)
   
   Round 2:
   ┌─────────────────────────────────────────┐
   │ Buyer Counter-Offer (System 2 thinking):│
   │ "B offers best price. Counter to ₹5.00" │
   │ "Check BATNA: Is this within ₹100K?"    │
   │ "100 units × ₹5.00 = ₹500K ✓ YES"       │
   │ "Send counter: Accept 100 @ ₹5.00/unit"│
   └─────────────────────────────────────────┘
          │
          ├──► Supplier A: "Can do ₹5.30, best offer"
          ├──► Supplier B: "Accepted! ₹5.00/unit"
          └──► Supplier C: "Can do ₹5.50 minimum"
   
   Round 3:
   ┌─────────────────────────────────────────┐
   │ DEAL SELECTION                          │
   │                                         │
   │ Supplier B Scoring:                    │
   │ • Price: 100 pts (best)                │
   │ • Reliability: 95 pts (known good)     │
   │ • Lead time: 90 pts (5 days)          │
   │ • MOQ: 85 pts (need flexibility)       │
   │ ──────────────────────────             │
   │ TOTAL SCORE: 92.5/100                  │
   │ DECISION: ACCEPT DEAL ✓                 │
   └─────────────────────────────────────────┘

4. PO GENERATION
   └─ Create PDF Purchase Order
      ├─ Supplier: Supplier B
      ├─ Quantity: 100 units
      ├─ Unit Price: ₹5.00
      ├─ Total: ₹500
      ├─ Delivery: [date+5 days]
      ├─ Terms: Net 30
      └─ Generated: [timestamp]

5. BLOCKCHAIN LOGGING
   └─ Calculate hash of PO + negotiation transcript
      └─ Call SupplyChainAudit.logEvent()
         ├─ EventType: NEGOTIATION_ACCEPTED
         ├─ DocumentHash: sha256(PO + transcript)
         ├─ Amount: 50000 (in paise)
         └─ Timestamp: block.timestamp

6. PERSISTENCE & NOTIFICATION
   └─ Save to MongoDB:
      ├─ PurchaseOrder collection
      ├─ NegotiationLog collection
      └─ Blockchain hash reference
   └─ Send notifications:
      ├─ Procurement officer (deal accepted)
      ├─ Supplier (PO issued)
      └─ Finance (for budgeting)
```

### **Memory Management (LibSQL):**

```
Each negotiation conversation is stored:

┌──────────────────────────────────────────┐
│ Negotiation Session (NEG-12)             │
├──────────────────────────────────────────┤
│ Agent: buyer_agent                       │
│ Suppliers: [supplier_a, supplier_b, ...]│
│ Product: SKU-891                         │
│ Budget: 100000                           │
│ Status: CONCLUDED                        │
│ Created: 2026-04-19 10:30:00            │
│ Concluded: 2026-04-19 11:45:00          │
└──────────────────────────────────────────┘

Messages Log:
├─ Msg#1: User → Agent: "Start negotiation for SKU-891"
├─ Msg#2: Agent → Supplier A: "RFQ received. Provide quote"
├─ Msg#3: Supplier A → Agent: "Quote: ₹5.50/unit"
├─ Msg#4: Agent → Supplier B: "RFQ received. Provide quote"
├─ Msg#5: Supplier B → Agent: "Quote: ₹5.20/unit"
├─ Msg#6: Agent (analysis): "Supplier B better. Counter-offer"
├─ Msg#7: Agent → Supplier B: "Can you do ₹5.00?"
├─ Msg#8: Supplier B → Agent: "ACCEPTED ₹5.00/unit"
├─ Msg#9: Agent (decision): "DEAL SELECTED: Supplier B"
└─ Msg#10: Agent → User: "Negotiation complete! PO issued."

Preserved state allows:
• Resume if interrupted
• Audit trail of decisions
• Performance analysis
• Continuous improvement
```

---

## 🔗 Blockchain Integration Screens

### **Screen: Blockchain Transaction Viewer** (S06)

```
┌─────────────────────────────────────────────────────────┐
│  BLOCKCHAIN EXPLORER - Supply Chain Audit Trail        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Search: [Transaction Hash or Reference ID]  [Search]  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ RECENT TRANSACTIONS                              │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Tx Hash        │ Event Type        │ Time        │  │
│  │─────────────────────────────────────────────────│  │
│  │ 0xa3b2c1...   │ PO_CREATED        │ 2 min ago   │  │
│  │ 0x7f4e3d...   │ NEGOTIATION_ACPT  │ 15 min ago  │  │
│  │ 0x5d2c1b...   │ PO_SENT           │ 1 hour ago  │  │
│  │ 0x9f8e7d...   │ PO_RECEIVED       │ 3 hours ago │  │
│  │ 0x4c3b2a...   │ INVENTORY_ADJ     │ 1 day ago   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ TRANSACTION DETAIL (0xa3b2c1...)                │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Reference ID:    ORDER-PO-2045                  │  │
│  │ Event Type:      PO_CREATED                     │  │
│  │ Status:          ✅ CONFIRMED (Block #18,245)   │  │
│  │ Document Hash:   0xf3e2d1c0... (SHA-256)       │  │
│  │ Amount:          50000 (paise)                  │  │
│  │ Submitted By:    0x742d3...backend.eth         │  │
│  │ Timestamp:       2026-04-19 14:30:00 (UTC)     │  │
│  │ Block Number:    18245                          │  │
│  │ Tx Fee:          0.0012 ETH                     │  │
│  │ Network:         Ethereum Sepolia (Testnet)    │  │
│  │                                                  │  │
│  │ VERIFICATION: ✅ Hash matches MongoDB record   │  │
│  │ [View Full Document] [Download PO PDF]         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ REFERENCE TIMELINE (All events for this PO)     │  │
│  │                                                  │  │
│  │ 2026-04-19 14:30 ───► PO_CREATED              │  │
│  │                      ├─ Hash: 0xf3e2...       │  │
│  │                      └─ Submitter: backend.eth │  │
│  │                                                  │  │
│  │ 2026-04-19 15:00 ───► PO_APPROVED             │  │
│  │                      ├─ Hash: 0x8d7c...       │  │
│  │                      └─ Submitter: admin.eth   │  │
│  │                                                  │  │
│  │ 2026-04-19 15:15 ───► PO_SENT                 │  │
│  │                      ├─ Hash: 0x5b4a...       │  │
│  │                      └─ Submitter: backend.eth │  │
│  │                                                  │  │
│  │ (Awaiting) ────────► PO_RECEIVED              │  │
│  │                      └─ Expected on 2026-04-24 │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Etherscan Link] [Download Audit Report]             │  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **QR Code Verification (at warehouse dock):**

```
Physical Shipment arrives at warehouse
           │
           ▼
Scan QR Code on box
           │
           ▼
┌──────────────────────────────────┐
│ QR Code Links to:                │
│ https://autostock.local/qr/      │
│ ?ref=ORDER-PO-2045               │
│ &hash=0xf3e2d1c0...              │
└──────────────────────────────────┘
           │
           ▼
Frontend Verification:
     ├─ Fetch blockchain record
     ├─ Extract expected hash
     ├─ Fetch MongoDB document
     ├─ Calculate actual hash
     └─ VERIFY: Hash match? ✅ YES / ❌ NO
           │
           ▼
Result displayed:
     ├─ ✅ AUTHENTIC - Document not tampered
     └─ ❌ TAMPERED - Alert admin (potential fraud)
```

---

## 📊 Data Flow Overview

```
EXTERNAL WORLD          AUTOSTOCK AI SYSTEM              STORAGE
                
Supplier              ┌─────────────────────────────┐
  │                   │    BACKEND API              │
  ├────RFQ Response──►│  (Express.js + MongoDB)    │───────► MongoDB
  │                   │  10+ Modules               │
  │<────PO PDF────────┤  • Users                   │
  │                   │  • Products                │───────► LibSQL
  ├────Negotiation──►│  • Inventory               │  (Agent
  │ Messages          │  • Orders                 │   Memory)
  │                   │  • Negotiation            │
  │                   │  • Warehouse              │
Retailer            └─────────────────────────────┘
  │                        ▲
  ├────Manual Order───────┤
  │                        │
  │<───Notifications──────┤
  │   (websocket)          │
  │                        ▼
  │                   ┌─────────────────────────────┐
  │                   │    AI AGENTS               │
  │                   │  (Mastra + LangGraph)      │
  │                   │                            │
  │                   │  • Forecast Agent         │───────► LibSQL
  │                   │  • Warehouse Agent        │  (Persistent
  │                   │  • Negotiation Agent      │   State)
  │                   │  • Reorder Agent          │
  │                   │  • (Future agents)        │
  │                   │                            │
  │                   │  LLM: Google Gemini 2.0   │
  │                   └─────────────────────────────┘
  │                        ▲ │
  │                        │ ▼
Warehouse               ┌─────────────────────────────┐
  │                    │    BLOCKCHAIN              │
  ├───Receiving─────► │  (Solidity Smart Contract) │───────► Ethereum
  │                    │  SupplyChainAudit         │  Sepolia
  │<──QR Verify────────┤  • Hash logging           │  Testnet
  │                    │  • Event tracking         │
  │                    │  • Audit trail            │
  └──────────────────►│  • Verification           │
                      └─────────────────────────────┘
                        │ 
                        ▼
                    ┌─────────────────────────────┐
                    │    FRONTEND                │
                    │  (Next.js React)           │
                    │  • 4 Role Dashboards       │
                    │  • 32 Total Screens        │
                    │  • Real-time Updates       │
                    └─────────────────────────────┘
                        ▲
                        │
                    Users interact
                    (Admin, Supplier,
                     Warehouse, Retailer)
```

---

## 🎯 Key Features Summary

| Feature | Description | Status |
|---------|-------------|--------|
| **Demand Forecasting** | 7-day forecast with confidence intervals | ✅ Done |
| **Warehouse Optimization** | Zone utilization + placement recommendations | ✅ Done |
| **AI Negotiation Agent** | Multi-turn supplier negotiations with memory | 🏗️ In Progress |
| **Blockchain Audit Trail** | Immutable supply chain event logging | ✅ Done |
| **4 Role Dashboards** | Admin, Supplier, Warehouse, Retailer | 🏗️ 70% |
| **Real-time Notifications** | WebSocket + email alerts | 🏗️ Partial |
| **QR Code Verification** | Physical product authentication | 📋 Not Started |
| **Smart Contract Deployment** | Deploy to Ethereum Sepolia | 📋 Not Started |
| **Advanced Analytics** | Cost analysis, supplier scorecard, ROI | 📋 Not Started |
| **Multi-supplier Negotiation** | Simultaneous bid management | 🏗️ In Progress |

---

## 🚀 Technology Stack

```
FRONTEND
├─ Framework: Next.js 14 (App Router)
├─ Language: TypeScript
├─ Styling: Tailwind CSS
├─ UI Components: shadcn/ui
├─ State: Zustand
└─ HTTP: TanStack Query

BACKEND
├─ Framework: Express.js
├─ Language: TypeScript
├─ Database: MongoDB (Atlas)
├─ ORM: Mongoose
├─ Auth: JWT + role-based guards
└─ Scheduling: node-cron

AI/AGENTS
├─ Orchestration: Mastra AI (standalone)
├─ Graph: LangGraph (embedded)
├─ LLM: Google Gemini 2.0 Flash
├─ Memory: LibSQL (persistent)
├─ Framework: LangChain (utilities)
└─ Runtime: Node.js 22+

BLOCKCHAIN
├─ Language: Solidity ^0.8.24
├─ Chain: Ethereum Sepolia (testnet)
├─ Framework: Hardhat
├─ Deployment: Automated via scripts
└─ Verification: Etherscan integration

DEPLOYMENT
├─ Frontend: Vercel
├─ Backend: Docker + Cloud Run (GCP)
├─ AI Module: Docker + Cloud Run
├─ Database: MongoDB Atlas (cloud)
└─ Blockchain: Infura (Sepolia RPC)
```

---

## 📈 Success Metrics & KPIs

```
PROCUREMENT EFFICIENCY
├─ Negotiation time: < 2 hours (vs manual 2-3 days)
├─ Cost savings: 3-5% per negotiation
├─ Supplier response rate: > 95%
└─ Deal acceptance rate: > 90%

FORECAST ACCURACY
├─ MAPE (Mean Absolute Percentage Error): < 10%
├─ Stockout prevention: > 98%
├─ Overstock reduction: 15-20%
└─ Safety stock optimization: 20-30% reduction

WAREHOUSE OPERATIONS
├─ Zone utilization: 80-90%
├─ Picking time improvement: 15-20%
├─ Inventory shrinkage detection: real-time
└─ Transfer accuracy: > 99%

AUDIT & COMPLIANCE
├─ Transaction on-chain: 100% of major events
├─ Hash verification success: 100%
├─ Audit trail completeness: 100%
└─ Compliance violations detected: real-time
```

---

## 🎓 How to Present This Project

### **Opening Statement:**
"AutoStock AI is an intelligent supply chain platform that automates procurement, forecasting, and warehouse operations using AI agents and blockchain for transparency and compliance."

### **Problem-Solution Flow:**
1. **Show the problem** → Manual procurement is slow
2. **Demo the solution** → AI negotiation in real-time
3. **Highlight innovation** → Blockchain audit trail + multi-agent orchestration
4. **Show dashboards** → 4 role-based views with real data

### **Technical Depth Talking Points:**
- **For AI** → Mention Mastra framework, Google Gemini, multi-turn memory, BATNA strategy
- **For Blockchain** → Hash-based verification, gas optimization, immutable audit
- **For Frontend** → 32 screens, role-based access, real-time WebSocket updates
- **For Integration** → How all components talk to each other

### **Demo Sequence:**
1. Login as different roles
2. Show forecast dashboard + predictions
3. Trigger a negotiation → watch AI agent interact with suppliers
4. Show blockchain transaction verification
5. Admin oversight → approve/override recommendations
6. Analytics → show cost savings achieved

---

## 📁 Project Structure

```
major-project/
├── frontend/               # Next.js React app
│   ├── src/app/           # 32 pages (4 role dashboards)
│   ├── src/components/    # Reusable UI components
│   ├── src/lib/           # API client, utilities
│   └── src/stores/        # Zustand state
│
├── backend/               # Express.js API
│   ├── src/modules/       # 10+ feature modules
│   ├── src/config/        # DB, auth config
│   └── src/utils/         # Helpers
│
├── ai/                    # Mastra AI standalone
│   ├── src/agents/        # Agent definitions
│   ├── src/tools/         # Agent tools
│   └── .mastra/           # Mastra config
│
├── blockchain/            # Solidity smart contracts
│   ├── contracts/         # SupplyChainAudit.sol
│   ├── scripts/           # Deploy, interact
│   └── test/              # Contract tests
│
└── docs/                  # Documentation & roadmaps
    ├── AUTOSTOCK_AI_FEATURES_ROADMAP.md
    ├── FRONTEND_MVP_SOT_PLAN.md
    └── architecture.md
```

---

## ✨ Unique Selling Points

1. **Mastra AI Framework** - Production-grade multi-agent orchestration
2. **Blockchain Transparency** - Immutable supply chain audit trail
3. **Real-time Negotiation** - Autonomous AI agent with persistent memory
4. **Role-Based Dashboards** - Tailored views for all stakeholders
5. **Forecast Accuracy** - Gemini-powered demand prediction with confidence intervals
6. **Gas-Optimized Smart Contracts** - Batch logging for cost efficiency
7. **Multi-Supplier Coordination** - BATNA strategy for optimal deal selection
8. **Hybrid On/Off-Chain** - Smart balance of blockchain + database storage

---

**END OF PRESENTATION GUIDE**

This document is your complete reference for explaining AutoStock AI to anyone!

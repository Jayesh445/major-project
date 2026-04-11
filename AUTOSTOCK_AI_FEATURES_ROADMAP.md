# AutoStock AI - Complete Agents & Features Roadmap

## Current Status Overview

| Component | Status |
|-----------|--------|
| Demand Forecast Agent (LangGraph) | Done |
| Warehouse Optimization Agent (LangGraph) | Done |
| Mastra AI Integration (Forecast + Warehouse workflows) | Done |
| Blockchain Model & Schema | Partial |
| Negotiation Agent | Schema only, no agent |
| Backend API (10+ modules) | Done |
| Frontend (4 role dashboards) | ~70% |

---

## AGENTS TO BUILD

### 1. Negotiation Agent (HIGH PRIORITY - Core Feature)
**Framework:** Mastra AI (stateful, multi-turn memory required)  
**Status:** Schema exists, agent NOT built  

The autonomous procurement negotiation agent that communicates with suppliers to get the best price. This is the flagship agentic feature of the platform.

**What it does:**
- Triggered when inventory drops below Reorder Point (ROP)
- Given a strict `pmax` (maximum willingness to pay) — hidden from supplier
- Engages multiple suppliers simultaneously via messages/email
- Extracts unstructured text (prices, delivery terms, MOQs) from supplier replies
- Uses "System 2 Thinking" — deliberate reasoning before counter-offers
- Employs BATNA (Best Alternative to Negotiated Agreement) strategy by comparing offers across suppliers
- Accepts deal OR terminates negotiation if supplier floor > pmax
- Generates final Purchase Order PDF upon deal closure
- Logs negotiation transcript + PO hash to blockchain

**Key capabilities to implement:**
- Multi-round dialogue management (LibSQL persistent memory)
- Price extraction from unstructured text
- Counter-offer formulation with strategic reasoning
- Simultaneous multi-supplier negotiation
- Budget constraint enforcement (hard pmax ceiling)
- Deal scoring (price, delivery time, reliability, payment terms)
- Auto-generation of Purchase Order on deal closure

---

### 2. Procurement Orchestrator Agent
**Framework:** LangGraph (sequential pipeline)  
**Status:** Not started  

Master agent that coordinates the full procurement lifecycle end-to-end.

**What it does:**
- Monitors ROP alerts from the Forecast Agent
- Calculates EOQ for the order
- Identifies eligible suppliers from the supplier catalog
- Triggers Negotiation Agent with supplier list + budget constraints
- Tracks negotiation progress across all suppliers
- Selects best deal based on weighted scoring (price, lead time, reliability)
- Auto-creates Purchase Order in the system
- Triggers blockchain logging
- Sends notifications to procurement officers

---

### 3. Supplier Evaluation & Scoring Agent
**Framework:** LangGraph  
**Status:** Not started  

Continuously evaluates and ranks suppliers based on historical performance.

**What it does:**
- Tracks on-time delivery rate per supplier
- Monitors quality rejection rates
- Calculates average price competitiveness vs market
- Tracks responsiveness (reply time in negotiations)
- Computes composite Supplier Reliability Index (SRI)
- Auto-flags underperforming suppliers
- Recommends supplier diversification when over-reliant on single source
- Feeds rankings into the Negotiation Agent for BATNA strategy

**Scoring formula:**
```
SRI = w1(OnTimeRate) + w2(QualityScore) + w3(PriceCompetitiveness) + w4(Responsiveness)
```

---

### 4. Anomaly Detection Agent
**Framework:** LangGraph  
**Status:** Not started  

Real-time monitoring agent that detects unusual patterns across the supply chain.

**What it does:**
- Detects demand spikes/drops that deviate from forecast
- Identifies unusual procurement patterns (potential fraud)
- Flags inventory discrepancies (shrinkage, theft, miscount)
- Monitors supplier behavior anomalies (sudden price hikes, delayed deliveries)
- Detects warehouse capacity anomalies
- Sends real-time alerts with severity classification
- Recommends corrective actions

**Detection methods:**
- Z-score based threshold detection
- Moving average deviation
- Pattern comparison against historical baselines

---

### 5. Smart Reorder Agent
**Framework:** LangGraph  
**Status:** Not started  

Automates the reorder decision-making beyond simple ROP triggers.

**What it does:**
- Combines forecast data + current stock + incoming POs + pending transfers
- Accounts for supplier lead time variability
- Adjusts safety stock dynamically based on demand volatility
- Considers bulk discount thresholds (order more if near price break)
- Coordinates with Warehouse Optimization Agent to determine WHICH warehouse receives stock
- Handles seasonal pre-stocking (pre-orders before known demand spikes)
- Manages backorder situations

---

### 6. Quality Control / Goods Receipt Agent
**Framework:** LangGraph  
**Status:** Not started  

Manages the receiving and verification of incoming shipments.

**What it does:**
- Cross-references received goods against Purchase Order
- Verifies quantities, SKUs, and pricing match the PO
- QR code scanning → blockchain hash verification (tamper detection)
- Flags discrepancies (short shipments, wrong items, damaged goods)
- Auto-updates inventory upon successful receipt
- Triggers payment settlement or dispute workflow
- Updates supplier reliability scores based on delivery accuracy

---

### 7. Returns & Reverse Logistics Agent
**Framework:** LangGraph  
**Status:** Not started  

Handles product returns, defective goods, and reverse supply chain.

**What it does:**
- Processes return requests with reason classification
- Calculates return shipping logistics
- Determines disposition (restock, refurbish, dispose, return to supplier)
- Auto-generates Return Merchandise Authorization (RMA)
- Coordinates with suppliers for defective goods credit/replacement
- Updates inventory and financial records
- Tracks return rate patterns per product/supplier

---

### 8. Financial / Cost Analytics Agent
**Framework:** LangGraph  
**Status:** Not started  

Provides intelligent financial analysis of supply chain operations.

**What it does:**
- Calculates total cost of ownership (TCO) per product
- Tracks procurement spend trends
- Analyzes holding cost vs ordering cost optimization
- Monitors cash flow impact of inventory decisions
- Compares actual vs budgeted procurement costs
- Identifies cost reduction opportunities
- Generates financial reports and KPI dashboards

---

### 9. Expiry / Shelf-Life Management Agent
**Framework:** LangGraph  
**Status:** Not started  

Manages perishable or time-sensitive inventory.

**What it does:**
- Tracks expiry dates across all warehouse locations
- Implements FIFO/FEFO (First Expiry First Out) enforcement
- Alerts before products approach expiry threshold
- Recommends markdown/discount pricing for near-expiry stock
- Suggests inter-warehouse transfers to move slow-moving stock to high-demand locations
- Calculates waste/shrinkage metrics
- Adjusts reorder quantities based on shelf-life constraints

---

### 10. Compliance & Audit Agent
**Framework:** Mastra AI (needs persistent state for audit trails)  
**Status:** Not started  

Ensures regulatory compliance and maintains audit readiness.

**What it does:**
- Validates all procurement actions against company policies
- Enforces approval workflows (e.g., orders above threshold need manager approval)
- Maintains complete audit trail on blockchain
- Generates compliance reports
- Monitors for policy violations (unauthorized purchases, budget overruns)
- Tracks document completeness (PO, invoice, receipt — 3-way match)
- Supports regulatory requirements (GST compliance, tax documentation)

---

## FEATURES TO BUILD

### Blockchain & Smart Contracts

| Feature | Description | Status |
|---------|-------------|--------|
| Smart Contract Deployment | Deploy `SupplyChainAudit.sol` on Ethereum Sepolia testnet | Not started |
| PO Hash Logging | SHA-256 hash of PO PDF + negotiation transcript mined on-chain | Not started |
| QR Code Generation | Dynamic QR codes linking physical shipments to blockchain records | Not started |
| QR Scan Verification | Scan QR at dock → cross-reference with immutable ledger | Not started |
| Tamper Detection | Hash mismatch detection when documents are altered post-signing | Not started |
| Payment Settlement | Auto-trigger payment via smart contract upon verified goods receipt | Not started |
| Gas Optimization | Storage packing + function batching for minimal transaction costs | Not started |

### Real-Time Notifications & Alerts

| Feature | Description | Status |
|---------|-------------|--------|
| Low Stock Alerts | Push notification when inventory < ROP | Partial |
| Forecast Alerts | Notify when forecast predicts upcoming stockout | Not started |
| Negotiation Updates | Real-time status of ongoing supplier negotiations | Not started |
| PO Status Tracking | Notifications for PO lifecycle (created → approved → shipped → received) | Not started |
| Anomaly Alerts | Immediate alerts for detected anomalies | Not started |
| WebSocket Integration | Real-time push to frontend dashboards | Not started |
| Email Notifications | Email alerts for critical events | Not started |

### Dashboard & Analytics

| Feature | Description | Status |
|---------|-------------|--------|
| Supply Chain Health Score | Single composite metric showing overall system health | Not started |
| Forecast Accuracy Dashboard | MAPE, RMSE tracking over time with model comparison | Not started |
| Negotiation Analytics | Success rates, savings captured, avg negotiation rounds | Not started |
| Supplier Scorecard | Visual supplier ranking with drill-down performance | Not started |
| Cost Analytics | Procurement spend, holding costs, savings trends | Not started |
| Blockchain Explorer | View all on-chain transactions with verification status | Not started |
| Agent Activity Monitor | Real-time view of all agent actions and decisions | Partial |
| Warehouse Heatmap | Geographic visualization of stock distribution | Not started |
| What-If Simulator | Simulate scenarios (demand spike, supplier failure) and see impact | Not started |

### Supplier Portal Features

| Feature | Description | Status |
|---------|-------------|--------|
| Supplier Self-Service Portal | Suppliers can view POs, update delivery status, upload invoices | Partial (dashboard exists) |
| Bid/Quote Submission | Suppliers submit quotes in response to RFQs | Not started |
| Negotiation Chat Interface | Real-time chat UI for supplier ↔ AI agent negotiation | Not started |
| Contract Management | Digital contract creation, signing, and tracking | Not started |
| Supplier Onboarding | Automated supplier registration and verification workflow | Not started |

### Advanced AI Features

| Feature | Description | Status |
|---------|-------------|--------|
| Multi-Product Correlation | Detect demand correlations between products (bundling opportunities) | Not started |
| External Data Integration | Weather, holidays, events, market trends feeding into forecasts | Not started |
| Promotional Impact Modeling | Predict demand impact of planned promotions/discounts | Not started |
| Auto-Classification | Auto-categorize products using ABC/XYZ analysis | Not started |
| Natural Language Queries | "What's my best-selling product in Mumbai warehouse this month?" | Not started |
| Explainable AI (XAI) | Human-readable explanations for every agent decision | Not started |
| Agent-to-Agent Communication | Agents can delegate tasks and share context with each other | Not started |

### Security & Access Control

| Feature | Description | Status |
|---------|-------------|--------|
| Role-Based Dashboards | Different views per role (admin, warehouse, procurement, supplier) | Done |
| API Rate Limiting | Protect endpoints from abuse | Not started |
| Activity Audit Log | Track all user and agent actions | Partial (blockchain model) |
| Two-Factor Authentication | Extra security for sensitive operations | Not started |
| Data Encryption | Encrypt sensitive data at rest and in transit | Not started |

---

## RECOMMENDED BUILD ORDER

### Phase 1: Core Negotiation (Weeks 1-3)
1. **Negotiation Agent** — the centerpiece feature
2. **Blockchain Smart Contract** deployment + PO hash logging
3. **QR Code generation** + scan verification

### Phase 2: Procurement Automation (Weeks 4-5)
4. **Procurement Orchestrator Agent** — ties forecast → negotiation → PO
5. **Smart Reorder Agent** — intelligent reorder beyond simple ROP
6. **WebSocket + Notification system** — real-time alerts

### Phase 3: Supplier Intelligence (Weeks 6-7)
7. **Supplier Evaluation Agent** — scoring and ranking
8. **Supplier Portal** — negotiation chat UI, bid submission
9. **Negotiation Analytics Dashboard**

### Phase 4: Operational Excellence (Weeks 8-9)
10. **Quality Control / Goods Receipt Agent**
11. **Anomaly Detection Agent**
12. **Compliance & Audit Agent**

### Phase 5: Advanced Analytics (Weeks 10-11)
13. **Financial / Cost Analytics Agent**
14. **Supply Chain Health Score dashboard**
15. **Forecast Accuracy tracking dashboard**

### Phase 6: Extended Features (Weeks 12+)
16. **Returns & Reverse Logistics Agent**
17. **Expiry / Shelf-Life Agent**
18. **What-If Simulator**
19. **Natural Language Query interface**
20. **External data integration** (weather, events, market)

---

## ARCHITECTURE NOTES

- **ALL agents run on Mastra AI** — unified framework for both stateless workflows and stateful multi-turn agents
- **Mastra workflows** for sequential pipelines (forecast, reorder, anomaly detection)
- **Mastra Memory (LibSQL)** for persistent state in multi-turn agents (negotiation, compliance)
- **Two-agent negotiation**: Buyer Agent vs Supplier Simulator Agent with real back-and-forth rounds
- **All agent decisions** logged to blockchain for immutable audit trail
- **Agent-to-agent communication** via Mastra workflow orchestration + shared MongoDB state
- **Google Gemini 2.0 Flash** as the LLM backbone (1M token context window)

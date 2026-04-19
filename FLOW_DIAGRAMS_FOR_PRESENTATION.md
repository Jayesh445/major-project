# AutoStock AI - Complete Flow Diagrams for Presentation

## 1. END-TO-END PROCUREMENT FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE PROCUREMENT WORKFLOW                │
└─────────────────────────────────────────────────────────────────┘

        STEP 1: DEMAND FORECASTING
        ──────────────────────────
        
        Historical Inventory Data (90 days)
                    │
                    ▼
        ┌───────────────────────────────┐
        │  Forecast Agent (LangGraph)   │
        │  + Google Gemini AI          │
        └───────────────────────────────┘
                    │
                    ▼
        7-Day Demand Prediction
        ├─ Monday: 45 units (92% confidence)
        ├─ Tuesday: 52 units (91% confidence)
        ├─ Wednesday: 48 units
        ├─ Thursday: 55 units
        ├─ Friday: 62 units ← ⚠️ Approaching ROP
        ├─ Saturday: 78 units
        └─ Sunday: 35 units
                    │
                    ▼
        ┌───────────────────────────────┐
        │ Decision: "Reorder needed"    │
        │ Trigger point: Stock < ROP    │
        └───────────────────────────────┘
                    │
                    
        STEP 2: AI NEGOTIATION INITIATION
        ──────────────────────────────────
        
                    ▼
        ┌───────────────────────────────────┐
        │ Procurement Officer Action:      │
        │ "Initiate negotiation for 100    │
        │ units of Product X"              │
        │ Budget: ₹100,000 (pmax)          │
        └───────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────┐
        │ Negotiation Agent (Mastra)       │
        │ + LibSQL Memory                  │
        │ + Google Gemini                  │
        └───────────────────────────────────┘
        
        
        STEP 3: SUPPLIER IDENTIFICATION & OUTREACH
        ──────────────────────────────────────────
        
                    ▼
        Query Supplier Catalog
        └─ Product X available from: 5 suppliers
           ├─ Supplier A: Reliable, moderate price
           ├─ Supplier B: Cheapest, fast delivery
           ├─ Supplier C: Premium quality
           ├─ Supplier D: Bulk discounts
           └─ Supplier E: New, good reviews
        
        Select top 3 → Contact via email
                    │
                    ▼
        RFQ Sent to:
        ├─ Supplier A
        ├─ Supplier B
        └─ Supplier C
        
        
        STEP 4: MULTI-ROUND NEGOTIATION
        ────────────────────────────────
        
        ROUND 1 - Initial Quotes:
        ┌─────────────────────────────────────┐
        │ Supplier A: ₹5.50/unit, MOQ 50     │
        │ Supplier B: ₹5.20/unit, MOQ 100    │  ← Best price
        │ Supplier C: ₹5.80/unit, MOQ 25     │
        └─────────────────────────────────────┘
        
        Agent Analysis:
        ├─ Extract prices (NLP)
        ├─ Compare MOQs & delivery times
        ├─ Check supplier reliability scores
        └─ Identify: Supplier B has best price
        
                    │
                    ▼
        ROUND 2 - Counter-Offer:
        ┌─────────────────────────────────────────┐
        │ Agent → Supplier B:                     │
        │ "Can you do ₹5.00/unit for 100 units?" │
        │                                         │
        │ BATNA Check:                            │
        │ 100 × ₹5.00 = ₹500 < ₹100K? ✓ YES     │
        │ (Within budget constraint)              │
        └─────────────────────────────────────────┘
        
                    │
        ┌───────────┴──────────┬──────────────┐
        │                      │              │
        ▼                      ▼              ▼
    Supplier A         Supplier B         Supplier C
    "Best we can     "ACCEPTED!          "Can do
    is ₹5.30"        ₹5.00/unit"         ₹5.50 min"
        │                      │              │
        │ (Price too high)     │ (WINNER!)    │ (Too expensive)
        │                      │              │
        └──────────────────────┼──────────────┘
                               │
                               ▼
        ROUND 3 - DEAL SELECTION:
        ┌─────────────────────────────────────┐
        │ Supplier B Score:                  │
        │ Price: 100 pts (best)              │
        │ Reliability: 95 pts (proven)       │
        │ Lead Time: 90 pts (5 days)         │
        │ MOQ Flexibility: 85 pts            │
        │ ──────────────────────────         │
        │ TOTAL: 92.5/100                    │
        │ ✅ DECISION: ACCEPT DEAL           │
        └─────────────────────────────────────┘
        
        
        STEP 5: PO GENERATION
        ─────────────────────
        
                    ▼
        ┌──────────────────────────────────┐
        │ Auto-Generate Purchase Order     │
        │                                  │
        │ PO#2045                          │
        │ Supplier: Supplier B             │
        │ Product: Product X               │
        │ Quantity: 100 units              │
        │ Unit Price: ₹5.00                │
        │ Total: ₹500                      │
        │ Delivery Date: 2026-04-24        │
        │ Terms: Net 30                    │
        │ Generated: 2026-04-19 11:45 UTC  │
        │ Negotiation Rounds: 3            │
        │ Savings vs Ask: ₹100 (20%)       │
        │                                  │
        │ [PDF Download] [Blockchain Hash] │
        └──────────────────────────────────┘
        
                    │
                    
        STEP 6: BLOCKCHAIN LOGGING
        ──────────────────────────
        
                    ▼
        Calculate SHA-256 Hash of:
        ├─ PO content
        ├─ Negotiation transcript
        └─ Supplier agreement
        
        Result: 0xf3e2d1c0a9b8c7d6e5f4a3b2c1d0e9f8
                    │
                    ▼
        ┌──────────────────────────────────────┐
        │ Call Smart Contract:                 │
        │ SupplyChainAudit.logEvent(          │
        │   referenceId: "ORDER-PO-2045",     │
        │   eventType: NEGOTIATION_ACCEPTED,  │
        │   documentHash: 0xf3e2d1c0...,      │
        │   amount: 50000,                    │
        │   submitter: backend.eth            │
        │ )                                    │
        └──────────────────────────────────────┘
        
                    │
                    ▼
        Ethereum Sepolia Blockchain:
        ┌──────────────────────────────────────┐
        │ Block #18245 - CONFIRMED             │
        │ Tx: 0xa3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d│
        │ Event: NEGOTIATION_ACCEPTED          │
        │ Hash: 0xf3e2d1c0...                  │
        │ Amount: 50000 paise                  │
        │ Time: 2026-04-19 11:45:30 UTC        │
        │ ✅ IMMUTABLE RECORD CREATED          │
        └──────────────────────────────────────┘
        
        
        STEP 7: NOTIFICATIONS & PERSISTENCE
        ────────────────────────────────────
        
                    ▼
        MongoDB Persistence:
        ├─ PurchaseOrder collection (PO#2045)
        ├─ NegotiationLog (conversation history)
        ├─ SupplierPerformance (reliability score update)
        └─ BlockchainAudit (hash reference)
        
        Notifications Sent:
        ├─ Procurement Officer: "✅ PO#2045 issued. Savings: ₹100"
        ├─ Supplier B: "📧 PO#2045 received. Please confirm receipt"
        ├─ Finance: "💰 Budget: ₹500 allocated for PO#2045"
        └─ Dashboard: Real-time update in negotiations panel
        
        
        STEP 8: SUPPLIER EXECUTION
        ──────────────────────────
        
                    ▼
        Supplier B Actions:
        ├─ Receives PO#2045
        ├─ Confirms order acceptance (via portal)
        ├─ Prepares 100 units of Product X
        ├─ Schedules shipment for 2026-04-24
        └─ Updates delivery status in system
        
        
        STEP 9: GOODS RECEIPT & VERIFICATION
        ────────────────────────────────────
        
        Shipment arrives at Warehouse:
                    │
                    ▼
        Warehouse Manager:
        ├─ Scans QR code on package
        └─ System queries blockchain for hash
        
                    │
                    ▼
        ┌──────────────────────────────────────┐
        │ QR Verification:                     │
        │ ├─ Fetch hash from blockchain        │
        │ ├─ Fetch document from MongoDB       │
        │ ├─ Calculate actual hash             │
        │ └─ Compare: 0xf3e2d1c0 == 0xf3e2d1c0│
        │ ✅ AUTHENTIC - No tampering detected │
        └──────────────────────────────────────┘
        
                    │
                    ▼
        Logistics Verification:
        ├─ Count: 100 units ✓
        ├─ SKU: Product X ✓
        ├─ Quality: ✓
        └─ Pricing: ₹500 ✓
        
                    │
                    ▼
        ┌──────────────────────────────────────┐
        │ Log to Blockchain:                   │
        │ EventType: PO_RECEIVED               │
        │ Status: ✅ CONFIRMED                 │
        │ Update: Inventory increased by 100   │
        └──────────────────────────────────────┘
        
        
        STEP 10: SETTLEMENT & CLOSURE
        ─────────────────────────────
        
                    ▼
        Payment Processing:
        ├─ Invoice received from Supplier B
        ├─ 3-way match: PO ↔ Invoice ↔ Receipt ✓
        ├─ Amount: ₹500 (Net 30 terms)
        └─ Payment scheduled for 2026-05-19
        
        Final Blockchain Record:
        ├─ Event: SMART_CONTRACT_EXECUTED
        ├─ Payment: Triggered automatically
        └─ Complete audit trail: 5 events logged
        
        
        ✨ END RESULT:
        ──────────────
        ✅ Negotiation completed in 2 hours (vs 2-3 days manual)
        ✅ Savings achieved: ₹100 (20% discount)
        ✅ Full audit trail on blockchain
        ✅ Supplier rated & scored for future negotiations
        ✅ Order fulfilled on time
        
        SYSTEM BENEFITS REALIZED:
        ├─ Time: 96% faster process
        ├─ Cost: 3-5% procurement savings
        ├─ Compliance: 100% immutable audit trail
        ├─ Transparency: All stakeholders have visibility
        └─ Intelligence: Future negotiations use this data

```

---

## 2. DEMAND FORECASTING FLOW

```
┌────────────────────────────────────────────────────┐
│          DEMAND FORECASTING PIPELINE              │
└────────────────────────────────────────────────────┘

AUTOMATIC SCHEDULER
(runs every 6 hours via node-cron)
        │
        ▼
┌───────────────────────────────────┐
│ Query all active products (MongoDB)
│ Count: 500+ products              │
└───────────────────────────────────┘
        │
        ▼
FOR EACH PRODUCT × WAREHOUSE COMBO:
        │
        ├─ Product-1 × Warehouse-1
        ├─ Product-1 × Warehouse-2
        ├─ Product-1 × Warehouse-3
        ├─ Product-2 × Warehouse-1
        ├─ ... (1500+ combinations)
        │
        
        PARALLEL EXECUTION: Forecast Agent runs for each combo
        
        Example: Product X in Warehouse 1
        ┌─────────────────────────────────────────┐
        │ STEP 1: Fetch Historical Data           │
        │                                         │
        │ Query MongoDB InventoryTransactions:    │
        │ • Last 90 days                          │
        │ • Product ID: 12345                     │
        │ • Warehouse ID: WH-01                   │
        │                                         │
        │ Result:                                 │
        │ ├─ Day 1: 45 units sold                 │
        │ ├─ Day 2: 52 units sold                 │
        │ ├─ Day 3: 48 units sold                 │
        │ ├─ Day 4: 51 units sold                 │
        │ └─ ... (90 days of data)                │
        │                                         │
        │ Total 90-day demand: 4,680 units        │
        │ Average: 52 units/day                   │
        │ Std Dev: 8.5 units                      │
        └─────────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────────┐
        │ STEP 2: Analyze Seasonality             │
        │                                         │
        │ Query Product Metadata:                 │
        │ • Product category                      │
        │ • Seasonal patterns                     │
        │ • Known promotions                      │
        │                                         │
        │ Example: Widget X                       │
        │ • Category: Home & Garden               │
        │ • Seasonal: High in spring/summer       │
        │ • Current: April (Spring ↗️ demand)    │
        │ • Status: Promotion planned: May 15%    │
        └─────────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────────┐
        │ STEP 3: LLM Analysis (Gemini)           │
        │                                         │
        │ Prompt:                                 │
        │ "Based on:                              │
        │  - 90-day avg: 52 units/day             │
        │  - Std Dev: 8.5 units                   │
        │  - Current season: Spring              │
        │  - Promotion: May 15%                   │
        │  - Day of week: Mon-Sun pattern        │
        │                                         │
        │ Predict demand for next 7 days          │
        │ with confidence intervals"              │
        │                                         │
        │ Gemini Response:                        │
        │ "Based on patterns:                     │
        │  Tomorrow (Mon): 48±6 units             │
        │  Day 2 (Tue): 55±7 units                │
        │  Day 3 (Wed): 51±5 units                │
        │  Day 4 (Thu): 54±6 units                │
        │  Day 5 (Fri): 58±8 units (pre-weekend)  │
        │  Day 6 (Sat): 72±10 units (weekend)     │
        │  Day 7 (Sun): 38±7 units (low)"         │
        │                                         │
        │ Confidence: 92%                         │
        └─────────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────────┐
        │ STEP 4: Calculate Confidence Intervals  │
        │                                         │
        │ Using statistical formulas:             │
        │ Low = prediction - (std_dev × 1.96)     │
        │ High = prediction + (std_dev × 1.96)    │
        │                                         │
        │ Results:                                │
        │ Day 1: 48 units (Low: 36, High: 60)     │
        │ Day 2: 55 units (Low: 41, High: 69)     │
        │ Day 3: 51 units (Low: 41, High: 61)     │
        │ Day 4: 54 units (Low: 42, High: 66)     │
        │ Day 5: 58 units (Low: 42, High: 74)     │
        │ Day 6: 72 units (Low: 52, High: 92)     │
        │ Day 7: 38 units (Low: 24, High: 52)     │
        │                                         │
        │ 7-Day Total Prediction: 376 units       │
        │ Overall MAPE (accuracy): 6.2%           │
        └─────────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────────┐
        │ STEP 5: Reorder Recommendations        │
        │                                         │
        │ Product X Reorder Point (ROP): 150 units│
        │ Lead Time: 7 days                       │
        │ Safety Stock: 50 units                  │
        │ Current Stock: 180 units                │
        │                                         │
        │ 7-Day Demand: 376 units                 │
        │ Stock needed by Day 7: 150 + 50 = 200  │
        │ Current will drop to: 180 - 376 = -196 │
        │ ⚠️ STOCKOUT PREDICTED on Day 4!        │
        │                                         │
        │ RECOMMENDATION:                         │
        │ "Reorder 500 units TODAY                │
        │ (Reorder Quantity calculated via EOQ)  │
        │ Expected arrival: Day 7 (by lead time)"│
        └─────────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────────┐
        │ STEP 6: Persist to MongoDB              │
        │                                         │
        │ Collection: DemandForecast              │
        │ Document:                               │
        │ {                                       │
        │   product: ObjectId("12345"),           │
        │   warehouse: ObjectId("WH-01"),         │
        │   forecastedAt: 2026-04-19,             │
        │   forecastHorizonDays: 7,               │
        │   dailyForecasts: [                     │
        │     {                                   │
        │       date: 2026-04-20,                 │
        │       predictedDemand: 48,              │
        │       confidenceLow: 36,                │
        │       confidenceHigh: 60,               │
        │       actualDemand: null                │
        │     },                                  │
        │     ... (7 days)                        │
        │   ],                                    │
        │   totalPredicted7Day: 376,              │
        │   overallMape: 0.062,                   │
        │   modelVersion: "gemini-v2",            │
        │   recommendedReorderQty: 500,           │
        │   recommendedOrderDate: 2026-04-19      │
        │ }                                       │
        └─────────────────────────────────────────┘
                    │
        ┌───────────┴──────────┬─────────────┐
        │                      │             │
        ▼                      ▼             ▼
    Retailer Dashboard   Notification   Negotiation Trigger
    ├─ Shows: "Stock     System: "Low   (if stock < ROP)
    │  will drop below    stock alert   │
    │  ROP on Day 4"      for Product   └─ Automatic
    │- Shows: "Reorder    X in WH-01"      negotiation
    │  500 units now"                      starts
    │
    └─ Data refresh every 6 hours


FRONTEND DISPLAY EXAMPLE:
┌──────────────────────────────────────┐
│ DEMAND FORECAST - Product X          │
├──────────────────────────────────────┤
│                                      │
│ Forecast Confidence: 92%             │
│ Model: Gemini 2.0 Flash              │
│                                      │
│ Day │ Predicted │ Range (95% CI)     │
│─────┼───────────┼───────────────────│
│ 1   │ 48 units  │ 36-60 (▁▂▃▃▂░░)   │
│ 2   │ 55 units  │ 41-69 (▁▂▃▄▂░░)   │
│ 3   │ 51 units  │ 41-61 (▁▂▃▃▂░░)   │
│ 4   │ 54 units  │ 42-66 (▁▂▃▃▂░░)   │
│ 5   │ 58 units  │ 42-74 (▁▂▃▄▃░░)   │
│ 6   │ 72 units  │ 52-92 (▁▂▃▅▄░░)   │
│ 7   │ 38 units  │ 24-52 (░▂▃▃░░░)   │
│─────┼───────────┼───────────────────│
│ Total 7-Day: 376 units               │
│ Current Stock: 180 units             │
│ ⚠️  Stockout Risk: DAY 4             │
│                                      │
│ [TRIGGER REORDER] [OVERRIDE] [DETAILS]
│                                      │
└──────────────────────────────────────┘

```

---

## 3. WAREHOUSE OPTIMIZATION FLOW

```
┌────────────────────────────────────────────────────┐
│        WAREHOUSE OPTIMIZATION PIPELINE            │
└────────────────────────────────────────────────────┘

API CALL: POST /api/warehouse-optimization/analyze
        │
        ├─ warehouseId: "WH-01"
        ├─ analysisDepthDays: 30
        └─ Triggered by: Warehouse Manager or Scheduler
        
        │
        ▼
┌──────────────────────────────────────────┐
│ STEP 1: Fetch Warehouse Data             │
│                                          │
│ MongoDB queries:                         │
│ ├─ Warehouse zones (A, B, C, D)         │
│ ├─ Zone capacities (each in sq meters)   │
│ ├─ Current inventory by zone            │
│ ├─ Zone configurations (climate, access)│
│ └─ Special constraints (cold storage)   │
│                                          │
│ Result:                                  │
│ Zone A (Cold): 1000 m² | 920 m² used    │
│              → 92% utilization           │
│ Zone B (Pick): 800 m²  | 624 m² used    │
│              → 78% utilization           │
│ Zone C (Bulk): 2000 m² | 1300 m² used   │
│              → 65% utilization           │
│ Zone D (Returns): 500 m² | 225 m² used  │
│              → 45% utilization           │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ STEP 2: Fetch Movement Patterns (30 days)│
│                                          │
│ MongoDB InventoryTransactions query:     │
│ For each SKU in each zone, calculate:    │
│                                          │
│ Movement Frequency Analysis:             │
│                                          │
│ Zone A (Cold Storage):                   │
│ ├─ SKU-001 (Widget X): 45 picks/month    │
│ ├─ SKU-002 (Widget Y): 2 picks/month     │
│ ├─ SKU-003 (Gadget Z): 1 pick/month      │
│ └─ ... (total: 300 picks/month from Zone A)
│                                          │
│ Zone B (Pick Zone):                      │
│ ├─ SKU-456 (Hot Item): 1200 picks/month  │
│ ├─ SKU-789 (Popular): 950 picks/month    │
│ ├─ SKU-101 (Fast-mover): 850 picks/month │
│ └─ ... (total: 5400 picks/month from Zone B)
│                                          │
│ Insight:                                 │
│ Zone B has 18× more picks per month      │
│ but Zone A has 92% utilization!          │
│ This is inefficient!                     │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ STEP 3: LLM Analysis (Gemini)            │
│                                          │
│ Prompt to Gemini:                        │
│ "Analyze warehouse layout:               │
│                                          │
│ Current state:                           │
│ Zone A (Cold): 92% full, 300 picks/mo   │
│ Zone B (Pick): 78% full, 5400 picks/mo  │
│ Zone C (Bulk): 65% full, 800 picks/mo   │
│ Zone D (Returns): 45% full, 200 picks/mo│
│                                          │
│ Problem: Zone A too full, low activity   │
│ Problem: Zone B at capacity, high demand │
│ Problem: Zone C has space, low activity  │
│                                          │
│ Recommend:                               │
│ 1. Move slow-movers from Zone A to C    │
│ 2. Reallocate cold items that are fast  │
│ 3. Expand fast-movers in Zone B         │
│                                          │
│ Estimate impact on picking time"         │
│                                          │
│ Gemini Response:                         │
│ "I recommend:                            │
│  1. Move 40% slow cold items to Zone C   │
│  2. Reallocate 60% fast cold items to B  │
│  3. Create 'hot shelf' in Zone B         │
│                                          │
│ Expected improvement:                    │
│  • Picking time: -18%                    │
│  • Zone A utilization: 65% (better)     │
│  • Zone B utilization: 85% (optimal)    │
│  • Zone C utilization: 75% (utilized)   │
│  • Monthly cost savings: ₹45,000         │
│  • Equipment cost for move: ₹8,000       │
│  • ROI: 2.2 months"                     │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ STEP 4: Generate Recommendations         │
│                                          │
│ Output structure:                        │
│ {                                        │
│   warehouseId: "WH-01",                  │
│   analysisDate: 2026-04-19,              │
│   currentUtilization: 73.5%,             │
│   recommendations: [                     │
│     {                                    │
│       type: "zone_reassignment",         │
│       priority: "high",                  │
│       description: "Move slow-moving    │
│                    cold items (Widget Y, │
│                    Gadget Z) from Zone A │
│                    to Zone C",           │
│       estimatedImpact:                  │
│         "Zone A: 92% → 65% (better);   │
│          Picking time: -15%",           │
│       affectedZones: ["A", "C"],        │
│       affectedProducts: ["SKU-002",     │
│                         "SKU-003"]       │
│     },                                   │
│     {                                    │
│       type: "product_relocation",        │
│       priority: "high",                  │
│       description: "Fast-moving cold     │
│                    items (Widget X) from │
│                    Zone A to Zone B",    │
│       estimatedImpact:                  │
│         "Picking time: -12%",           │
│       affectedZones: ["A", "B"],        │
│       affectedProducts: ["SKU-001"]      │
│     },                                   │
│     {                                    │
│       type: "capacity_expansion",        │
│       priority: "medium",                │
│       description: "Zone B at capacity.  │
│                    Consider adding       │
│                    additional shelving", │
│       estimatedImpact:                  │
│         "Increase capacity: +20%",      │
│       affectedZones: ["B"]               │
│     }                                    │
│   ],                                     │
│   estimatedCostSavings: 45000,          │
│   estimatedEfficiencyGain: 18%          │
│ }                                        │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ STEP 5: Dashboard Display                │
│                                          │
│ Warehouse Manager sees:                  │
│                                          │
│ OPTIMIZATION RECOMMENDATIONS             │
│ ┌─────────────────────────────────────┐ │
│ │ Priority: HIGH                      │ │
│ │ Recommendation: Zone Reassignment   │ │
│ │ Move: SKU-002, SKU-003 from A→C    │ │
│ │ Impact: Zone A 92%→65%, Picking -15%│
│ │ Effort: 2-3 hours                   │
│ │                                     │ │
│ │ [APPROVE] [REVIEW] [REJECT]        │ │
│ │ ✓ APPROVED on 2026-04-19 14:00     │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Priority: HIGH                      │ │
│ │ Recommendation: Product Relocation  │ │
│ │ Move: SKU-001 from Zone A→B        │ │
│ │ Impact: Picking time -12%           │ │
│ │ Effort: 1-2 hours                   │ │
│ │                                     │ │
│ │ [APPROVE] [REVIEW] [REJECT]        │ │
│ │ ⏳ PENDING APPROVAL                 │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ SUMMARY:                                 │
│ Expected Savings: ₹45,000 annually      │
│ Implementation Cost: ₹8,000              │
│ ROI: 2.2 months                          │
│                                          │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ STEP 6: Implementation Tracking          │
│                                          │
│ On approval, system creates tasks:       │
│ ├─ Task 1: Move SKU-002, SKU-003 from A→C
│ │  Assigned to: Zone Manager A          │
│ │  Deadline: 2026-04-20 18:00           │
│ │  Status: IN PROGRESS                  │
│ │  [Update Status] [Mark Complete]      │
│ │                                       │
│ ├─ Task 2: Inventory recount Zone A & C │
│ │  Assigned to: Counting Team           │
│ │  Status: PENDING                      │
│ │                                       │
│ └─ Task 3: Verify picking time impact   │
│    Assigned to: Logistics Manager       │
│    Status: PENDING                      │
│                                         │
└──────────────────────────────────────────┘
        │
        ▼
RESULTS (After Implementation):
    
Zone A: 92% → 65% utilization ✓
Zone B: 78% → 85% utilization ✓
Picking time: -18% reduction ✓
Cost savings: ₹3,750/month ✓
Return on investment: Achieved in 2.2 months

```

---

## 4. BLOCKCHAIN VERIFICATION FLOW

```
┌────────────────────────────────────────────────────┐
│       BLOCKCHAIN AUDIT TRAIL & VERIFICATION       │
└────────────────────────────────────────────────────┘

SCENARIO: Goods received at warehouse dock


        STEP 1: PHYSICAL SHIPMENT ARRIVAL
        ────────────────────────────────
        
        📦 Box arrives at Warehouse WH-01
                    │
                    ▼
        Barcode/QR Code on box:
        
        ┌────────────────────────────────┐
        │ https://autostock/verify       │
        │ ?order=PO%232045               │
        │ &hash=0xf3e2d1c0...            │
        │ &blockchain=sepolia            │
        └────────────────────────────────┘
        
        
        STEP 2: QR CODE SCAN
        ───────────────────
        
        Warehouse staff scans with phone
                    │
                    ▼
        Frontend opens verification page
                    │
                    ▼
        ┌────────────────────────────────────┐
        │ BLOCKCHAIN VERIFICATION PAGE       │
        │                                    │
        │ Verifying: PO#2045                │
        │ Status: 🔄 Checking blockchain... │
        │                                    │
        └────────────────────────────────────┘
        
        
        STEP 3: ON-CHAIN LOOKUP
        ──────────────────────
        
        Query Ethereum Sepolia Blockchain:
        
        SmartContract: SupplyChainAudit
        Function call: verifyHash(
            referenceId: bytes32(PO#2045),
            eventType: PO_CREATED,
            documentHash: 0xf3e2d1c0...
        )
                    │
                    ▼
        Blockchain response:
        ┌────────────────────────────────┐
        │ Tx: 0xa3b2c1d0e9f8a7b6c5d4e3f2 │
        │ Block: 18245                   │
        │ Status: ✅ CONFIRMED           │
        │ Hash from chain: 0xf3e2d1c0... │
        │ Hash from QR: 0xf3e2d1c0...    │
        │                                │
        │ RESULT: ✅ MATCH!              │
        └────────────────────────────────┘
        
        
        STEP 4: OFF-CHAIN DOCUMENT FETCH
        ────────────────────────────────
        
        Query MongoDB for document:
        
        Reference: PO#2045
        Collections to check:
        ├─ PurchaseOrder (main document)
        ├─ NegotiationLog (transcript)
        └─ BlockchainAudit (hash reference)
        
        Result:
        ┌────────────────────────────────┐
        │ PO#2045 Document:              │
        │                                │
        │ Supplier: Supplier B           │
        │ Product: Widget X              │
        │ Quantity: 100 units            │
        │ Price: ₹5.00/unit              │
        │ Total: ₹500                    │
        │ Expected Delivery: 2026-04-24  │
        │ Status: ✅ DELIVERED           │
        │ Timestamp: 2026-04-24 10:30    │
        │                                │
        │ Negotiation Round 3:           │
        │ "Accepted ₹5.00/unit"          │
        │                                │
        └────────────────────────────────┘
        
        
        STEP 5: HASH VERIFICATION
        ────────────────────────
        
        System calculates SHA-256 of:
        1. Full PO document (JSON)
        2. Negotiation transcript (text)
        3. Supplier agreement (text)
        
        Concatenate all:
        ┌────────────────────────────────┐
        │ "{"supplier":"Supplier B",...}" │
        │ + "Round 1: Quote ₹5.20..."    │
        │ + "Agreement: Accept 5.00"     │
        │                                │
        │ SHA-256(concatenated) =        │
        │ 0xf3e2d1c0a9b8c7d6e5f4a3b2...  │
        └────────────────────────────────┘
        
        Compare:
        ├─ Hash from blockchain: 0xf3e2d1c0...
        ├─ Hash from MongoDB doc: 0xf3e2d1c0...
        └─ Calculated hash: 0xf3e2d1c0...
        
        ✅ ALL THREE MATCH → Document authentic!
        ❌ MISMATCH → Document tampered!
        
        
        STEP 6: DISPLAY VERIFICATION RESULT
        ───────────────────────────────────
        
        CASE 1: ✅ AUTHENTIC
        ┌────────────────────────────────┐
        │ ✅ SHIPMENT VERIFIED            │
        │                                │
        │ Document: AUTHENTIC            │
        │ No tampering detected          │
        │ Blockchain hash: MATCHES       │
        │                                │
        │ Details:                       │
        │ PO#2045                        │
        │ Supplier: Supplier B           │
        │ Items: 100 units Widget X      │
        │ Amount: ₹500                   │
        │ Verified on: Block #18245      │
        │ Verification time: 15 seconds  │
        │                                │
        │ ✓ All checks passed            │
        │ ✓ Safe to accept delivery      │
        │                                │
        │ [ACCEPT SHIPMENT]              │
        │ [DOWNLOAD CERTIFICATE]         │
        └────────────────────────────────┘
        
        
        CASE 2: ❌ TAMPERED
        ┌────────────────────────────────┐
        │ ⚠️  FRAUD ALERT!               │
        │                                │
        │ Document: TAMPERED             │
        │ Hash mismatch detected         │
        │                                │
        │ Blockchain hash:               │
        │ 0xf3e2d1c0a9b8c7d6e5f4a3b2... │
        │                                │
        │ Document hash:                 │
        │ 0x5a6b7c8d9e0f1a2b3c4d5e6f... │
        │                                │
        │ ❌ DOES NOT MATCH              │
        │                                │
        │ Analysis:                      │
        │ • Supplier changed from A → B? │
        │ • Quantity reduced 100 → 50?   │
        │ • Price altered ₹5.00 → ₹4.50?│
        │                                │
        │ ACTION REQUIRED:               │
        │ 1. DO NOT ACCEPT SHIPMENT      │
        │ 2. Alert warehouse manager     │
        │ 3. Alert security team         │
        │ 4. Contact supplier            │
        │ 5. Report to admin             │
        │                                │
        │ [REJECT SHIPMENT]              │
        │ [ALERT SECURITY]               │
        │ [CONTACT SUPPLIER]             │
        └────────────────────────────────┘
        
        
        STEP 7: UPDATE SYSTEM
        ─────────────────────
        
        If ✅ ACCEPTED:
        ┌────────────────────────────────┐
        │ Log to Blockchain:             │
        │ Event: PO_RECEIVED             │
        │ Hash: 0x7f8e9d0c...            │
        │ Status: CONFIRMED              │
        │ Timestamp: 2026-04-24 10:30    │
        │                                │
        │ MongoDB Update:                │
        │ PurchaseOrder.status = RECEIVED│
        │ InventoryTransaction:          │
        │ +100 units Widget X in WH-01   │
        │                                │
        │ Notifications:                 │
        │ ✓ Warehouse Manager (received) │
        │ ✓ Finance (ready for payment)  │
        │ ✓ Retailer (stock available)   │
        └────────────────────────────────┘
        
        If ❌ REJECTED:
        ┌────────────────────────────────┐
        │ Log to Blockchain:             │
        │ Event: SHIPMENT_REJECTED       │
        │ Reason: HASH_MISMATCH          │
        │ Alert Level: CRITICAL          │
        │                                │
        │ MongoDB Update:                │
        │ PurchaseOrder.status = DISPUTED│
        │ Alert.severity = HIGH          │
        │ Escalated to: Security Team    │
        │                                │
        │ Notifications:                 │
        │ ✓ Warehouse Manager (urgent)   │
        │ ✓ Admin (fraud alert)          │
        │ ✓ Supplier (discrepancy notice)│
        │ ✓ Finance (hold payment)       │
        └────────────────────────────────┘
        
        
        COMPLETE AUDIT TRAIL FOR PO#2045:
        
        Timeline:
        ├─ 2026-04-19 11:45 UTC: NEGOTIATION_ACCEPTED
        │  Hash: 0xf3e2d1c0...
        │  Block: 18245 ✅ Confirmed
        │
        ├─ 2026-04-19 12:00 UTC: PO_CREATED
        │  Hash: 0x8d7c5b4a...
        │  Block: 18246 ✅ Confirmed
        │
        ├─ 2026-04-19 14:30 UTC: PO_SENT
        │  Hash: 0x5b4a3c2d...
        │  Block: 18248 ✅ Confirmed
        │
        └─ 2026-04-24 10:30 UTC: PO_RECEIVED
           Hash: 0x7f8e9d0c...
           Block: 18523 ✅ Confirmed
           QR Verification: PASSED
           
        RESULT: Complete immutable audit trail for compliance!

```

---

This document provides clear visual flows for all major processes. You can print these or use them as presentation slides!


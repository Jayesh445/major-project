# AutoStock AI - Live Demo Walkthrough Guide for Presentation

**⏱️ Total Demo Time: 20-25 minutes**  
**📍 Follow this guide step-by-step while running the actual project**

---

## 🔑 User Roles in the System

### 1. **Admin**
- **Role:** System administrator and oversight
- **Responsibilities:** Manage users, oversee negotiations, configure system
- **Best Dashboard For:** Complete system overview
- **Login:** admin@scm.dev / Password123!

### 2. **Procurement Officer / Retailer**
- **Role:** Procurement and replenishment management
- **Responsibilities:** Order products, manage inventory, monitor forecasts
- **Best Dashboard For:** Demand forecasting, order management
- **Login:** vikram.proc@scm.dev / Password123!
- **Alt Login:** ananya.proc@scm.dev / Password123!

### 3. **Warehouse Manager**
- **Role:** Warehouse operations
- **Responsibilities:** Manage inventory locations, approve allocations, optimize zones
- **Best Dashboard For:** Inventory, warehouse optimization
- **Login:** priya.wh@scm.dev / Password123!
- **Alt Login:** amit.wh@scm.dev / Password123!

### 4. **Supplier**
- **Role:** Vendor/supplier
- **Responsibilities:** Manage product catalog, respond to orders and negotiations
- **Best Dashboard For:** Order confirmation, negotiation response
- **Note:** Supplier portal may require separate setup or viewing as procurement_officer role

---

## 📊 Demo Flow Overview

```
STEP 1: Login as Admin              (2 min)  ← Show overall system
STEP 2: Show Retailer Dashboard     (4 min)  ← Forecast & demand
STEP 3: Show Negotiation Oversight  (4 min)  ← AI agent in action
STEP 4: Show Warehouse Dashboard    (3 min)  ← Optimization
STEP 5: Show Blockchain Verification(3 min)  ← Immutable records
STEP 6: Show Supplier Portal        (2 min)  ← Multi-stakeholder view
STEP 7: Q&A                         (Rest)
```

---

# 🎬 STEP-BY-STEP WALKTHROUGH

---

## ✅ STEP 1: LOGIN & ADMIN DASHBOARD (2 minutes)

### 🔐 LOGIN PROCESS

**Where to go:**
```
URL: http://localhost:3000  (or your deployment URL)
```

**What you see:**
```
┌─────────────────────────────┐
│    AUTOSTOCK AI LOGIN       │
│                             │
│ Email: [____________]       │
│ Password: [____________]    │
│                             │
│ [LOGIN BUTTON]              │
│ [FORGOT PASSWORD]           │
└─────────────────────────────┘
```

**Action:**
```
Email:    admin@scm.dev
Password: Password123!
Click:    [LOGIN BUTTON]
```

**Wait for:** Loading... → Redirect to dashboard

---

### 🏠 ADMIN DASHBOARD (Screen A01)

**After login, you'll see:**

```
┌────────────────────────────────────────────────────────┐
│ AUTOSTOCK AI - ADMIN DASHBOARD                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [← Back] [Admin Dashboard] [Settings] [Logout]       │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ KEY METRICS (Top Section)                      ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Total Orders: 245      │ Pending Negotiations: 12 ║   │
│ ║ Low Stock Alerts: 8    │ Supplier Performance: 94%║   │
│ ║ Warehouse Util: 87%    │ Avg Neg. Rounds: 3      ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ RECENT ACTIVITIES                              ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ • PO#2045 Negotiation complete (saved ₹5,000) ║   │
│ ║ • Warehouse optimization suggested (WH-03)    ║   │
│ ║ • Forecast alert: Low stock SKU-891 in WH-02  ║   │
│ ║ • Negotiation round 3: Supplier-A counter      ║   │
│ ║ • New order created by Retailer-1              ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ CHARTS (Lower Section)                         ║   │
│ ║ [Order Trends Chart]  [Supplier Rankings]     ║   │
│ ║ [Forecast Accuracy]   [Cost Savings Trend]    ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ [View Negotiations] [Manage Partners] [Analytics]    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"This is the Admin Dashboard. You can see:
- KPI cards with system health metrics
- Recent activities feed showing what's happening
- Charts showing trends and performance
- Quick action buttons for oversight

An admin can see everything - negotiations, partners, 
analytics, and system configuration."
```

**Don't spend too long here - move to next step**

---

## ✅ STEP 2: RETAILER/PROCUREMENT DASHBOARD (4 minutes)

### 📍 Navigate to Retailer View

**Option 1 - Switch role in current session:**
```
Click on: User menu → Switch to "Procurement Officer" role
```

**Option 2 - Direct login:**
```
Logout from admin
Login with:
Email:    vikram.proc@scm.dev
Password: Password123!
```

**Option 3 - Direct URL:**
```
Direct URL: http://localhost:3000/dashboard/procurement/
```

**After switching, you'll see:**

```
┌────────────────────────────────────────────────────────┐
│ RETAILER DASHBOARD - INVENTORY & FORECASTING          │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [Retailer Dashboard] [Inventory] [Orders] [Settings]  │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ INVENTORY HEALTH (Quick Metrics)               ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Total SKUs: 456                                ║   │
│ ║ Low Stock Items: 8 ⚠️                         ║   │
│ ║ Total Inventory Value: ₹12.5M                  ║   │
│ ║ Forecast Accuracy: 94%                         ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ LOW STOCK ALERTS (Critical Items)              ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ ⚠️ SKU-891 (Widget X)                         ║   │
│ ║    Current: 12 units                           ║   │
│ ║    Reorder Point: 50 units                     ║   │
│ ║    Status: 🔄 AUTO-REPLENISH ENABLED          ║   │
│ ║    Action: Negotiation in progress NEG-12     ║   │
│ ║                                                ║   │
│ ║ ⚠️ SKU-456 (Gadget Y)                         ║   │
│ ║    Current: 5 units                            ║   │
│ ║    Reorder Point: 30 units                     ║   │
│ ║    Status: 🔄 AUTO-REPLENISH ENABLED          ║   │
│ ║    Action: [CREATE MANUAL ORDER]               ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ 7-DAY DEMAND FORECAST (SKU-891 - Widget X)   ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║                                                ║   │
│ ║ Chart showing daily predictions:               ║   │
│ ║ Monday:    45 units (92% confidence)           ║   │
│ ║ Tuesday:   52 units (91% confidence)           ║   │
│ ║ Wednesday: 48 units (90% confidence)           ║   │
│ ║ Thursday:  55 units (91% confidence)           ║   │
│ ║ Friday:    62 units (92% confidence)           ║   │
│ ║ Saturday:  78 units (89% confidence)           ║   │
│ ║ Sunday:    35 units (88% confidence)           ║   │
│ ║                                                ║   │
│ ║ ⚠️ Estimated Stockout: Friday (if not         ║   │
│ ║    reordered today)                            ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ RECENT PURCHASE ORDERS                         ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ PO#2043 | SKU-789  | 100 units | Delivered   ║   │
│ ║ PO#2044 | SKU-234  | 75 units  | Shipped     ║   │
│ ║ PO#2045 | SKU-891  | 120 units | NEGOTIATING ║   │
│ ║         └─ Status: Round 3, awaiting supplier ║   │
│ ║         └─ Current offer: ₹5.00/unit          ║   │
│ ║         └─ Est. savings: ₹100 (20%)           ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ COST SAVINGS THIS MONTH                        ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Total Saved: ₹23,450                           ║   │
│ ║ Avg per order: 3.2%                            ║   │
│ ║ Thanks to: AI Negotiation Agent                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"This is the Retailer Dashboard. Notice:

1️⃣ INVENTORY HEALTH:
   - Shows which items are running low
   - Total inventory value and SKU count
   - Forecast accuracy: 94%

2️⃣ LOW STOCK ALERTS:
   - SKU-891 is at 12 units (below ROP of 50)
   - Auto-replenish is ENABLED
   - Negotiation NEG-12 is already in progress
   - System automatically triggered it!

3️⃣ 7-DAY DEMAND FORECAST:
   - Predicts demand for next 7 days
   - Shows confidence levels (92%, 91%, etc.)
   - Estimated stockout on Friday if not reordered
   - This is powered by Google Gemini AI

4️⃣ RECENT ORDERS:
   - PO#2045 is actively being negotiated
   - Current best offer: ₹5.00/unit
   - Estimated savings: ₹100

The system is proactive - it doesn't wait for you to 
reorder. It forecasts, negotiates, and updates you!"
```

**Action:**
```
Click on: "PO#2045" (the negotiating order)
This will take us to the Negotiation Details page
```

---

## ✅ STEP 3: NEGOTIATION DETAILS & OVERSIGHT (4 minutes)

### 📍 Click on Active Negotiation

**Where you are now:**
```
After clicking PO#2045 or "View Negotiations" button
URL: http://localhost:3000/dashboard/dev-tools/negotiations/
```

**What you see - Negotiation Overview:**

```
┌────────────────────────────────────────────────────────┐
│ ACTIVE NEGOTIATIONS - ADMIN OVERSIGHT                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [Active Negotiations] [Completed] [Failed]             │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ NEGOTIATION NEG-12 (Status: IN PROGRESS)      ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║                                                ║   │
│ ║ Purchase Order: PO#2045                        ║   │
│ ║ Product: Widget X (SKU-891)                    ║   │
│ ║ Quantity: 100 units                            ║   │
│ ║ Budget (pmax): ₹100,000                        ║   │
│ ║ Suppliers Contacted: 3                         ║   │
│ ║ Current Round: 3                               ║   │
│ ║ Negotiation Time Elapsed: 1 hour 45 minutes    ║   │
│ ║ Status: Awaiting Supplier B response           ║   │
│ ║                                                ║   │
│ ║ [VIEW DETAILS] [VIEW TRANSCRIPT] [OVERRIDE]   ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ SUPPLIER COMPARISON                            ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║                                                ║   │
│ ║ Supplier A:                                    ║   │
│ ║   Best Offer: ₹5.30/unit                       ║   │
│ ║   Reliability Score: 88%                       ║   │
│ ║   Lead Time: 7 days                            ║   │
│ ║   Status: ❌ Price too high                   ║   │
│ ║                                                ║   │
│ ║ Supplier B: ⭐ LEADING                         ║   │
│ ║   Best Offer: ₹5.00/unit                       ║   │
│ ║   Reliability Score: 95%                       ║   │
│ ║   Lead Time: 5 days                            ║   │
│ ║   Status: ✅ ACCEPTED                         ║   │
│ ║                                                ║   │
│ ║ Supplier C:                                    ║   │
│ ║   Best Offer: ₹5.50/unit                       ║   │
│ ║   Reliability Score: 82%                       ║   │
│ ║   Lead Time: 10 days                           ║   │
│ ║   Status: ❌ Expensive & slow                  ║   │
│ ║                                                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"This is the Negotiation Oversight page. The admin 
can monitor all active negotiations in real-time. 

Notice:
- 3 suppliers were contacted simultaneously
- Supplier B is the leader with ₹5.00/unit
- Reliability score: 95% (proven reliable)
- Lead time: 5 days (fast)
- Budget check: 100 × ₹5.00 = ₹500 ✓ Within budget

The AI agent is comparing not just price, but also:
✓ Supplier reliability
✓ Lead time
✓ Delivery terms
✓ Budget constraints

Admin can override if needed, but the AI usually 
makes the optimal decision!"
```

**Action:**
```
Click on: [VIEW TRANSCRIPT] or [VIEW DETAILS]
This will show the actual conversation between 
the AI and suppliers
```

---

### 📍 Negotiation Transcript/Details

**What you see - Conversation History:**

```
┌────────────────────────────────────────────────────────┐
│ NEGOTIATION TRANSCRIPT - NEG-12                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Started: 2026-04-19 09:50 UTC                         │
│ Duration: 1h 45m                                       │
│ Agent: Buyer Agent (powered by Google Gemini 2.0)    │
│ Memory: Persistent (LibSQL)                           │
│                                                        │
│ ─────────────────────────────────────────────         │
│ ROUND 1: INITIAL REQUEST FOR QUOTES                   │
│ ─────────────────────────────────────────────         │
│                                                        │
│ [09:50] AI Agent → All Suppliers:                    │
│ "Hello, we need 100 units of Widget X (SKU-891)      │
│  Specifications: [quality requirements]               │
│  Needed by: 2026-04-24                                │
│  Please provide your best quote                       │
│  (price per unit, MOQ, delivery time, terms)"        │
│                                                        │
│ [09:55] Supplier A replies:                           │
│ "We can supply 100 units at ₹5.50/unit               │
│  MOQ: 50 units (your qty is OK)                       │
│  Delivery: 7 days                                     │
│  Payment: Net 30"                                     │
│                                                        │
│ [10:00] Supplier B replies: ⭐ BEST PRICE            │
│ "Best price: ₹5.20/unit                              │
│  MOQ: 100 units (exactly your qty)                    │
│  Delivery: 5 days (fast!)                             │
│  Payment: Net 30"                                     │
│                                                        │
│ [10:05] Supplier C replies:                           │
│ "Price: ₹5.80/unit                                   │
│  MOQ: 25 units                                        │
│  Delivery: 10 days                                    │
│  Payment: Net 45"                                     │
│                                                        │
│ ─────────────────────────────────────────────         │
│ AI ANALYSIS (Internal):                               │
│ "Supplier B has best price: ₹5.20                    │
│  Reliability: 95% (from supplier scorecard)           │
│  Lead time: 5 days (acceptable)                       │
│  Let me negotiate harder with B"                      │
│ ─────────────────────────────────────────────         │
│                                                        │
│ [10:10] AI Agent → Supplier B:                       │
│ "Your offer is competitive. Can you improve?        │
│  Can you do ₹5.00/unit for 100 units?"              │
│                                                        │
│ ─────────────────────────────────────────────         │
│ ROUND 2: NEGOTIATION & COUNTER-OFFERS                │
│ ─────────────────────────────────────────────         │
│                                                        │
│ [10:15] Supplier A replies:                           │
│ "Best we can do is ₹5.30/unit.                        │
│  Cannot go lower due to cost constraints."            │
│                                                        │
│ [10:20] Supplier B replies: ✅ ACCEPTED!             │
│ "We can accept ₹5.00/unit!                           │
│  100 units × ₹5.00 = ₹500 total                      │
│  5-day delivery                                       │
│  Ready to proceed immediately."                       │
│                                                        │
│ [10:25] Supplier C replies:                           │
│ "Our minimum is ₹5.50/unit.                           │
│  Cannot match Supplier B."                            │
│                                                        │
│ ─────────────────────────────────────────────         │
│ ROUND 3: DEAL SELECTION & DECISION                    │
│ ─────────────────────────────────────────────         │
│                                                        │
│ [10:30] AI Agent - Decision Making:                  │
│ "BATNA Analysis:                                      │
│  Supplier A: ₹5.30/unit → ₹530 total                │
│  Supplier B: ₹5.00/unit → ₹500 total ⭐ BEST        │
│  Supplier C: ₹5.50/unit → ₹550 total                │
│                                                        │
│  Scoring Supplier B:                                  │
│  • Price: 100/100 pts (best)                          │
│  • Reliability: 95/100 pts (proven)                   │
│  • Lead time: 90/100 pts (5 days is good)            │
│  • MOQ flexibility: 85/100 pts                        │
│  ──────────────────────────                          │
│  TOTAL SCORE: 92.5/100                               │
│                                                        │
│  Budget check: ₹500 < ₹100,000 budget? YES ✓       │
│                                                        │
│  DECISION: ✅ ACCEPT DEAL WITH SUPPLIER B"           │
│                                                        │
│ [10:35] AI Agent → All Suppliers:                    │
│ "DEAL CLOSED with Supplier B                         │
│  Supplier A & C: Thank you for your quotes"          │
│                                                        │
│ [10:36] Purchase Order Generated:                     │
│ "PO#2045 created and ready for approval"             │
│                                                        │
│ ─────────────────────────────────────────────         │
│ FINAL RESULTS:                                         │
│ ─────────────────────────────────────────────         │
│ ✅ Negotiation Status: COMPLETE                       │
│ ✅ Winner: Supplier B                                 │
│ ✅ Final Price: ₹5.00/unit                            │
│ ✅ Total Cost: ₹500                                   │
│ ✅ Savings vs Supplier A ask: ₹30 (6%)              │
│ ✅ Savings vs initial ask (₹5.50): ₹50 (10%)       │
│ ✅ Lead Time: 5 days                                  │
│ ✅ Rounds: 3                                          │
│ ✅ Duration: 1h 45m (vs 2-3 days manual)            │
│ ✅ Blockchain: Logged as immutable record             │
│                                                        │
│ [DOWNLOAD TRANSCRIPT] [VIEW PO] [OVERRIDE]          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"This is the actual negotiation transcript. The AI agent:

ROUND 1: Contacted 3 suppliers, asked for quotes
  └─ Supplier A: ₹5.50/unit
  └─ Supplier B: ₹5.20/unit (best price)
  └─ Supplier C: ₹5.80/unit

ROUND 2: Negotiated harder with Supplier B
  └─ Asked: 'Can you do ₹5.00?'
  └─ Supplier B: 'YES, ACCEPTED!'

ROUND 3: Made final decision
  └─ Compared all options using BATNA strategy
  └─ Checked budget: ₹500 < ₹100,000 ✓
  └─ Selected Supplier B (best score: 92.5/100)

KEY NUMBERS:
✅ Completed in 1h 45m (vs 2-3 days manually!)
✅ Saved ₹50 (10% discount from initial ask)
✅ All decisions transparent and audited
✅ Ready to log on blockchain

This is NOT a human doing the negotiation - 
it's an AI agent with persistent memory, 
using Gemini for decision-making, and LibSQL 
for conversation history."
```

**Action:**
```
Click on: [VIEW PO] 
This will show the generated Purchase Order
```

---

### 📍 Purchase Order PDF

**What you see - Generated PO:**

```
┌────────────────────────────────────────────────────────┐
│                  PURCHASE ORDER #2045                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│ FROM: AutoStock AI (Buyer)                           │
│ TO: Supplier B                                        │
│ Date: 2026-04-19                                      │
│ PO Date: 2026-04-19 10:36 UTC                         │
│                                                        │
│ ─────────────────────────────────────────────         │
│ DELIVERY DETAILS:                                      │
│ Delivery Address: Main Warehouse, WH-01               │
│ Expected Delivery: 2026-04-24 (5 days)               │
│ Terms: Net 30 payment                                 │
│ ─────────────────────────────────────────────         │
│                                                        │
│ ─────────────────────────────────────────────         │
│ LINE ITEMS:                                            │
│ ─────────────────────────────────────────────         │
│ Item #1:                                               │
│   Product: Widget X (SKU-891)                         │
│   Description: [Product specs]                        │
│   Quantity: 100 units                                 │
│   Unit Price: ₹5.00                                   │
│   Line Total: ₹500                                    │
│                                                        │
│ ─────────────────────────────────────────────         │
│ SUMMARY:                                               │
│ Subtotal: ₹500                                        │
│ Tax (18% GST): ₹90                                    │
│ TOTAL: ₹590                                           │
│                                                        │
│ ─────────────────────────────────────────────         │
│ NEGOTIATION DETAILS:                                  │
│ Negotiation ID: NEG-12                                │
│ Rounds: 3                                             │
│ Duration: 1h 45m                                      │
│ Best Alternative (Supplier A): ₹5.30/unit           │
│ Savings: ₹30 vs Supplier A, ₹50 vs initial ask      │
│                                                        │
│ ─────────────────────────────────────────────         │
│ BLOCKCHAIN COMMITMENT:                                │
│ Hash: 0xf3e2d1c0a9b8c7d6e5f4a3b2c1d0e9f8              │
│ Status: PENDING BLOCKCHAIN LOGGING                    │
│                                                        │
│ ─────────────────────────────────────────────         │
│ SIGNATURES:                                            │
│ Approved by: Admin                                    │
│ Sent to: Supplier B                                   │
│ Status: 🔄 AWAITING SUPPLIER CONFIRMATION             │
│                                                        │
│ [APPROVE & SEND] [DOWNLOAD PDF] [EDIT] [CANCEL]      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"The AI has auto-generated Purchase Order #2045.

Notice:
✓ All negotiation details embedded
✓ Savings clearly shown (₹30 vs Supplier A)
✓ Blockchain hash ready to be logged
✓ Expected delivery: 5 days (Supplier B promised)

The PO is ready to send to the supplier.
The blockchain hash will be recorded when 
the PO is finalized.

This completes the procurement negotiation!
The whole process took 1h 45m instead of 2-3 days.
Cost savings: ₹50 (10% discount)."
```

**Now show them the Blockchain:**

```
Go to: Blockchain Explorer page
URL: http://localhost:3000/blockchain/
or look for Blockchain menu
```

---

## ✅ STEP 4: BLOCKCHAIN VERIFICATION (3 minutes)

### 📍 Blockchain Explorer

**What you see:**

```
┌────────────────────────────────────────────────────────┐
│ BLOCKCHAIN EXPLORER - SUPPLY CHAIN AUDIT TRAIL        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Search: [Enter TX Hash or Order ID] [SEARCH]         │
│                                                        │
│ Network: Ethereum Sepolia Testnet                     │
│ Contract: 0x742d35Cc6634C0532925a3b844Bc9e7595f...   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ RECENT TRANSACTIONS                            ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Tx Hash          │ Event Type       │ Time      ║   │
│ ║──────────────────┼──────────────────┼────────── ║   │
│ ║ 0xa3b2c1...     │ NEGOTIATION_ACPT │ 2 min ago ║   │
│ ║ 0x7f4e3d...     │ PO_CREATED       │ 5 min ago ║   │
│ ║ 0x5d2c1b...     │ PO_SENT          │ 1 hr ago  ║   │
│ ║ 0x9f8e7d...     │ PO_RECEIVED      │ 3 hrs ago ║   │
│ ║ 0x4c3b2a...     │ INVENTORY_ADJ    │ 1 day ago ║   │
│ ║                                                 ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
```

**Action:**
```
Search for: "PO#2045" or "ORDER-PO-2045"
OR
Click on: 0xa3b2c1... (most recent NEGOTIATION_ACPT)
```

**Result - Transaction Details:**

```
┌────────────────────────────────────────────────────────┐
│ TRANSACTION DETAILS                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Reference ID:      ORDER-PO-2045                      │
│ Event Type:        NEGOTIATION_ACCEPTED               │
│ Status:            ✅ CONFIRMED (Block #18245)        │
│                                                        │
│ Document Hash:     0xf3e2d1c0a9b8c7d6e5f4a3b2...      │
│ (SHA-256 of PO + negotiation transcript)             │
│                                                        │
│ Amount:            50000 (paise)                      │
│ Submitted By:      0x742d35Cc...backend.eth          │
│ Timestamp:         2026-04-19 10:36:00 UTC           │
│ Block Number:      18245                              │
│ Block Timestamp:   2026-04-19 10:36:15 UTC           │
│ Tx Fee:            0.0012 ETH (~$2.50)               │
│                                                        │
│ Network:           Ethereum Sepolia (Testnet)         │
│ Confirmations:     ✅ 5/5 confirmed                  │
│                                                        │
│ ─────────────────────────────────────────────         │
│ VERIFICATION:                                          │
│ Hash Match Status: ✅ VERIFIED                        │
│ MongoDB record hash matches blockchain hash           │
│ Document is AUTHENTIC - NOT TAMPERED                  │
│ ─────────────────────────────────────────────         │
│                                                        │
│ [View on Etherscan] [Download PDF] [Download JSON]   │
│                                                        │
│ ─────────────────────────────────────────────         │
│ FULL TIMELINE FOR THIS PO:                            │
│ ─────────────────────────────────────────────         │
│                                                        │
│ 📅 2026-04-19 10:30 UTC:                             │
│    Event: NEGOTIATION_STARTED                         │
│    Hash: 0x3c4d5e6f...                               │
│    Block: #18243 ✅ Confirmed                        │
│                                                        │
│ 📅 2026-04-19 10:35 UTC:                             │
│    Event: NEGOTIATION_ACCEPTED                        │
│    Hash: 0xf3e2d1c0... (this one!)                   │
│    Block: #18245 ✅ Confirmed                        │
│                                                        │
│ 📅 2026-04-19 10:36 UTC:                             │
│    Event: PO_CREATED                                  │
│    Hash: 0x8d7c5b4a...                               │
│    Block: #18246 ✅ Confirmed                        │
│                                                        │
│ 📅 2026-04-19 11:00 UTC:                             │
│    Event: PO_SENT (to supplier)                       │
│    Hash: 0x5b4a3c2d...                               │
│    Block: #18248 ✅ Confirmed                        │
│                                                        │
│ 📅 2026-04-24 10:30 UTC (Expected):                  │
│    Event: PO_RECEIVED (goods arrive)                  │
│    Hash: TBD                                          │
│    Block: TBD (pending delivery)                      │
│                                                        │
│ ─────────────────────────────────────────────         │
│ WHY BLOCKCHAIN MATTERS:                               │
│ ─────────────────────────────────────────────         │
│ Without blockchain: Supplier could claim they         │
│ never received this PO or that it was different       │
│                                                        │
│ With blockchain: There's PROOF on immutable ledger    │
│ that this PO existed on this date at this time.       │
│ Can't be denied. Can't be faked.                      │
│                                                        │
│ [More Info] [How Blockchain Works]                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"This is where blockchain comes in. Every major 
supply chain event is hashed and logged on Ethereum.

For PO#2045:
✓ Negotiation start: Logged with hash
✓ Negotiation acceptance: Logged with hash
✓ PO creation: Logged with hash
✓ PO sent to supplier: Logged with hash
✓ (Future) PO received: Will be logged with hash

Each transaction costs ~0.0012 ETH (~$2.50) to record.

The hash is a digital fingerprint of the document.
If ANYONE alters the PO after logging:
- Change the supplier name
- Change the quantity
- Change the price

The hash will NO LONGER match the blockchain hash.
This detects tampering immediately!

At the warehouse dock, when goods arrive:
Scan QR code → System fetches blockchain hash
Compare with document hash → Mismatch? ALERT!

This is your tamper-proof, immutable audit trail."
```

**Now let's go to Warehouse:**

---

## ✅ STEP 5: WAREHOUSE OPTIMIZATION (3 minutes)

### 📍 Switch to Warehouse Manager

**Logout from Admin / Switch role:**
```
Click on: User menu → Switch to Warehouse Manager
OR
URL: http://localhost:3000/dashboard/warehouse/
```

**Login if needed:**
```
Email:    priya.wh@scm.dev
Password: Password123!

Alternative: amit.wh@scm.dev / Password123!
```

**Warehouse Dashboard (W01):**

```
┌────────────────────────────────────────────────────────┐
│ WAREHOUSE DASHBOARD - OPERATIONS & OPTIMIZATION       │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [Warehouse] [Inventory] [Allocations] [Transfers]     │
│                                                        │
│ SELECT WAREHOUSE: [WH-01 (Primary)] [WH-02] [WH-03]  │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ ZONE UTILIZATION (WH-01)                       ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║                                                ║   │
│ ║ Zone A (Cold Storage):                         ║   │
│ ║ ████████████████████ 92% Full                  ║   │
│ ║ Items: 245 SKUs | Cost: ₹1.2M                 ║   │
│ ║ Status: ⚠️ NEARLY AT CAPACITY                 ║   │
│ ║                                                ║   │
│ ║ Zone B (Pick Zone):                            ║   │
│ ║ ███████████████ 78% Full                       ║   │
│ ║ Items: 189 SKUs | Cost: ₹980K                 ║   │
│ ║ Status: ⏰ MONITOR                            ║   │
│ ║                                                ║   │
│ ║ Zone C (Bulk Storage):                         ║   │
│ ║ ██████████ 65% Full                            ║   │
│ ║ Items: 312 SKUs | Cost: ₹2.1M                 ║   │
│ ║ Status: ✅ OPTIMAL CAPACITY                   ║   │
│ ║                                                ║   │
│ ║ Zone D (Returns):                              ║   │
│ ║ ███████ 45% Full                               ║   │
│ ║ Items: 45 SKUs | Cost: ₹320K                  ║   │
│ ║ Status: ✅ UNDERUTILIZED                      ║   │
│ ║                                                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ OPTIMIZATION ALERT 🎯                          ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ AI Warehouse Optimization Agent has made       ║   │
│ ║ recommendations for better efficiency!         ║   │
│ ║                                                ║   │
│ ║ [VIEW RECOMMENDATIONS] →                       ║   │
│ ║                                                ║   │
│ ║ Expected Impact:                               ║   │
│ ║ • Picking speed: +18%                          ║   │
│ ║ • Zone A utilization: 92% → 65%               ║   │
│ ║ • Monthly cost savings: ₹45,000                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ PENDING ALLOCATIONS (Queue)                    ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ 3 allocations awaiting approval                ║   │
│ ║ [Alloc-089] 45 units SKU-234 → [REVIEW]      ║   │
│ ║ [Alloc-090] 120 units SKU-456 → [REVIEW]     ║   │
│ ║ [Alloc-091] 23 units SKU-789 → [REVIEW]      ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"This is the Warehouse Dashboard. The warehouse manager 
can see zone utilization at a glance.

CURRENT SITUATION:
• Zone A (Cold): 92% full - too full!
• Zone B (Pick): 78% full - at capacity
• Zone C (Bulk): 65% full - has space
• Zone D (Returns): 45% full - underutilized

PROBLEM: Fast-moving items (high-pick frequency) are 
spread across zones. Slow-moving items take up space 
in Zone A which is expensive (cold storage).

Click on: [VIEW RECOMMENDATIONS]
This will show the AI optimization suggestions."
```

**Action:**
```
Click on: [VIEW RECOMMENDATIONS]
or navigate to: /dashboard/warehouse/optimization/
```

**Optimization Recommendations Page:**

```
┌────────────────────────────────────────────────────────┐
│ WAREHOUSE OPTIMIZATION RECOMMENDATIONS                │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Analysis Date: 2026-04-19                             │
│ Analysis Period: Last 30 days                          │
│ Warehouse: WH-01                                       │
│ AI Agent: Warehouse Optimization (LangGraph)          │
│ LLM: Google Gemini 2.0 Flash                          │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ RECOMMENDATION #1 (PRIORITY: HIGH) 🔴            ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Type: Zone Reassignment                         ║   │
│ ║                                                ║   │
│ ║ MOVE slow-cold items from Zone A → Zone C      ║   │
│ ║ Items to move:                                  ║   │
│ ║   • SKU-002 (Widget Y): 2 picks/month          ║   │
│ ║   • SKU-003 (Gadget Z): 1 pick/month           ║   │
│ ║   • 20 other slow-movers                        ║   │
│ ║                                                ║   │
│ ║ Why? Save Zone A capacity for fast cold items  ║   │
│ ║                                                ║   │
│ ║ Expected Impact:                                ║   │
│ ║   Zone A: 92% → 65% utilization               ║   │
│ ║   Zone C: 65% → 78% utilization               ║   │
│ ║   Cost savings: ₹15,000/month (cold storage)   ║   │
│ ║   Effort: 2-3 hours                            ║   │
│ ║                                                ║   │
│ ║ [APPROVE] [DETAILS] [REJECT] [ASK AI MORE]    ║   │
│ ║ Status: ⏳ PENDING YOUR APPROVAL                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ RECOMMENDATION #2 (PRIORITY: HIGH) 🔴            ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Type: Product Relocation (Hot Shelf)            ║   │
│ ║                                                ║   │
│ ║ MOVE fast cold items from Zone A → Zone B      ║   │
│ ║ (create "HOT COLD SHELF" in Zone B)            ║   │
│ ║                                                ║   │
│ ║ Items to relocate:                              ║   │
│ ║   • SKU-001 (Widget X): 1200 picks/month      ║   │
│ ║   • 3 other hot items                           ║   │
│ ║                                                ║   │
│ ║ Why? High-velocity items should be in          ║   │
│ ║ pick zone for faster retrieval                 ║   │
│ ║                                                ║   │
│ ║ Expected Impact:                                ║   │
│ ║   Picking time: -12% reduction                  ║   │
│ ║   Zone B utilization: 78% → 85%                ║   │
│ ║   Throughput increase: +8%                      ║   │
│ ║   Effort: 1-2 hours                            ║   │
│ ║                                                ║   │
│ ║ [APPROVE] [DETAILS] [REJECT]                   ║   │
│ ║ Status: ⏳ PENDING YOUR APPROVAL                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ RECOMMENDATION #3 (PRIORITY: MEDIUM) 🟡         ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Type: Capacity Expansion                        ║   │
│ ║                                                ║   │
│ ║ Zone B approaching capacity. Recommend:         ║   │
│ ║   • Add 2 additional shelving units             ║   │
│ ║   • Capacity increase: +20%                     ║   │
│ ║                                                ║   │
│ ║ Cost: ₹25,000 (one-time)                        ║   │
│ ║ ROI: Prevents future bottlenecks                ║   │
│ ║                                                ║   │
│ ║ [APPROVE] [DETAILS] [REJECT]                   ║   │
│ ║ Status: ⏳ PENDING YOUR APPROVAL                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ═══════════════════════════════════════════════════   │
│ SUMMARY OF ALL RECOMMENDATIONS:                       │
│ ═══════════════════════════════════════════════════   │
│                                                        │
│ Total Recommendations: 3                              │
│ Total Cost: ₹25,000 (one-time expansion cost)        │
│ Monthly Savings: ₹45,000                              │
│ Efficiency Gain: +18% overall                         │
│ Payback Period: 0.5 months                            │
│ ROI: 216% annually                                    │
│                                                        │
│ Estimated Picking Time Improvement:                   │
│ Current average: 15 minutes per order                 │
│ After optimization: 12.3 minutes per order           │
│ Savings: 2.7 minutes per order (18%)                 │
│                                                        │
│ [APPROVE ALL] [REJECT ALL] [APPROVE SELECTIVE]      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"The AI Warehouse Optimization Agent analyzed 30 days 
of movement data and made 3 recommendations.

RECOMMENDATION 1 - Zone Reassignment:
Move 20+ slow-moving items from Zone A (cold, expensive) 
to Zone C (bulk, cheaper).
Result: Zone A goes from 92% to 65% full
Savings: ₹15,000/month (cold storage costs)

RECOMMENDATION 2 - Hot Shelf in Pick Zone:
Move fast-moving items (1200 picks/month) from Zone A 
to Zone B (pick zone).
Result: Picking time -12%, throughput +8%

RECOMMENDATION 3 - Capacity Expansion:
Zone B is getting too full. Add 2 shelving units.
Cost: ₹25,000 (one-time)
Prevents future bottlenecks

Total Monthly Savings: ₹45,000
Implementation Cost: ₹25,000
ROI: 0.5 months payback!

The warehouse manager can approve, reject, or ask for 
more details. The system tracks all approvals."
```

**Action - Approve the recommendation:**
```
Click on: [APPROVE] on Recommendation #1
Or: [APPROVE ALL]

System will create implementation tasks assigned 
to warehouse staff.
```

---

## ✅ STEP 6: SUPPLIER PORTAL (2 minutes)

### 📍 Switch to Supplier Account

**Note:** The seeded database may not have a separate "Supplier" user account.
For demo purposes, you can:

**Option 1 - View as Procurement Officer:**
```
Login with:
Email:    vikram.proc@scm.dev
Password: Password123!
And navigate to: Supplier Portal or Negotiations section
```

**Option 2 - Set up a Supplier Account:**
```
You may need to create a supplier account in the system
Or use a procurement officer account to view incoming orders
```

**Supplier Dashboard (V01):**

```
┌────────────────────────────────────────────────────────┐
│ SUPPLIER DASHBOARD - VENDOR PORTAL                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Welcome, Supplier B!                                   │
│                                                        │
│ [Dashboard] [Catalog] [Orders] [Negotiations] [Perf]  │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ YOUR METRICS                                   ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ Pending Orders: 5                              ║   │
│ ║ Response Time: 2.3 hours avg                   ║   │
│ ║ Active Negotiations: 2                         ║   │
│ ║ Reliability Score: 96% (Excellent!)            ║   │
│ ║ On-Time Delivery Rate: 98%                     ║   │
│ ║ Quality Score: 94%                             ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ INCOMING ORDERS (Awaiting Confirmation)        ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║                                                ║   │
│ ║ PO#2045 - NEWLY ARRIVED! 🆕                   ║   │
│ ║ ├─ Items: 100 units of Widget X (SKU-891)    ║   │
│ ║ ├─ Negotiated Price: ₹5.00/unit (you agreed!)║   │
│ ║ ├─ Total: ₹500 (+ ₹90 GST = ₹590)            ║   │
│ ║ ├─ Delivery Expected: 2026-04-24              ║   │
│ ║ ├─ Terms: Net 30 payment                       ║   │
│ ║ ├─ Status: ⏳ Awaiting your confirmation      ║   │
│ ║ └─ [ACCEPT] [REJECT] [REQUEST CHANGES]       ║   │
│ ║                                                ║   │
│ ║ PO#2043 (From yesterday)                       ║   │
│ ║ ├─ Items: 50 units Product Y                   ║   │
│ ║ ├─ Status: ✅ ACCEPTED (shipping tomorrow)    ║   │
│ ║                                                ║   │
│ ║ PO#2040 (From 3 days ago)                      ║   │
│ ║ ├─ Items: 200 units Product Z                  ║   │
│ ║ ├─ Status: 🚚 SHIPPED (in transit)            ║   │
│ ║                                                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ ACTIVE NEGOTIATIONS                            ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║                                                ║   │
│ ║ Negotiation NEG-12 (PO#2045) ✅ COMPLETED    ║   │
│ ║ Status: You accepted ₹5.00/unit offer        ║   │
│ ║ [VIEW DETAILS] [VIEW TRANSCRIPT]              ║   │
│ ║                                                ║   │
│ ║ Negotiation NEG-11 (from other buyer)          ║   │
│ ║ Status: ⏳ Awaiting your counter-offer       ║   │
│ ║ Current offer: They want 50% discount         ║   │
│ ║ [RESPOND] [DECLINE] [REQUEST DETAILS]         ║   │
│ ║                                                ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
│ ╔════════════════════════════════════════════════╗   │
│ ║ YOUR CATALOG (5 Products)                      ║   │
│ ╠════════════════════════════════════════════════╣   │
│ ║ SKU-001 │ Widget X    │ ₹5.00  │ Stock: 500  ║   │
│ ║ SKU-002 │ Widget Y    │ ₹3.50  │ Stock: 800  ║   │
│ ║ SKU-003 │ Gadget Z    │ ₹8.00  │ Stock: 200  ║   │
│ ║                                                ║   │
│ ║ [BULK UPLOAD CSV] [ADD PRODUCT] [EDIT]        ║   │
│ ╚════════════════════════════════════════════════╝   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**What to say:**
```
"Now we're viewing the Supplier Portal. The supplier 
can see:

1️⃣ METRICS:
   - Reliability Score: 96% (very good!)
   - On-Time Delivery: 98%
   - Quality Score: 94%

This data helps them understand how they're ranked 
against other suppliers.

2️⃣ INCOMING ORDERS:
   PO#2045 just arrived! (the one we just negotiated)
   - 100 units of Widget X
   - Price: ₹5.00/unit (they agreed to this in NEG-12)
   - They need to click [ACCEPT] to confirm

3️⃣ ACTIVE NEGOTIATIONS:
   The supplier can see conversations from the AI buyer
   and respond to counter-offers.

4️⃣ THEIR CATALOG:
   They can manage their product inventory and pricing.

This is the multi-stakeholder experience. Every role 
has visibility into their part of the supply chain."
```

**Show the Negotiation Details:**

```
Click on: PO#2045 [VIEW DETAILS]
or Negotiation NEG-12 [VIEW TRANSCRIPT]
```

**This shows the supplier the same negotiation transcript 
they can see what the AI discussed and agreed to.**

---

## ✅ STEP 7: SUMMARY & CLOSING (Rest of time)

### 📍 Bring It All Together

**What you've shown:**

```
✅ ADMIN DASHBOARD (System overview)
   └─ All KPIs, activities, and management functions

✅ RETAILER DASHBOARD (Procurement view)
   └─ Demand forecast showing stockout risk
   └─ Auto-replenishment triggered the negotiation

✅ NEGOTIATION DETAILS (AI agent in action)
   └─ 3 suppliers contacted simultaneously
   └─ AI negotiated 3 rounds
   └─ Best deal selected: Supplier B at ₹5.00/unit
   └─ Savings: ₹50 (10% discount)
   └─ Time: 1h 45m (vs 2-3 days manually)

✅ PURCHASE ORDER (Auto-generated)
   └─ Complete with negotiation details
   └─ Ready for blockchain logging

✅ BLOCKCHAIN EXPLORER (Immutable audit trail)
   └─ Every transaction hashed on Ethereum
   └─ Complete timeline of PO from creation to receipt
   └─ Tamper detection enabled

✅ WAREHOUSE DASHBOARD (Operations view)
   └─ Zone utilization metrics
   └─ AI optimization recommendations
   └─ Cost savings calculations

✅ SUPPLIER PORTAL (Vendor view)
   └─ See incoming orders
   └─ Accept/reject POs
   └─ Manage negotiation responses
   └─ Track their own performance
```

---

## 🎯 Key Talking Points During Demo

### During Admin Dashboard:
```
"Admin has complete oversight of the system. Can:
- Monitor all negotiations
- Override AI decisions
- Configure system settings
- View all analytics
- Manage users and access"
```

### During Retailer Dashboard:
```
"The system is PROACTIVE, not reactive:
- Predicts demand automatically
- Alerts when stock is low
- Initiates negotiations without human intervention
- Generates POs automatically
- All in the background while you focus on business"
```

### During Negotiation Details:
```
"This is the SECRET SAUCE - multi-round negotiation:
- Not just static RFQ
- Real conversation with suppliers
- Gemini AI understands context
- Considers multiple factors (price, reliability, speed)
- Uses BATNA strategy (Best Alternative to Negotiated Agr)
- Enforces budget constraints
- Learns from past negotiations"
```

### During Blockchain:
```
"Blockchain solves a REAL PROBLEM:
- How do you prove this PO is authentic?
- How do you prevent tampering after the fact?
- Immutable record on Ethereum
- QR code verification at warehouse
- Hash mismatch = fraud alert
- Compliance-ready for audits"
```

### During Warehouse Optimization:
```
"AI isn't just for negotiations:
- Analyzes 30 days of warehouse data
- Finds inefficiencies humans miss
- Recommends specific relocations
- Shows exact cost impact
- Helps warehouse managers make data-driven decisions
- Can save ₹45,000/month with right optimization"
```

### During Supplier Portal:
```
"Everyone is connected:
- Suppliers see their orders immediately
- Can respond to negotiations
- Can track their own performance
- Increases transparency
- Better supplier relationships
- Real-time communication"
```

---

## ❓ Questions You Might Get

**Q: "How does the AI know it made a good deal?"**
```
A: We use a scoring system called BATNA analysis:
   • Price score (weight: 40%)
   • Supplier reliability (weight: 25%)
   • Lead time (weight: 20%)
   • Flexibility (MOQ, terms) (weight: 15%)
   
   Supplier with highest score wins.
   But price + reliability combo matters most.
```

**Q: "Can the AI negotiate in real-time?"**
```
A: The negotiation we showed took 1h 45m.
   That's because suppliers take time to respond.
   The AI sends messages, waits for replies,
   analyzes them, and counter-offers.
   
   It's continuous monitoring - no human needed!
```

**Q: "What if a supplier rejects everything?"**
```
A: The AI escalates to the procurement officer:
   "Negotiation failed. Best offer was ₹5.50/unit.
    This exceeds your budget of ₹5.00.
    Please approve higher budget or reject order."
   
   Human always has final say on decisions.
```

**Q: "How secure is the blockchain?"**
```
A: Ethereum Sepolia is the testnet version.
   We use testnet because it's free (for demo).
   
   In production, we'd use mainnet Ethereum,
   which has:
   - Thousands of nodes validating
   - 51% attack infeasible
   - Immutable records (can't be altered)
   
   Cost: ~$2-5 per transaction (main chain)
```

**Q: "Can suppliers see other suppliers' quotes?"**
```
A: NO - confidential information is kept secret.
   Each supplier only knows their own offer,
   not competitors' prices.
   
   This is realistic - you wouldn't share 
   Supplier A's quote with Supplier B.
```

---

## 📝 Demo Checklist (Before Presenting)

- [ ] Frontend environment running locally or deployed
- [ ] Test all 4 accounts login works
- [ ] Check if sample data (orders, negotiatio ns) is in database
- [ ] Verify blockchain explorer page loads
- [ ] Take screenshots of key pages for backup
- [ ] Have a terminal ready to show backend is running
- [ ] Have MongoDB connection visible (optional)
- [ ] Practice switching between roles smoothly
- [ ] Have talking points written on paper/cards
- [ ] Timing: Do a dry run to stay within 20-25 min
- [ ] Backup URL if using local deployment

---

## ⏱️ Time Breakdown

```
STEP 1 - Admin Dashboard:           2 min
STEP 2 - Retailer Dashboard:        4 min
STEP 3 - Negotiation Details:       4 min
STEP 4 - Blockchain Verification:   3 min
STEP 5 - Warehouse Optimization:    3 min
STEP 6 - Supplier Portal:           2 min
────────────────────────────────
TOTAL:                             18 min

Remaining: 7-12 min for Q&A and discussion
```

---

## 🎬 You're Ready!

Follow this guide step-by-step, stay on timing, and your presentation will be impressive and complete!

Good luck! 🚀

# Agent Data

Detailed reference for all AI agents in the StationeryChain supply chain system.

---

## Agent Overview

| Agent | Location | Framework | LLM | Trigger |
|---|---|---|---|---|
| Forecast Agent | `backend/src/ai/forecast-agent/` | LangGraph | Google Gemini | HTTP + node-cron |
| Warehouse Optimization Agent | `backend/src/ai/warehouse-optimization-agent/` | LangGraph | Google Gemini | HTTP (on-demand) |
| Mastra Agents | `ai/src/` | Mastra 1.4.0 | Configurable | Standalone process |

---

## Forecast Agent

### Purpose

Generates **7-day demand forecasts** for each product-warehouse combination. Uses historical inventory transaction data to predict daily demand, confidence intervals, reorder quantities, and optimal order dates. Results are persisted to MongoDB and used by the replenishment workflow.

### Location

```
backend/src/ai/forecast-agent/
├── agent.ts        # LangGraph StateGraph definition
├── tools.ts        # MongoDB query tools
├── scheduler.ts    # node-cron scheduler
└── types.ts        # Input/output TypeScript types
```

### API Endpoint

```
POST /api/forecast
GET  /api/forecast/predictions
```

### Input Schema

```typescript
interface ForecastInput {
  productId: string;          // MongoDB ObjectId — which product to forecast
  warehouseId: string;        // MongoDB ObjectId — which warehouse's stock to use
  horizonDays?: number;       // Forecast window (default: 7)
}
```

### Output Schema

Output is stored in the `DemandForecast` MongoDB collection and returned from `GET /api/forecast/predictions`.

```typescript
interface ForecastOutput {
  product: string;              // ObjectId ref
  warehouse: string;            // ObjectId ref
  forecastedAt: Date;
  forecastHorizonDays: number;  // default: 7
  dailyForecasts: Array<{
    date: Date;
    predictedDemand: number;    // units expected to be consumed
    confidenceLow: number;      // lower bound of prediction interval
    confidenceHigh: number;     // upper bound of prediction interval
    actualDemand?: number;      // filled retroactively for accuracy tracking
    mape?: number;              // mean absolute percentage error per day
  }>;
  totalPredicted7Day: number;   // sum of all daily predictions
  overallMape: number;          // model accuracy metric
  modelVersion: string;         // e.g. "arima-v1"
  recommendedReorderQty: number;
  recommendedOrderDate: Date;
}
```

### LangGraph Nodes

```
State: { productId, warehouseId, historicalData, productMeta, forecastResult }

┌─────────────────────┐
│  fetchHistoricalData│  Queries inventory transactions (90 days)
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  fetchProductMeta   │  Gets product reorderPoint, safetyStock, leadTimeDays
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  generateForecast   │  LLM call: Gemini generates structured forecast JSON
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  calcConfidence     │  Statistical post-processing on LLM output
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  persistForecast    │  Upsert DemandForecast document in MongoDB
└──────────┬──────────┘
           │
          END
```

### Tools Available to Agent

```typescript
// Tool 1: Query inventory transactions
queryInventoryTransactions(productId: string, warehouseId: string, days: number)
// → Returns array of { type, quantity, timestamp } for the last N days

// Tool 2: Get product metadata
getProductMetadata(productId: string)
// → Returns { reorderPoint, safetyStock, reorderQty, leadTimeDays, unitPrice }
```

### Gemini Prompt Pattern

The agent sends historical transaction data as structured context and asks Gemini to produce a JSON forecast:

```
Given the following 90-day inventory transaction history for a stationery product:
<transactions JSON>

Product parameters:
- Reorder Point: {reorderPoint} units
- Safety Stock: {safetyStock} units
- Lead Time: {leadTimeDays} days

Generate a 7-day demand forecast with:
1. Daily predicted demand (units)
2. Confidence interval (low, high)
3. Recommended reorder quantity
4. Recommended order date (considering lead time)

Respond in JSON format only.
```

### Scheduler (`ForecastScheduler`)

```typescript
// backend/src/ai/forecast-agent/scheduler.ts

class ForecastScheduler {
  static start(): void {
    cron.schedule('0 2 * * *', async () => {
      // Runs at 02:00 every night
      const products = await Product.find({ isActive: true });
      const warehouses = await Warehouse.find({ isActive: true });
      for (const product of products) {
        for (const warehouse of warehouses) {
          await forecastAgent.run({ productId, warehouseId });
        }
      }
    });
  }

  static stop(): void {
    // Called on SIGTERM/SIGINT
  }
}
```

The scheduler is started in `backend/src/index.ts` after the server starts:
```typescript
ForecastScheduler.start();
```

### MongoDB Collection: `demandforecasts`

| Field | Type | Description |
|---|---|---|
| `product` | ObjectId | Ref to Products collection |
| `warehouse` | ObjectId | Ref to Warehouses collection |
| `forecastedAt` | Date | When the forecast was generated |
| `forecastHorizonDays` | Number | Default 7 |
| `dailyForecasts` | Array | Per-day predictions |
| `totalPredicted7Day` | Number | Sum of all daily predictions |
| `overallMape` | Number | Model accuracy |
| `modelVersion` | String | "arima-v1" |
| `recommendedReorderQty` | Number | How much to order |
| `recommendedOrderDate` | Date | When to place order |

---

## Warehouse Optimization Agent

### Purpose

Analyzes warehouse zone utilization and product movement patterns to generate **actionable optimization recommendations**. Helps reduce picking time, lower storage costs, and improve warehouse throughput.

### Location

```
backend/src/ai/warehouse-optimization-agent/
├── agent.ts        # LangGraph StateGraph definition
├── tools.ts        # Warehouse + inventory query tools
└── types.ts        # Input/output types
```

### API Endpoint

```
POST /api/warehouse-optimization/analyze
```

Requires authentication. Accessible by: `admin`, `warehouse_manager`.

### Input Schema

```typescript
interface OptimizationInput {
  warehouseId: string;            // Which warehouse to analyze
  analysisDepthDays?: number;     // How far back to look (default: 30)
}
```

### Output Schema

```typescript
interface OptimizationOutput {
  warehouseId: string;
  analysisDate: Date;
  currentUtilization: number;           // % of capacity used
  zoneBreakdown: Array<{
    zoneCode: string;
    type: string;
    utilization: number;
    movementFrequency: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    type: 'zone_reassignment' | 'product_relocation' | 'capacity_expansion' | 'layout_change';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImpact: string;
    affectedZones?: string[];
    affectedProducts?: string[];
    implementationSteps?: string[];
  }>;
  estimatedCostSavings: number;         // USD
  estimatedEfficiencyGain: number;      // percentage improvement
}
```

### LangGraph Nodes

```
State: { warehouseId, warehouseData, movementData, recommendations }

┌──────────────────────┐
│  fetchWarehouseData  │  Gets warehouse zones, capacity, current inventory
└───────────┬──────────┘
            │
┌───────────▼──────────┐
│ fetchMovementPatterns│  Aggregates inventory transactions (30 days)
└───────────┬──────────┘
            │
┌───────────▼──────────┐
│  analyzeUtilization  │  Computes zone utilization percentages
└───────────┬──────────┘
            │
┌───────────▼──────────┐
│  generateRecs (LLM)  │  Gemini generates optimization recommendations
└───────────┬──────────┘
            │
           END (returns recommendations — not persisted)
```

### Tools Available to Agent

```typescript
// Tool 1: Get warehouse with zones and inventory
getWarehouseStats(warehouseId: string)
// → { warehouse, zones[], inventoryByZone[], utilizationPercent }

// Tool 2: Get movement frequency per product per zone
getInventoryMovements(warehouseId: string, days: number)
// → Array<{ productId, zone, transactionCount, totalQuantity, avgFrequency }>
```

### Key Difference from Forecast Agent

- **Forecast Agent**: Persists results to MongoDB, runs on schedule, produces quantitative predictions
- **Optimization Agent**: Returns results directly in HTTP response, runs on-demand only, produces qualitative recommendations

---

## Mastra Agents (`ai/` module)

The root-level `ai/` module is a **standalone Mastra process** separate from the Express server.

### What is Mastra?

Mastra is a TypeScript AI agent framework that provides:
- **Declarative agent definitions** with tools and instructions
- **Persistent memory** via LibSQL (conversation history survives restarts)
- **Built-in evaluations** for testing agent behavior
- **Observability** with structured logs and traces
- **Dev server** (`mastra dev`) with hot reload and a visual UI

### Running Mastra

```bash
cd ai
pnpm install       # requires Node.js >= 22.13.0
pnpm dev           # starts mastra dev server (includes UI at localhost:4111)
pnpm build         # compile for production
pnpm start         # run production build
```

### Mastra Dependencies

| Package | Purpose |
|---|---|
| `@mastra/core` 1.4.0 | Core agent framework |
| `@mastra/libsql` | Persistent memory (LibSQL/SQLite) |
| `@mastra/memory` | Conversation memory management |
| `@mastra/evals` | Agent evaluation harness |
| `@mastra/observability` | Structured logging and tracing |
| `@mastra/loggers` | Log formatters |
| `mastra` (dev) | CLI for dev/build/start |

### Agent Definition Pattern (Mastra)

```typescript
import { Agent } from '@mastra/core';

const forecastAgent = new Agent({
  name: 'ForecastAgent',
  instructions: `You are a supply chain demand forecasting specialist...`,
  model: {
    provider: 'GOOGLE',
    name: 'gemini-pro',
    toolChoice: 'auto',
  },
  tools: { queryInventory, getProductData },
});
```

### Memory Architecture

Mastra agents have persistent memory via LibSQL:

```
Conversation turn → stored in LibSQL → retrieved on next turn
```

This means Mastra agents can maintain context across multiple requests (e.g., "use the same warehouse I analyzed last time"). LangGraph agents in the backend are stateless per-request.

---

## LangSmith Monitoring (Optional)

Enable distributed tracing for LangGraph agent runs:

```env
# backend/.env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your-key
LANGCHAIN_PROJECT=supply-chain-forecasting
```

What gets traced:
- Each LangGraph node execution with input/output
- LLM calls (prompt, response, token usage, latency)
- Tool invocations (MongoDB queries)
- Full agent run timeline

Access traces at [smith.langchain.com](https://smith.langchain.com).

---

## Google Gemini Configuration

```env
GEMINI_API_KEY=AIza...   # backend/.env
```

Model used: `gemini-pro` (via `@langchain/google-genai`)

Typical settings:
```typescript
const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-pro',
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.1,      // low — for consistent, deterministic forecasts
  maxOutputTokens: 2048,
});
```

Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey). The free tier supports sufficient requests for development and light production use.

---

## Agent → Backend Data Flow

```
                    Backend Express Server
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   Forecast Agent    Optimization Agent   Other Modules
          │                 │
          ▼                 ▼
   [LangGraph]         [LangGraph]
          │                 │
          ▼                 ▼
   [Gemini LLM]        [Gemini LLM]
          │
          ▼
   DemandForecast      (response only,
   MongoDB collection   not persisted)
          │
          ▼
   Notification
   Module (alerts)
          │
          ▼
   PurchaseOrder
   (auto-replenishment trigger)
```

---

## Replenishment Trigger Flow

When the Forecast Agent runs and the `recommendedOrderDate` is approaching:

1. Forecast Agent saves `DemandForecast` with `recommendedReorderQty` and `recommendedOrderDate`
2. Inventory module detects `availableStock ≤ reorderPoint` (checked on each stock movement)
3. Sets `replenishmentTriggered: true` on the inventory document
4. Creates a `PurchaseOrder` with `triggeredBy: 'auto_replenishment'`
5. Creates a `Notification` of type `reorder_triggered` for relevant users
6. Optionally logs a `BlockchainEvent` of type `po_created`

---

## Dev Tools Dashboard

The frontend has an agent monitoring page at:

```
/dashboard/dev-tools/agent-monitor
```

This page shows:
- Recent forecast agent runs and their outputs
- Agent execution logs
- Forecast accuracy (MAPE) over time
- Optimization recommendation history

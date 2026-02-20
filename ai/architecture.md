# AI Module Architecture

## Overview

The AI layer of this project is split across two locations:

1. **`backend/src/ai/`** — AI agents embedded directly in the backend server. These are triggered by HTTP routes and by the `ForecastScheduler` (node-cron). They use **LangChain + LangGraph** with **Google Gemini** as the LLM.

2. **`ai/`** (root-level module) — A standalone **Mastra** AI framework project. This is a separate Node.js process intended for agent orchestration, memory persistence, evaluations, and observability. It communicates with the backend independently.

---

## Directory Structure

```
ai/                                     # Standalone Mastra AI module
├── src/
│   └── (Mastra agent definitions)
├── package.json                        # Node >=22.13.0 required, ESM
└── pnpm-lock.yaml

backend/src/ai/                         # Embedded LangGraph agents
├── forecast-agent/                     # Demand forecasting
│   ├── agent.ts                        # LangGraph graph definition
│   ├── tools.ts                        # Agent tools (DB queries)
│   ├── scheduler.ts                    # node-cron scheduler
│   └── types.ts                        # Input/output types
└── warehouse-optimization-agent/       # Warehouse optimization
    ├── agent.ts                        # LangGraph graph definition
    ├── tools.ts                        # Optimization tools
    └── types.ts                        # Input/output types
```

---

## Embedded Backend Agents (LangGraph + Gemini)

These agents live inside the Express server and are invoked via API routes or the scheduler.

### Forecast Agent

**Route:** `POST /api/forecast`
**Route:** `GET /api/forecast/predictions`
**Scheduler:** `ForecastScheduler` — runs automatically via node-cron

**Purpose:** Analyzes historical inventory transaction data and product sales patterns to generate 7-day demand forecasts with daily predictions and confidence intervals.

**Architecture:**

```
ForecastScheduler (node-cron)
        │
        ▼
POST /api/forecast
        │
        ▼
[Forecast Agent — LangGraph StateGraph]
        │
        ├── Node: fetchHistoricalData
        │     └── Tool: queryInventoryTransactions(productId, warehouseId, days=90)
        │
        ├── Node: analyzeSeasonality
        │     └── Tool: getProductMetadata(productId)
        │
        ├── Node: generateForecast
        │     └── LLM: Google Gemini (via @langchain/google-genai)
        │           └── Prompt: structured demand prediction
        │
        ├── Node: calculateConfidenceIntervals
        │     └── Statistical calculations on LLM output
        │
        └── Node: persistForecast
              └── Saves DemandForecast document to MongoDB
```

**Input:**
```typescript
{
  productId: string;        // MongoDB ObjectId
  warehouseId: string;      // MongoDB ObjectId
  horizonDays?: number;     // default: 7
}
```

**Output (stored in `DemandForecast` collection):**
```typescript
{
  product: ObjectId;
  warehouse: ObjectId;
  forecastedAt: Date;
  forecastHorizonDays: number;
  dailyForecasts: Array<{
    date: Date;
    predictedDemand: number;
    confidenceLow: number;
    confidenceHigh: number;
    actualDemand?: number;   // filled in later for MAPE tracking
    mape?: number;
  }>;
  totalPredicted7Day: number;
  overallMape: number;
  modelVersion: string;      // e.g. "arima-v1"
  recommendedReorderQty: number;
  recommendedOrderDate: Date;
}
```

**Scheduler (`ForecastScheduler`):**
- Uses `node-cron` to run on a configurable schedule
- On each tick: queries all active products, triggers `forecastAgent.run()` per product
- Started via `ForecastScheduler.start()` in `index.ts`
- Stopped gracefully via `ForecastScheduler.stop()` on SIGTERM/SIGINT

---

### Warehouse Optimization Agent

**Route:** `POST /api/warehouse-optimization/analyze`

**Purpose:** Analyzes warehouse zone utilization, inventory placement, and movement patterns. Produces recommendations to reduce picking time, reduce storage costs, and improve throughput.

**Architecture:**

```
POST /api/warehouse-optimization/analyze
        │
        ▼
[Optimization Agent — LangGraph StateGraph]
        │
        ├── Node: fetchWarehouseData
        │     └── Tool: getWarehouseStats(warehouseId)
        │         └── Queries: Warehouse zones, capacity, inventory by zone
        │
        ├── Node: fetchMovementPatterns
        │     └── Tool: getInventoryMovements(warehouseId, days=30)
        │         └── Aggregates transaction history
        │
        ├── Node: analyzeOptimization
        │     └── LLM: Google Gemini
        │           └── Analyzes zone utilization + movement frequency
        │
        └── Node: generateRecommendations
              └── Returns structured optimization plan
```

**Input:**
```typescript
{
  warehouseId: string;
  analysisDepthDays?: number;  // default: 30
}
```

**Output:**
```typescript
{
  warehouseId: string;
  analysisDate: Date;
  currentUtilization: number;       // percentage
  recommendations: Array<{
    type: 'zone_reassignment' | 'product_relocation' | 'capacity_expansion';
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedImpact: string;
    affectedZones?: string[];
    affectedProducts?: string[];
  }>;
  estimatedCostSavings: number;
  estimatedEfficiencyGain: number;  // percentage
}
```

---

## LangGraph Graph Pattern

Both agents use the same LangGraph `StateGraph` pattern:

```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-pro',
  apiKey: process.env.GEMINI_API_KEY,
});

const graph = new StateGraph({ channels: stateSchema })
  .addNode('fetchData', fetchDataNode)
  .addNode('analyze', analyzeNode)
  .addNode('generate', generateNode)
  .addNode('persist', persistNode)
  .addEdge('fetchData', 'analyze')
  .addEdge('analyze', 'generate')
  .addEdge('generate', 'persist')
  .addEdge('persist', END);

const app = graph.compile();
```

State flows through nodes sequentially. Each node receives the full state and returns updates.

---

## Standalone Mastra Module (`ai/`)

The root-level `ai/` directory is a **separate Node.js ESM project** using the **Mastra AI framework**. It runs as its own process.

### What Mastra Provides

| Feature | Implementation |
|---|---|
| Agent definitions | Declarative agent config with tools and memory |
| Memory persistence | `@mastra/libsql` — LibSQL (SQLite-compatible) for conversation history |
| Observability | `@mastra/observability` — structured logging and tracing |
| Evaluations | `@mastra/evals` — automated agent evaluation harness |
| Logging | `@mastra/loggers` — structured log outputs |
| Dev server | `mastra dev` — hot-reload development environment |

### Running the Mastra Module

```bash
cd ai
pnpm install          # Node >=22.13.0 required
pnpm dev              # mastra dev — starts dev server with hot reload
pnpm build            # mastra build — compile for production
pnpm start            # mastra start — run compiled build
```

### Mastra vs LangGraph

| | LangGraph (in `backend/src/ai/`) | Mastra (in `ai/`) |
|---|---|---|
| Purpose | Deterministic agentic workflows | Higher-level agent orchestration |
| Invocation | HTTP route / cron | Standalone process |
| Memory | MongoDB (via backend) | LibSQL (dedicated memory DB) |
| State | Stateless per request | Persistent conversation memory |
| Observability | LangSmith (optional) | Built-in Mastra observability |

---

## LangSmith Integration (Optional)

LangChain tracing can be enabled for debugging and monitoring LangGraph agent runs:

```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__your-key
LANGCHAIN_PROJECT=supply-chain-forecasting
```

When enabled, every LangGraph node execution — including LLM calls, tool invocations, and state transitions — is logged to LangSmith for inspection.

---

## Google Gemini Integration

Both backend agents use `@langchain/google-genai` to call the Gemini API:

```typescript
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-pro',
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.1,      // low temperature for consistent forecasts
});
```

The `GEMINI_API_KEY` is required for AI features. Without it, forecast and optimization routes will fail. The key is free to obtain from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Data Flow: Forecast Scheduler

```
node-cron tick (scheduled interval)
        │
        ▼
Query: all active products from MongoDB
        │
        ▼
For each product × warehouse combination:
        │
        ├── Fetch 90 days of inventory transactions
        ├── Fetch product metadata (reorderPoint, leadTime, safetyStock)
        ├── Call Gemini with historical data
        ├── Parse structured forecast output
        ├── Calculate confidence intervals
        └── Upsert DemandForecast document in MongoDB
                │
                ▼
        Notify interested users (Notification module)
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Graph Orchestration | LangGraph 1.1.4 (`@langchain/langgraph`) |
| LLM Framework | LangChain 1.2.24 + `@langchain/core` |
| LLM Provider | Google Gemini (`@langchain/google-genai` 2.1.18) |
| Agent Framework | Mastra 1.4.0 (standalone module) |
| Memory Persistence | LibSQL (`@mastra/libsql`) |
| Observability | Mastra Observability + LangSmith (optional) |
| Scheduling | node-cron 4.2.1 |
| Runtime | Node.js 22+ (Mastra), Node.js 20+ (backend) |
| Language | TypeScript (ESM for Mastra, CommonJS for backend) |

# AUTOSTOCK AI - Major Project

## Purpose
AUTOSTOCK AI is an enterprise-grade supply chain optimization platform that uses AI agents to automate procurement, inventory management, warehouse optimization, and demand forecasting.

## Tech Stack
- **Frontend**: Next.js 16 with React 19, TypeScript, TailwindCSS, Radix UI, TanStack React Query
- **Backend**: Express.js 5, TypeScript, MongoDB 9, Mongoose, Node Cron
- **AI/Agents**: Mastra, LangChain, Google Generative AI
- **Blockchain**: Ethereum (Sepolia testnet) with ethers.js for immutable PO logging
- **Package Manager**: pnpm (monorepo structure)

## Project Structure
```
major-project/
├── frontend/          # Next.js app (frontend)
├── backend/           # Express API
├── ai/               # Mastra-based AI agents
├── blockchain/       # Blockchain integration
└── docs/            # Documentation and diagrams
```

## Key Modules
### Backend (/backend/src/modules)
- **purchase-order** - Full CRUD + workflow endpoints for POs
- **dashboard** - Admin, warehouse, procurement, and agent stats
- **agents** - Agent run tracking
- **forecast** - Demand forecasting models
- **warehouse-optimization** - Optimization recommendations
- **inventory** - Stock management
- **negotiation** - Negotiation session history
- **product, supplier, user, warehouse** - Entity management

### Frontend (/frontend/src)
- **dashboard/** - Multi-role dashboards (admin, warehouse, procurement, supplier)
- **components/** - Reusable UI components (tables, forms, cards)
- **lib/api/services/** - API service layer (TypeScript)
- **hooks/queries/** - React Query hooks for data fetching
- **types/** - TypeScript type definitions

## Current Issues
1. **Procurement pages showing static data** - Cost Analysis page not fetching real procurement stats
2. **PO create functionality broken** - Create PO button doesn't navigate or open form
3. **PO detail page clicks don't work** - Recent PO cards should navigate to detail page
4. **Missing API integrations** - Several pages don't call backend endpoints
5. **Incomplete hooks** - Some React Query hooks missing implementation

# Frontend MVP Source of Truth Plan

Version: 1.0  
Date: February 14, 2026  
Owner: Frontend Team  
Status: Ready for execution

## 1. Purpose

This document is the single source of truth for frontend implementation of the MVP defined in `backend/MVP_PRD_UPDATED.md`.

It defines:
- exact frontend scope
- screen count and route map
- module boundaries for maintainability
- API contract expectations
- phased implementation plan and task backlog

## 2. Source Inputs

Primary PRD references:
- User roles and role features: `backend/MVP_PRD_UPDATED.md:60`
- Core features (auth, catalog, forecasting, replenishment, blockchain, notifications, AI negotiation, warehouse optimization, dashboards, analytics): `backend/MVP_PRD_UPDATED.md:148`
- Role-based dashboard requirements: `backend/MVP_PRD_UPDATED.md:569`
- Happy-path workflows: `backend/MVP_PRD_UPDATED.md:640`
- MVP API endpoints: `backend/MVP_PRD_UPDATED.md:795`
- Success and acceptance criteria: `backend/MVP_PRD_UPDATED.md:1032`, `backend/MVP_PRD_UPDATED.md:1171`

Current project baseline:
- Current app routes: only landing page exists (`frontend/src/app/page.tsx:12`)
- App shell exists (reusable): `frontend/src/components/dashboard/dashboard-layout.tsx:15`
- Current sidebar role model does not match PRD roles: `frontend/src/components/dashboard/sidebar.tsx:30`
- Existing API client endpoint model does not match PRD endpoint list: `frontend/src/lib/api.ts:135`
- Backend route readiness currently minimal (example route only): `backend/src/index.ts:14`

## 3. Scope Boundary

In scope for frontend MVP:
- role-based web app for 4 roles: admin, supplier, warehouse manager, retailer
- dashboards and operational views per role
- authentication and RBAC guards
- catalog, order, negotiation, warehouse optimization, notifications, blockchain visibility, analytics views
- export flows (CSV/PDF trigger)

Out of scope for frontend MVP (PRD exclusions):
- OAuth2
- QR and GPS delivery tracking
- advanced predictive analytics beyond listed MVP metrics
- native mobile app
- customer portal
- voice/chat interfaces

Reference: `backend/MVP_PRD_UPDATED.md:1060`

## 4. Critical Alignment Decisions (must be locked before implementation)

1. Role taxonomy mismatch
- PRD role: `retailer`
- backend model role: `procurement_officer` in `backend/src/modules/user/model.ts:6`
- decision required: treat `procurement_officer` as retailer UI role in MVP

2. Dashboard role mismatch in current frontend
- existing roles: `scm`, `finance`, `admin`, `inventory`, `ai-agent`, `vendor` (`frontend/src/components/dashboard/sidebar.tsx:30`)
- decision required: replace with PRD roles only

3. API contract mismatch
- current frontend API methods target non-PRD endpoints (`frontend/src/lib/api.ts:143`)
- decision required: refactor client to PRD endpoint contracts (`backend/MVP_PRD_UPDATED.md:795`)

## 5. Screen Inventory and Count

Counting rule:
- "Screen" means route-level page or major workflow page with unique business logic
- drawers/modals are not counted as separate screens

Total screens required for MVP frontend: **32**

Breakdown:
- Shared platform screens: 6
- Admin screens: 7
- Supplier screens: 6
- Warehouse manager screens: 7
- Retailer screens: 6

### 5.1 Shared Platform Screens (6)

1. `S01` Login (`/auth/login`)
2. `S02` Unauthorized or session-expired (`/auth/unauthorized`)
3. `S03` Role-based dashboard entry redirect (`/dashboard`)
4. `S04` Notifications center (`/notifications`)
5. `S05` Notification preferences (`/settings/notifications`)
6. `S06` Blockchain transaction details (`/blockchain/tx/[txHash]`)

### 5.2 Admin Screens (7)

1. `A01` Admin dashboard (`/admin/dashboard`)
2. `A02` Supplier and retailer management (`/admin/partners`)
3. `A03` Supplier detail and scorecard (`/admin/partners/[supplierId]`)
4. `A04` AI negotiation oversight and override (`/admin/negotiations`)
5. `A05` Warehouse optimization oversight and override (`/admin/warehouse-optimization`)
6. `A06` Alert configuration (`/admin/alerts`)
7. `A07` Analytics and report export (`/admin/analytics`)

### 5.3 Supplier Screens (6)

1. `V01` Supplier dashboard (`/supplier/dashboard`)
2. `V02` Catalog management (`/supplier/catalog`)
3. `V03` Catalog CSV upload workflow (`/supplier/catalog/upload`)
4. `V04` Orders queue and confirmation (`/supplier/orders`)
5. `V05` Negotiation inbox and response (`/supplier/negotiations`)
6. `V06` Performance metrics (`/supplier/performance`)

### 5.4 Warehouse Manager Screens (7)

1. `W01` Warehouse dashboard (`/warehouse/dashboard`)
2. `W02` Multi-warehouse inventory view (`/warehouse/inventory`)
3. `W03` Stock level management (`/warehouse/inventory/manage`)
4. `W04` Allocation recommendations queue (`/warehouse/allocations`)
5. `W05` Allocation review and override (`/warehouse/allocations/[allocationId]`)
6. `W06` Transfer recommendations and approvals (`/warehouse/transfers`)
7. `W07` Shipment and discrepancy operations (`/warehouse/operations`)

### 5.5 Retailer Screens (6)

1. `R01` Retailer dashboard (`/retailer/dashboard`)
2. `R02` Inventory monitoring with forecast visibility (`/retailer/inventory`)
3. `R03` Manual order creation (`/retailer/orders/new`)
4. `R04` Order history and tracking (`/retailer/orders`)
5. `R05` Auto-replenishment settings (`/retailer/replenishment`)
6. `R06` Negotiated pricing and cost savings (`/retailer/pricing-savings`)

## 6. Feature to Screen Mapping (PRD Traceability)

1. Authentication and RBAC (PRD 4.1)
- `S01`, `S02`, `S03`

2. Product catalog management (PRD 4.2)
- `V02`, `V03`

3. Forecasting visibility and override (PRD 4.3)
- `R02`, `R05`

4. Autonomous replenishment controls and outcomes (PRD 4.4)
- `R05`, `R04`, `A01`

5. Blockchain verification (PRD 4.5)
- `S06`, `V06`, `A04`, `W01`

6. Notifications and alert preferences (PRD 4.6)
- `S04`, `S05`, `A06`

7. AI negotiation agent visibility and response (PRD 4.7)
- `A04`, `V05`, `R06`

8. Multi-warehouse optimization visibility and action (PRD 4.8)
- `A05`, `W04`, `W05`, `W06`

9. Role dashboards (PRD 4.9)
- `A01`, `V01`, `W01`, `R01`

10. Basic analytics and reporting (PRD 4.10)
- `A07`, `V06`, `R06`

## 7. Frontend Architecture (Modular and Maintainable)

## 7.1 Route Architecture (Next.js App Router)

```
src/app/
  (public)/
    page.tsx
  (auth)/
    auth/login/page.tsx
    auth/unauthorized/page.tsx
  (platform)/
    dashboard/page.tsx
    notifications/page.tsx
    settings/notifications/page.tsx
    blockchain/tx/[txHash]/page.tsx
  (admin)/
    admin/dashboard/page.tsx
    admin/partners/page.tsx
    admin/partners/[supplierId]/page.tsx
    admin/negotiations/page.tsx
    admin/warehouse-optimization/page.tsx
    admin/alerts/page.tsx
    admin/analytics/page.tsx
  (supplier)/
    supplier/dashboard/page.tsx
    supplier/catalog/page.tsx
    supplier/catalog/upload/page.tsx
    supplier/orders/page.tsx
    supplier/negotiations/page.tsx
    supplier/performance/page.tsx
  (warehouse)/
    warehouse/dashboard/page.tsx
    warehouse/inventory/page.tsx
    warehouse/inventory/manage/page.tsx
    warehouse/allocations/page.tsx
    warehouse/allocations/[allocationId]/page.tsx
    warehouse/transfers/page.tsx
    warehouse/operations/page.tsx
  (retailer)/
    retailer/dashboard/page.tsx
    retailer/inventory/page.tsx
    retailer/orders/new/page.tsx
    retailer/orders/page.tsx
    retailer/replenishment/page.tsx
    retailer/pricing-savings/page.tsx
```

## 7.2 Domain Modules

Create frontend domain folders:
- `src/features/auth`
- `src/features/notifications`
- `src/features/catalog`
- `src/features/inventory`
- `src/features/orders`
- `src/features/negotiation`
- `src/features/warehouse-optimization`
- `src/features/blockchain`
- `src/features/analytics`
- `src/features/replenishment`

Each feature module must contain:
- `api.ts` (endpoint calls)
- `types.ts` (domain types)
- `schemas.ts` (zod validation)
- `hooks.ts` (domain hooks)
- `components/` (feature UI)

## 7.3 Shared Platform Layers

- `src/lib/api-client` for auth headers, retries, error normalization
- `src/lib/rbac` for role checks and route guard policy
- `src/components/shared` for table, filters, KPI cards, chart wrappers, export controls
- `src/stores` for global state slices

## 8. API Contract Plan (Frontend)

Frontend services must map 1:1 to PRD endpoint groups:
- `authService`
- `productsService`
- `inventoryService`
- `ordersService`
- `negotiationService`
- `warehouseService`
- `blockchainService`
- `notificationsService`
- `analyticsService`

Mandatory contract rule:
- no UI should depend on endpoints outside PRD contract unless approved in a versioned API delta doc

Because backend routes are not fully implemented yet (`backend/src/index.ts:14`), frontend will use:
- typed service interfaces first
- mock handlers for all MVP endpoints
- integration switch via environment config

## 9. Step-by-Step Implementation Plan

Timeline aligned to PRD phases (`backend/MVP_PRD_UPDATED.md:1088`).

### Phase 0 - Foundations and Contracts (Week 1)

1. Lock role mapping and RBAC matrix
2. Freeze route map and screen IDs from Section 5
3. Refactor API client to PRD endpoint namespaces
4. Add mock API layer for all MVP endpoint groups
5. Add error/loading/empty-state standards

Exit criteria:
- all 32 screens scaffolded with route guards
- mocked data available for every primary workflow

### Phase 1 - Core Infrastructure UI (Weeks 2-4)

1. Build `S01-S06` shared platform screens
2. Build all 4 role dashboard screens (`A01`, `V01`, `W01`, `R01`)
3. Implement notifications center and preference management
4. Implement reusable table, chart, filter, export primitives

Exit criteria:
- role login and navigation fully functional
- dashboard metrics and tables render from service contracts

### Phase 2 - Operational Workflows (Weeks 5-8)

1. Supplier flows: `V02-V05`
2. Retailer flows: `R02-R05`
3. Warehouse flows: `W02-W07`
4. Order creation, status updates, and tracking integration

Exit criteria:
- all core happy paths from PRD Section 5 implemented
- workflow state transitions validated against API contracts

### Phase 3 - AI, Optimization, and Oversight (Weeks 9-10)

1. Admin negotiation oversight (`A04`)
2. Admin warehouse optimization oversight (`A05`)
3. Supplier negotiation response UX hardening (`V05`)
4. Retailer negotiated pricing and savings (`R06`)

Exit criteria:
- negotiation and warehouse optimization workflows end-to-end in UI
- admin override actions wired and audited in frontend events

### Phase 4 - Analytics, Quality, and Pilot Readiness (Weeks 11-14)

1. Admin analytics and exports (`A07`)
2. Supplier performance (`V06`)
3. Performance tuning for dashboard load targets
4. Accessibility and responsive QA
5. Full test pass (unit, integration, e2e smoke)

Exit criteria:
- MVP frontend ready for pilot
- all P0 and P1 acceptance scenarios passed

## 10. Task Backlog (Execution List)

Priority key:
- `P0` blocking MVP
- `P1` required but parallelizable
- `P2` polish

### 10.1 Foundation Tasks

1. `FE-001` P0: Role taxonomy lock and route guard policy
2. `FE-002` P0: Screen ID to route registry implementation
3. `FE-003` P0: API service refactor to PRD endpoint groups
4. `FE-004` P0: Mock endpoint coverage for all MVP APIs
5. `FE-005` P1: Shared error boundary and API error normalization

### 10.2 Shared Platform Tasks

1. `FE-010` P0: Auth login flow with session persistence
2. `FE-011` P0: Unauthorized and session-expired handling
3. `FE-012` P1: Notification center and preferences
4. `FE-013` P1: Blockchain transaction viewer
5. `FE-014` P1: Reusable data table, filters, pagination, export controls
6. `FE-015` P1: Shared KPI and chart components

### 10.3 Admin Tasks

1. `FE-100` P0: `A01` Admin dashboard
2. `FE-101` P0: `A02` Partner management list and onboarding forms
3. `FE-102` P1: `A03` Supplier detail scorecard
4. `FE-103` P0: `A04` Negotiation oversight and override UI
5. `FE-104` P0: `A05` Warehouse optimization oversight UI
6. `FE-105` P1: `A06` Alert configuration
7. `FE-106` P1: `A07` Analytics and report export

### 10.4 Supplier Tasks

1. `FE-200` P0: `V01` Supplier dashboard
2. `FE-201` P0: `V02` Catalog management (CRUD + search/filter)
3. `FE-202` P0: `V03` CSV upload wizard with validation summary
4. `FE-203` P0: `V04` Orders queue and confirmation
5. `FE-204` P0: `V05` Negotiation response workflow
6. `FE-205` P1: `V06` Performance metrics

### 10.5 Warehouse Manager Tasks

1. `FE-300` P0: `W01` Warehouse dashboard
2. `FE-301` P0: `W02` Multi-warehouse inventory
3. `FE-302` P0: `W03` Stock management actions
4. `FE-303` P0: `W04` Allocation recommendation queue
5. `FE-304` P0: `W05` Allocation review and override
6. `FE-305` P0: `W06` Transfer recommendation approvals
7. `FE-306` P1: `W07` Shipment and discrepancy operations

### 10.6 Retailer Tasks

1. `FE-400` P0: `R01` Retailer dashboard
2. `FE-401` P0: `R02` Inventory monitoring and forecast visibility
3. `FE-402` P0: `R03` Manual order creation
4. `FE-403` P0: `R04` Order history and tracking
5. `FE-404` P0: `R05` Auto-replenishment settings
6. `FE-405` P1: `R06` Negotiated pricing and savings

### 10.7 Quality and Release Tasks

1. `FE-500` P0: Unit test baseline for domain hooks and services
2. `FE-501` P0: Integration tests for role workflows
3. `FE-502` P0: E2E smoke tests for 5 happy paths in PRD Section 5
4. `FE-503` P1: Accessibility audit (keyboard, contrast, labels)
5. `FE-504` P1: Performance optimization for dashboard load and interactions
6. `FE-505` P2: UX polish and copy pass

## 11. Acceptance Gates (Frontend)

Gate A - Architecture:
- route guards enforce role access boundaries
- no role mismatch between token role and UI permissions

Gate B - Functional:
- all 32 screens implemented
- all P0 tasks completed
- all PRD happy paths in Section 5 executable end-to-end

Gate C - Quality:
- no blocker defects in auth, orders, negotiation, warehouse optimization
- responsive behavior verified for dashboard/table/chart views
- export and filtering functional on analytics screens

## 12. Risks and Mitigations

1. Backend endpoint delays
- mitigation: contract-first mocks and adapter layer

2. Role definition conflict (retailer vs procurement_officer)
- mitigation: lock mapping in Week 1 and enforce across auth + route guards

3. Scope creep from non-MVP asks
- mitigation: change control against Section 3 scope boundary

4. Performance risk on data-heavy dashboards
- mitigation: pagination, server-side filtering, memoized chart adapters

## 13. Immediate Execution Order (Next 10 Working Days)

1. Complete `FE-001` to `FE-005`
2. Scaffold all 32 routes with placeholder states and route guards
3. Implement `S01-S06` shared screens
4. Implement role dashboards `A01`, `V01`, `W01`, `R01`
5. Start supplier catalog (`FE-201`, `FE-202`) and retailer order (`FE-402`, `FE-403`) in parallel

---

This file is authoritative for frontend MVP execution until superseded by a higher version.
push
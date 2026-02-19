# 🚀 StationeryChain Frontend - Implementation Plan

**Version**: 1.0  
**Created**: February 19, 2026  
**Duration**: 16 Weeks (4 Phases)  
**Current Phase**: Phase 1 - Foundation (Weeks 1-4)  
**Status**: In Progress 🟡

---

## 📊 Project Overview

### Current State
- ✅ Next.js 14 project initialized
- ✅ TypeScript configured (strict mode)
- ✅ Tailwind CSS v4 installed and configured
- ✅ 40+ shadcn/ui components installed (Radix UI)
- ✅ React Hook Form + Zod for forms
- ✅ Axios for API calls
- ✅ Recharts for charts
- ✅ Basic folder structure (app/, components/, lib/, types/)

### What's Missing
- ❌ Testing infrastructure (Jest, React Testing Library, Playwright)
- ❌ State management (Zustand stores, TanStack Query setup)
- ❌ API integration layer (services, hooks)
- ❌ Authentication system (login, signup, protected routes)
- ❌ Layout components (sidebar, navbar, protected routes)
- ❌ Business components (stat cards, status badges, etc.)
- ❌ CI/CD pipeline (GitHub Actions)

---

## 🎯 Phase 1: Foundation (Weeks 1-4)

**Goal**: Setup project infrastructure, core authentication, and reusable components

### ✅ Week 1: Project Setup & Design System (COMPLETED)
- [x] Initialize Next.js 14 project
- [x] Install shadcn/ui components
- [x] Configure Tailwind CSS v4
- [ ] **TODO**: Setup testing infrastructure
- [ ] **TODO**: Configure CI/CD pipeline
- [ ] **TODO**: Customize design tokens

### 🔄 Week 2: Core Layout & Navigation (IN PROGRESS)

#### Priority 1: Testing Infrastructure Setup 🧪
**Files to Create:**
```
frontend/
├── jest.config.js
├── jest.setup.js
├── playwright.config.ts
├── tests/
│   ├── setup.ts
│   ├── test-utils.tsx
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── __mocks__/
    └── handlers.ts (MSW)
```

**Tasks:**
1. [ ] Install dependencies:
   ```bash
   npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
   npm install -D @playwright/test
   npm install -D msw
   ```

2. [ ] Configure Jest:
   ```javascript
   // jest.config.js
   module.exports = {
     testEnvironment: 'jsdom',
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     },
     collectCoverageFrom: [
       'src/**/*.{ts,tsx}',
       '!src/**/*.d.ts',
       '!src/**/*.stories.tsx',
     ],
     coverageThreshold: {
       global: {
         branches: 90,
         functions: 90,
         lines: 90,
         statements: 90,
       },
     },
   };
   ```

3. [ ] Create test utilities:
   ```typescript
   // tests/test-utils.tsx
   import { render } from '@testing-library/react';
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   
   const createTestQueryClient = () => new QueryClient({
     defaultOptions: {
       queries: { retry: false },
       mutations: { retry: false },
     },
   });
   
   export function renderWithProviders(ui: React.ReactElement) {
     const queryClient = createTestQueryClient();
     return render(
       <QueryClientProvider client={queryClient}>
         {ui}
       </QueryClientProvider>
     );
   }
   ```

4. [ ] Setup MSW for API mocking:
   ```typescript
   // __mocks__/handlers.ts
   import { http, HttpResponse } from 'msw';
   
   export const handlers = [
     http.get('/api/v1/products', () => {
       return HttpResponse.json({
         success: true,
         data: {
           products: [
             { _id: '1', sku: 'PEN-001', name: 'Blue Pen' },
           ],
           total: 1,
         },
       });
     }),
   ];
   ```

5. [ ] Configure Playwright:
   ```typescript
   // playwright.config.ts
   import { defineConfig } from '@playwright/test';
   
   export default defineConfig({
     testDir: './tests/e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     use: {
       baseURL: 'http://localhost:3000',
       trace: 'on-first-retry',
     },
   });
   ```

6. [ ] Add test scripts to `package.json`:
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage",
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui"
     }
   }
   ```

7. [ ] Write sample tests to verify setup

**Estimated Time**: 1 day

---

#### Priority 2: Business Components 🎨
**Files to Create:**
```
frontend/src/components/
├── business/
│   ├── stat-card.tsx
│   ├── status-badge.tsx
│   ├── empty-state.tsx
│   ├── search-bar.tsx
│   ├── page-header.tsx
│   └── agent-activity-card.tsx
└── shared/
    ├── data-table.tsx
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    └── pagination.tsx
```

**Tasks:**
1. [ ] Create `stat-card.tsx` (KPI cards for dashboards)
2. [ ] Create `status-badge.tsx` (colored status indicators)
3. [ ] Create `empty-state.tsx` (no data placeholder)
4. [ ] Create `search-bar.tsx` (debounced search)
5. [ ] Create `page-header.tsx` (page title, breadcrumbs, actions)
6. [ ] Create `data-table.tsx` (sortable, filterable table)
7. [ ] Create `loading-spinner.tsx` (loading states)
8. [ ] Create `error-boundary.tsx` (error handling)
9. [ ] Write tests for all components

**Documentation Reference**: `docs/COMPONENT_LIBRARY.md` (Section 10)

**Estimated Time**: 2 days

---

#### Priority 3: Layout Components 🏗️
**Files to Create:**
```
frontend/src/components/layout/
├── app-layout.tsx
├── sidebar.tsx
├── header.tsx
├── footer.tsx
└── protected-route.tsx
```

**Tasks:**
1. [ ] Create `app-layout.tsx` (main dashboard layout)
   - Responsive grid (sidebar + main content)
   - Mobile-friendly (collapsible sidebar)

2. [ ] Create `sidebar.tsx` (role-based navigation)
   - Navigation menu with icons (Lucide React)
   - Active state highlighting
   - Collapsible functionality
   - Role-based menu items:
     - Admin: Users, Products, Warehouses, Suppliers, Analytics
     - Warehouse Manager: Inventory, Transfers, Receiving
     - Procurement Officer: POs, Cost Analysis
     - Supplier: Catalog, Orders, Performance

3. [ ] Create `header.tsx`
   - Logo
   - Global search bar
   - Notifications dropdown (bell icon with badge)
   - User menu (avatar, profile, logout)

4. [ ] Create `footer.tsx` (copyright, version info)

5. [ ] Create `protected-route.tsx` (route guard)
   - Check authentication
   - Check role permissions
   - Redirect to login if unauthorized

6. [ ] Implement mobile navigation (Sheet component)

7. [ ] Write tests for layout components

**Documentation Reference**: `docs/COMPONENT_LIBRARY.md` (Section 9)

**Estimated Time**: 2 days

---

### 🔜 Week 3: Authentication System

#### Priority 1: API Client Setup 🌐
**Files to Create:**
```
frontend/src/lib/api/
├── client.ts (Axios instance)
└── services/
    └── auth.service.ts
```

**Tasks:**
1. [ ] Create Axios instance with interceptors
2. [ ] Implement request interceptor (add auth token)
3. [ ] Implement response interceptor (handle errors, token refresh)
4. [ ] Create auth service (login, signup, logout, refresh)

**Documentation Reference**: `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` (Section 6)

**Estimated Time**: 1 day

---

#### Priority 2: Auth State Management 🗂️
**Files to Create:**
```
frontend/src/stores/
└── auth-store.ts (Zustand)

frontend/src/hooks/
└── use-auth.ts
```

**Tasks:**
1. [ ] Install Zustand: `npm install zustand`
2. [ ] Create auth store (user, tokens, isAuthenticated)
3. [ ] Add persist middleware (localStorage)
4. [ ] Add devtools middleware
5. [ ] Create `use-auth` hook (wrapper around store)
6. [ ] Write tests for store

**Documentation Reference**: `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` (Section 5)

**Estimated Time**: 0.5 days

---

#### Priority 3: Auth Pages & Forms 🔐
**Files to Create:**
```
frontend/src/app/(auth)/
├── layout.tsx
├── login/page.tsx
├── signup/page.tsx
└── forgot-password/page.tsx

frontend/src/components/features/auth/
├── login-form.tsx
├── signup-form.tsx
└── forgot-password-form.tsx

frontend/src/lib/validators/
└── auth.validator.ts (Zod schemas)
```

**Tasks:**
1. [ ] Create auth layout (centered card, no sidebar)
2. [ ] Create login page
   - Email/password form
   - Remember me checkbox
   - Forgot password link
   - Redirect based on role after login

3. [ ] Create signup page
   - Registration form (name, email, password, role)
   - Password strength indicator
   - Terms & conditions checkbox

4. [ ] Create forgot password page
   - Email input
   - Send reset link

5. [ ] Create Zod validation schemas:
   ```typescript
   // auth.validator.ts
   export const loginSchema = z.object({
     email: z.string().email('Invalid email address'),
     password: z.string().min(8, 'Password must be at least 8 characters'),
   });
   
   export const signupSchema = z.object({
     name: z.string().min(2, 'Name must be at least 2 characters'),
     email: z.string().email('Invalid email address'),
     password: z.string()
       .min(8, 'Password must be at least 8 characters')
       .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
       .regex(/[0-9]/, 'Must contain at least one number'),
     role: z.enum(['admin', 'warehouse_manager', 'procurement_officer', 'supplier']),
   });
   ```

6. [ ] Write E2E tests for auth flow

**Documentation Reference**: 
- `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` (Section 11)
- `docs/SCREEN_SPECIFICATIONS.md` (Section 4)

**Estimated Time**: 2 days

---

#### Priority 4: Protected Routes 🛡️
**Files to Create:**
```
frontend/src/middleware.ts
frontend/src/app/(dashboard)/layout.tsx
```

**Tasks:**
1. [ ] Create middleware for route protection
2. [ ] Implement role-based access control
3. [ ] Redirect to login if not authenticated
4. [ ] Redirect to correct dashboard based on role
5. [ ] Write tests for protected routes

**Estimated Time**: 0.5 days

---

### 🔜 Week 4: State Management & Data Fetching

#### Priority 1: TanStack Query Setup ⚡
**Files to Create:**
```
frontend/src/app/providers.tsx
frontend/src/lib/query-client.ts
```

**Tasks:**
1. [ ] Install TanStack Query: `npm install @tanstack/react-query`
2. [ ] Configure QueryClient with defaults
3. [ ] Create providers wrapper (QueryClientProvider)
4. [ ] Add TanStack Query DevTools (development only)
5. [ ] Update root layout to use providers

**Documentation Reference**: `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` (Section 6)

**Estimated Time**: 0.5 days

---

#### Priority 2: API Services Layer 🌐
**Files to Create:**
```
frontend/src/lib/api/services/
├── user.service.ts
├── product.service.ts
├── inventory.service.ts
├── purchase-order.service.ts
├── supplier.service.ts
└── warehouse.service.ts
```

**Tasks:**
1. [ ] Create service for each backend resource
2. [ ] Implement CRUD operations (getAll, getById, create, update, delete)
3. [ ] Add JSDoc comments for each method
4. [ ] Type all parameters and return values
5. [ ] Handle API response unwrapping (backend wraps in `data`)

**Documentation Reference**: 
- `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` (Section 6)
- `docs/API_REFERENCE.md`

**Estimated Time**: 2 days

---

#### Priority 3: Query & Mutation Hooks 🪝
**Files to Create:**
```
frontend/src/hooks/queries/
├── use-users.ts
├── use-products.ts
├── use-inventory.ts
├── use-purchase-orders.ts
├── use-suppliers.ts
└── use-warehouses.ts

frontend/src/hooks/mutations/
(similar structure)
```

**Tasks:**
1. [ ] Create query hooks for each resource
2. [ ] Create mutation hooks (create, update, delete)
3. [ ] Add optimistic updates
4. [ ] Implement cache invalidation
5. [ ] Add toast notifications (success/error)
6. [ ] Write tests for hooks

**Documentation Reference**: `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` (Section 6)

**Estimated Time**: 2 days

---

#### Priority 4: TypeScript Types 📘
**Files to Create:**
```
frontend/src/types/
├── index.ts
├── auth.types.ts
├── user.types.ts
├── product.types.ts
├── inventory.types.ts
├── purchase-order.types.ts
├── supplier.types.ts
└── warehouse.types.ts
```

**Tasks:**
1. [ ] Define interfaces for all backend models
2. [ ] Create DTOs (Data Transfer Objects) for forms
3. [ ] Create query parameter types
4. [ ] Create paginated response types
5. [ ] Export all types from `index.ts`

**Estimated Time**: 1 day

---

#### Priority 5: Utilities & Constants 🛠️
**Files to Create:**
```
frontend/src/lib/utils/
├── cn.ts (className utility)
├── format.ts (date, currency formatters)
└── validators.ts (custom validators)

frontend/src/lib/constants/
├── routes.ts (route constants)
└── enums.ts (status, roles, etc.)
```

**Tasks:**
1. [ ] Create className utility (already exists from shadcn/ui)
2. [ ] Create date formatters (use date-fns)
3. [ ] Create currency formatters (INR format)
4. [ ] Create route constants (for navigation)
5. [ ] Create enums (UserRole, ProductStatus, etc.)

**Estimated Time**: 0.5 days

---

#### Priority 6: Custom Hooks 🪝
**Files to Create:**
```
frontend/src/hooks/
├── use-toast.ts (already from shadcn/ui)
├── use-debounce.ts
├── use-pagination.ts
└── use-local-storage.ts
```

**Tasks:**
1. [ ] Create `use-debounce` hook (for search)
2. [ ] Create `use-pagination` hook
3. [ ] Create `use-local-storage` hook
4. [ ] Write tests for custom hooks

**Estimated Time**: 0.5 days

---

## 🎯 Phase 1 Completion Checklist

### Quality Gates (Must Pass Before Phase 2)
- [ ] All tests passing (unit + integration)
- [ ] Test coverage ≥ 90%
- [ ] TypeScript: No errors, no `any` types
- [ ] ESLint: No errors
- [ ] Authentication working end-to-end
- [ ] Protected routes working
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Lighthouse score > 80
- [ ] Code review completed
- [ ] Documentation updated

### Files Created (Minimum)
- [ ] 40+ component files
- [ ] 7+ service files
- [ ] 10+ hook files
- [ ] 7+ type files
- [ ] 3+ store files
- [ ] 50+ test files

---

## 🚀 Phase 2: Core Features (Weeks 5-10)

**After Phase 1 is complete, we'll implement:**

### Week 5: Admin Dashboard
- Admin overview with stat cards
- Activity feed
- Charts (Recharts)
- Low stock alerts
- Real-time notifications

### Week 6: Product Management
- Product list (DataTable with sorting, filtering, pagination)
- Product form (Create/Edit)
- Image upload
- Bulk operations

### Week 7: User & Warehouse Management
- User management (CRUD)
- Role-based access control
- Warehouse management (CRUD)
- Zone management

### Week 8: Supplier Management
- Supplier list (CRUD)
- Supplier approval workflow
- Supplier portal
- Performance metrics

### Week 9: Warehouse Manager Features
- Warehouse dashboard
- Inventory management
- Stock adjustments
- Receiving (GRN)
- Stock transfers

### Week 10: Procurement Features
- Procurement dashboard
- Purchase order management
- PO approval workflow
- Cost analysis

---

## 🤖 Phase 3: Advanced Features (Weeks 11-14)

### Week 11: Autonomous Replenishment System
- AI recommendation dashboard
- Demand forecasting visualization
- Bulk approval workflow
- Auto-generate POs

### Week 12: Agent Activity Monitor
- Real-time activity log
- Tool call details viewer
- Agent pipeline visualization
- Performance statistics

### Week 13: System Logs & Decision Visualizer
- System logs with filters
- Decision tree visualization
- Performance dashboard

### Week 14: Real-time Features
- WebSocket integration
- Real-time notifications
- Real-time data updates
- Notification preferences

---

## 🎨 Phase 4: Polish & Launch (Weeks 15-16)

### Week 15: Testing & QA
- Achieve 90%+ test coverage
- E2E testing (Playwright)
- Accessibility testing (WCAG 2.1 AA)
- Bug fixes

### Week 16: Performance & Deployment
- Performance optimization (Lighthouse 95+)
- Code splitting & lazy loading
- CI/CD pipeline (GitHub Actions)
- Production deployment
- Documentation

---

## 📊 Progress Tracking

### Phase 1 Progress: 30% Complete
- ✅ Week 1: Project Setup (100%)
- 🔄 Week 2: Layout & Navigation (0%)
- ⏳ Week 3: Authentication (0%)
- ⏳ Week 4: State Management (0%)

### Overall Progress: 7.5% Complete
- ✅ Phase 1 Foundation: 30%
- ⏳ Phase 2 Core Features: 0%
- ⏳ Phase 3 Advanced Features: 0%
- ⏳ Phase 4 Polish & Launch: 0%

---

## 🎯 Success Metrics

### Technical Metrics
- **Performance**: Lighthouse score > 95
- **Quality**: Test coverage > 90%
- **Reliability**: 99.9% uptime, < 1% error rate
- **Accessibility**: WCAG 2.1 AA compliant

### Business Metrics
- **User Adoption**: 100% onboarded, < 5% support tickets
- **Efficiency**: 50% reduction in manual replenishment time
- **Accuracy**: 40% reduction in inventory errors

---

## 🔗 Documentation References

**Always consult these before implementing:**
1. `docs/FRONTEND_IMPLEMENTATION_GUIDE.md` - Overall implementation guide
2. `docs/IMPLEMENTATION_ROADMAP.md` - Week-by-week breakdown
3. `docs/COMPONENT_LIBRARY.md` - Component patterns and usage
4. `docs/SCREEN_SPECIFICATIONS.md` - UI specifications and wireframes
5. `docs/API_REFERENCE.md` - Backend API documentation
6. `.opencode/frontend-agent-instructions.md` - AI agent rules

---

## 📞 Getting Help

**If stuck:**
1. Consult documentation (see above)
2. Check `.opencode/frontend-agent-instructions.md` for patterns
3. Ask the AI agent (it has read all documentation)
4. Review completed code in similar features

**Common Issues:**
- **TypeScript errors**: Check types in `src/types/`
- **API errors**: Check `docs/API_REFERENCE.md`
- **Test failures**: Check test patterns in `.opencode/frontend-agent-instructions.md`
- **Styling issues**: Check `docs/COMPONENT_LIBRARY.md`

---

## 🎉 Next Steps

**Immediate Actions (Today):**
1. ✅ Read `.opencode/frontend-agent-instructions.md`
2. ✅ Understand Phase 1 tasks
3. 🔄 Start Week 2: Testing Infrastructure Setup

**This Week's Goals:**
- Complete testing infrastructure
- Create all business components
- Create all layout components
- Write tests for components

**This Month's Goals:**
- Complete Phase 1 (Foundation)
- Pass all quality gates
- Ready for Phase 2 (Core Features)

---

**Version**: 1.0  
**Last Updated**: February 19, 2026  
**Next Review**: End of Week 2 (February 23, 2026)

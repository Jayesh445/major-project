# StationeryChain Backend Implementation Roadmap

## 📋 Overview

This document outlines the strategic implementation plan for building the StationeryChain backend API and AI agents. The modules are organized in dependency order, ensuring each phase builds upon the previous one.

---

## 🎯 Implementation Phases

### **Phase 1: Foundation & Authentication** (Week 1)
*Core infrastructure that everything else depends on*

#### 1.1 Database Connection & Configuration
**Priority:** 🔴 CRITICAL
**Dependencies:** None
**Files to Create:**
- `src/config/index.ts` - Export all config
- `src/config/env.ts` - Environment variable validation (use `zod`)
- Update `src/index.ts` - Initialize database connection

**Tasks:**
- [ ] Create environment variable schema (MONGODB_URI, JWT_SECRET, PORT, NODE_ENV)
- [ ] Add database connection initialization to server startup
- [ ] Add graceful shutdown handlers
- [ ] Test database connection

**Why First?** Nothing works without database connectivity.

---

#### 1.2 User Authentication & Authorization Module
**Priority:** 🔴 CRITICAL
**Dependencies:** User Model (✅ Created)
**Module Path:** `src/modules/user/`

**Files to Create:**
```
src/modules/user/
├── model.ts          ✅ Already created
├── dto.ts            - Request/Response DTOs (Zod schemas)
├── service.ts        - Business logic
├── controller.ts     - Route handlers
├── routes.ts         - Express routes
└── middleware.ts     - Auth middleware (verifyToken, checkRole)
```

**API Endpoints to Implement:**
```typescript
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login (returns JWT)
POST   /api/v1/auth/logout            - Logout
GET    /api/v1/auth/me                - Get current user profile
PUT    /api/v1/auth/me                - Update profile
PUT    /api/v1/auth/change-password   - Change password
POST   /api/v1/auth/refresh-token     - Refresh JWT token

// Admin only
GET    /api/v1/users                  - List all users (admin)
GET    /api/v1/users/:id              - Get user by ID (admin)
PUT    /api/v1/users/:id              - Update user (admin)
DELETE /api/v1/users/:id              - Deactivate user (admin)
```

**Key Features:**
- JWT-based authentication
- Password hashing with bcrypt (before save)
- Role-based access control (RBAC) middleware
- Token refresh mechanism
- Rate limiting on auth routes

**Why Second?** All subsequent endpoints require authentication.

---

### **Phase 2: Master Data Management** (Week 1-2)
*Build CRUD operations for core business entities*

#### 2.1 Product Catalog Module
**Priority:** 🔴 HIGH
**Dependencies:** User Module (auth)
**Module Path:** `src/modules/product/`

**Files to Create:**
```
src/modules/product/
├── model.ts          ✅ Already created
├── dto.ts            - Product DTOs (Zod validation)
├── service.ts        - CRUD + search logic
├── controller.ts     - Route handlers
└── routes.ts         - Express routes
```

**API Endpoints:**
```typescript
POST   /api/v1/products              - Create product (Admin/Procurement Officer)
GET    /api/v1/products              - List products (paginated, filterable)
GET    /api/v1/products/search       - Search by name/SKU/category
GET    /api/v1/products/:id          - Get product details
PUT    /api/v1/products/:id          - Update product (Admin/Procurement Officer)
DELETE /api/v1/products/:id          - Soft delete (set isActive=false)
POST   /api/v1/products/bulk-upload  - CSV/Excel bulk upload
```

**Key Features:**
- Text search (using MongoDB text index)
- Filtering by category, supplier, active status
- Pagination and sorting
- Bulk upload validation
- SKU uniqueness validation

**Why First in Phase 2?** Products are referenced by Inventory, POs, and Forecasts.

---

#### 2.2 Warehouse Management Module
**Priority:** 🔴 HIGH
**Dependencies:** User Module
**Module Path:** `src/modules/warehouse/`

**Files to Create:**
```
src/modules/warehouse/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
└── routes.ts
```

**API Endpoints:**
```typescript
POST   /api/v1/warehouses            - Create warehouse (Admin)
GET    /api/v1/warehouses            - List warehouses
GET    /api/v1/warehouses/:id        - Get warehouse details
PUT    /api/v1/warehouses/:id        - Update warehouse (Admin/Warehouse Manager)
DELETE /api/v1/warehouses/:id        - Deactivate warehouse (Admin)

// Zone management
POST   /api/v1/warehouses/:id/zones  - Add zone
PUT    /api/v1/warehouses/:id/zones/:zoneId  - Update zone
DELETE /api/v1/warehouses/:id/zones/:zoneId  - Remove zone

// Analytics
GET    /api/v1/warehouses/:id/capacity-report  - Capacity utilization
GET    /api/v1/warehouses/:id/inventory-summary - Stock summary
```

**Key Features:**
- Zone-based capacity management
- Manager assignment
- Geolocation support (lat/lng)
- Capacity utilization calculations

**Why Second in Phase 2?** Warehouses are needed for Inventory tracking.

---

#### 2.3 Supplier Management Module
**Priority:** 🔴 HIGH
**Dependencies:** User Module, Product Module
**Module Path:** `src/modules/supplier/`

**Files to Create:**
```
src/modules/supplier/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
└── routes.ts
```

**API Endpoints:**
```typescript
POST   /api/v1/suppliers             - Register supplier (Admin)
GET    /api/v1/suppliers             - List suppliers (filterable)
GET    /api/v1/suppliers/:id         - Get supplier details
PUT    /api/v1/suppliers/:id         - Update supplier
DELETE /api/v1/suppliers/:id         - Remove supplier (Admin)

// Catalog management
POST   /api/v1/suppliers/:id/catalog - Add product to catalog
PUT    /api/v1/suppliers/:id/catalog/:productId - Update catalog item
DELETE /api/v1/suppliers/:id/catalog/:productId - Remove from catalog

// Contract management
PUT    /api/v1/suppliers/:id/contract - Update contract terms
GET    /api/v1/suppliers/:id/performance - Get performance metrics

// Approval workflow (for supplier role users)
PUT    /api/v1/suppliers/:id/approve  - Approve supplier (Admin)
PUT    /api/v1/suppliers/:id/reject   - Reject supplier (Admin)
```

**Key Features:**
- Supplier approval workflow
- Catalog product pricing
- Performance tracking (negotiation stats)
- Rating system

**Why Third in Phase 2?** Suppliers are needed for Purchase Orders and Negotiations.

---

### **Phase 3: Operational Modules** (Week 2-3)
*Core business operations*

#### 3.1 Inventory Management Module
**Priority:** 🔴 CRITICAL
**Dependencies:** Product, Warehouse, User
**Module Path:** `src/modules/inventory/`

**Files to Create:**
```
src/modules/inventory/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts        - IMPORTANT: Implement availableStock calculation here
├── controller.ts
└── routes.ts
```

**API Endpoints:**
```typescript
POST   /api/v1/inventory             - Initialize inventory for product+warehouse
GET    /api/v1/inventory             - List inventory (filterable by warehouse/product)
GET    /api/v1/inventory/:id         - Get inventory details
PUT    /api/v1/inventory/:id/adjust  - Manual stock adjustment (Warehouse Manager)

// Stock movements
POST   /api/v1/inventory/:id/reserve    - Reserve stock
POST   /api/v1/inventory/:id/release    - Release reservation
POST   /api/v1/inventory/:id/transfer   - Transfer between warehouses

// Replenishment
GET    /api/v1/inventory/low-stock      - Get low stock items (below reorder point)
POST   /api/v1/inventory/trigger-replenishment - Trigger auto-replenishment

// Transactions
GET    /api/v1/inventory/:id/transactions - Get transaction history
POST   /api/v1/inventory/:id/transactions - Add transaction record

// Reporting
GET    /api/v1/inventory/stock-report   - Stock levels across all warehouses
GET    /api/v1/inventory/valuation      - Inventory valuation report
```

**Key Features:**
- **Auto-compute availableStock** in service layer (currentStock - reservedStock)
- Transaction logging for audit trail
- Low stock alerts (check against reorderPoint)
- Multi-warehouse stock visibility
- Reservation system for order fulfillment

**Critical Implementation Notes:**
```typescript
// In service.ts - Always compute availableStock
async updateInventory(id: string, updates: any) {
  if ('currentStock' in updates || 'reservedStock' in updates) {
    const inventory = await Inventory.findById(id);
    const currentStock = updates.currentStock ?? inventory.currentStock;
    const reservedStock = updates.reservedStock ?? inventory.reservedStock;
    updates.availableStock = Math.max(0, currentStock - reservedStock);
  }
  return Inventory.findByIdAndUpdate(id, updates, { new: true });
}
```

**Why First in Phase 3?** Core to supply chain operations.

---

#### 3.2 Purchase Order Module
**Priority:** 🔴 HIGH
**Dependencies:** Product, Warehouse, Supplier, Inventory, User
**Module Path:** `src/modules/purchase-order/`

**Files to Create:**
```
src/modules/purchase-order/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
└── routes.ts
```

**API Endpoints:**
```typescript
POST   /api/v1/purchase-orders          - Create PO (manual or auto)
GET    /api/v1/purchase-orders          - List POs (filterable)
GET    /api/v1/purchase-orders/:id      - Get PO details
PUT    /api/v1/purchase-orders/:id      - Update PO (draft only)
DELETE /api/v1/purchase-orders/:id      - Cancel PO

// Workflow actions
PUT    /api/v1/purchase-orders/:id/submit-for-approval  - Submit (draft → pending_approval)
PUT    /api/v1/purchase-orders/:id/approve              - Approve (Admin/Manager)
PUT    /api/v1/purchase-orders/:id/reject               - Reject PO
PUT    /api/v1/purchase-orders/:id/send                 - Send to supplier
PUT    /api/v1/purchase-orders/:id/acknowledge          - Supplier acknowledges

// Receiving
PUT    /api/v1/purchase-orders/:id/receive              - Record receipt (partial/full)
POST   /api/v1/purchase-orders/:id/line-items/:lineId/receive - Receive specific line item

// Analytics
GET    /api/v1/purchase-orders/analytics  - PO analytics (by status, supplier)
GET    /api/v1/purchase-orders/pending    - Pending approvals
```

**Key Features:**
- PO number auto-generation (PO-XXXXXX format)
- Status workflow state machine
- Line item tracking (ordered vs received quantities)
- Approval workflow
- Blockchain logging integration (prepare fields)
- Total amount calculation

**Integration Points:**
- When PO is fully received → Update Inventory (increase currentStock)
- Low stock detection → Trigger auto PO creation
- Link to Negotiation sessions

---

### **Phase 4: AI Agent Modules** (Week 3-4)
*Intelligent automation features*

#### 4.1 Demand Forecasting Module
**Priority:** 🟡 MEDIUM (MVP)
**Dependencies:** Product, Warehouse, Inventory (historical data)
**Module Path:** `src/modules/forecast/`

**Files to Create:**
```
src/modules/forecast/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
├── routes.ts
└── ai-agent/
    ├── forecasting-engine.ts   - ARIMA/Prophet implementation
    ├── data-processor.ts       - Historical data aggregation
    └── mape-calculator.ts      - Accuracy metrics
```

**API Endpoints:**
```typescript
POST   /api/v1/forecasts/generate           - Generate forecast for product+warehouse
GET    /api/v1/forecasts                    - List forecasts
GET    /api/v1/forecasts/:id                - Get forecast details
GET    /api/v1/forecasts/latest/:productId  - Get latest forecast for product

// Batch operations
POST   /api/v1/forecasts/generate-batch     - Generate for multiple products
POST   /api/v1/forecasts/generate-all       - Generate for all active products

// Analytics
GET    /api/v1/forecasts/accuracy-report    - MAPE performance report
PUT    /api/v1/forecasts/:id/update-actual  - Update actual demand (for MAPE calculation)
```

**AI Agent Implementation:**
```typescript
// Use Python microservice or Node.js libraries
// Libraries: tensorflow.js, statsmodels (Python), prophet (Python)

// Forecasting Engine Workflow:
1. Fetch historical inventory transactions (last 90 days)
2. Aggregate daily demand
3. Run forecasting model (ARIMA/Prophet)
4. Generate 7-day predictions with confidence intervals
5. Calculate recommended reorder quantity
6. Store forecast in database
7. Trigger notification if reorder recommended
```

**Key Features:**
- 7-day ahead demand prediction
- Confidence intervals (low/high bounds)
- MAPE tracking (target: < 20%)
- Model versioning (arima-v1, prophet-v2)
- Reorder recommendations

**MVP Acceptance Criteria:**
- ✅ Forecast generated within 30 seconds
- ✅ MAPE < 20% for 70%+ of products
- ✅ Daily batch forecast job (cron)

---

#### 4.2 AI Negotiation Agent Module
**Priority:** 🟡 MEDIUM (MVP)
**Dependencies:** Supplier, Product, Purchase Order, User
**Module Path:** `src/modules/negotiation/`

**Files to Create:**
```
src/modules/negotiation/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
├── routes.ts
└── ai-agent/
    ├── negotiation-agent.ts    - LangChain/LangGraph implementation
    ├── langgraph-workflow.ts   - State machine definition
    ├── prompts.ts              - LLM prompt templates
    └── pricing-analyzer.ts     - Market price analysis
```

**API Endpoints:**
```typescript
POST   /api/v1/negotiations/start          - Start negotiation session
GET    /api/v1/negotiations                - List sessions
GET    /api/v1/negotiations/:id            - Get session details
POST   /api/v1/negotiations/:id/counter    - Supplier counter-offer (Supplier role)
PUT    /api/v1/negotiations/:id/accept     - Accept offer
PUT    /api/v1/negotiations/:id/reject     - Reject offer
PUT    /api/v1/negotiations/:id/escalate   - Escalate to human (Procurement Officer)

// Agent actions
POST   /api/v1/negotiations/:id/agent-offer - AI generates next offer
GET    /api/v1/negotiations/:id/reasoning   - Get AI reasoning for offer

// Analytics
GET    /api/v1/negotiations/analytics      - Success rate, savings
```

**LangGraph Workflow:**
```typescript
// State machine states:
- ANALYZE_REQUIREMENTS  // Analyze product, supplier, constraints
- GENERATE_OFFER        // Create initial offer using LLM
- WAIT_FOR_RESPONSE     // Await supplier counter-offer
- EVALUATE_COUNTER      // Evaluate if acceptable
- GENERATE_COUNTER      // Generate counter-offer
- FINALIZE_TERMS        // Accept and create PO
- ESCALATE              // Hand off to human

// LangChain components:
- ChatOpenAI / ChatAnthropic for LLM
- Custom tools: fetchSupplierHistory, checkMarketPrice, calculateSavings
- Memory: Store negotiation context
- Structured output: Parse offers as JSON
```

**Key Features:**
- Multi-round negotiation (max 5 rounds)
- Agent constraints (maxPrice, targetPrice, maxLeadTime)
- Reasoning transparency (explain offer to user)
- Savings calculation
- 24-hour deadline with timeout
- Human escalation capability

**MVP Acceptance Criteria:**
- ✅ Negotiate at least 3 product categories
- ✅ Achieve 15%+ cost savings on 50% of negotiations
- ✅ Auto-generate PO after successful negotiation

---

#### 4.3 Warehouse Optimization Module
**Priority:** 🟢 LOW (Post-MVP)
**Dependencies:** Warehouse, Inventory, Product
**Module Path:** `src/modules/warehouse-optimization/`

**Files to Create:**
```
src/modules/warehouse-optimization/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
├── routes.ts
└── ai-agent/
    ├── optimization-agent.ts   - LangGraph implementation
    ├── transfer-optimizer.ts   - Stock transfer logic
    └── cost-calculator.ts      - Logistics cost estimation
```

**API Endpoints:**
```typescript
POST   /api/v1/warehouse-optimization/generate    - Generate recommendations
GET    /api/v1/warehouse-optimization             - List recommendations
GET    /api/v1/warehouse-optimization/:id         - Get details
PUT    /api/v1/warehouse-optimization/:id/review  - Accept/reject/partial

// Actions
POST   /api/v1/warehouse-optimization/:id/execute - Execute transfers
GET    /api/v1/warehouse-optimization/analytics   - Optimization impact
```

**AI Agent Logic:**
1. Analyze inventory across all warehouses
2. Identify imbalances (excess stock in one, shortage in another)
3. Calculate transfer costs vs benefit
4. Generate transfer recommendations
5. Predict cost savings and capacity improvement

**MVP Acceptance Criteria:**
- ✅ Generate recommendations in < 5 minutes
- ✅ Predict 10%+ logistics cost reduction

---

### **Phase 5: Supporting Services** (Week 4-5)
*Cross-cutting concerns*

#### 5.1 Notification Service
**Priority:** 🟡 MEDIUM
**Dependencies:** User, All other modules
**Module Path:** `src/modules/notification/`

**Files to Create:**
```
src/modules/notification/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
├── routes.ts
└── channels/
    ├── email-service.ts    - Email sending (Nodemailer/SendGrid)
    └── in-app-service.ts   - In-app notification storage
```

**API Endpoints:**
```typescript
GET    /api/v1/notifications          - Get user's notifications
GET    /api/v1/notifications/:id      - Get notification details
PUT    /api/v1/notifications/:id/read - Mark as read
PUT    /api/v1/notifications/read-all - Mark all as read
DELETE /api/v1/notifications/:id      - Delete notification

// Preferences
GET    /api/v1/notifications/preferences - Get notification preferences
PUT    /api/v1/notifications/preferences - Update preferences
```

**Notification Triggers:**
- Low stock alert (when currentStock <= reorderPoint)
- PO created/approved/received
- Negotiation started/completed/requires action
- Forecast ready
- Warehouse capacity alert (when usedCapacity > 90%)

**Implementation Note:**
```typescript
// In service layer - update readAt timestamp manually
async markAsRead(notificationId: string) {
  return Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
}
```

---

#### 5.2 Blockchain Logging Service
**Priority:** 🟢 LOW (Post-MVP)
**Dependencies:** PurchaseOrder, Negotiation, Inventory
**Module Path:** `src/modules/blockchain/`

**Files to Create:**
```
src/modules/blockchain/
├── model.ts          ✅ Already created
├── dto.ts
├── service.ts
├── controller.ts
├── routes.ts
└── blockchain/
    ├── web3-client.ts      - Web3.js/ethers.js setup
    ├── smart-contract.ts   - Contract interactions
    └── tx-logger.ts        - Transaction logger
```

**API Endpoints:**
```typescript
POST   /api/v1/blockchain/log          - Manually log event
GET    /api/v1/blockchain/logs         - Get logs (filterable)
GET    /api/v1/blockchain/logs/:id     - Get log details
GET    /api/v1/blockchain/verify/:txHash - Verify transaction

// Analytics
GET    /api/v1/blockchain/audit-trail/:referenceId - Get audit trail for entity
```

**Key Features:**
- Log critical events (PO created, approved, received)
- Store transaction hash and block number
- Confirmation status tracking
- Payload snapshot (immutable record)

---

## 📊 Implementation Priority Matrix

### Must Have (MVP - Week 1-3)
1. ✅ User Authentication & Authorization
2. ✅ Product Management
3. ✅ Warehouse Management
4. ✅ Supplier Management
5. ✅ Inventory Management
6. ✅ Purchase Order Management
7. ⚠️ Demand Forecasting (AI)
8. ⚠️ Negotiation Agent (AI)
9. ✅ Notifications (basic)

### Should Have (Post-MVP - Week 4-5)
10. ⚠️ Warehouse Optimization (AI)
11. ⚠️ Blockchain Logging
12. Advanced Analytics & Reporting
13. Bulk Operations & CSV Import

### Could Have (Future)
14. Email notifications
15. Real-time WebSocket updates
16. Advanced dashboards
17. Mobile app API support

---

## 🛠️ Technical Standards

### Folder Structure Per Module
```
src/modules/{module-name}/
├── model.ts          # Mongoose schema (✅ Done)
├── dto.ts            # Zod validation schemas
├── service.ts        # Business logic layer
├── controller.ts     # Request handlers
├── routes.ts         # Express router
├── middleware.ts     # Module-specific middleware (optional)
└── ai-agent/         # AI-specific code (if applicable)
    ├── agent.ts
    └── prompts.ts
```

### Standard File Templates

#### DTO Pattern (Zod)
```typescript
import { z } from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string().min(3).max(50).toUpperCase(),
  name: z.string().min(2).max(200),
  category: z.enum(['writing_instruments', ...]),
  unitPrice: z.number().min(0),
  // ...
});

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
```

#### Service Pattern
```typescript
export class ProductService {
  async create(dto: CreateProductDto, userId: string): Promise<IProduct> {
    // Business logic
    const product = new Product({ ...dto, uploadedBy: userId });
    await product.save();
    return product;
  }

  async findAll(filters: any, pagination: any): Promise<PaginatedResult<IProduct>> {
    // Implement pagination, filtering
  }
}
```

#### Controller Pattern
```typescript
export class ProductController {
  private service = new ProductService();

  create = asyncHandler(async (req, res) => {
    const dto = CreateProductSchema.parse(req.body);
    const product = await this.service.create(dto, req.user.id);
    res.status(201).json(new ApiResponse(201, product, 'Product created'));
  });
}
```

#### Routes Pattern
```typescript
import { Router } from 'express';
import { ProductController } from './controller';
import { authenticate, authorize } from '@/middlewares';

const router = Router();
const controller = new ProductController();

router.post('/', authenticate, authorize(['admin', 'procurement_officer']), controller.create);
router.get('/', authenticate, controller.findAll);

export default router;
```

---

## 🧪 Testing Strategy

### Unit Tests
- Service layer business logic
- DTO validation schemas
- Utility functions

### Integration Tests
- API endpoints (use supertest)
- Database operations
- Authentication flow

### AI Agent Tests
- Mock LLM responses
- Test state machine transitions
- Validate output format

---

## 🚀 Recommended Start Order

### Week 1: Foundation
**Day 1-2:** Database config + User auth
**Day 3-4:** Product module
**Day 5-7:** Warehouse + Supplier modules

### Week 2: Operations
**Day 8-10:** Inventory management (most complex)
**Day 11-14:** Purchase Order module

### Week 3: AI Agents
**Day 15-17:** Demand Forecasting agent
**Day 18-21:** Negotiation agent (most complex)

### Week 4-5: Polish
**Day 22-24:** Notifications
**Day 25-28:** Warehouse Optimization
**Day 29-30:** Blockchain logging
**Day 31-35:** Testing, documentation, deployment

---

## 📝 Next Immediate Steps

### Step 1: Environment Setup
```bash
# Install additional dependencies
pnpm add zod jsonwebtoken bcryptjs
pnpm add -D @types/jsonwebtoken @types/bcryptjs

# Create .env file
cp .env.example .env
```

### Step 2: Create Config Files
1. `src/config/env.ts` - Environment validation
2. `src/config/index.ts` - Export all configs
3. Update `src/index.ts` - Database connection

### Step 3: Start with User Module
Begin implementation with `src/modules/user/dto.ts`

---

## 🎓 Key Learnings & Best Practices

1. **Always validate at boundaries** - Use Zod for all input validation
2. **Keep services pure** - No req/res objects in services
3. **Use transactions** - For multi-step operations (PO creation + inventory update)
4. **Cache where possible** - Product catalog, supplier lists
5. **Log everything** - Use winston/pino for structured logging
6. **Handle errors gracefully** - Use custom error classes
7. **Document as you go** - JSDoc comments for complex logic
8. **Test AI agents thoroughly** - They're the most unpredictable part

---

## 📚 Recommended Libraries

### Core
- **express** - Web framework
- **mongoose** - ODM
- **zod** - Schema validation
- **jsonwebtoken** - JWT auth

### AI/ML
- **langchain** - LLM orchestration
- **@langchain/langgraph** - State machines
- **openai** or **@anthropic-ai/sdk** - LLM providers
- **tensorflow.js** or Python microservice - Forecasting

### Utilities
- **winston** - Logging
- **bull** - Job queues (for async AI tasks)
- **nodemailer** - Email
- **date-fns** - Date manipulation

### Testing
- **jest** - Test runner
- **supertest** - API testing
- **@faker-js/faker** - Test data generation

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] All endpoints return < 500ms (P95)
- [ ] Test coverage > 80%
- [ ] Zero critical security vulnerabilities
- [ ] API documentation complete (Swagger/OpenAPI)

### Business Metrics
- [ ] Forecast accuracy MAPE < 20%
- [ ] Negotiation success rate > 50%
- [ ] 15%+ cost savings from negotiations
- [ ] Warehouse optimization 10%+ cost reduction

---

## 🚦 START HERE

**Your first task:** Implement Phase 1.1 - Database Connection & Configuration

Create a new issue or task:
```
Title: Setup Database Connection & Environment Config
Files: src/config/env.ts, src/config/database.ts, src/config/index.ts, src/index.ts
Dependencies: None
Estimated Time: 2-3 hours
```

Then proceed to Phase 1.2 - User Authentication Module.

Good luck! 🚀

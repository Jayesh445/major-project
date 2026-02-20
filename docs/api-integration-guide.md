# API Integration Guide

This guide covers how the frontend integrates with the backend REST API — from the Axios client setup to React Query hooks and TypeScript types.

---

## Base URL

```
http://localhost:5000/api/v1
```

Set via environment variable in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

If not set, the client falls back to `http://localhost:5000/api/v1` automatically.

---

## API Client (`frontend/src/lib/api/client.ts`)

All HTTP calls go through a single **Axios instance** with two interceptors.

### Setup

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
```

### Request Interceptor — Auto-attach JWT

Every outgoing request automatically gets the `Authorization` header from the Zustand auth store:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor — Auto Token Refresh

When the server returns `401 Unauthorized`:

1. Marks the request with `_retry: true` to prevent infinite loops
2. Reads the `refreshToken` from the Zustand store
3. Calls `POST /users/refresh-token` with the refresh token
4. On success: updates Zustand with new `accessToken` + `refreshToken`, retries the original request
5. On failure (refresh also fails): calls `logout()` and redirects to `/login`

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // ... token refresh logic
    }
    return Promise.reject(error);
  }
);
```

---

## Authentication

### Standard Response Format

All backend responses follow this envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Error",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

### Login

```typescript
POST /users/login

// Request
{ "email": "admin@example.com", "password": "password123" }

// Response data
{
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "isActive": true
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**After login**, call `useAuthStore.getState().setTokens(accessToken, refreshToken)` and `setUser(user)`. The Zustand store persists `user` and `refreshToken` to localStorage. `accessToken` is in-memory only.

### Signup

```typescript
POST /users/signup

// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "procurement_officer"  // admin | warehouse_manager | procurement_officer | supplier
}

// Response: same shape as login
```

### Refresh Token

```typescript
POST /users/refresh-token

// Request
{ "refreshToken": "eyJhbGc..." }

// Response data
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."   // rotated — old token is invalidated
}
```

### Logout

```typescript
POST /users/logout

// Request
{ "refreshToken": "eyJhbGc..." }

// Response: 200 OK
```

Logout all devices:
```typescript
POST /users/logout-all
// No body needed — uses authenticated user from token
```

---

## Auth Store (`frontend/src/stores/auth-store.ts`)

Zustand store with `devtools` + `persist` middleware:

```typescript
const { user, accessToken, refreshToken, isAuthenticated } = useAuthStore();

// Available actions:
useAuthStore.getState().setUser(user);
useAuthStore.getState().setTokens(accessToken, refreshToken);
useAuthStore.getState().logout();
useAuthStore.getState().updateProfile(partialUser);
```

**Persistence:** Only `user` and `refreshToken` are saved to localStorage (key: `auth-storage`). `accessToken` is never persisted — it is re-obtained via refresh token on page reload.

---

## Service Layer (`frontend/src/lib/api/services/`)

Each module has a dedicated service object. Services are thin wrappers — they call `apiClient`, unwrap `response.data.data`, and return typed values.

### Auth Service

```typescript
import { authService } from '@/lib/api/services/auth.service';

// Login
const { user, accessToken, refreshToken } = await authService.login({ email, password });

// Signup
const { user, accessToken, refreshToken } = await authService.signup({ name, email, password, role });

// Refresh
const { accessToken, refreshToken } = await authService.refreshToken(currentRefreshToken);

// Logout
await authService.logout();
```

### Product Service

```typescript
import { productService } from '@/lib/api/services/product.service';

// List with filters
const { data, meta } = await productService.getAll({ page: 1, limit: 20, category: 'paper_products' });

// Single
const product = await productService.getById(id);

// Create
const newProduct = await productService.create({ sku, name, category, unitPrice, ... });

// Update
const updated = await productService.update(id, { unitPrice: 150 });

// Delete (soft delete)
await productService.delete(id);

// Low stock
const lowStockProducts = await productService.getLowStock();
```

### Inventory Service

```typescript
import { inventoryService } from '@/lib/api/services/inventory.service';

// List
const { data, meta } = await inventoryService.getAll({ warehouse: warehouseId });

// By product
const items = await inventoryService.getByProduct(productId);

// Adjust stock
const updated = await inventoryService.adjustStock({
  productId,
  warehouseId,
  quantity: 50,
  type: 'in',           // 'in' | 'out' | 'set'
  reason: 'Purchase receipt',
});

// Transfer between warehouses
await inventoryService.transferStock({
  productId,
  fromWarehouseId,
  toWarehouseId,
  quantity: 20,
  notes: 'Monthly rebalance',
});
```

### Purchase Order Service

```typescript
import { poService } from '@/lib/api/services/purchase-order.service';

// List with filters
const { data, meta } = await poService.getAll({ status: 'pending_approval' });

// Get single PO
const po = await poService.getById(id);

// Create PO
const newPO = await poService.create({
  supplier: supplierId,
  warehouse: warehouseId,
  items: [{ product: productId, quantity: 100, unitPrice: 50 }],
  expectedDeliveryDate: '2026-03-01',
});

// Approve
const approved = await poService.approve(id);

// Reject
const rejected = await poService.reject(id, 'Price too high');

// Update
const updated = await poService.update(id, { status: 'sent_to_supplier' });
```

### Supplier Service

```typescript
import { supplierService } from '@/lib/api/services/supplier.service';

const { data } = await supplierService.getAll({ status: 'active' });
const supplier = await supplierService.getById(id);
const created = await supplierService.create({ name, contactPerson, email, phone, address });
const updated = await supplierService.update(id, { rating: 4.5 });
await supplierService.delete(id);
```

### Warehouse Service

```typescript
import { warehouseService } from '@/lib/api/services/warehouse.service';

const { data } = await warehouseService.getAll();
const warehouse = await warehouseService.getById(id);
const created = await warehouseService.create({ name, location, capacity, manager, zones });
const updated = await warehouseService.update(id, { status: 'inactive' });
await warehouseService.delete(id);
```

### User Service

```typescript
import { userService } from '@/lib/api/services/user.service';

const { data } = await userService.getAll({ role: 'warehouse_manager' });
const user = await userService.getById(id);
const created = await userService.create({ name, email, password, role });
const updated = await userService.update(id, { isActive: false });
await userService.delete(id);
```

---

## React Query Hooks (`frontend/src/hooks/queries/`)

Hooks wrap services with TanStack Query for caching, loading states, and cache invalidation.

### Products

```typescript
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useLowStockProducts,
} from '@/hooks/queries/use-products';

// In a component:
const { data, isLoading, error } = useProducts({ category: 'paper_products', page: 1 });
const { data: product } = useProduct(id);

const createProduct = useCreateProduct();
await createProduct.mutateAsync({ sku: 'SKU001', name: 'A4 Paper', ... });

const updateProduct = useUpdateProduct();
await updateProduct.mutateAsync({ id, data: { unitPrice: 200 } });

const deleteProduct = useDeleteProduct();
await deleteProduct.mutateAsync(id);
```

### Inventory

```typescript
import {
  useInventory,
  useProductInventory,
  useAdjustStock,
  useTransferStock,
} from '@/hooks/queries/use-inventory';

const { data } = useInventory({ warehouse: warehouseId });
const { data: items } = useProductInventory(productId);

const adjustStock = useAdjustStock();
await adjustStock.mutateAsync({ productId, warehouseId, quantity: 50, type: 'in', reason: '...' });

const transferStock = useTransferStock();
await transferStock.mutateAsync({ productId, fromWarehouseId, toWarehouseId, quantity: 10 });
```

### Purchase Orders

```typescript
import {
  usePurchaseOrders,
  usePurchaseOrder,
  useCreatePO,
  useUpdatePO,
  useApprovePO,
  useRejectPO,
} from '@/hooks/queries/use-purchase-orders';

const { data } = usePurchaseOrders({ status: 'pending_approval' });

const createPO = useCreatePO();
await createPO.mutateAsync({ supplier, warehouse, items });

const approvePO = useApprovePO();
await approvePO.mutateAsync(poId);

const rejectPO = useRejectPO();
await rejectPO.mutateAsync({ id: poId, reason: 'Budget exceeded' });
```

### Suppliers, Users, Warehouses

```typescript
// Suppliers
import { useSuppliers, useSupplier, useCreateSupplier, useUpdateSupplier, useDeleteSupplier }
  from '@/hooks/queries/use-suppliers';

// Users
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser }
  from '@/hooks/queries/use-users';

// Warehouses
import { useWarehouses, useWarehouse, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse }
  from '@/hooks/queries/use-warehouses';
```

All hooks follow the same pattern:
- `useXxx(params?)` → `useQuery` (reads)
- `useCreateXxx()` → `useMutation` (POST)
- `useUpdateXxx()` → `useMutation` (PUT)
- `useDeleteXxx()` → `useMutation` (DELETE)

All mutations:
- Auto-invalidate relevant query keys on success
- Show `toast()` notifications on success and error

---

## Query Key Conventions

| Resource | Query Key |
|---|---|
| All products | `['products', params]` |
| Single product | `['products', id]` |
| Low stock | `['products', 'low-stock']` |
| All inventory | `['inventory', params]` |
| By product | `['inventory', 'product', productId]` |
| All warehouses | `['warehouses', params]` |
| Single warehouse | `['warehouses', id]` |
| All suppliers | `['suppliers', params]` |
| Single supplier | `['suppliers', id]` |
| All POs | `['purchase-orders', params]` |
| Single PO | `['purchase-orders', id]` |
| All users | `['users', params]` |
| Single user | `['users', id]` |

---

## TypeScript Types

All types live in `frontend/src/types/` and are exported from `index.ts`.

### Common Types

```typescript
// Pagination wrapper — all list endpoints return this
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Common query params for all list endpoints
interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}
```

### Domain Types

```typescript
// Auth
interface LoginCredentials { email: string; password: string; }
interface SignupCredentials { name: string; email: string; password: string; role: UserRole; }
interface AuthResponse { user: User; accessToken: string; refreshToken: string; }

// Product
interface Product {
  _id: string; sku: string; name: string; category: string;
  unit: string; unitPrice: number; reorderPoint: number;
  safetyStock: number; reorderQty: number; leadTimeDays: number;
  primarySupplier: string; status: 'active' | 'inactive' | 'archived';
}

// Inventory
interface InventoryItem {
  _id: string; product: string | Product; warehouse: string | Warehouse;
  quantity: number; zone?: string; lastUpdated: string;
}
interface StockAdjustmentDto {
  productId: string; warehouseId: string;
  quantity: number; type: 'in' | 'out' | 'set'; reason: string;
}

// Purchase Order
type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'received' | 'cancelled' | 'rejected';
interface PurchaseOrder {
  _id: string; poNumber: string; supplier: string | Supplier;
  warehouse: string | Warehouse; items: POLineItem[];
  status: POStatus; totalAmount: number;
}

// Supplier
interface Supplier {
  _id: string; name: string; contactPerson: string; email: string;
  phone: string; address: string; status: 'active' | 'inactive' | 'blacklisted';
  rating: number;
}

// Warehouse
interface Warehouse {
  _id: string; name: string; location: string;
  capacity: number; manager: string; zones: string[];
  status: 'active' | 'inactive';
}

// User
type UserRole = 'admin' | 'warehouse_manager' | 'procurement_officer' | 'supplier';
interface User {
  _id: string; name: string; email: string;
  role: UserRole; isActive: boolean;
}
```

---

## AI Endpoints

These endpoints do not follow the standard CRUD pattern — they invoke AI agents.

### Demand Forecast

```typescript
POST /api/forecast
Authorization: Bearer <token>

// Request
{
  "productId": "...",
  "warehouseId": "...",
  "horizonDays": 7        // optional, default 7
}

// Response
{
  "forecastedAt": "2026-02-19T10:00:00Z",
  "dailyForecasts": [
    { "date": "2026-02-20", "predictedDemand": 45, "confidenceLow": 38, "confidenceHigh": 52 },
    ...
  ],
  "totalPredicted7Day": 315,
  "recommendedReorderQty": 200,
  "recommendedOrderDate": "2026-02-22T00:00:00Z"
}
```

```typescript
GET /api/forecast/predictions?productId=...&warehouseId=...
// Returns stored forecast results from MongoDB
```

### Warehouse Optimization

```typescript
POST /api/warehouse-optimization/analyze
Authorization: Bearer <token>

// Request
{
  "warehouseId": "...",
  "analysisDepthDays": 30    // optional, default 30
}

// Response
{
  "currentUtilization": 78.5,
  "recommendations": [
    {
      "type": "zone_reassignment",
      "priority": "high",
      "description": "Move fast-moving SKUs to Zone A for reduced picking distance",
      "estimatedImpact": "15% reduction in pick time"
    }
  ],
  "estimatedCostSavings": 12000,
  "estimatedEfficiencyGain": 18
}
```

---

## Error Handling

All service functions throw `AxiosError` on failure. React Query hooks catch these and show toasts automatically. For manual error handling:

```typescript
try {
  await someService.create(data);
} catch (error) {
  const axiosError = error as AxiosError<{ message: string; errors: any[] }>;
  const message = axiosError.response?.data?.message ?? 'Something went wrong';
  const fieldErrors = axiosError.response?.data?.errors ?? [];
  // handle...
}
```

Common status codes:

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error — check `errors[]` for field details |
| 401 | Unauthenticated — token missing or expired |
| 403 | Forbidden — insufficient role |
| 404 | Resource not found |
| 409 | Conflict — duplicate entry (e.g., duplicate email or SKU) |
| 500 | Internal server error |

---

## Pagination

All list endpoints support standard query params:

```typescript
GET /api/v1/products?page=2&limit=25&sort=name&order=asc&search=paper&category=paper_products
```

Response includes:
```json
{
  "data": { ... },
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 25,
    "pages": 6
  }
}
```

---

## Adding a New API Integration

1. **Add TypeScript types** in `frontend/src/types/<module>.types.ts`
2. **Add the service** in `frontend/src/lib/api/services/<module>.service.ts`
3. **Add React Query hooks** in `frontend/src/hooks/queries/use-<module>.ts`
4. **Export types** from `frontend/src/types/index.ts`
5. **Use hooks in components** — they handle loading, error, and cache automatically

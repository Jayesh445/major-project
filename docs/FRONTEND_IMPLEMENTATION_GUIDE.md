# 🚀 StationeryChain - Frontend Implementation Guide

**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Tech Stack:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Zustand

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack Rationale](#2-tech-stack-rationale)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder Structure](#4-folder-structure)
5. [State Management Strategy](#5-state-management-strategy)
6. [API Integration Guide](#6-api-integration-guide)
7. [Component Library](#7-component-library)
8. [User Flows by Role](#8-user-flows-by-role)
9. [Screen Specifications](#9-screen-specifications)
10. [Form Validation Strategy](#10-form-validation-strategy)
11. [Authentication Flow](#11-authentication-flow)
12. [Error Handling](#12-error-handling)
13. [Performance Optimization](#13-performance-optimization)
14. [Security Best Practices](#14-security-best-practices)
15. [Testing Strategy](#15-testing-strategy)
16. [Deployment Guide](#16-deployment-guide)
17. [Development Workflow](#17-development-workflow)

---

## 1. Project Overview

**StationeryChain** is an AI-powered, blockchain-enabled supply chain platform for automating stationery logistics, inventory replenishment, and delivery verification.

### Key Features

- ✅ **Multi-role Authentication** - Admin, Warehouse Manager, Procurement Officer, Supplier
- ✅ **Real-time Inventory Tracking** - Multi-warehouse stock management
- ✅ **Autonomous Replenishment** - AI-driven demand forecasting
- ✅ **Purchase Order Management** - Complete workflow from creation to receiving
- ✅ **Supplier Management** - Catalog, contracts, approval workflow
- ✅ **AI-Powered Negotiations** - LangChain/LangGraph agent (future)
- ✅ **Blockchain Logging** - Immutable transaction records (future)
- ✅ **Analytics Dashboards** - Role-specific KPIs and reports

### User Roles

| Role | Description | Key Responsibilities |
|------|-------------|---------------------|
| **Admin** | System oversight | User management, supplier onboarding, system analytics |
| **Warehouse Manager** | Inventory operations | Stock management, receiving, transfers, zone allocation |
| **Procurement Officer** | Order management | Create POs, supplier negotiations, cost optimization |
| **Supplier** | Product fulfillment | Catalog management, order acknowledgment, dispatch |

---

## 2. Tech Stack Rationale

### Frontend Framework: **Next.js 14** with TypeScript

**Why Next.js?**
- ✅ **App Router** - Modern file-based routing with layouts
- ✅ **Server Components** - Better performance and SEO
- ✅ **API Routes** - Built-in backend integration capability
- ✅ **TypeScript** - Type safety across the entire application
- ✅ **Image Optimization** - Built-in next/image for performance
- ✅ **Code Splitting** - Automatic optimization

### UI Framework: **Tailwind CSS** + **shadcn/ui**

**Why Tailwind + shadcn?**
- ✅ **Utility-First** - Rapid UI development
- ✅ **Customizable** - Full control over component styles
- ✅ **Accessible** - Built on Radix UI primitives
- ✅ **No Runtime Overhead** - Zero JS for styling
- ✅ **Copy-Paste Components** - You own the code
- ✅ **Dark Mode Ready** - Built-in theme support

### State Management: **Zustand**

**Why Zustand over Redux?**
- ✅ **Minimal Boilerplate** - Less code, more productivity
- ✅ **Small Bundle** - ~1KB (vs Redux ~10KB)
- ✅ **TypeScript Native** - Excellent type inference
- ✅ **No Provider Wrapper** - Direct store access
- ✅ **DevTools Support** - Easy debugging
- ✅ **Middleware Support** - Persist, immer, devtools

### Server State: **React Query** (TanStack Query)

**Why React Query?**
- ✅ **Automatic Caching** - Reduces API calls
- ✅ **Background Refetching** - Always fresh data
- ✅ **Optimistic Updates** - Better UX
- ✅ **Request Deduplication** - Prevents duplicate requests
- ✅ **DevTools** - Query debugging interface
- ✅ **TypeScript Support** - Full type inference

### Form Management: **React Hook Form** + **Zod**

**Why This Combo?**
- ✅ **Performance** - Uncontrolled components, less re-renders
- ✅ **Type Safety** - Zod schemas for validation
- ✅ **Bundle Size** - Small footprint
- ✅ **Developer Experience** - Simple API, great errors
- ✅ **Integration** - Works seamlessly with shadcn/ui

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   App Router │  │  Components  │  │    Stores    │          │
│  │   (Pages)    │  │  (shadcn/ui) │  │   (Zustand)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                    │
│                     API Client Layer                            │
│                   (Axios + React Query)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Routes     │  │ Controllers  │  │   Services   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                            │                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Models     │  │  AI Agents   │  │  Blockchain  │          │
│  │  (Mongoose)  │  │ (LangChain)  │  │   (Web3.js)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  MongoDB    │
                      └─────────────┘
```

### Data Flow

```
User Action (UI Event)
    ↓
Component Event Handler
    ↓
React Query Mutation / Zustand Action
    ↓
API Client (Axios with interceptors)
    ↓
Backend API Endpoint
    ↓
Database Operation (MongoDB)
    ↓
Response (JSON)
    ↓
React Query Cache Update
    ↓
Zustand Store Update (if needed)
    ↓
Component Re-render
    ↓
Updated UI
```

---

## 4. Folder Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (grouped)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   ├── dashboard/                # Protected dashboard routes
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Admin overview
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── suppliers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── warehouses/
│   │   │   │       └── page.tsx
│   │   │   ├── warehouse/
│   │   │   │   ├── page.tsx          # Warehouse overview
│   │   │   │   ├── inventory/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── transfers/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── receiving/
│   │   │   │       └── page.tsx
│   │   │   ├── procurement/
│   │   │   │   ├── page.tsx          # Procurement overview
│   │   │   │   └── purchase-orders/
│   │   │   │       ├── page.tsx
│   │   │   │       └── new/
│   │   │   │           └── page.tsx
│   │   │   └── supplier/
│   │   │       ├── page.tsx          # Supplier overview
│   │   │       ├── catalog/
│   │   │       │   └── page.tsx
│   │   │       └── orders/
│   │   │           └── page.tsx
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/                   # Layout components
│   │   │   ├── app-layout.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── protected-route.tsx
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── auth/
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── signup-form.tsx
│   │   │   ├── users/
│   │   │   │   ├── user-table.tsx
│   │   │   │   └── user-form.tsx
│   │   │   ├── products/
│   │   │   │   ├── product-table.tsx
│   │   │   │   ├── product-form.tsx
│   │   │   │   └── bulk-upload-modal.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── inventory-table.tsx
│   │   │   │   ├── stock-adjustment-modal.tsx
│   │   │   │   └── transfer-modal.tsx
│   │   │   ├── purchase-orders/
│   │   │   │   ├── po-table.tsx
│   │   │   │   ├── po-form.tsx
│   │   │   │   └── po-wizard.tsx
│   │   │   ├── suppliers/
│   │   │   │   ├── supplier-table.tsx
│   │   │   │   └── supplier-form.tsx
│   │   │   └── warehouses/
│   │   │       ├── warehouse-card.tsx
│   │   │       └── warehouse-form.tsx
│   │   └── shared/                   # Shared components
│   │       ├── data-table.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── pagination.tsx
│   │       └── stats-card.tsx
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── user-store.ts
│   │   ├── product-store.ts
│   │   ├── inventory-store.ts
│   │   ├── purchase-order-store.ts
│   │   ├── supplier-store.ts
│   │   └── warehouse-store.ts
│   │
│   ├── lib/                          # Utilities and configs
│   │   ├── api/
│   │   │   ├── client.ts             # Axios instance
│   │   │   └── services/             # API service functions
│   │   │       ├── auth.service.ts
│   │   │       ├── user.service.ts
│   │   │       ├── product.service.ts
│   │   │       ├── inventory.service.ts
│   │   │       ├── purchase-order.service.ts
│   │   │       ├── supplier.service.ts
│   │   │       └── warehouse.service.ts
│   │   ├── utils/
│   │   │   ├── cn.ts                 # Class name utility
│   │   │   ├── format.ts             # Formatters (date, currency)
│   │   │   └── validators.ts         # Custom validators
│   │   └── constants/
│   │       ├── routes.ts             # Route constants
│   │       └── enums.ts              # Enums (roles, status)
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-users.ts
│   │   ├── use-products.ts
│   │   ├── use-inventory.ts
│   │   ├── use-purchase-orders.ts
│   │   ├── use-suppliers.ts
│   │   ├── use-warehouses.ts
│   │   ├── use-toast.ts
│   │   └── use-debounce.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── product.types.ts
│   │   ├── inventory.types.ts
│   │   ├── purchase-order.types.ts
│   │   ├── supplier.types.ts
│   │   └── warehouse.types.ts
│   │
│   └── config/                       # App configuration
│       ├── site.ts                   # Site metadata
│       └── navigation.ts             # Navigation config
│
├── public/                           # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── .env.local                        # Environment variables
├── .env.example                      # Example env file
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── components.json                   # shadcn/ui config
└── package.json
```

---

## 5. State Management Strategy

### Zustand Store Pattern

```typescript
// stores/auth-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'warehouse_manager' | 'procurement_officer' | 'supplier';
  isActive: boolean;
}

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        
        // Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        setTokens: (accessToken, refreshToken) => 
          set({ accessToken, refreshToken }),
        
        logout: () => 
          set({ 
            user: null, 
            accessToken: null, 
            refreshToken: null, 
            isAuthenticated: false 
          }),
        
        updateProfile: (updates) => {
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser, ...updates } });
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          refreshToken: state.refreshToken,
        }),
      }
    )
  )
);
```

### Store Organization

| Store | Purpose | Key State | Key Actions |
|-------|---------|-----------|-------------|
| `authStore` | Authentication | user, tokens | login, logout, refreshToken |
| `userStore` | User management | users, filters | fetchUsers, createUser, updateUser |
| `productStore` | Product catalog | products, pagination | fetchProducts, createProduct, search |
| `inventoryStore` | Inventory data | inventory, lowStock | fetchInventory, adjustStock, transfer |
| `purchaseOrderStore` | PO management | orders, draftOrder | createPO, submitPO, approvePO |
| `supplierStore` | Supplier data | suppliers | fetchSuppliers, addCatalog |
| `warehouseStore` | Warehouse data | warehouses | fetchWarehouses, addZone |

---

## 6. API Integration Guide

### API Client Setup

```typescript
// lib/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/hooks/use-toast';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/users/refresh-token`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Update tokens
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Service Example

```typescript
// lib/api/services/product.service.ts
import apiClient from '../client';
import { 
  Product, 
  CreateProductDto, 
  UpdateProductDto, 
  ProductQueryParams,
  PaginatedResponse 
} from '@/types';

export const productService = {
  /**
   * Get all products with filters and pagination
   */
  getAll: async (params?: ProductQueryParams): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get('/products', { params });
    return response.data.data;
  },
  
  /**
   * Get product by ID
   */
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  },
  
  /**
   * Create new product
   */
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data.data;
  },
  
  /**
   * Update product
   */
  update: async (id: string, data: UpdateProductDto): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data.data;
  },
  
  /**
   * Delete product (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
  
  /**
   * Search products
   */
  search: async (query: string): Promise<Product[]> => {
    const response = await apiClient.get('/products/search', { 
      params: { q: query } 
    });
    return response.data.data.products;
  },
  
  /**
   * Get low stock products
   */
  getLowStock: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products/low-stock');
    return response.data.data;
  },
  
  /**
   * Bulk upload products
   */
  bulkUpload: async (file: File): Promise<{ success: number; failed: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/products/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.data;
  },
};
```

### React Query Hook Example

```typescript
// hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/lib/api/services';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch all products with filters
 */
export const useProducts = (params?: ProductQueryParams) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch single product by ID
 */
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
};

/**
 * Create product mutation
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create product',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Update product mutation
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
    },
  });
};

/**
 * Delete product mutation
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    },
  });
};

/**
 * Search products
 */
export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productService.search(query),
    enabled: query.length > 2, // Only search if query > 2 chars
  });
};
```

---

## 7. Component Library

See [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) for detailed component specifications.

**Key Components:**

### Layout Components
- `AppLayout` - Main dashboard layout with sidebar
- `Sidebar` - Role-based navigation menu
- `Header` - User menu, notifications, logout
- `ProtectedRoute` - Route guard for authentication

### Data Display
- `DataTable` - Sortable, filterable, paginated table
- `StatsCard` - KPI display card
- `Badge` - Status indicators
- `Avatar` - User avatar with fallback
- `EmptyState` - No data placeholder

### Forms
- `Form` - React Hook Form wrapper
- `Input`, `Select`, `Textarea`, `Checkbox`
- `DatePicker`, `TimePicker`
- `FileUpload`
- `FormField` - Field with label and error

### Feedback
- `Toast` - Notification system
- `Alert` - Inline alerts
- `Dialog` - Modal dialogs
- `Drawer` - Side panel
- `LoadingSpinner` - Loading states

### Charts (Recharts)
- `LineChart` - Trends
- `BarChart` - Comparisons
- `PieChart` - Distribution
- `AreaChart` - Time series

---

## 8. User Flows by Role

### Admin User Flow

```
Login → Admin Dashboard
  ├─→ User Management
  │     ├─→ View users table
  │     ├─→ Add new user
  │     ├─→ Edit user details
  │     ├─→ Deactivate/Delete user
  │     └─→ View active sessions
  │
  ├─→ Supplier Management
  │     ├─→ View suppliers table
  │     ├─→ Add new supplier
  │     ├─→ Approve/Reject supplier
  │     ├─→ Manage supplier catalog
  │     ├─→ Edit contract terms
  │     └─→ View performance metrics
  │
  ├─→ Product Management
  │     ├─→ View products table
  │     ├─→ Add new product
  │     ├─→ Bulk upload products (CSV)
  │     ├─→ Edit product details
  │     ├─→ View low stock products
  │     └─→ Delete product
  │
  ├─→ Warehouse Management
  │     ├─→ View warehouses (grid/list)
  │     ├─→ Add new warehouse
  │     ├─→ Edit warehouse details
  │     ├─→ Manage warehouse zones
  │     ├─→ View capacity report
  │     ├─→ View inventory summary
  │     └─→ Assign manager
  │
  └─→ Analytics
        ├─→ Order analytics
        ├─→ Inventory analytics
        ├─→ Supplier performance
        └─→ Revenue trends
```

### Warehouse Manager User Flow

```
Login → Warehouse Dashboard (WH-XXX-XX)
  ├─→ Inventory Management
  │     ├─→ View stock levels (all products)
  │     ├─→ Filter by zone/category
  │     ├─→ Adjust stock manually
  │     ├─→ View transaction history
  │     └─→ View low stock alerts
  │
  ├─→ Stock Transfers
  │     ├─→ View transfer requests
  │     ├─→ Initiate transfer to another warehouse
  │     ├─→ Approve/Execute transfer
  │     └─→ Track transfer status
  │
  ├─→ Purchase Orders (Receiving)
  │     ├─→ View incoming POs
  │     ├─→ View PO line items
  │     ├─→ Receive full PO
  │     ├─→ Partial receiving
  │     └─→ Update inventory on receive
  │
  ├─→ Zone Management
  │     ├─→ View zone utilization
  │     ├─→ Update zone capacity
  │     └─→ Reassign products to zones
  │
  └─→ Reports
        ├─→ Stock report
        ├─→ Capacity utilization report
        ├─→ Transaction history
        └─→ Receiving report
```

### Procurement Officer User Flow

```
Login → Procurement Dashboard
  ├─→ Purchase Orders
  │     ├─→ View all POs (filter by status)
  │     ├─→ View PO details
  │     ├─→ Create new PO
  │     │     ├─→ Select supplier
  │     │     ├─→ Select warehouse
  │     │     ├─→ Add products (line items)
  │     │     ├─→ Review total
  │     │     └─→ Submit for approval
  │     ├─→ Edit draft PO
  │     ├─→ Cancel PO
  │     └─→ Export PO to PDF
  │
  ├─→ Inventory Monitoring
  │     ├─→ View stock levels across warehouses
  │     ├─→ View low stock alerts
  │     ├─→ Trigger replenishment
  │     └─→ View demand forecast (future)
  │
  ├─→ Supplier Negotiations (Future)
  │     ├─→ View AI negotiation results
  │     ├─→ Override AI decisions
  │     └─→ View savings analytics
  │
  └─→ Reports
        ├─→ PO analytics
        ├─→ Cost analysis
        ├─→ Supplier comparison
        └─→ Savings report
```

### Supplier User Flow

```
Login → Supplier Dashboard
  ├─→ Product Catalog
  │     ├─→ View my products
  │     ├─→ Add new product
  │     ├─→ Update pricing
  │     ├─→ Update lead time
  │     ├─→ Set MOQ (Minimum Order Quantity)
  │     └─→ Update availability
  │
  ├─→ Incoming Orders
  │     ├─→ View new POs
  │     ├─→ View PO line items
  │     ├─→ Acknowledge order
  │     ├─→ Mark as dispatched
  │     └─→ Download PO PDF
  │
  ├─→ Negotiation Requests (Future)
  │     ├─→ View AI offers
  │     ├─→ Accept offer
  │     ├─→ Counter offer
  │     ├─→ Reject offer
  │     └─→ View negotiation history
  │
  └─→ Performance Metrics
        ├─→ Order fulfillment rate
        ├─→ Average delivery time
        ├─→ Rating history
        └─→ Revenue trends
```

---

## 9. Screen Specifications

See [SCREEN_SPECIFICATIONS.md](./SCREEN_SPECIFICATIONS.md) for detailed wireframes and component breakdown.

**Key Screens:**

### Authentication
- Login page
- Signup page
- Forgot password
- Reset password

### Admin Dashboard
- Overview dashboard
- User management table
- Supplier management table
- Product management table
- Warehouse management cards
- Analytics dashboard

### Warehouse Manager Dashboard
- Warehouse overview
- Inventory table
- Transfer requests
- Receiving workflow
- Zone management
- Stock reports

### Procurement Officer Dashboard
- Procurement overview
- PO list table
- Create PO wizard
- PO details drawer
- Inventory monitoring
- Cost analysis charts

### Supplier Dashboard
- Supplier overview
- Catalog management
- Incoming orders table
- Order details modal
- Performance dashboard

---

## 10. Form Validation Strategy

### Zod Schema Pattern

```typescript
// lib/validators/product.validator.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  
  description: z.string().optional(),
  
  category: z.enum([
    'writing_instruments',
    'paper_products',
    'office_supplies',
    'filing_storage',
    'desk_accessories',
    'presentation',
    'technology',
    'other'
  ]),
  
  unit: z.enum(['piece', 'kg', 'litre', 'box', 'pallet', 'carton']),
  
  unitPrice: z.number()
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01'),
  
  reorderPoint: z.number()
    .int('Reorder point must be an integer')
    .min(0, 'Reorder point cannot be negative'),
  
  safetyStock: z.number()
    .int('Safety stock must be an integer')
    .min(0, 'Safety stock cannot be negative'),
  
  reorderQty: z.number()
    .int('Reorder quantity must be an integer')
    .positive('Reorder quantity must be positive'),
  
  leadTimeDays: z.number()
    .int('Lead time must be an integer')
    .min(0, 'Lead time cannot be negative'),
  
  primarySupplier: z.string()
    .min(1, 'Primary supplier is required'),
  
  alternateSuppliers: z.array(z.string()).optional(),
  
  imageUrl: z.string().url('Must be a valid URL').optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

### Form Component with React Hook Form

```typescript
// components/features/products/product-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, type CreateProductInput } from '@/lib/validators';
import { useCreateProduct } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

export function ProductForm() {
  const { mutate: createProduct, isPending } = useCreateProduct();
  
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category: 'office_supplies',
      unit: 'piece',
      unitPrice: 0,
      reorderPoint: 0,
      safetyStock: 0,
      reorderQty: 0,
      leadTimeDays: 0,
      primarySupplier: '',
      alternateSuppliers: [],
    },
  });
  
  const onSubmit = (data: CreateProductInput) => {
    createProduct(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="PEN-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Blue Ball Pen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Add more fields... */}
        
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Product'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 11. Authentication Flow

### Login Flow Diagram

```
User enters credentials
    ↓
Form validation (Zod)
    ↓
POST /api/v1/users/login
    ↓
Backend validates credentials
    ↓
Backend returns: { user, accessToken, refreshToken }
    ↓
Store in Zustand (authStore)
    ↓
Store refreshToken in localStorage (via persist middleware)
    ↓
Redirect based on role:
  - admin → /dashboard/admin
  - warehouse_manager → /dashboard/warehouse
  - procurement_officer → /dashboard/procurement
  - supplier → /dashboard/supplier
```

### Token Refresh Flow

```
API call fails with 401
    ↓
Interceptor catches error
    ↓
GET refreshToken from authStore
    ↓
POST /api/v1/users/refresh-token
    ↓
Backend validates refreshToken
    ↓
Backend returns: { accessToken, refreshToken }
    ↓
Update tokens in authStore
    ↓
Retry original API call with new token
    ↓
If refresh fails:
  - Logout user
  - Clear authStore
  - Redirect to /login
```

### Protected Route Component

```typescript
// components/layout/protected-route.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user, allowedRoles, router]);
  
  if (!isAuthenticated) {
    return null; // or loading spinner
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // or unauthorized page
  }
  
  return <>{children}</>;
}
```

---

## 12. Error Handling

### Global Error Boundary

```typescript
// components/shared/error-boundary.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (e.g., Sentry)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </AlertDescription>
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4"
            >
              Try again
            </Button>
          </Alert>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handling Pattern

```typescript
// lib/api/error-handler.ts
import { AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';

export function handleApiError(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    
    switch (statusCode) {
      case 400:
        toast({
          title: 'Invalid Request',
          description: message,
          variant: 'destructive',
        });
        break;
      
      case 401:
        toast({
          title: 'Unauthorized',
          description: 'Please login to continue',
          variant: 'destructive',
        });
        break;
      
      case 403:
        toast({
          title: 'Forbidden',
          description: 'You do not have permission to perform this action',
          variant: 'destructive',
        });
        break;
      
      case 404:
        toast({
          title: 'Not Found',
          description: message,
          variant: 'destructive',
        });
        break;
      
      case 500:
        toast({
          title: 'Server Error',
          description: 'An internal server error occurred',
          variant: 'destructive',
        });
        break;
      
      default:
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
    }
  } else {
    toast({
      title: 'Error',
      description: 'An unexpected error occurred',
      variant: 'destructive',
    });
  }
}
```

---

## 13. Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(() => import('@/components/charts/line-chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Disable SSR for client-only components
});

const BulkUploadModal = dynamic(
  () => import('@/components/features/products/bulk-upload-modal'),
  { loading: () => <div>Loading...</div> }
);
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/product-image.jpg"
  alt="Product"
  width={300}
  height={300}
  quality={75}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Debounced Search

```typescript
// hooks/use-debounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage in search component
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 500);

const { data } = useSearchProducts(debouncedQuery);
```

### Virtual Scrolling for Large Lists

```typescript
// For very large datasets (1000+ items)
import { useVirtualizer } from '@tanstack/react-virtual';

function ProductList({ products }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
  });
  
  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {products[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 14. Security Best Practices

### Input Sanitization

```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
```

### XSS Prevention

```typescript
// Always use Zod validation for user inputs
// Never use dangerouslySetInnerHTML unless sanitized
// Use textContent instead of innerHTML where possible

// BAD
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD
<div>{userInput}</div>

// Or if HTML needed
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />
```

### CSRF Protection

```typescript
// Add CSRF token to forms (if using session-based auth)
// For JWT: Use httpOnly cookies instead of localStorage (future enhancement)

// Current implementation uses localStorage for refresh token
// Consider moving to httpOnly cookies for production
```

### Environment Variables

```bash
# .env.local (Never commit this file)
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production
NEXT_PUBLIC_API_URL=https://api.stationerychain.com/api/v1
NEXT_PUBLIC_APP_URL=https://app.stationerychain.com
```

---

## 15. Testing Strategy

### Unit Tests (Vitest)

```typescript
// __tests__/components/stats-card.test.tsx
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/shared/stats-card';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Orders" value={125} />);
    
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
  });
  
  it('renders with trend indicator', () => {
    render(<StatsCard title="Revenue" value={50000} trend={12.5} />);
    
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// __tests__/features/products/product-crud.test.tsx
import { renderWithProviders } from '@/test-utils';
import { ProductTable } from '@/components/features/products/product-table';
import { productHandlers } from '@/mocks/handlers';
import { setupServer } from 'msw/node';

const server = setupServer(...productHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Product CRUD', () => {
  it('displays products list', async () => {
    renderWithProviders(<ProductTable />);
    
    expect(await screen.findByText('Blue Ball Pen')).toBeInTheDocument();
    expect(screen.getByText('PEN-001')).toBeInTheDocument();
  });
  
  it('creates new product', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductForm />);
    
    await user.type(screen.getByLabelText('SKU'), 'PEN-002');
    await user.type(screen.getByLabelText('Name'), 'Red Pen');
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    expect(await screen.findByText('Product created successfully')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/product-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/admin');
  });
  
  test('admin can create product', async ({ page }) => {
    await page.goto('/dashboard/admin/products');
    await page.click('text=Add Product');
    
    await page.fill('[name="sku"]', 'PEN-TEST-001');
    await page.fill('[name="name"]', 'Test Pen');
    await page.selectOption('[name="category"]', 'writing_instruments');
    await page.fill('[name="unitPrice"]', '15.00');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Product created successfully')).toBeVisible();
    await expect(page.locator('text=PEN-TEST-001')).toBeVisible();
  });
});
```

---

## 16. Deployment Guide

### Frontend Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link project
vercel link

# 4. Deploy to preview
vercel

# 5. Deploy to production
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
```
NEXT_PUBLIC_API_URL=https://api.stationerychain.com/api/v1
NEXT_PUBLIC_APP_URL=https://app.stationerychain.com
```

### Alternative: Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000/api/v1
    depends_on:
      - backend
```

---

## 17. Development Workflow

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/product-management
git add .
git commit -m "feat: add product management UI"
git push origin feature/product-management

# Create PR on GitHub
# After review and approval, merge to main
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Code Review Checklist

- [ ] Code follows project structure
- [ ] TypeScript types are properly defined
- [ ] Components are properly decomposed
- [ ] Forms have validation
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design works
- [ ] No console.logs in production code
- [ ] Tests added for new features
- [ ] Documentation updated

### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Conclusion

This guide provides a comprehensive foundation for building the StationeryChain frontend. Follow the architecture, patterns, and best practices outlined here to ensure consistency and maintainability.

**Next Steps:**
1. Setup development environment
2. Initialize Next.js project
3. Install dependencies
4. Configure Tailwind + shadcn/ui
5. Start with Phase 1 (Authentication)

**Additional Resources:**
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation
- [SCREEN_SPECIFICATIONS.md](./SCREEN_SPECIFICATIONS.md) - Detailed screen specs
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) - Component catalog
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Week-by-week plan

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Maintained By:** StationeryChain Team

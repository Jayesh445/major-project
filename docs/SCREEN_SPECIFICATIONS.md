# Screen Specifications - StationeryChain Frontend

**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

---

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Common Components](#common-components)
4. [Authentication Screens](#authentication-screens)
5. [Admin Dashboard & Screens](#admin-dashboard--screens)
6. [Warehouse Manager Dashboard & Screens](#warehouse-manager-dashboard--screens)
7. [Procurement Officer Dashboard & Screens](#procurement-officer-dashboard--screens)
8. [Supplier Dashboard & Screens](#supplier-dashboard--screens)
9. [Developer Tools & Agent Monitoring](#developer-tools--agent-monitoring)
10. [Responsive Design Guidelines](#responsive-design-guidelines)

---

## 1. Overview

This document provides detailed wireframes and specifications for all screens in the StationeryChain platform. Each screen includes:
- Layout structure
- Component breakdown
- Data requirements
- User interactions
- API integrations
- Responsive behavior

### Screen Naming Convention
```
/app/(auth)/login/page.tsx           → Login Screen
/app/(dashboard)/admin/page.tsx      → Admin Dashboard
/app/(dashboard)/products/page.tsx   → Product List
```

---

## 2. Design System

### Color Palette
```css
/* Primary Colors */
--primary: 222.2 47.4% 11.2%        /* Dark Blue-Gray */
--primary-foreground: 210 40% 98%   /* Light Text */

/* Secondary Colors */
--secondary: 210 40% 96.1%          /* Light Gray */
--secondary-foreground: 222.2 47.4% 11.2%

/* Accent Colors */
--accent: 210 40% 96.1%
--accent-foreground: 222.2 47.4% 11.2%

/* Status Colors */
--success: 142 76% 36%              /* Green */
--warning: 38 92% 50%               /* Orange */
--error: 0 84% 60%                  /* Red */
--info: 221 83% 53%                 /* Blue */

/* Background Colors */
--background: 0 0% 100%             /* White */
--foreground: 222.2 84% 4.9%        /* Dark Text */

/* Muted Colors */
--muted: 210 40% 96.1%
--muted-foreground: 215.4 16.3% 46.9%

/* Border & Input */
--border: 214.3 31.8% 91.4%
--input: 214.3 31.8% 91.4%
--ring: 222.2 47.4% 11.2%
```

### Typography
```css
/* Font Family */
font-family: Inter, system-ui, -apple-system, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */
--text-2xl: 1.5rem     /* 24px */
--text-3xl: 1.875rem   /* 30px */
--text-4xl: 2.25rem    /* 36px */

/* Font Weights */
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Spacing System
```
4px   → 1 unit   (p-1, m-1)
8px   → 2 units  (p-2, m-2)
12px  → 3 units  (p-3, m-3)
16px  → 4 units  (p-4, m-4)
20px  → 5 units  (p-5, m-5)
24px  → 6 units  (p-6, m-6)
32px  → 8 units  (p-8, m-8)
48px  → 12 units (p-12, m-12)
64px  → 16 units (p-16, m-16)
```

### Border Radius
```
--radius-sm: 0.375rem   /* 6px */
--radius-md: 0.5rem     /* 8px */
--radius-lg: 0.75rem    /* 12px */
--radius-xl: 1rem       /* 16px */
```

---

## 3. Common Components

### 3.1 Navigation Bar (Top)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] StationeryChain    [Search Bar]    [🔔] [👤 User Menu]  │
└─────────────────────────────────────────────────────────────────┘
```

**Component:** `app/components/layout/Navbar.tsx`

**Structure:**
- Left: Logo (clickable, routes to dashboard)
- Center: Global search bar (products, orders, suppliers)
- Right: Notifications bell + User dropdown menu

**User Dropdown:**
- Profile
- Settings
- Switch Role (if multi-role)
- Logout

**Notifications:**
- Real-time notifications
- Badge count indicator
- Dropdown with recent 5 notifications
- "View All" link

---

### 3.2 Sidebar Navigation
```
┌──────────────────┐
│ 🏠 Dashboard     │
│ 📦 Products      │
│ 📊 Inventory     │
│ 🛒 Orders        │
│ 🏭 Warehouses    │
│ 🚚 Suppliers     │
│ 👥 Users         │
│ ⚙️  Settings     │
│ 🔧 Dev Tools     │ ← New: Agent Monitor
└──────────────────┘
```

**Component:** `app/components/layout/Sidebar.tsx`

**Features:**
- Collapsible/expandable
- Active route highlighting
- Role-based menu items
- Icon + text labels
- Hover states
- Nested menu support

**Responsive:**
- Desktop: Fixed left sidebar (256px width)
- Tablet: Collapsible (icons only, 64px width)
- Mobile: Slide-out drawer

---

### 3.3 Page Header
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Page Title                          [Action Buttons]   │
│ Breadcrumb > Navigation > Current Page                          │
└─────────────────────────────────────────────────────────────────┘
```

**Component:** `app/components/layout/PageHeader.tsx`

**Props:**
```typescript
interface PageHeaderProps {
  title: string
  breadcrumbs?: Breadcrumb[]
  backLink?: string
  actions?: React.ReactNode
  description?: string
}
```

---

### 3.4 Data Table
```
┌─────────────────────────────────────────────────────────────────┐
│ [Search...] [Filter ▼] [Sort ▼]          [+ Add New] [Export]  │
├─────────────────────────────────────────────────────────────────┤
│ ☐ │ Name        │ Category    │ Stock   │ Status   │ Actions  │
├─────────────────────────────────────────────────────────────────┤
│ ☐ │ Pen Blue    │ Stationery  │ 1,250   │ ✅ Active │ [⋮]     │
│ ☐ │ A4 Paper    │ Paper       │ 500     │ ✅ Active │ [⋮]     │
│ ☐ │ Stapler     │ Office      │ 50      │ ⚠️  Low   │ [⋮]     │
├─────────────────────────────────────────────────────────────────┤
│ Showing 1-10 of 156           [< Prev] [1] [2] [3] ... [Next >]│
└─────────────────────────────────────────────────────────────────┘
```

**Component:** `app/components/common/DataTable.tsx`

**Features:**
- Column sorting (asc/desc)
- Multi-select checkboxes
- Bulk actions
- Row actions menu
- Pagination
- Search/filter
- Responsive columns
- Loading skeleton
- Empty state

**Props:**
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchable?: boolean
  filterable?: boolean
  selectable?: boolean
  onRowClick?: (row: T) => void
  actions?: TableAction[]
  isLoading?: boolean
  pagination?: PaginationProps
}
```

---

### 3.5 Stat Card
```
┌───────────────────────┐
│ Total Products        │
│ 1,234                 │
│ ↑ 12% from last month │
└───────────────────────┘
```

**Component:** `app/components/common/StatCard.tsx`

**Variants:**
- Default (white background)
- Primary (colored background)
- Gradient
- With icon
- With trend indicator

---

### 3.6 Form Components

**Text Input:**
```
┌─────────────────────────────────┐
│ Label *                         │
│ ┌─────────────────────────────┐ │
│ │ Placeholder text...         │ │
│ └─────────────────────────────┘ │
│ Helper text or error message    │
└─────────────────────────────────┘
```

**Select Dropdown:**
```
┌─────────────────────────────────┐
│ Category *                      │
│ ┌─────────────────────────────┐ │
│ │ Select category...        ▼ │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Date Picker:**
```
┌─────────────────────────────────┐
│ Delivery Date                   │
│ ┌─────────────────────────────┐ │
│ │ MM/DD/YYYY              📅  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 4. Authentication Screens

### 4.1 Login Screen

**Route:** `/login`  
**Component:** `app/(auth)/login/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │                     │                      │
│                    │   [Logo] Large      │                      │
│                    │   StationeryChain   │                      │
│                    │                     │                      │
│                    │   Welcome Back      │                      │
│                    │   Sign in to your   │                      │
│                    │   account           │                      │
│                    │                     │                      │
│                    │  Email              │                      │
│                    │  [input field]      │                      │
│                    │                     │                      │
│                    │  Password           │                      │
│                    │  [input field] [👁] │                      │
│                    │                     │                      │
│                    │  [☐] Remember me    │                      │
│                    │  Forgot password? → │                      │
│                    │                     │                      │
│                    │  [Sign In Button]   │                      │
│                    │                     │                      │
│                    │  Don't have account?│                      │
│                    │  Sign up →          │                      │
│                    └─────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Centered card (max-width: 400px)
- Gradient background
- Logo at top
- Form fields with validation
- Remember me checkbox
- Forgot password link
- Sign up link

**Form Fields:**
```typescript
interface LoginForm {
  email: string      // Required, email format
  password: string   // Required, min 8 chars
  rememberMe: boolean
}
```

**Validation (Zod):**
```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional()
})
```

**API Integration:**
- `POST /api/user/login`
- Store tokens in localStorage/cookies
- Redirect based on role:
  - Admin → `/admin`
  - Warehouse Manager → `/warehouse`
  - Procurement Officer → `/procurement`
  - Supplier → `/supplier`

**Error Handling:**
- Display error toast for invalid credentials
- Show validation errors inline
- Lock account after 5 failed attempts

---

### 4.2 Signup Screen

**Route:** `/signup`  
**Component:** `app/(auth)/signup/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│                    ┌─────────────────────┐                      │
│                    │  Create Account     │                      │
│                    │                     │                      │
│                    │  Full Name          │                      │
│                    │  [input]            │                      │
│                    │                     │                      │
│                    │  Email              │                      │
│                    │  [input]            │                      │
│                    │                     │                      │
│                    │  Password           │                      │
│                    │  [input] [👁]       │                      │
│                    │  • 8+ chars         │                      │
│                    │  • 1 uppercase      │                      │
│                    │  • 1 number         │                      │
│                    │                     │                      │
│                    │  Confirm Password   │                      │
│                    │  [input] [👁]       │                      │
│                    │                     │                      │
│                    │  Role               │                      │
│                    │  [Select dropdown]  │                      │
│                    │                     │                      │
│                    │  [☐] I agree to     │                      │
│                    │  Terms & Conditions │                      │
│                    │                     │                      │
│                    │  [Create Account]   │                      │
│                    │                     │                      │
│                    │  Have an account?   │                      │
│                    │  Sign in →          │                      │
│                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

**Form Fields:**
```typescript
interface SignupForm {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: 'admin' | 'warehouse_manager' | 'procurement_officer' | 'supplier'
  agreeToTerms: boolean
}
```

**Password Strength Indicator:**
- Visual progress bar
- Requirements checklist:
  - Min 8 characters
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character

**API Integration:**
- `POST /api/user/signup`
- Auto-login after signup
- Send verification email (future)

---

### 4.3 Forgot Password Screen

**Route:** `/forgot-password`

```
┌─────────────────────────────────────────────────────────────────┐
│                    ┌─────────────────────┐                      │
│                    │  Forgot Password?   │                      │
│                    │                     │                      │
│                    │  Enter your email   │                      │
│                    │  and we'll send you │                      │
│                    │  reset instructions │                      │
│                    │                     │                      │
│                    │  Email              │                      │
│                    │  [input field]      │                      │
│                    │                     │                      │
│                    │  [Send Reset Link]  │                      │
│                    │                     │                      │
│                    │  ← Back to login    │                      │
│                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Admin Dashboard & Screens

### 5.1 Admin Dashboard

**Route:** `/admin`  
**Component:** `app/(dashboard)/admin/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Admin Dashboard                    [Export] [Settings] │
│ Home > Dashboard                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 📦       │ │ 👥       │ │ 🏭       │ │ 🚚       │           │
│ │ Products │ │ Users    │ │Warehouse │ │ Supplier │           │
│ │ 1,234    │ │ 45       │ │ 8        │ │ 32       │           │
│ │ ↑ 12%    │ │ ↑ 5%     │ │ →        │ │ ↑ 8%     │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ ┌────────────────────────────┐ ┌──────────────────────────┐   │
│ │ Recent Activities          │ │ System Health            │   │
│ ├────────────────────────────┤ ├──────────────────────────┤   │
│ │ • User "John" added        │ │ • API Status: ✅ Healthy │   │
│ │ • Product "Pen" updated    │ │ • Database: ✅ Connected │   │
│ │ • Supplier "ABC" approved  │ │ • Storage: 78% used      │   │
│ │ • Warehouse "WH-1" added   │ │ • Response: 45ms avg     │   │
│ │ [View All Activities →]    │ │ [View Details →]         │   │
│ └────────────────────────────┘ └──────────────────────────┘   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Low Stock Alerts (5 items)                               │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ Product      │ Current │ Threshold │ Warehouse │ Action  │   │
│ │ A4 Paper     │ 50      │ 100       │ WH-01     │ [Order] │   │
│ │ Stapler      │ 15      │ 50        │ WH-02     │ [Order] │   │
│ │ [View All Alerts →]                                      │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Inventory Trends (Last 30 Days)                            │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │         📈 Line Chart                                      │ │
│ │     │                        ╱╲                            │ │
│ │     │                    ╱──╯  ╲                           │ │
│ │     │                ╱──╯       ╲──╲                       │ │
│ │     │            ╱──╯                ╲                     │ │
│ │     └────────────────────────────────────────              │ │
│ │       Week 1   Week 2   Week 3   Week 4                   │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Requirements:**
- Total products count + trend
- Total users count + trend
- Total warehouses count
- Total suppliers count + trend
- Recent 10 activities
- System health metrics
- Low stock alerts (top 5)
- Inventory trend data (30 days)

**API Calls:**
```typescript
// Dashboard stats
GET /api/product/count
GET /api/user/count
GET /api/warehouse/count
GET /api/supplier/count

// Recent activities (from activity log)
GET /api/activity/recent?limit=10

// Low stock alerts
GET /api/inventory/low-stock?limit=5

// Inventory trends
GET /api/inventory/trends?period=30days
```

---

### 5.2 User Management Screen

**Route:** `/admin/users`  
**Component:** `app/(dashboard)/admin/users/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] User Management                    [+ Add User] [⚙️]   │
│ Home > Admin > Users                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│ │ Total   │ │ Active  │ │ Inactive│ │ Pending │               │
│ │ 45      │ │ 38      │ │ 5       │ │ 2       │               │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                 │
│ [🔍 Search users...] [Role ▼] [Status ▼] [Department ▼]       │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ☐ │ Name      │ Email         │ Role    │ Status │ Actions││
│ ├──────────────────────────────────────────────────────────┤   │
│ │ ☐ │ John Doe  │ john@ex.com   │ Admin   │ ✅ Active│ [⋮] ││
│ │ ☐ │ Jane Smith│ jane@ex.com   │ Manager │ ✅ Active│ [⋮] ││
│ │ ☐ │ Bob Wilson│ bob@ex.com    │ Officer │ ⚠️ Pending│[⋮]││
│ │ ☐ │ Alice Lee │ alice@ex.com  │ Supplier│ 🔴 Inactive│[⋮]││
│ ├──────────────────────────────────────────────────────────┤   │
│ │ Showing 1-10 of 45          [< Prev] [1] [2] [3] [Next >]│   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Search by name, email
- Filter by role, status, department
- Bulk actions: Activate, Deactivate, Delete
- Row actions: Edit, View Details, Delete, Reset Password
- Pagination

**Add/Edit User Modal:**
```
┌─────────────────────────────────────────┐
│ Add New User                      [X]   │
├─────────────────────────────────────────┤
│                                         │
│ Full Name *                             │
│ [input]                                 │
│                                         │
│ Email *                                 │
│ [input]                                 │
│                                         │
│ Password *                              │
│ [input] [Generate]                      │
│                                         │
│ Role *                                  │
│ [Select: Admin/Manager/Officer/...]     │
│                                         │
│ Department                              │
│ [Select department]                     │
│                                         │
│ Phone                                   │
│ [input]                                 │
│                                         │
│ Status                                  │
│ (•) Active  ( ) Inactive                │
│                                         │
│ Send welcome email                      │
│ [☐] Send credentials via email          │
│                                         │
│           [Cancel]  [Create User]       │
└─────────────────────────────────────────┘
```

**API Calls:**
```typescript
GET /api/user?page=1&limit=10&role=admin&status=active
POST /api/user (Create user)
PUT /api/user/:id (Update user)
DELETE /api/user/:id (Delete user)
```

---

### 5.3 Product Management Screen

**Route:** `/admin/products`  
**Component:** `app/(dashboard)/admin/products/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Product Management      [+ Add] [Import] [Export]     │
│ Home > Admin > Products                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [🔍 Search products...] [Category ▼] [Status ▼] [Stock ▼]     │
│                                                                 │
│ Grid View [▦] | List View [☰]                                  │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │☐│SKU    │Name    │Category│Price │Stock│Status  │Actions │││
│ ├─────────────────────────────────────────────────────────────┤│
│ │☐│P-001  │Pen Blue│Statry  │₹10  │1,250│✅ Active│ [⋮]    │││
│ │☐│P-002  │A4 Paper│Paper   │₹250 │500  │✅ Active│ [⋮]    │││
│ │☐│P-003  │Stapler │Office  │₹150 │50   │⚠️ Low  │ [⋮]    │││
│ │☐│P-004  │Notebook│Statry  │₹80  │0    │🔴 Out  │ [⋮]    │││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ Showing 1-20 of 1,234       [< Prev] [1][2][3] ... [Next >]│││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Grid View (Alternative):**
```
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ [Image]   │ │ [Image]   │ │ [Image]   │ │ [Image]   │
│ Pen Blue  │ │ A4 Paper  │ │ Stapler   │ │ Notebook  │
│ P-001     │ │ P-002     │ │ P-003     │ │ P-004     │
│ ₹10       │ │ ₹250      │ │ ₹150      │ │ ₹80       │
│ Stock:1250│ │ Stock:500 │ │ Stock:50  │ │ Stock:0   │
│ [View]    │ │ [View]    │ │ [View]    │ │ [View]    │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

**Add Product Modal:**
```
┌─────────────────────────────────────────────────┐
│ Add New Product                           [X]   │
├─────────────────────────────────────────────────┤
│ ┌─ Basic Information ────────────────────────┐  │
│ │                                            │  │
│ │ Product Name *                             │  │
│ │ [input]                                    │  │
│ │                                            │  │
│ │ SKU *                      Category *      │  │
│ │ [input]                    [Select ▼]      │  │
│ │                                            │  │
│ │ Description                                │  │
│ │ [textarea]                                 │  │
│ │                                            │  │
│ │ Brand              Manufacturer            │  │
│ │ [input]            [input]                 │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Pricing ──────────────────────────────────┐  │
│ │ Unit Price *       Tax Rate (%)            │  │
│ │ [₹ input]          [input]                 │  │
│ │                                            │  │
│ │ Cost Price         Selling Price           │  │
│ │ [₹ input]          [₹ input]               │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Inventory ────────────────────────────────┐  │
│ │ Unit of Measure *  Reorder Point *         │  │
│ │ [Select: pcs/box]  [input: 100]            │  │
│ │                                            │  │
│ │ Min Stock Level    Max Stock Level         │  │
│ │ [input: 50]        [input: 5000]           │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Additional Details ───────────────────────┐  │
│ │ HSN Code          Weight (kg)              │  │
│ │ [input]           [input]                  │  │
│ │                                            │  │
│ │ Dimensions (L x W x H cm)                  │  │
│ │ [input] x [input] x [input]                │  │
│ │                                            │  │
│ │ Product Image                              │  │
│ │ [📎 Upload or drag & drop]                 │  │
│ │ PNG, JPG up to 5MB                         │  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ Status: (•) Active  ( ) Inactive                │
│                                                 │
│              [Cancel]  [Save Product]           │
└─────────────────────────────────────────────────┘
```

**API Calls:**
```typescript
GET /api/product?page=1&limit=20&category=stationery
POST /api/product (Create)
PUT /api/product/:id (Update)
DELETE /api/product/:id (Delete)
POST /api/product/bulk-upload (CSV import)
```

---

### 5.4 Warehouse Management Screen

**Route:** `/admin/warehouses`  
**Component:** `app/(dashboard)/admin/warehouses/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Warehouse Management           [+ Add Warehouse]      │
│ Home > Admin > Warehouses                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Total    │ │ Active   │ │ Capacity │ │ Utilization│         │
│ │ 8        │ │ 7        │ │ 50,000m² │ │ 72%      │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ [🔍 Search warehouses...] [Location ▼] [Status ▼]             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Warehouse │Location    │Capacity│Used │Util%│Status│Actions││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ WH-01     │Mumbai      │10,000m²│7,200│72%  │✅ Act│ [⋮]  │││
│ │ WH-02     │Delhi       │8,000m² │6,400│80%  │✅ Act│ [⋮]  │││
│ │ WH-03     │Bangalore   │12,000m²│4,800│40%  │✅ Act│ [⋮]  │││
│ │ WH-04     │Chennai     │6,000m² │5,400│90%  │⚠️ Full│[⋮]  │││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ Showing 1-8 of 8                                            ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 🗺️ Warehouse Map View                                       ││
│ │ [Interactive map with warehouse markers]                    ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Warehouse Detail View:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] WH-01: Mumbai Central Warehouse         [Edit] [⚙️]   │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Warehouse Info ──────────────┐ ┌─ Capacity ──────────────┐  │
│ │ Code: WH-01                   │ │ Total: 10,000 m²        │  │
│ │ Name: Mumbai Central          │ │ Used: 7,200 m²          │  │
│ │ Manager: John Doe             │ │ Available: 2,800 m²     │  │
│ │ Contact: +91-9876543210       │ │ Utilization: 72%        │  │
│ │ Email: wh01@company.com       │ │ [Progress Bar ████░░]   │  │
│ └───────────────────────────────┘ └─────────────────────────┘  │
│                                                                 │
│ ┌─ Zones (5) ───────────────────────────────────────────────┐  │
│ │ Zone    │ Type      │ Capacity │ Used  │ Products │Actions││  │
│ │ A-001   │ Storage   │ 2,000m²  │ 1,800 │ 250      │ [⋮]  ││  │
│ │ B-001   │ Cold      │ 1,500m²  │ 1,200 │ 80       │ [⋮]  ││  │
│ │ C-001   │ Receiving │ 500m²    │ 300   │ 0        │ [⋮]  ││  │
│ │ D-001   │ Dispatch  │ 500m²    │ 400   │ 0        │ [⋮]  ││  │
│ │ [+ Add Zone]                                              ││  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Top Products (Stock) ────────────────────────────────────┐  │
│ │ Product     │ SKU    │ Quantity │ Location │ Last Updated ││  │
│ │ A4 Paper    │ P-002  │ 5,000    │ A-001    │ 2 hours ago  ││  │
│ │ Pen Blue    │ P-001  │ 12,000   │ A-002    │ 5 hours ago  ││  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5.5 Supplier Management Screen

**Route:** `/admin/suppliers`  
**Component:** `app/(dashboard)/admin/suppliers/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Supplier Management         [+ Add] [Import] [Export] │
│ Home > Admin > Suppliers                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Total    │ │ Active   │ │ Pending  │ │ Contracts│           │
│ │ 32       │ │ 28       │ │ 3        │ │ 15       │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ [🔍 Search suppliers...] [Category ▼] [Status ▼] [Rating ▼]   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Code │Name       │Contact    │Category│Rating│Status│Action││
│ ├─────────────────────────────────────────────────────────────┤│
│ │S-001 │ABC Traders│9876543210 │Statry  │⭐⭐⭐⭐⭐│✅ Act│[⋮]  │││
│ │S-002 │XYZ Supply │9876543211 │Paper   │⭐⭐⭐⭐ │✅ Act│[⋮]  │││
│ │S-003 │PQR Corp   │9876543212 │Office  │⭐⭐⭐  │⚠️ Pend│[⋮] │││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ Showing 1-10 of 32          [< Prev] [1] [2] [3] [Next >]  ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Supplier Detail View:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] S-001: ABC Traders              [Edit] [Approve/Block]│
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Supplier Information ────────────────────────────────────┐   │
│ │ Company Name: ABC Traders Pvt Ltd                        │   │
│ │ Code: S-001                                              │   │
│ │ GST Number: 27AABCU9603R1ZM                              │   │
│ │ Contact Person: Ramesh Kumar                             │   │
│ │ Email: ramesh@abctraders.com                             │   │
│ │ Phone: +91-9876543210                                    │   │
│ │ Address: 123 MG Road, Mumbai - 400001                    │   │
│ │ Rating: ⭐⭐⭐⭐⭐ (4.8/5.0)                                  │   │
│ │ Status: ✅ Active                                         │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ [Tab: Overview] [Catalog] [Orders] [Contracts] [Documents]     │
│                                                                 │
│ ┌─ Performance Metrics ─────────────────────────────────────┐  │
│ │ Total Orders: 145      On-Time Delivery: 95%            │  │
│ │ Total Value: ₹12.5L    Average Lead Time: 3 days        │  │
│ │ Quality Score: 4.7/5   Return Rate: 2%                  │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Product Catalog (25 items) ──────────────────────────────┐  │
│ │ Product     │ SKU    │ Price  │ MOQ  │ Lead Time │ Action││  │
│ │ Pen Blue    │ P-001  │ ₹8     │ 500  │ 2 days    │ [View]││  │
│ │ A4 Paper    │ P-002  │ ₹220   │ 100  │ 3 days    │ [View]││  │
│ │ [View All Catalog →]                                     ││  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Recent Orders ───────────────────────────────────────────┐  │
│ │ PO #     │ Date       │ Items │ Amount  │ Status        ││  │
│ │ PO-1001  │ 2026-02-10 │ 5     │ ₹45,000 │ ✅ Delivered   ││  │
│ │ PO-1002  │ 2026-02-12 │ 3     │ ₹28,000 │ 🚚 In Transit ││  │
│ │ [View All Orders →]                                      ││  │
│ └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Warehouse Manager Dashboard & Screens

### 6.1 Warehouse Manager Dashboard

**Route:** `/warehouse`  
**Component:** `app/(dashboard)/warehouse/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ Warehouse Dashboard                          [WH-01 Mumbai ▼]  │
│ Home > Dashboard                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Inventory│ │ Incoming │ │ Outgoing │ │ Capacity │           │
│ │ 1,234    │ │ 15 POs   │ │ 8 Orders │ │ 72%      │           │
│ │ Products │ │ Today    │ │ Pending  │ │ Used     │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ ┌────────────────────────────┐ ┌──────────────────────────┐   │
│ │ Today's Tasks (8)          │ │ Alerts & Notifications   │   │
│ ├────────────────────────────┤ ├──────────────────────────┤   │
│ │ ☐ Receive PO-1001 (3 items)│ │ 🔴 5 products low stock  │   │
│ │ ☐ Process Transfer TR-101  │ │ ⚠️ 2 expiring items      │   │
│ │ ☐ Stock count Zone A-001   │ │ ✅ 3 POs received today  │   │
│ │ ☐ Dispatch Order #5432     │ │ 📦 Zone B at 95% full    │   │
│ │ [View All Tasks →]         │ │ [View All Alerts →]      │   │
│ └────────────────────────────┘ └──────────────────────────┘   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Inventory Movement (Today)                               │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ Time  │ Type     │ Product   │ Qty  │ From → To │ By    │   │
│ │ 09:15 │ Received │ A4 Paper  │ 500  │ PO → A-01 │ John  │   │
│ │ 10:30 │ Transfer │ Pen Blue  │ 1000 │ A-01→B-02 │ Jane  │   │
│ │ 11:45 │ Dispatch │ Stapler   │ 50   │ A-01 → SO │ Bob   │   │
│ │ [View All Movements →]                                   │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Zone Status                                              │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ Zone  │ Type     │ Capacity │ Utilization              │   │
│ │ A-001 │ Storage  │ 2,000m²  │ [████████░░] 80%         │   │
│ │ A-002 │ Storage  │ 1,500m²  │ [██████░░░░] 60%         │   │
│ │ B-001 │ Cold     │ 1,500m²  │ [█████████░] 90%         │   │
│ │ C-001 │ Receive  │ 500m²    │ [███░░░░░░░] 30%         │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Switch between warehouses (dropdown)
- Quick stats for selected warehouse
- Today's tasks checklist
- Real-time alerts
- Inventory movements log
- Zone capacity visualization

---

### 6.2 Inventory Management Screen

**Route:** `/warehouse/inventory`  
**Component:** `app/(dashboard)/warehouse/inventory/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Inventory Management    [+ Add Stock] [Adjust] [Move] │
│ Home > Warehouse > Inventory                    [WH-01 Mumbai ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [🔍 Search products...] [Category ▼] [Zone ▼] [Status ▼]      │
│                                                                 │
│ View: [All] [Low Stock] [Out of Stock] [Expiring Soon]         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │SKU  │Product │Zone │Qty │Reorder│Status    │Last Mvt│Actions││
│ ├─────────────────────────────────────────────────────────────┤│
│ │P-001│Pen Blue│A-001│1250│100    │✅ Good   │2h ago │ [⋮]   │││
│ │P-002│A4 Paper│A-001│500 │100    │✅ Good   │5h ago │ [⋮]   │││
│ │P-003│Stapler │A-002│50  │50     │⚠️ Low   │1d ago │ [⋮]   │││
│ │P-004│Notebook│A-001│0   │100    │🔴 Out   │3d ago │ [⋮]   │││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ Showing 1-20 of 1,234       [< Prev] [1][2][3] ... [Next >]││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Selected: 0 items  [Bulk Actions ▼]                            │
└─────────────────────────────────────────────────────────────────┘
```

**Row Actions:**
- View Details
- Adjust Stock (Add/Remove/Set quantity)
- Move to Zone
- View History
- Generate Report

**Stock Adjustment Modal:**
```
┌─────────────────────────────────────────┐
│ Adjust Stock - P-001: Pen Blue    [X]   │
├─────────────────────────────────────────┤
│                                         │
│ Current Stock: 1,250 units              │
│ Zone: A-001                             │
│                                         │
│ Adjustment Type *                       │
│ (•) Add  ( ) Remove  ( ) Set            │
│                                         │
│ Quantity *                              │
│ [input]                                 │
│                                         │
│ Reason *                                │
│ [Select: Damaged/Expired/Found/Other]   │
│                                         │
│ Notes                                   │
│ [textarea]                              │
│                                         │
│ Reference Document                      │
│ [input: e.g., GRN-001]                  │
│                                         │
│ New Stock: 1,250 + 0 = 1,250            │
│                                         │
│           [Cancel]  [Adjust Stock]      │
└─────────────────────────────────────────┘
```

---

### 6.3 Receiving Screen (GRN - Goods Receipt Note)

**Route:** `/warehouse/receiving`  
**Component:** `app/(dashboard)/warehouse/receiving/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Receiving                      [Scan Barcode] [Print] │
│ Home > Warehouse > Receiving                    [WH-01 Mumbai ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Tab: Pending POs (15)] [In Progress (3)] [Completed Today (8)]│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │PO#   │Supplier   │Date      │Items│Amount  │ETA    │Actions ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │PO-101│ABC Traders│2026-02-10│5    │₹45,000│Today  │[Receive]││
│ │PO-102│XYZ Supply │2026-02-12│3    │₹28,000│Today  │[Receive]││
│ │PO-103│PQR Corp   │2026-02-13│7    │₹62,000│Tomorrow│[View] ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Receive PO Screen:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Receive PO-1001                      [Save] [Complete] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ PO Details ──────────────────────────────────────────────┐   │
│ │ PO Number: PO-1001                                       │   │
│ │ Supplier: ABC Traders                                    │   │
│ │ PO Date: 2026-02-10    Expected: 2026-02-15             │   │
│ │ Total Items: 5         Total Amount: ₹45,000             │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Receiving Items ─────────────────────────────────────────┐  │
│ │Product    │Ordered│Received│Damaged│Accept│Zone  │Status ││  │
│ ├───────────────────────────────────────────────────────────┤  │
│ │Pen Blue   │1000   │[input] │[input]│[calc]│[A-01]│[ ]    ││  │
│ │A4 Paper   │500    │[input] │[input]│[calc]│[A-01]│[ ]    ││  │
│ │Stapler    │200    │[input] │[input]│[calc]│[A-02]│[ ]    ││  │
│ │Notebook   │300    │[input] │[input]│[calc]│[A-01]│[ ]    ││  │
│ │Eraser     │500    │[input] │[input]│[calc]│[A-03]│[ ]    ││  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Quality Check ───────────────────────────────────────────┐  │
│ │ Overall Quality: (•) Good  ( ) Acceptable  ( ) Poor      │  │
│ │                                                          │  │
│ │ Packaging Condition: [Select ▼]                          │  │
│ │                                                          │  │
│ │ Notes:                                                   │  │
│ │ [textarea]                                               │  │
│ │                                                          │  │
│ │ Upload Photos: [📎 Drag & drop or click]                 │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Summary ─────────────────────────────────────────────────┐  │
│ │ Total Ordered: 2,500       Total Received: ___           │  │
│ │ Total Damaged: ___          Total Accepted: ___          │  │
│ │ Acceptance Rate: ___%                                    │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│              [Save Draft]  [Complete Receiving]                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.4 Stock Transfer Screen

**Route:** `/warehouse/transfers`  
**Component:** `app/(dashboard)/warehouse/transfers/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Stock Transfers                    [+ Create Transfer]│
│ Home > Warehouse > Transfers                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Tab: All] [Pending (5)] [In Transit (2)] [Completed (15)]     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │TR#  │Date      │From    │To      │Items│Status      │Actions││
│ ├─────────────────────────────────────────────────────────────┤│
│ │TR-01│2026-02-15│WH-01   │WH-02   │3    │✅ Completed│[View] ││
│ │TR-02│2026-02-14│WH-01   │WH-03   │5    │🚚 Transit │[Track]││
│ │TR-03│2026-02-13│WH-02   │WH-01   │2    │⏳ Pending │[Edit] ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Create Transfer Modal:**
```
┌─────────────────────────────────────────┐
│ Create Stock Transfer             [X]   │
├─────────────────────────────────────────┤
│                                         │
│ From Warehouse *                        │
│ [Select: WH-01 Mumbai]                  │
│                                         │
│ To Warehouse *                          │
│ [Select: WH-02 Delhi]                   │
│                                         │
│ Transfer Date *                         │
│ [Date picker: 2026-02-15]               │
│                                         │
│ ┌─ Items ─────────────────────────────┐ │
│ │Product        │Avail│Qty │[Action] │ │
│ │[Search/Select]│     │    │         │ │
│ │Pen Blue       │1250 │[  ]│ [X]     │ │
│ │A4 Paper       │500  │[  ]│ [X]     │ │
│ │[+ Add Item]                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Reason for Transfer                     │
│ [textarea]                              │
│                                         │
│ Priority                                │
│ ( ) Normal  (•) High  ( ) Urgent        │
│                                         │
│           [Cancel]  [Create Transfer]   │
└─────────────────────────────────────────┘
```

---

## 7. Procurement Officer Dashboard & Screens

### 7.1 Procurement Officer Dashboard

**Route:** `/procurement`  
**Component:** `app/(dashboard)/procurement/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ Procurement Dashboard                        [This Month ▼]    │
│ Home > Dashboard                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Active   │ │ Pending  │ │ This Month│ │ Cost     │           │
│ │ POs: 25  │ │ Apprv: 8 │ │ POs: 45  │ │ Savings: │           │
│ │          │ │          │ │          │ │ ₹2.5L    │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ ┌────────────────────────────┐ ┌──────────────────────────┐   │
│ │ Pending Actions (8)        │ │ Autonomous Recommendations│  │
│ ├────────────────────────────┤ ├──────────────────────────┤   │
│ │ • 5 POs awaiting approval  │ │ 🤖 AI suggests 3 reorders│   │
│ │ • 2 Quotations to review   │ │ • A4 Paper (500 units)   │   │
│ │ • 1 Supplier pending rating│ │ • Pen Blue (1000 units)  │   │
│ │ [View All →]               │ │ • Stapler (200 units)    │   │
│ │                            │ │ Total: ₹45,000           │   │
│ │                            │ │ [Review & Approve]       │   │
│ └────────────────────────────┘ └──────────────────────────┘   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Purchase Order Pipeline                                  │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ Draft (5) → Pending Approval (8) → Approved (12) →       │   │
│ │ Sent to Supplier (15) → Received (25)                    │   │
│ │ [View Pipeline Details →]                                │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Spending Analysis (Last 6 Months)                        │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │         📊 Bar Chart                                     │   │
│ │     │                                                    │   │
│ │ 10L │     ┃                                              │   │
│ │     │     ┃     ┃                                        │   │
│ │  5L │ ┃   ┃ ┃   ┃ ┃   ┃                                 │   │
│ │     │ ┃   ┃ ┃   ┃ ┃   ┃ ┃   ┃                           │   │
│ │     └─────────────────────────────                       │   │
│ │      Sep Oct Nov Dec Jan Feb                            │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Key metrics (Active POs, Pending approvals, Monthly stats, Cost savings)
- Pending actions list
- AI-powered autonomous replenishment recommendations
- PO pipeline visualization
- Spending trend analysis

---

### 7.2 Purchase Orders Screen

**Route:** `/procurement/purchase-orders`  
**Component:** `app/(dashboard)/procurement/purchase-orders/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Purchase Orders                      [+ Create PO]    │
│ Home > Procurement > Purchase Orders                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [🔍 Search POs...] [Status ▼] [Supplier ▼] [Date Range]       │
│                                                                 │
│ [Tab: All] [Draft (5)] [Pending (8)] [Approved (12)] [Sent (15)]│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │PO#   │Date      │Supplier  │Items│Amount │Status   │Actions ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │PO-101│2026-02-10│ABC Trdr  │5    │₹45,000│✅ Sent  │ [⋮]   │││
│ │PO-102│2026-02-12│XYZ Supp  │3    │₹28,000│⏳ Pending│[⋮]   │││
│ │PO-103│2026-02-13│PQR Corp  │7    │₹62,000│📝 Draft │ [⋮]   │││
│ │PO-104│2026-02-14│ABC Trdr  │4    │₹35,000│⏳ Pending│[⋮]   │││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Showing 1-20 of 145         [< Prev] [1][2][3] ... [Next >]    │
└─────────────────────────────────────────────────────────────────┘
```

**Create Purchase Order Screen:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Create Purchase Order        [Save Draft] [Submit]    │
│ Home > Procurement > Create PO                                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ PO Information ──────────────────────────────────────────┐   │
│ │ Supplier *                     PO Date *                 │   │
│ │ [Select Supplier ▼]            [Date: 2026-02-15]        │   │
│ │                                                          │   │
│ │ Delivery Warehouse *           Expected Delivery *       │   │
│ │ [Select: WH-01 Mumbai ▼]       [Date: 2026-02-20]        │   │
│ │                                                          │   │
│ │ Payment Terms                  Delivery Terms            │   │
│ │ [Select: Net 30 ▼]             [Select: Ex-Works ▼]      │   │
│ │                                                          │   │
│ │ Reference / Notes                                        │   │
│ │ [textarea]                                               │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Order Items ─────────────────────────────────────────────┐  │
│ │ [Search & Add Products...]                    [+ Add Row] │  │
│ │                                                           │  │
│ │ Product      │ Unit │ Qty  │ Rate  │ Tax │ Amount       │  │
│ │ Pen Blue     │ pcs  │ 1000 │ ₹8    │ 18% │ ₹9,440       │  │
│ │ A4 Paper     │ ream │ 500  │ ₹220  │ 12% │ ₹1,23,200    │  │
│ │ Stapler      │ pcs  │ 200  │ ₹150  │ 18% │ ₹35,400      │  │
│ │ [Add more items...]                                      │  │
│ │                                                           │  │
│ │                              Subtotal:    ₹1,58,240      │  │
│ │                              Tax (GST):   ₹22,154        │  │
│ │                              Discount:    -₹5,000        │  │
│ │                              ─────────────────────       │  │
│ │                              Total:       ₹1,75,394      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Terms & Conditions ──────────────────────────────────────┐  │
│ │ [Load Template ▼]                                         │  │
│ │ [Rich text editor with T&C]                               │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                [Cancel]  [Save as Draft]  [Submit for Approval] │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7.3 Autonomous Replenishment Screen

**Route:** `/procurement/autonomous-replenishment`  
**Component:** `app/(dashboard)/procurement/autonomous-replenishment/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Autonomous Replenishment    [Settings] [History]      │
│ Home > Procurement > AI Recommendations                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ AI Insights ─────────────────────────────────────────────┐  │
│ │ 🤖 AI Analysis Summary:                                   │  │
│ │ • 15 products below reorder point                         │  │
│ │ • Predicted stockout in 3-5 days for 5 items             │  │
│ │ • Optimal order value: ₹1.2L (saves ₹15K vs urgent)      │  │
│ │ • Recommended suppliers: 3 based on price & lead time    │  │
│ │                                                           │  │
│ │ Confidence Score: ⭐⭐⭐⭐⭐ 95%                              │  │
│ │ Last Updated: 2 hours ago      [🔄 Refresh Analysis]      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Recommended Orders ──────────────────────────────────────┐  │
│ │ Filter: [All (15)] [High Priority (5)] [Medium (8)] [Low]│  │
│ │                                                           │  │
│ │ ┌─ Recommendation #1 ──────────────────────────────────┐ │  │
│ │ │ Product: A4 Paper (SKU: P-002)        Priority: 🔴 HIGH││ │
│ │ │ Current Stock: 50 units (5 days left)                ││ │
│ │ │ Reorder Point: 100 units                             ││ │
│ │ │ Suggested Order: 500 units                           ││ │
│ │ │ Estimated Cost: ₹1,10,000                            ││ │
│ │ │                                                      ││ │
│ │ │ 📊 Demand Forecast (Next 30 Days):                   ││ │
│ │ │ Week 1: 120 | Week 2: 130 | Week 3: 125 | Week 4: 125││ │
│ │ │                                                      ││ │
│ │ │ Recommended Supplier: ABC Traders                    ││ │
│ │ │ • Price: ₹220/unit                                   ││ │
│ │ │ • Lead Time: 3 days                                  ││ │
│ │ │ • Rating: ⭐⭐⭐⭐⭐ 4.8/5                                ││ │
│ │ │                                                      ││ │
│ │ │ Alternative Suppliers:                               ││ │
│ │ │ • XYZ Supply: ₹225/unit, 2 days, 4.5/5              ││ │
│ │ │ • PQR Corp: ₹215/unit, 5 days, 4.2/5                ││ │
│ │ │                                                      ││ │
│ │ │ [✓ Approve] [✏️ Edit] [✕ Reject] [View Details]     ││ │
│ │ └──────────────────────────────────────────────────────┘ │  │
│ │                                                           │  │
│ │ ┌─ Recommendation #2 ──────────────────────────────────┐ │  │
│ │ │ Product: Pen Blue (SKU: P-001)       Priority: 🟡 MED││ │
│ │ │ Current Stock: 1,250 units (15 days left)           ││ │
│ │ │ [Similar structure as above...]                      ││ │
│ │ └──────────────────────────────────────────────────────┘ │  │
│ │                                                           │  │
│ │ [Load More Recommendations...]                            │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Bulk Actions ────────────────────────────────────────────┐  │
│ │ Selected: 0 recommendations                               │  │
│ │ [☐ Select All] [Approve Selected] [Create Combined PO]    │  │
│ │                                                           │  │
│ │ Total Value if all approved: ₹1,24,500                    │  │
│ │ Estimated Savings: ₹15,200 (vs urgent orders)             │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- AI-powered stock analysis
- Demand forecasting (ML-based)
- Automatic reorder recommendations
- Supplier comparison
- Bulk approval
- Cost optimization insights
- Priority flagging (high/medium/low)

---

### 7.4 Cost Analysis Screen

**Route:** `/procurement/cost-analysis`  
**Component:** `app/(dashboard)/procurement/cost-analysis/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Cost Analysis & Reports        [Export] [Print]       │
│ Home > Procurement > Cost Analysis                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Period: [Last 6 Months ▼]  Compare: [Previous Period ▼]        │
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Total    │ │ Avg PO   │ │ Cost     │ │ Top      │           │
│ │ Spent    │ │ Value    │ │ Savings  │ │ Category │           │
│ │ ₹45.5L   │ │ ₹35,000  │ │ ₹2.5L    │ │ Paper    │           │
│ │ ↑ 15%    │ │ → 0%     │ │ ↑ 20%    │ │ ₹18L     │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Spending Trends                                            │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │         📈 Line Chart (Spending over time)                 │ │
│ │     │                                                      │ │
│ │ 10L │                                    ╱─╲               │ │
│ │     │                          ╱─╲    ╱─╯  ╲              │ │
│ │  5L │                    ╱───╯   ╲──╯       ╲             │ │
│ │     │            ╱─────╯                     ╲            │ │
│ │     └────────────────────────────────────────────          │ │
│ │      Sep   Oct   Nov   Dec   Jan   Feb                    │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌───────────────────────────┐ ┌──────────────────────────┐    │
│ │ Category Breakdown        │ │ Top 5 Suppliers          │    │
│ ├───────────────────────────┤ ├──────────────────────────┤    │
│ │   🥧 Pie Chart            │ │ Supplier    │ Amount     │    │
│ │                           │ │ ABC Traders │ ₹12.5L     │    │
│ │     Paper 40%             │ │ XYZ Supply  │ ₹8.2L      │    │
│ │     Stationery 30%        │ │ PQR Corp    │ ₹6.8L      │    │
│ │     Office 20%            │ │ LMN Ltd     │ ₹5.5L      │    │
│ │     Other 10%             │ │ RST Co      │ ₹4.2L      │    │
│ │                           │ │                          │    │
│ └───────────────────────────┘ └──────────────────────────┘    │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Cost Optimization Opportunities                          │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ 💡 AI Insights:                                          │   │
│ │ • Switch to Supplier XYZ for A4 Paper saves ₹5/unit     │   │
│ │ • Bulk order Pens (500+ units) gets 10% discount        │   │
│ │ • 3 products cheaper from alternative suppliers          │   │
│ │ • Consolidate orders to save on shipping (₹2,500/month)  │   │
│ │                                                          │   │
│ │ Potential Monthly Savings: ₹15,000                       │   │
│ │ [View Detailed Recommendations →]                        │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Supplier Dashboard & Screens

### 8.1 Supplier Dashboard

**Route:** `/supplier`  
**Component:** `app/(dashboard)/supplier/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ Supplier Dashboard - ABC Traders                                │
│ Home > Dashboard                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Pending  │ │ In       │ │ This     │ │ Revenue  │           │
│ │ Orders   │ │ Progress │ │ Month    │ │ (MTD)    │           │
│ │ 5        │ │ 3        │ │ 25 Orders│ │ ₹12.5L   │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ ┌────────────────────────────┐ ┌──────────────────────────┐   │
│ │ Recent Purchase Orders     │ │ Performance Metrics      │   │
│ ├────────────────────────────┤ ├──────────────────────────┤   │
│ │ PO-1001 | ₹45K | 2026-02-10│ │ On-Time Delivery: 95%    │   │
│ │ Status: ⏳ Pending Confirm │ │ Quality Score: 4.8/5     │   │
│ │ [View Details →]           │ │ Return Rate: 2%          │   │
│ │                            │ │ Avg Lead Time: 3 days    │   │
│ │ PO-1002 | ₹28K | 2026-02-12│ │ Customer Rating: ⭐⭐⭐⭐⭐ │   │
│ │ Status: 📦 In Progress     │ │                          │   │
│ │ [Update Status →]          │ │ [View Full Report →]     │   │
│ │                            │ │                          │   │
│ │ [View All Orders →]        │ │                          │   │
│ └────────────────────────────┘ └──────────────────────────┘   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Order Fulfillment Pipeline                               │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ New (5) → Confirmed (3) → Packing (2) → Shipped (8) →    │   │
│ │ Delivered (25)                                           │   │
│ │ [Manage Pipeline →]                                      │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Revenue Trends (Last 6 Months)                           │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │         📈 Area Chart                                    │   │
│ │     │                                    ╱█████╲         │   │
│ │ 15L │                          ╱███████╯      ████╲      │   │
│ │     │                  ╱██████╯                   ███╲   │   │
│ │  5L │         ╱███████╯                               ██ │   │
│ │     └─────────────────────────────────────────────────── │   │
│ │      Sep   Oct   Nov   Dec   Jan   Feb                  │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 8.2 Supplier Orders Screen

**Route:** `/supplier/orders`  
**Component:** `app/(dashboard)/supplier/orders/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Purchase Orders                                        │
│ Home > Supplier > Orders                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [🔍 Search orders...] [Status ▼] [Date Range]                  │
│                                                                 │
│ [Tab: All] [New (5)] [Confirmed (3)] [In Progress (8)] [Done] │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │PO#   │Date      │Items│Amount │Delivery│Status     │Actions ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │PO-101│2026-02-10│5    │₹45,000│2026-20 │⏳ New     │[Accept]│││
│ │PO-102│2026-02-12│3    │₹28,000│2026-22 │📦 Packing│[Update]│││
│ │PO-103│2026-02-08│7    │₹62,000│2026-18 │🚚 Shipped│[Track] │││
│ │PO-104│2026-02-05│4    │₹35,000│2026-15 │✅ Delivered│[View]│││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Order Detail View:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] PO-1001 Details               [Accept] [Reject] [PDF] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Order Information ───────────────────────────────────────┐   │
│ │ PO Number: PO-1001                                       │   │
│ │ Customer: StationeryChain Pvt Ltd                        │   │
│ │ Order Date: 2026-02-10                                   │   │
│ │ Expected Delivery: 2026-02-20                            │   │
│ │ Status: ⏳ Pending Confirmation                          │   │
│ │                                                          │   │
│ │ Delivery Address:                                        │   │
│ │ Warehouse WH-01, Mumbai Central                          │   │
│ │ Contact: John Doe, +91-9876543210                        │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Order Items ─────────────────────────────────────────────┐  │
│ │ Product    │ SKU   │ Qty  │ Rate  │ Tax  │ Amount       │  │
│ │ Pen Blue   │ P-001 │ 1000 │ ₹8    │ 18%  │ ₹9,440       │  │
│ │ A4 Paper   │ P-002 │ 500  │ ₹220  │ 12%  │ ₹1,23,200    │  │
│ │ Stapler    │ P-003 │ 200  │ ₹150  │ 18%  │ ₹35,400      │  │
│ │                                                           │  │
│ │                              Subtotal:    ₹1,58,240      │  │
│ │                              Tax (GST):   ₹22,154        │  │
│ │                              Total:       ₹1,80,394      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Fulfillment Status ──────────────────────────────────────┐  │
│ │ Current Status: ⏳ Pending Confirmation                    │  │
│ │                                                           │  │
│ │ Update Status:                                            │  │
│ │ [Select: Confirm/Cannot Fulfill/Need Clarification ▼]     │  │
│ │                                                           │  │
│ │ Estimated Dispatch Date:                                  │  │
│ │ [Date picker: 2026-02-18]                                 │  │
│ │                                                           │  │
│ │ Notes/Comments:                                           │  │
│ │ [textarea]                                                │  │
│ │                                                           │  │
│ │                        [Cancel]  [Update Order Status]    │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Timeline:                                                       │
│ ● 2026-02-10 10:30 - Order Received                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 8.3 Supplier Product Catalog Screen

**Route:** `/supplier/catalog`  
**Component:** `app/(dashboard)/supplier/catalog/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] My Product Catalog       [+ Add Product] [Import CSV] │
│ Home > Supplier > Catalog                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [🔍 Search products...] [Category ▼] [Status ▼]                │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │SKU  │Product  │Category│Price│MOQ │Lead Time│Status │Actions││
│ ├─────────────────────────────────────────────────────────────┤│
│ │P-001│Pen Blue │Statry  │₹8   │500 │2 days   │✅ Active│[⋮]  │││
│ │P-002│A4 Paper │Paper   │₹220 │100 │3 days   │✅ Active│[⋮]  │││
│ │P-003│Stapler  │Office  │₹150 │200 │2 days   │✅ Active│[⋮]  │││
│ │P-004│Notebook │Statry  │₹75  │300 │4 days   │⏸ Inactive│[⋮] │││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Developer Tools & Agent Monitoring

### 9.1 Agent Activity Monitor

**Route:** `/dev-tools/agent-monitor`  
**Component:** `app/(dashboard)/dev-tools/agent-monitor/page.tsx`

This screen provides real-time visibility into AI agent activities, tool calls, and decision-making processes.

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Agent Activity Monitor            [Auto-refresh: ON ▼]│
│ Home > Dev Tools > Agent Monitor            Last update: 2s ago │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ Current Stage ───────────────────────────────────────────┐   │
│ │ 🤖 Active Agent: Autonomous Replenishment Engine          │   │
│ │ Stage: Analyzing Inventory Data                           │   │
│ │ Progress: [████████████████░░░░] 75%                      │   │
│ │ Started: 2026-02-15 10:30:45                              │   │
│ │ Duration: 00:02:15                                        │   │
│ │ Status: ✅ Running                                         │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Agent Pipeline ──────────────────────────────────────────┐   │
│ │ ✅ Data Collection     → ✅ Analysis → 🔄 Decision Making  │   │
│ │ → ⏳ Recommendation → ⏳ Validation → ⏳ Output            │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Real-Time Activity Log ──────────────────────────────────┐   │
│ │ Time     │ Agent    │ Action          │ Status │ Duration ││  │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ 10:32:58 │ Repl-AI  │ Tool: API Call  │ ✅ OK  │ 245ms    ││  │
│ │          │          │ GET /inventory  │        │          ││  │
│ │          │          │ [View Details]  │        │          ││  │
│ │                                                           ││  │
│ │ 10:32:55 │ Repl-AI  │ Thought Process │ 💭     │ -        ││  │
│ │          │          │ "Need to check  │        │          ││  │
│ │          │          │ stock levels... │        │          ││  │
│ │          │          │ [Expand ▼]      │        │          ││  │
│ │                                                           ││  │
│ │ 10:32:52 │ Repl-AI  │ Tool: Query DB  │ ✅ OK  │ 156ms    ││  │
│ │          │          │ SELECT * FROM   │        │          ││  │
│ │          │          │ products...     │        │          ││  │
│ │          │          │ [View Query]    │        │          ││  │
│ │                                                           ││  │
│ │ 10:32:50 │ Repl-AI  │ Tool: ML Model  │ ✅ OK  │ 1.2s     ││  │
│ │          │          │ Demand Forecast │        │          ││  │
│ │          │          │ [View Results]  │        │          ││  │
│ │                                                           ││  │
│ │ 10:32:48 │ Repl-AI  │ Stage Transition│ ℹ️     │ -        ││  │
│ │          │          │ Data → Analysis │        │          ││  │
│ │                                                           ││  │
│ │ 10:32:45 │ Repl-AI  │ Started Session │ 🚀     │ -        ││  │
│ │          │          │ Session ID:     │        │          ││  │
│ │          │          │ sess_abc123     │        │          ││  │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ [Load More Logs...]                    [Export Logs]     ││  │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Tool Call Statistics (Last Hour) ────────────────────────┐   │
│ │ Tool Name       │ Calls │ Success │ Avg Time │ Errors    ││  │
│ │ API Call        │ 45    │ 98%     │ 234ms    │ 1         ││  │
│ │ Database Query  │ 32    │ 100%    │ 145ms    │ 0         ││  │
│ │ ML Inference    │ 15    │ 100%    │ 1.1s     │ 0         ││  │
│ │ File Read       │ 8     │ 100%    │ 45ms     │ 0         ││  │
│ │ External API    │ 5     │ 80%     │ 856ms    │ 1         ││  │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Expandable Tool Call Detail:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Tool Call Details - ID: tool_call_xyz789                        │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ Metadata ────────────────────────────────────────────────┐   │
│ │ Tool: API Call                                            │   │
│ │ Timestamp: 2026-02-15 10:32:58.234                        │   │
│ │ Duration: 245ms                                           │   │
│ │ Status: ✅ Success (HTTP 200)                             │   │
│ │ Agent: Autonomous Replenishment Engine                    │   │
│ │ Session: sess_abc123                                      │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Request ─────────────────────────────────────────────────┐   │
│ │ Method: GET                                               │   │
│ │ URL: /api/inventory?warehouse=WH-01&status=low            │   │
│ │ Headers:                                                  │   │
│ │   Authorization: Bearer eyJhbGc...                        │   │
│ │   Content-Type: application/json                          │   │
│ │ Body: null                                                │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Response ────────────────────────────────────────────────┐   │
│ │ Status: 200 OK                                            │   │
│ │ Size: 2.4 KB                                              │   │
│ │ Data: {                                                   │   │
│ │   "success": true,                                        │   │
│ │   "data": [                                               │   │
│ │     {                                                     │   │
│ │       "product": "A4 Paper",                              │   │
│ │       "sku": "P-002",                                     │   │
│ │       "currentStock": 50,                                 │   │
│ │       "reorderPoint": 100,                                │   │
│ │       "warehouse": "WH-01"                                │   │
│ │     },                                                    │   │
│ │     ...                                                   │   │
│ │   ],                                                      │   │
│ │   "count": 15                                             │   │
│ │ }                                                         │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Agent Reasoning ─────────────────────────────────────────┐   │
│ │ "I need to fetch all products with low stock in WH-01    │   │
│ │ to analyze replenishment needs. Using status filter       │   │
│ │ 'low' to get products below reorder point."               │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│                           [Close]  [Copy as cURL]               │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time agent activity tracking
- Current stage/progress indicator
- Tool call logs with request/response details
- Agent reasoning/thought process display
- Performance metrics (duration, success rate)
- Error tracking and debugging
- Session tracking
- Export logs functionality
- Auto-refresh toggle

---

### 9.2 System Logs & Traces

**Route:** `/dev-tools/logs`  
**Component:** `app/(dashboard)/dev-tools/logs/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] System Logs & Traces        [Auto-refresh ▼] [Export] │
│ Home > Dev Tools > Logs                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Filters: [Level ▼] [Source ▼] [Time Range] [🔍 Search logs...] │
│                                                                 │
│ [Tab: All] [Errors (3)] [Warnings (12)] [Info] [Debug]         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │Time     │Level│Source        │Message              │Actions ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │10:35:12 │🔴 ERR│API Gateway   │Request timeout /api │[View]  │││
│ │         │     │              │/inventory           │        │││
│ │                                                             │││
│ │10:34:58 │⚠️ WARN│Auth Service │Token expiring in 5m │[View]  │││
│ │         │     │              │for user@example.com │        │││
│ │                                                             │││
│ │10:34:45 │ℹ️ INFO│Repl Engine  │Started analysis for │[View]  │││
│ │         │     │              │15 products          │        │││
│ │                                                             │││
│ │10:34:30 │ℹ️ INFO│Database     │Query executed: 145ms│[View]  │││
│ │         │     │              │SELECT * FROM inv... │        │││
│ │                                                             │││
│ │10:34:15 │🐛 DBG│ML Service   │Model loaded: v2.1.0 │[View]  │││
│ │         │     │              │Demand forecast model│        │││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Showing 1-50 of 1,234 logs         [< Prev] [1][2][3] [Next >] │
└─────────────────────────────────────────────────────────────────┘
```

**Expanded Log Entry:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Log Entry Details - ID: log_xyz789                         [X] │
├─────────────────────────────────────────────────────────────────┤
│ Timestamp: 2026-02-15 10:35:12.456                              │
│ Level: 🔴 ERROR                                                 │
│ Source: API Gateway                                             │
│ Service: api-gateway-01                                         │
│ Host: server-prod-01                                            │
│ Process ID: 12345                                               │
│                                                                 │
│ ┌─ Message ─────────────────────────────────────────────────┐   │
│ │ Request timeout on /api/inventory endpoint                │   │
│ │ Request took 30.5s (timeout: 30s)                         │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Stack Trace ─────────────────────────────────────────────┐   │
│ │ Error: Request Timeout                                    │   │
│ │   at APIGateway.handleRequest (gateway.ts:145)            │   │
│ │   at Router.route (router.ts:89)                          │   │
│ │   at Server.handleIncoming (server.ts:234)                │   │
│ │   ...                                                     │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Context ─────────────────────────────────────────────────┐   │
│ │ User: user@example.com (ID: usr_123)                      │   │
│ │ Request ID: req_abc789                                    │   │
│ │ Session ID: sess_xyz456                                   │   │
│ │ IP Address: 192.168.1.100                                 │   │
│ │ User Agent: Mozilla/5.0 (Windows...)                      │   │
│ │ Route: GET /api/inventory?warehouse=WH-01                 │   │
│ │ Query Params: {warehouse: "WH-01", status: "low"}         │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Related Logs (3) ────────────────────────────────────────┐   │
│ │ 10:35:10 INFO - Request started for /api/inventory        │   │
│ │ 10:35:08 DEBUG - Database connection established          │   │
│ │ 10:35:42 ERROR - Retry attempt 1 failed                   │   │
│ │ [View All Related Logs →]                                 │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│          [Copy Log] [Create Issue] [Mark as Resolved]           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 9.3 Agent Decision Visualizer

**Route:** `/dev-tools/decision-tree`  
**Component:** `app/(dashboard)/dev-tools/decision-tree/page.tsx`

This screen visualizes how agents make decisions step-by-step.

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Agent Decision Tree Visualizer      [Session: Recent ▼]│
│ Home > Dev Tools > Decision Visualizer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Session: sess_abc123 - Autonomous Replenishment                 │
│ Started: 2026-02-15 10:30:45    Duration: 00:02:15    ✅ Complete│
│                                                                 │
│ ┌─ Decision Flow ───────────────────────────────────────────┐   │
│ │                                                           │   │
│ │     🚀 START                                              │   │
│ │       │                                                   │   │
│ │       ▼                                                   │   │
│ │     ┌─────────────────┐                                  │   │
│ │     │ Collect Data    │ ✅ Success (245ms)                │   │
│ │     │ - Inventory     │ → 15 low-stock products          │   │
│ │     │ - Sales history │ → 90 days of data                │   │
│ │     └─────────────────┘                                  │   │
│ │       │                                                   │   │
│ │       ▼                                                   │   │
│ │     ┌─────────────────┐                                  │   │
│ │     │ Analyze Trends  │ ✅ Success (1.2s)                 │   │
│ │     │ ML Model v2.1   │ → Forecast generated             │   │
│ │     └─────────────────┘                                  │   │
│ │       │                                                   │   │
│ │       ▼                                                   │   │
│ │     ┌─────────────────┐                                  │   │
│ │     │ Decision Point  │ 💭 Thinking...                    │   │
│ │     │ Should order?   │                                  │   │
│ │     └─────────────────┘                                  │   │
│ │       ├──YES──┐                                          │   │
│ │       │       │                                          │   │
│ │       ▼       ▼                                          │   │
│ │   ┌─────┐  ┌─────────────────┐                          │   │
│ │   │ NO  │  │ Calculate Order │ ✅ Success (156ms)         │   │
│ │   │(0)  │  │ Quantities      │ → 15 items processed     │   │
│ │   └─────┘  └─────────────────┘                          │   │
│ │              │                                           │   │
│ │              ▼                                           │   │
│ │            ┌─────────────────┐                          │   │
│ │            │ Find Suppliers  │ ✅ Success (89ms)          │   │
│ │            │ Best price/lead │ → 3 suppliers matched    │   │
│ │            └─────────────────┘                          │   │
│ │              │                                           │   │
│ │              ▼                                           │   │
│ │            ┌─────────────────┐                          │   │
│ │            │ Generate Recs   │ ✅ Success (45ms)          │   │
│ │            │ 15 items        │ → Output ready           │   │
│ │            └─────────────────┘                          │   │
│ │              │                                           │   │
│ │              ▼                                           │   │
│ │            🎯 END                                         │   │
│ │                                                           │   │
│ │ [Click nodes for details]                                │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Selected Node: "Calculate Order Quantities" ────────────┐   │
│ │ Timestamp: 10:32:55                                       │   │
│ │ Duration: 156ms                                           │   │
│ │ Status: ✅ Success                                         │   │
│ │                                                           │   │
│ │ Input:                                                    │   │
│ │ - Low stock products: 15 items                            │   │
│ │ - Demand forecast: [array of 15 forecasts]               │   │
│ │ - Current inventory levels: {...}                         │   │
│ │                                                           │   │
│ │ Logic Applied:                                            │   │
│ │ 1. For each product, calculate:                           │   │
│ │    - Days until stockout = current / daily_usage          │   │
│ │    - Safety stock = lead_time * daily_usage * 1.5         │   │
│ │    - Order quantity = max(reorder_qty, safety_stock)      │   │
│ │ 2. Round up to MOQ if needed                              │   │
│ │ 3. Validate against max stock levels                      │   │
│ │                                                           │   │
│ │ Output:                                                   │   │
│ │ - A4 Paper: Order 500 units (current: 50, forecast: 120/wk)│  │
│ │ - Pen Blue: Order 1000 units (current: 1250, forecast:...│   │
│ │ - [13 more items...]                                      │   │
│ │                                                           │   │
│ │ Tools Called:                                             │   │
│ │ • calculateStockout() - 45ms                              │   │
│ │ • calculateSafetyStock() - 38ms                           │   │
│ │ • validateQuantity() - 73ms                               │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Interactive decision tree visualization
- Node click for detailed information
- Execution time for each step
- Input/output data display
- Logic explanation
- Success/failure indicators
- Branching logic visualization
- Tool call tracking

---

### 9.4 Agent Performance Dashboard

**Route:** `/dev-tools/performance`  
**Component:** `app/(dashboard)/dev-tools/performance/page.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Agent Performance Dashboard       [Time: Last 24h ▼]  │
│ Home > Dev Tools > Performance                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Total    │ │ Success  │ │ Avg      │ │ Active   │           │
│ │ Sessions │ │ Rate     │ │ Duration │ │ Now      │           │
│ │ 145      │ │ 97.2%    │ │ 2.3s     │ │ 3        │           │
│ │ ↑ 15%    │ │ ↑ 2%     │ │ ↓ 0.5s   │ │          │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Session Duration Over Time                               │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │         📈 Line Chart                                    │   │
│ │     │                                                    │   │
│ │  5s │         ╱╲                                         │   │
│ │     │       ╱─╯ ╲      ╱╲                               │   │
│ │  3s │     ╱─╯    ╲────╯  ╲─╲                            │   │
│ │     │   ╱─╯               ╲ ╲──╲                        │   │
│ │  1s │ ╱─╯                     ╲  ╲─                     │   │
│ │     └────────────────────────────────────               │   │
│ │      0h   4h    8h   12h  16h  20h  24h                 │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Agent Breakdown ─────────────────────────────────────────┐  │
│ │ Agent Name           │Sessions│Success│Avg Time│Errors  │  │
│ │ Replenishment Engine │ 85     │ 98%   │ 2.1s   │ 2      │  │
│ │ Cost Optimizer       │ 35     │ 95%   │ 3.2s   │ 1      │  │
│ │ Demand Forecaster    │ 25     │ 100%  │ 1.5s   │ 0      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Tool Performance ────────────────────────────────────────┐  │
│ │ Tool Name       │ Calls │ Success │ Avg Time │ P95 Time │  │
│ │ API Call        │ 2,145 │ 98%     │ 234ms    │ 456ms    │  │
│ │ Database Query  │ 1,532 │ 100%    │ 145ms    │ 289ms    │  │
│ │ ML Inference    │ 425   │ 100%    │ 1.1s     │ 1.8s     │  │
│ │ File Read       │ 178   │ 100%    │ 45ms     │ 89ms     │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Error Analysis ──────────────────────────────────────────┐  │
│ │ Error Type          │ Count │ % of Total │ Last Seen     │  │
│ │ Request Timeout     │ 5     │ 50%        │ 2 hours ago   │  │
│ │ Auth Token Expired  │ 3     │ 30%        │ 30 mins ago   │  │
│ │ Database Unavailable│ 2     │ 20%        │ 5 hours ago   │  │
│ │ [View All Errors →]                                      │  │
│ └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Responsive Design Guidelines

### Breakpoints
```css
/* Tailwind default breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Layout Adaptations

**Desktop (≥1024px):**
- Fixed sidebar (256px width)
- Full data tables with all columns
- Multi-column layouts
- Hover states for interactions

**Tablet (768px - 1023px):**
- Collapsible sidebar (icons only, 64px)
- Reduced columns in tables
- Stack some side-by-side components
- Touch-friendly buttons (min 44x44px)

**Mobile (≤767px):**
- Slide-out drawer navigation
- Single column layouts
- Card-based lists instead of tables
- Bottom navigation bar (optional)
- Swipe gestures
- Simplified forms (one field per row)

### Component Responsiveness

**Data Tables:**
```
Desktop: Full table with all columns
Tablet:  Hide less important columns, show "View More"
Mobile:  Card layout with key info, tap to expand
```

**Forms:**
```
Desktop: Multi-column (2-3 columns)
Tablet:  2 columns
Mobile:  Single column, full-width inputs
```

**Dashboards:**
```
Desktop: 4 stat cards in a row
Tablet:  2 cards per row
Mobile:  1 card per row, stacked
```

**Modals:**
```
Desktop: Centered modal (max-width: 600-800px)
Tablet:  Slightly wider modal
Mobile:  Full-screen modal with close button
```

---

## Summary

This document provides comprehensive screen specifications for all user roles:
- **Authentication:** Login, Signup, Forgot Password
- **Admin:** Dashboard, Users, Products, Warehouses, Suppliers
- **Warehouse Manager:** Dashboard, Inventory, Receiving, Transfers
- **Procurement Officer:** Dashboard, POs, Autonomous Replenishment, Cost Analysis
- **Supplier:** Dashboard, Orders, Catalog
- **Developer Tools:** Agent Monitor, System Logs, Decision Visualizer, Performance Dashboard

Each screen includes:
- Wireframe layout
- Component breakdown
- Data requirements
- API integrations
- User interactions
- Responsive behavior

The developer tools section provides unprecedented visibility into AI agent operations, making debugging and optimization straightforward.

---

**Next Steps:**
1. Review and refine wireframes with stakeholders
2. Create high-fidelity designs in Figma
3. Begin component implementation following the Component Library guide
4. Implement API integrations as per API Reference
5. Add real-time features (WebSockets) for agent monitoring

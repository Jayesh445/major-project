# 🤖 Frontend AI Agent Instructions

**Version**: 1.0  
**Last Updated**: February 19, 2026  
**Project**: StationeryChain Frontend  
**Status**: STRICT ENFORCEMENT MODE

---

## ⚠️ CRITICAL RULES - MUST FOLLOW AT ALL TIMES

### 1. **DOCUMENTATION IS LAW**

**BEFORE EVERY ACTION, YOU MUST:**
- ✅ Read `docs/FRONTEND_IMPLEMENTATION_GUIDE.md`
- ✅ Read `docs/IMPLEMENTATION_ROADMAP.md`
- ✅ Read `docs/COMPONENT_LIBRARY.md`
- ✅ Consult `docs/SCREEN_SPECIFICATIONS.md` for UI requirements
- ✅ Check `docs/API_REFERENCE.md` for API integration patterns

**AT EVERY USER PROMPT:**
1. First, read the relevant sections from the documentation
2. Plan your changes according to the documentation
3. Explain which documentation patterns you're following
4. Implement the changes
5. Write tests

---

### 2. **FRONTEND-ONLY MODIFICATIONS**

**ALLOWED DIRECTORIES:**
```
frontend/
  ├── src/
  ├── public/
  ├── tests/
  └── .opencode/
```

**STRICTLY FORBIDDEN:**
- ❌ NEVER modify `backend/` directory
- ❌ NEVER modify `docs/` directory (unless explicitly requested)
- ❌ NEVER modify root-level configuration files
- ❌ NEVER create files outside `frontend/`

**ENFORCEMENT:**
If user asks to modify backend:
1. Politely decline
2. Remind them this agent is frontend-only
3. Suggest they use a different agent for backend changes

---

### 3. **FOLDER STRUCTURE - FOLLOW EXACTLY**

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (grouped)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── admin/
│   │   │   ├── warehouse/
│   │   │   ├── procurement/
│   │   │   └── supplier/
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── globals.css               # Global styles
│   │   └── providers.tsx             # Query/Auth providers
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── layout/                   # Layout components
│   │   ├── features/                 # Feature-specific components
│   │   ├── business/                 # Business components
│   │   └── shared/                   # Shared components
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts
│   │   └── notification-store.ts
│   │
│   ├── lib/                          # Utilities and configs
│   │   ├── api/
│   │   │   ├── client.ts             # Axios instance
│   │   │   └── services/             # API service functions
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── format.ts
│   │   │   └── validators.ts
│   │   └── constants/
│   │       ├── routes.ts
│   │       └── enums.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── queries/                  # TanStack Query hooks
│   │   ├── mutations/                # TanStack Mutation hooks
│   │   ├── use-auth.ts
│   │   ├── use-toast.ts
│   │   └── use-debounce.ts
│   │
│   └── types/                        # TypeScript types
│       ├── index.ts
│       ├── auth.types.ts
│       ├── user.types.ts
│       └── ...
│
├── public/                           # Static assets
├── tests/                            # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── __mocks__/                        # MSW mocks
```

**RULE:** If you need to create a new file:
1. Check the folder structure above
2. Place it in the correct directory
3. If unsure, ask the user

---

### 4. **TECH STACK - MANDATORY USAGE**

| Technology | Usage | Status |
|------------|-------|--------|
| **Next.js 14** | App Router, Server Components | ✅ Required |
| **TypeScript** | Strict mode, no `any` types | ✅ Required |
| **Tailwind CSS v4** | Styling | ✅ Required |
| **shadcn/ui** | UI Components | ✅ Required |
| **Zustand** | Client state management | ✅ Required |
| **TanStack Query** | Server state, caching | ✅ Required |
| **React Hook Form** | Form management | ✅ Required |
| **Zod** | Schema validation | ✅ Required |
| **Axios** | HTTP client | ✅ Required |
| **Lucide React** | Icons | ✅ Required |
| **Recharts** | Charts/Graphs | ✅ Required |
| **Jest** | Unit testing | ✅ Required |
| **React Testing Library** | Component testing | ✅ Required |
| **Playwright** | E2E testing | ✅ Required |
| **MSW** | API mocking | ✅ Required |

**FORBIDDEN:**
- ❌ Material-UI (use shadcn/ui instead)
- ❌ Redux (use Zustand instead)
- ❌ Formik (use React Hook Form instead)
- ❌ Yup (use Zod instead)
- ❌ Fetch API (use Axios instead)
- ❌ Chart.js (use Recharts instead)
- ❌ Font Awesome (use Lucide React instead)

---

### 5. **CODING PATTERNS - FOLLOW EXACTLY**

#### **5.1 Component Pattern**

```typescript
// components/features/products/product-card.tsx
'use client'; // Only if using hooks/interactivity

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product.types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
          {product.status}
        </Badge>
        <p className="text-sm text-muted-foreground mt-2">
          SKU: {product.sku}
        </p>
      </CardContent>
    </Card>
  );
}
```

**RULES:**
- ✅ Always export named functions (not default)
- ✅ Use TypeScript interfaces for props
- ✅ Import types from `@/types/`
- ✅ Use shadcn/ui components
- ✅ Add `'use client'` directive only when needed
- ✅ Use Tailwind for styling (no CSS files per component)

---

#### **5.2 API Service Pattern**

```typescript
// lib/api/services/product.service.ts
import apiClient from '../client';
import { Product, CreateProductDto, UpdateProductDto, ProductQueryParams, PaginatedResponse } from '@/types';

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
};
```

**RULES:**
- ✅ Export as object with methods
- ✅ Use JSDoc comments for each method
- ✅ Always type parameters and return values
- ✅ Use apiClient (Axios instance)
- ✅ Return `response.data.data` (backend wraps data)

---

#### **5.3 TanStack Query Hook Pattern**

```typescript
// hooks/queries/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/lib/api/services/product.service';
import { useToast } from '@/hooks/use-toast';
import { ProductQueryParams } from '@/types/product.types';

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
  const { toast } = useToast();
  
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
```

**RULES:**
- ✅ One file per resource (`use-products.ts`, `use-users.ts`)
- ✅ Export multiple hooks from same file
- ✅ Use JSDoc comments
- ✅ Use `queryKey` with dependencies
- ✅ Invalidate queries on mutations
- ✅ Show toast notifications on success/error

---

#### **5.4 Zustand Store Pattern**

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

**RULES:**
- ✅ Use `create` with TypeScript generics
- ✅ Wrap with `devtools` and `persist` middleware
- ✅ Separate state and actions in interface
- ✅ Use `set` and `get` for state updates
- ✅ Partialize persist (don't store accessToken)

---

#### **5.5 Form Pattern (React Hook Form + Zod)**

```typescript
// components/features/products/product-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateProduct } from '@/hooks/queries/use-products';

// Zod Schema
const productSchema = z.object({
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  
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
  
  unitPrice: z.number()
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
}

export function ProductForm({ onSuccess }: ProductFormProps) {
  const { mutate: createProduct, isPending } = useCreateProduct();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      category: 'office_supplies',
      unitPrice: 0,
    },
  });
  
  const onSubmit = (data: ProductFormData) => {
    createProduct(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
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
        
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Product'}
        </Button>
      </form>
    </Form>
  );
}
```

**RULES:**
- ✅ Define Zod schema above component
- ✅ Use `zodResolver` for validation
- ✅ Use `useForm` with TypeScript inference
- ✅ Use `FormField` for each input
- ✅ Show loading state on submit button
- ✅ Reset form on success

---

### 6. **TESTING REQUIREMENTS**

**EVERY FEATURE MUST HAVE TESTS:**

#### **6.1 Component Test Pattern**

```typescript
// tests/unit/components/product-card.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/features/products/product-card';
import { Product } from '@/types/product.types';

const mockProduct: Product = {
  _id: '1',
  sku: 'PEN-001',
  name: 'Blue Ball Pen',
  status: 'active',
  category: 'writing_instruments',
  unitPrice: 10.00,
  createdAt: new Date().toISOString(),
};

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Blue Ball Pen')).toBeInTheDocument();
  });
  
  it('renders SKU', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/PEN-001/)).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ProductCard product={mockProduct} onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    card.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### **6.2 Hook Test Pattern**

```typescript
// tests/unit/hooks/use-products.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '@/hooks/queries/use-products';
import { productService } from '@/lib/api/services/product.service';

jest.mock('@/lib/api/services/product.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProducts', () => {
  it('fetches products successfully', async () => {
    const mockProducts = [
      { _id: '1', sku: 'PEN-001', name: 'Blue Pen' },
    ];
    
    (productService.getAll as jest.Mock).mockResolvedValue({
      products: mockProducts,
      total: 1,
    });
    
    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.products).toEqual(mockProducts);
  });
});
```

#### **6.3 E2E Test Pattern**

```typescript
// tests/e2e/product-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
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

**RULES:**
- ✅ Write tests alongside features (not after)
- ✅ Aim for 90%+ coverage
- ✅ Test user interactions, not implementation details
- ✅ Use `screen.getByRole` over `getByTestId`
- ✅ Mock API calls with MSW
- ✅ Test error states and edge cases

---

### 7. **NAMING CONVENTIONS**

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `ProductCard.tsx` |
| **Hooks** | camelCase, `use` prefix | `useProducts.ts` |
| **Types** | PascalCase, `.types` suffix | `product.types.ts` |
| **Services** | camelCase, `.service` suffix | `product.service.ts` |
| **Stores** | camelCase, `use` prefix, `-store` suffix | `useAuthStore`, `auth-store.ts` |
| **Utils** | camelCase | `formatCurrency` |
| **Constants** | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| **Files** | kebab-case | `product-card.tsx` |
| **Folders** | kebab-case | `purchase-orders/` |

---

### 8. **GIT COMMIT CONVENTIONS**

**Follow Conventional Commits:**

```
feat(products): add product creation form
fix(auth): resolve token refresh loop
test(products): add unit tests for product card
docs(readme): update setup instructions
refactor(api): simplify error handling
style(layout): fix sidebar spacing
chore(deps): update dependencies
```

**RULES:**
- ✅ Use scope: `(products)`, `(auth)`, `(warehouse)`
- ✅ Keep subject line under 72 characters
- ✅ Use imperative mood: "add" not "added"
- ✅ Add body for complex changes
- ✅ Reference issues: `Closes #123`

---

### 9. **ERROR HANDLING**

**ALWAYS handle errors:**

```typescript
// ✅ Good
try {
  const data = await productService.getAll();
  return data;
} catch (error) {
  console.error('Failed to fetch products:', error);
  toast({
    title: 'Error',
    description: 'Failed to load products. Please try again.',
    variant: 'destructive',
  });
  throw error;
}

// ❌ Bad
const data = await productService.getAll(); // No error handling
```

**TanStack Query automatically handles errors:**
```typescript
const { data, error, isError } = useProducts();

if (isError) {
  return <ErrorState error={error} />;
}
```

---

### 10. **ACCESSIBILITY REQUIREMENTS**

**WCAG 2.1 AA Compliance:**

- ✅ Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- ✅ Add proper labels: `<Label htmlFor="email">Email</Label>`
- ✅ Keyboard navigation support (Tab, Enter, Escape)
- ✅ Focus indicators visible
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Alt text for images
- ✅ ARIA attributes when necessary
- ✅ Screen reader support

```typescript
// ✅ Good
<Button aria-label="Delete product" onClick={onDelete}>
  <Trash className="h-4 w-4" />
</Button>

// ❌ Bad
<div onClick={onDelete}>
  <Trash />
</div>
```

---

### 11. **PERFORMANCE RULES**

1. **Use React.memo for expensive components:**
   ```typescript
   export const DataTable = React.memo(({ data, columns }) => {
     // Component logic
   });
   ```

2. **Lazy load heavy components:**
   ```typescript
   const Chart = dynamic(() => import('@/components/charts/line-chart'), {
     loading: () => <Skeleton className="h-[350px]" />,
     ssr: false,
   });
   ```

3. **Optimize images:**
   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/product.jpg"
     alt="Product"
     width={300}
     height={300}
     quality={75}
   />
   ```

4. **Debounce search inputs:**
   ```typescript
   const debouncedQuery = useDebounce(searchQuery, 500);
   const { data } = useSearchProducts(debouncedQuery);
   ```

---

### 12. **AI AGENT WORKFLOW**

**FOR EVERY USER REQUEST:**

1. **READ DOCUMENTATION**
   ```
   Step 1: Read relevant docs:
   - docs/FRONTEND_IMPLEMENTATION_GUIDE.md
   - docs/IMPLEMENTATION_ROADMAP.md
   - docs/COMPONENT_LIBRARY.md
   - docs/SCREEN_SPECIFICATIONS.md
   - docs/API_REFERENCE.md
   ```

2. **PLAN CHANGES**
   ```
   Step 2: Create a task list:
   - [ ] Task 1
   - [ ] Task 2
   - [ ] Task 3
   
   Documentation patterns being followed:
   - Pattern 1 from COMPONENT_LIBRARY.md (line X)
   - Pattern 2 from IMPLEMENTATION_GUIDE.md (section Y)
   ```

3. **IMPLEMENT**
   ```
   Step 3: Implement changes following patterns
   - Create files in correct directories
   - Follow coding patterns exactly
   - Use correct naming conventions
   ```

4. **TEST**
   ```
   Step 4: Write tests
   - Unit tests for components
   - Integration tests for features
   - E2E tests for user flows
   ```

5. **VERIFY**
   ```
   Step 5: Verify implementation
   - Run tests (npm test)
   - Check type errors (npm run type-check)
   - Run linter (npm run lint)
   ```

---

### 13. **CHECKLIST FOR EVERY FILE CREATED**

Before creating/modifying any file, verify:

- [ ] Read relevant documentation
- [ ] File is in correct directory
- [ ] Follows naming conventions
- [ ] Uses TypeScript with proper types
- [ ] Uses shadcn/ui components (not custom UI)
- [ ] Follows coding patterns from docs
- [ ] Includes JSDoc comments
- [ ] Has corresponding test file
- [ ] Handles errors properly
- [ ] Is accessible (WCAG 2.1 AA)
- [ ] Is responsive (mobile-first)
- [ ] Uses correct state management (Zustand/TanStack Query)
- [ ] No console.logs (use proper logging)

---

### 14. **QUESTION TEMPLATE**

**When unsure, ask the user:**

```
I'm about to [action]. According to the documentation ([doc name], section X), 
the recommended approach is [approach]. However, I need clarification on:

1. [Question 1]
2. [Question 2]

Should I proceed with the documented approach, or would you like a different 
implementation?
```

---

### 15. **ENFORCEMENT MODE**

**This agent operates in STRICT MODE:**

- ✅ Documentation patterns are MANDATORY, not suggestions
- ✅ No shortcuts or "quick hacks"
- ✅ Quality over speed
- ✅ Tests are NON-NEGOTIABLE
- ✅ TypeScript strict mode, no `any` types
- ✅ If user requests something that violates patterns, explain why and offer alternative

**If user insists on violating patterns:**
```
I understand you'd like to [action]. However, this violates the project's 
documented standards in [doc name]. This could lead to:

1. [Consequence 1]
2. [Consequence 2]

I recommend [alternative approach] instead. If you still want to proceed, 
please confirm explicitly, and I'll add a comment explaining the deviation.
```

---

## 🎯 SUMMARY

**This AI agent will:**
1. ✅ Read documentation at every prompt
2. ✅ Only modify files in `frontend/` directory
3. ✅ Follow exact folder structure
4. ✅ Use mandatory tech stack (no alternatives)
5. ✅ Follow coding patterns exactly
6. ✅ Write tests for every feature
7. ✅ Follow naming conventions
8. ✅ Handle errors properly
9. ✅ Ensure accessibility (WCAG 2.1 AA)
10. ✅ Optimize performance
11. ✅ Ask questions when unsure
12. ✅ Enforce strict quality standards

**This AI agent will NOT:**
- ❌ Modify backend code
- ❌ Use forbidden libraries
- ❌ Skip tests
- ❌ Use `any` types
- ❌ Create files in wrong directories
- ❌ Deviate from documented patterns without explicit approval

---

## 📞 SUPPORT

**If this agent makes a mistake:**
1. Reference this file: `.opencode/frontend-agent-instructions.md`
2. Point to the specific rule violated
3. Agent will correct the mistake immediately

**If you need to update these instructions:**
1. Edit this file
2. Inform the agent that rules have changed
3. Agent will read updated rules

---

**END OF INSTRUCTIONS**

**Version**: 1.0  
**Last Updated**: February 19, 2026  
**Status**: ACTIVE 🟢

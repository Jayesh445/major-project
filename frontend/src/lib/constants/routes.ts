export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: {
    ROOT: '/dashboard',
    ADMIN: {
      ROOT: '/dashboard/admin',
      USERS: '/dashboard/admin/users',
      PRODUCTS: '/dashboard/admin/products',
      WAREHOUSES: '/dashboard/admin/warehouses',
      SUPPLIERS: '/dashboard/admin/suppliers',
    },
    WAREHOUSE: {
      ROOT: '/dashboard/warehouse',
      INVENTORY: '/dashboard/warehouse/inventory',
      RECEIVING: '/dashboard/warehouse/receiving',
      TRANSFERS: '/dashboard/warehouse/transfers',
    },
    PROCUREMENT: {
      ROOT: '/dashboard/procurement',
      ORDERS: '/dashboard/procurement/orders',
      COSTS: '/dashboard/procurement/costs',
    },
    SUPPLIER: {
      ROOT: '/dashboard/supplier',
      CATALOG: '/dashboard/supplier/catalog',
      ORDERS: '/dashboard/supplier/orders',
    },
  },
} as const;

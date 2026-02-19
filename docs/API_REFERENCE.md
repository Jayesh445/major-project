# 📡 StationeryChain - API Reference Guide

**Version:** 1.0  
**Last Updated:** February 15, 2026  
**Base URL:** `http://localhost:5000/api/v1` (Development)  
**Production URL:** `https://api.stationerychain.com/api/v1`

---

## 📋 Table of Contents

1. [Authentication](#1-authentication)
2. [User Management](#2-user-management)
3. [Product Management](#3-product-management)
4. [Inventory Management](#4-inventory-management)
5. [Purchase Order Management](#5-purchase-order-management)
6. [Warehouse Management](#6-warehouse-management)
7. [Supplier Management](#7-supplier-management)
8. [Error Handling](#8-error-handling)
9. [Rate Limiting](#9-rate-limiting)
10. [Pagination](#10-pagination)

---

## 1. Authentication

### 1.1 User Signup

**Endpoint:** `POST /users/signup`  
**Auth Required:** No  
**Description:** Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "warehouse_manager"
}
```

**Validation Rules:**
- `name`: 2-100 characters
- `email`: Valid email format, unique
- `password`: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- `role`: One of `admin`, `warehouse_manager`, `procurement_officer`, `supplier`

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65f4a1234567890abcdef123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "warehouse_manager",
      "isActive": true,
      "createdAt": "2026-02-15T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email already exists",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}
```

---

### 1.2 User Login

**Endpoint:** `POST /users/login`  
**Auth Required:** No  
**Description:** Login with email and password

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65f4a1234567890abcdef123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "warehouse_manager",
      "isActive": true,
      "assignedWarehouses": ["65f4c456..."],
      "lastLogin": "2026-02-15T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

---

### 1.3 Refresh Token

**Endpoint:** `POST /users/refresh-token`  
**Auth Required:** No  
**Description:** Get new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.4 Logout

**Endpoint:** `POST /users/logout`  
**Auth Required:** Yes  
**Description:** Logout and revoke refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 1.5 Get Current User Profile

**Endpoint:** `GET /users/profile`  
**Auth Required:** Yes  
**Description:** Get logged-in user details

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4a1234567890abcdef123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "warehouse_manager",
    "isActive": true,
    "assignedWarehouses": [
      {
        "_id": "65f4c456...",
        "name": "Mumbai Warehouse",
        "code": "WH-MUM-01"
      }
    ],
    "notificationPreferences": {
      "email": true,
      "inApp": true
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "lastLogin": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 1.6 Update Profile

**Endpoint:** `PATCH /users/profile`  
**Auth Required:** Yes  
**Description:** Update current user profile

**Request Body:**
```json
{
  "name": "John Updated Doe",
  "notificationPreferences": {
    "email": false,
    "inApp": true
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "65f4a1234567890abcdef123",
    "name": "John Updated Doe",
    "email": "john@example.com",
    "role": "warehouse_manager",
    "notificationPreferences": {
      "email": false,
      "inApp": true
    }
  }
}
```

---

### 1.7 Change Password

**Endpoint:** `POST /users/change-password`  
**Auth Required:** Yes  
**Description:** Change user password

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 2. User Management

### 2.1 Get All Users (Admin Only)

**Endpoint:** `GET /users`  
**Auth Required:** Yes (Admin)  
**Description:** Get list of all users with filters

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 10 |
| role | string | Filter by role | - |
| isActive | boolean | Filter by status | - |
| search | string | Search by name/email | - |
| sortBy | string | Sort field | createdAt |
| order | string | Sort order (asc/desc) | desc |

**Example Request:**
```
GET /users?page=1&limit=10&role=warehouse_manager&isActive=true&search=john
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "65f4a123...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "warehouse_manager",
        "isActive": true,
        "assignedWarehouses": ["65f4c456..."],
        "lastLogin": "2026-02-15T10:00:00.000Z",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 2.2 Get User by ID (Admin Only)

**Endpoint:** `GET /users/:id`  
**Auth Required:** Yes (Admin)  
**Description:** Get specific user details

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4a123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "warehouse_manager",
    "isActive": true,
    "assignedWarehouses": [
      {
        "_id": "65f4c456...",
        "name": "Mumbai Warehouse",
        "code": "WH-MUM-01"
      }
    ],
    "notificationPreferences": {
      "email": true,
      "inApp": true
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z",
    "lastLogin": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 2.3 Update User (Admin Only)

**Endpoint:** `PATCH /users/:id`  
**Auth Required:** Yes (Admin)  
**Description:** Update user details

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "procurement_officer",
  "isActive": false,
  "assignedWarehouses": ["65f4c456...", "65f4c789..."]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "65f4a123...",
    "name": "Updated Name",
    "email": "john@example.com",
    "role": "procurement_officer",
    "isActive": false,
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 2.4 Delete User (Admin Only)

**Endpoint:** `DELETE /users/:id`  
**Auth Required:** Yes (Admin)  
**Description:** Soft delete user (set isActive to false)

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 2.5 Get Active Sessions

**Endpoint:** `GET /users/sessions`  
**Auth Required:** Yes  
**Description:** Get all active sessions for current user

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "device": "Chrome on Windows",
        "ipAddress": "192.168.1.1",
        "createdAt": "2026-02-15T10:00:00.000Z",
        "expiresAt": "2026-02-22T10:00:00.000Z",
        "isCurrent": true
      }
    ]
  }
}
```

---

### 2.6 Logout All Sessions

**Endpoint:** `POST /users/logout-all`  
**Auth Required:** Yes  
**Description:** Revoke all refresh tokens for current user

**Success Response (200):**
```json
{
  "success": true,
  "message": "All sessions logged out successfully"
}
```

---

## 3. Product Management

### 3.1 Get All Products

**Endpoint:** `GET /products`  
**Auth Required:** Yes  
**Description:** Get list of products with filters

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| category | string | Filter by category |
| supplier | string | Filter by supplier ID |
| isActive | boolean | Filter by status |
| search | string | Search by SKU/name |
| sortBy | string | Sort field (default: createdAt) |
| order | string | Sort order (asc/desc) |

**Example Request:**
```
GET /products?page=1&limit=20&category=writing_instruments&search=pen&sortBy=name&order=asc
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "65f4b123...",
        "sku": "PEN-001",
        "name": "Blue Ball Pen",
        "description": "Premium blue ink ball pen",
        "category": "writing_instruments",
        "unit": "piece",
        "unitPrice": 15.00,
        "reorderPoint": 100,
        "safetyStock": 50,
        "reorderQty": 200,
        "leadTimeDays": 3,
        "primarySupplier": {
          "_id": "65f4e123...",
          "companyName": "ABC Suppliers Ltd"
        },
        "alternateSuppliers": [],
        "imageUrl": "https://example.com/image.jpg",
        "isActive": true,
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 3.2 Get Product by ID

**Endpoint:** `GET /products/:id`  
**Auth Required:** Yes  
**Description:** Get specific product details

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4b123...",
    "sku": "PEN-001",
    "name": "Blue Ball Pen",
    "description": "Premium blue ink ball pen with smooth writing experience",
    "category": "writing_instruments",
    "unit": "piece",
    "unitPrice": 15.00,
    "reorderPoint": 100,
    "safetyStock": 50,
    "reorderQty": 200,
    "leadTimeDays": 3,
    "primarySupplier": {
      "_id": "65f4e123...",
      "companyName": "ABC Suppliers Ltd",
      "contactEmail": "abc@suppliers.com"
    },
    "alternateSuppliers": [
      {
        "_id": "65f4e456...",
        "companyName": "XYZ Corp"
      }
    ],
    "imageUrl": "https://example.com/pen-001.jpg",
    "isActive": true,
    "uploadedBy": {
      "_id": "65f4a123...",
      "name": "Admin User"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 3.3 Create Product

**Endpoint:** `POST /products`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Create new product

**Request Body:**
```json
{
  "sku": "PEN-002",
  "name": "Red Ball Pen",
  "description": "Premium red ink ball pen",
  "category": "writing_instruments",
  "unit": "piece",
  "unitPrice": 18.00,
  "reorderPoint": 100,
  "safetyStock": 50,
  "reorderQty": 200,
  "leadTimeDays": 3,
  "primarySupplier": "65f4e123...",
  "alternateSuppliers": ["65f4e456..."],
  "imageUrl": "https://example.com/pen-002.jpg"
}
```

**Validation Rules:**
- `sku`: 3-50 chars, uppercase, unique
- `name`: 2-200 chars
- `category`: Valid enum value
- `unitPrice`: Positive number
- `reorderPoint`, `safetyStock`, `reorderQty`: Non-negative integers
- `leadTimeDays`: Non-negative integer
- `primarySupplier`: Valid supplier ID

**Success Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "65f4b456...",
    "sku": "PEN-002",
    "name": "Red Ball Pen",
    "unitPrice": 18.00,
    "isActive": true,
    "createdAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 3.4 Update Product

**Endpoint:** `PUT /products/:id`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Update product details

**Request Body:**
```json
{
  "name": "Red Ball Pen - Updated",
  "unitPrice": 20.00,
  "reorderPoint": 150,
  "imageUrl": "https://example.com/new-image.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "65f4b456...",
    "sku": "PEN-002",
    "name": "Red Ball Pen - Updated",
    "unitPrice": 20.00,
    "reorderPoint": 150,
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 3.5 Delete Product

**Endpoint:** `DELETE /products/:id`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Soft delete product (set isActive to false)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### 3.6 Search Products

**Endpoint:** `GET /products/search`  
**Auth Required:** Yes  
**Description:** Search products by SKU or name

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (min 2 chars) |

**Example Request:**
```
GET /products/search?q=pen
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "65f4b123...",
        "sku": "PEN-001",
        "name": "Blue Ball Pen",
        "unitPrice": 15.00,
        "category": "writing_instruments"
      },
      {
        "_id": "65f4b456...",
        "sku": "PEN-002",
        "name": "Red Ball Pen",
        "unitPrice": 20.00,
        "category": "writing_instruments"
      }
    ]
  }
}
```

---

### 3.7 Get Low Stock Products

**Endpoint:** `GET /products/low-stock`  
**Auth Required:** Yes (Admin, Warehouse Manager, Procurement Officer)  
**Description:** Get products below reorder point

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f4b123...",
      "sku": "NOTE-001",
      "name": "A4 Notebook",
      "currentStock": 25,
      "reorderPoint": 100,
      "safetyStock": 50,
      "stockStatus": "critical",
      "recommendedOrderQty": 200
    }
  ]
}
```

---

### 3.8 Get Product Statistics

**Endpoint:** `GET /products/statistics`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Get product statistics and analytics

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalProducts": 500,
    "activeProducts": 480,
    "inactiveProducts": 20,
    "lowStockProducts": 15,
    "byCategory": {
      "writing_instruments": 150,
      "paper_products": 200,
      "office_supplies": 100,
      "other": 50
    },
    "totalValue": 2500000.00
  }
}
```

---

### 3.9 Get Products by Category

**Endpoint:** `GET /products/category/:category`  
**Auth Required:** Yes  
**Description:** Get products filtered by category

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "category": "writing_instruments",
    "products": [
      {
        "_id": "65f4b123...",
        "sku": "PEN-001",
        "name": "Blue Ball Pen",
        "unitPrice": 15.00
      }
    ],
    "count": 150
  }
}
```

---

### 3.10 Get Product by SKU

**Endpoint:** `GET /products/sku/:sku`  
**Auth Required:** Yes  
**Description:** Get product by SKU

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4b123...",
    "sku": "PEN-001",
    "name": "Blue Ball Pen",
    "unitPrice": 15.00,
    "isActive": true
  }
}
```

---

### 3.11 Bulk Upload Products

**Endpoint:** `POST /products/bulk-upload`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Upload multiple products via CSV

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (CSV file)

**CSV Format:**
```csv
sku,name,category,unit,unitPrice,reorderPoint,safetyStock,reorderQty,leadTimeDays,primarySupplier
PEN-003,Green Pen,writing_instruments,piece,16.00,100,50,200,3,65f4e123...
NOTE-002,B5 Notebook,paper_products,piece,35.00,50,20,100,5,65f4e123...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Products uploaded successfully",
  "data": {
    "successCount": 48,
    "failedCount": 2,
    "errors": [
      {
        "row": 5,
        "sku": "PEN-999",
        "error": "SKU already exists"
      }
    ]
  }
}
```

---

## 4. Inventory Management

### 4.1 Get All Inventory

**Endpoint:** `GET /inventory`  
**Auth Required:** Yes  
**Description:** Get inventory across all or specific warehouse

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| warehouse | string | Filter by warehouse ID |
| product | string | Filter by product ID |
| zone | string | Filter by zone |
| page | number | Page number |
| limit | number | Items per page |

**Example Request:**
```
GET /inventory?warehouse=65f4c456...&page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "_id": "65f4d123...",
        "product": {
          "_id": "65f4b123...",
          "sku": "PEN-001",
          "name": "Blue Ball Pen"
        },
        "warehouse": {
          "_id": "65f4c456...",
          "name": "Mumbai Warehouse",
          "code": "WH-MUM-01"
        },
        "currentStock": 500,
        "reservedStock": 50,
        "availableStock": 450,
        "reorderPoint": 100,
        "safetyStock": 50,
        "zone": "A1",
        "replenishmentTriggered": false,
        "lastReplenishmentAt": null,
        "updatedAt": "2026-02-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

---

### 4.2 Get Inventory by ID

**Endpoint:** `GET /inventory/:id`  
**Auth Required:** Yes  
**Description:** Get specific inventory details

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4d123...",
    "product": {
      "_id": "65f4b123...",
      "sku": "PEN-001",
      "name": "Blue Ball Pen",
      "unitPrice": 15.00
    },
    "warehouse": {
      "_id": "65f4c456...",
      "name": "Mumbai Warehouse",
      "code": "WH-MUM-01",
      "location": {
        "city": "Mumbai",
        "state": "Maharashtra"
      }
    },
    "currentStock": 500,
    "reservedStock": 50,
    "availableStock": 450,
    "reorderPoint": 100,
    "safetyStock": 50,
    "zone": "A1",
    "replenishmentTriggered": false,
    "lastReplenishmentAt": null,
    "transactions": [
      {
        "type": "receipt",
        "quantity": 200,
        "referenceDoc": "PO-000123",
        "timestamp": "2026-02-10T10:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 4.3 Initialize Inventory

**Endpoint:** `POST /inventory`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Create inventory record for product in warehouse

**Request Body:**
```json
{
  "product": "65f4b123...",
  "warehouse": "65f4c456...",
  "currentStock": 500,
  "reorderPoint": 100,
  "safetyStock": 50,
  "zone": "A1"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Inventory initialized successfully",
  "data": {
    "_id": "65f4d123...",
    "product": "65f4b123...",
    "warehouse": "65f4c456...",
    "currentStock": 500,
    "reservedStock": 0,
    "availableStock": 500,
    "reorderPoint": 100,
    "safetyStock": 50,
    "zone": "A1",
    "createdAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 4.4 Adjust Stock

**Endpoint:** `PUT /inventory/:id/adjust`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Manually adjust stock levels

**Request Body:**
```json
{
  "quantity": 50,
  "type": "adjustment",
  "reason": "Physical count adjustment",
  "performedBy": "65f4a123...",
  "notes": "Stock damaged during inspection"
}
```

**Types:**
- `adjustment` - Manual correction
- `receipt` - Goods received
- `dispatch` - Goods sent out
- `return` - Return from customer

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "_id": "65f4d123...",
    "currentStock": 550,
    "availableStock": 500,
    "transactions": [
      {
        "type": "adjustment",
        "quantity": 50,
        "reason": "Physical count adjustment",
        "performedBy": {
          "_id": "65f4a123...",
          "name": "John Doe"
        },
        "timestamp": "2026-02-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 4.5 Reserve Stock

**Endpoint:** `POST /inventory/:id/reserve`  
**Auth Required:** Yes  
**Description:** Reserve stock for order

**Request Body:**
```json
{
  "quantity": 100,
  "referenceDoc": "PO-000125",
  "performedBy": "65f4a123..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock reserved successfully",
  "data": {
    "_id": "65f4d123...",
    "currentStock": 500,
    "reservedStock": 100,
    "availableStock": 400
  }
}
```

---

### 4.6 Release Reservation

**Endpoint:** `POST /inventory/:id/release`  
**Auth Required:** Yes  
**Description:** Release reserved stock

**Request Body:**
```json
{
  "quantity": 50,
  "referenceDoc": "PO-000125",
  "reason": "Partial cancellation"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock reservation released",
  "data": {
    "_id": "65f4d123...",
    "reservedStock": 50,
    "availableStock": 450
  }
}
```

---

### 4.7 Transfer Stock

**Endpoint:** `POST /inventory/transfer`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Transfer stock between warehouses

**Request Body:**
```json
{
  "product": "65f4b123...",
  "fromWarehouse": "65f4c456...",
  "toWarehouse": "65f4c789...",
  "quantity": 50,
  "reason": "Load balancing",
  "performedBy": "65f4a123...",
  "notes": "Inter-warehouse transfer for demand balancing"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock transferred successfully",
  "data": {
    "transferId": "TRF-000001",
    "fromInventory": {
      "_id": "65f4d123...",
      "warehouse": "WH-MUM-01",
      "currentStock": 450,
      "availableStock": 400
    },
    "toInventory": {
      "_id": "65f4d456...",
      "warehouse": "WH-DEL-01",
      "currentStock": 150,
      "availableStock": 150
    },
    "transferredQuantity": 50,
    "completedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 4.8 Get Low Stock Items

**Endpoint:** `GET /inventory/low-stock`  
**Auth Required:** Yes  
**Description:** Get inventory items below reorder point

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| warehouse | string | Filter by warehouse ID |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f4d123...",
      "product": {
        "sku": "NOTE-001",
        "name": "A4 Notebook"
      },
      "warehouse": {
        "code": "WH-MUM-01",
        "name": "Mumbai Warehouse"
      },
      "currentStock": 25,
      "reorderPoint": 100,
      "safetyStock": 50,
      "status": "critical",
      "daysUntilStockout": 3,
      "recommendedOrderQty": 200
    }
  ]
}
```

---

### 4.9 Get Stock Report

**Endpoint:** `GET /inventory/stock-report`  
**Auth Required:** Yes  
**Description:** Get comprehensive stock report

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| warehouse | string | Filter by warehouse ID |
| category | string | Filter by product category |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProducts": 500,
      "totalStockValue": 2500000.00,
      "lowStockItems": 15,
      "criticalStockItems": 5,
      "overStockItems": 10
    },
    "byWarehouse": [
      {
        "warehouse": "WH-MUM-01",
        "totalStock": 50000,
        "stockValue": 1500000.00,
        "utilizationPercent": 75
      }
    ],
    "byCategory": {
      "writing_instruments": {
        "totalStock": 15000,
        "value": 500000.00
      }
    }
  }
}
```

---

### 4.10 Get Inventory Valuation

**Endpoint:** `GET /inventory/valuation`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Get total inventory valuation

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalValue": 2500000.00,
    "byWarehouse": {
      "WH-MUM-01": 1500000.00,
      "WH-DEL-01": 1000000.00
    },
    "byCategory": {
      "writing_instruments": 500000.00,
      "paper_products": 1200000.00,
      "office_supplies": 800000.00
    },
    "calculatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 4.11 Update Reorder Settings

**Endpoint:** `PUT /inventory/:id/reorder-settings`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Update reorder point and safety stock

**Request Body:**
```json
{
  "reorderPoint": 150,
  "safetyStock": 75
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reorder settings updated successfully",
  "data": {
    "_id": "65f4d123...",
    "reorderPoint": 150,
    "safetyStock": 75,
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 4.12 Trigger Replenishment

**Endpoint:** `POST /inventory/:id/trigger-replenishment`  
**Auth Required:** Yes (Admin, Warehouse Manager, Procurement Officer)  
**Description:** Manually trigger replenishment for low stock

**Success Response (200):**
```json
{
  "success": true,
  "message": "Replenishment triggered successfully",
  "data": {
    "inventoryId": "65f4d123...",
    "purchaseOrderId": "65f4f123...",
    "poNumber": "PO-000126",
    "recommendedQty": 200,
    "replenishmentTriggered": true,
    "triggeredAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 4.13 Get Transaction History

**Endpoint:** `GET /inventory/:id/transactions`  
**Auth Required:** Yes  
**Description:** Get stock movement history

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| type | string | Filter by transaction type |
| startDate | date | Start date |
| endDate | date | End date |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "type": "receipt",
        "quantity": 200,
        "referenceDoc": "PO-000123",
        "performedBy": {
          "name": "John Doe",
          "role": "warehouse_manager"
        },
        "notes": "Received from supplier ABC Ltd",
        "timestamp": "2026-02-10T10:00:00.000Z"
      },
      {
        "type": "dispatch",
        "quantity": -50,
        "referenceDoc": "SO-000045",
        "performedBy": {
          "name": "Jane Smith",
          "role": "warehouse_manager"
        },
        "timestamp": "2026-02-12T14:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 30
    }
  }
}
```

---

## 5. Purchase Order Management

### 5.1 Get All Purchase Orders

**Endpoint:** `GET /purchase-orders`  
**Auth Required:** Yes  
**Description:** Get list of purchase orders

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| status | string | Filter by status |
| supplier | string | Filter by supplier ID |
| warehouse | string | Filter by warehouse ID |
| startDate | date | Filter by date range |
| endDate | date | Filter by date range |

**Example Request:**
```
GET /purchase-orders?status=approved&supplier=65f4e123...&page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "65f4f123...",
        "poNumber": "PO-000123",
        "supplier": {
          "_id": "65f4e123...",
          "companyName": "ABC Suppliers Ltd"
        },
        "warehouse": {
          "_id": "65f4c456...",
          "code": "WH-MUM-01",
          "name": "Mumbai Warehouse"
        },
        "totalAmount": 45000.00,
        "currency": "INR",
        "status": "approved",
        "triggeredBy": "manual",
        "createdBy": {
          "_id": "65f4a123...",
          "name": "John Doe"
        },
        "expectedDeliveryDate": "2026-02-20T00:00:00.000Z",
        "createdAt": "2026-02-15T10:00:00.000Z",
        "lineItemsCount": 3
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 87
    }
  }
}
```

**Status Values:**
- `draft` - PO being created
- `pending_approval` - Awaiting approval
- `approved` - Approved by manager
- `sent_to_supplier` - Sent to supplier
- `acknowledged` - Supplier acknowledged
- `partially_received` - Partial delivery
- `fully_received` - Complete delivery
- `cancelled` - Cancelled

---

### 5.2 Get Purchase Order by ID

**Endpoint:** `GET /purchase-orders/:id`  
**Auth Required:** Yes  
**Description:** Get detailed PO information

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000123",
    "supplier": {
      "_id": "65f4e123...",
      "companyName": "ABC Suppliers Ltd",
      "contactEmail": "abc@suppliers.com",
      "contactPhone": "+91-9876543210"
    },
    "warehouse": {
      "_id": "65f4c456...",
      "code": "WH-MUM-01",
      "name": "Mumbai Warehouse",
      "location": {
        "city": "Mumbai",
        "address": "123 Industrial Area"
      }
    },
    "lineItems": [
      {
        "_id": "item1",
        "product": {
          "_id": "65f4b123...",
          "sku": "PEN-001",
          "name": "Blue Ball Pen"
        },
        "orderedQty": 200,
        "receivedQty": 0,
        "unitPrice": 15.00,
        "totalPrice": 3000.00
      },
      {
        "_id": "item2",
        "product": {
          "_id": "65f4b456...",
          "sku": "NOTE-001",
          "name": "A4 Notebook"
        },
        "orderedQty": 100,
        "receivedQty": 0,
        "unitPrice": 45.00,
        "totalPrice": 4500.00
      }
    ],
    "totalAmount": 7500.00,
    "currency": "INR",
    "status": "approved",
    "triggeredBy": "manual",
    "createdBy": {
      "_id": "65f4a123...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "approvedBy": {
      "_id": "65f4a456...",
      "name": "Manager User"
    },
    "approvedAt": "2026-02-15T11:00:00.000Z",
    "expectedDeliveryDate": "2026-02-20T00:00:00.000Z",
    "notes": "Urgent order for low stock items",
    "blockchainTxHash": null,
    "blockchainLoggedAt": null,
    "createdAt": "2026-02-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T11:00:00.000Z"
  }
}
```

---

### 5.3 Create Purchase Order

**Endpoint:** `POST /purchase-orders`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Create new purchase order

**Request Body:**
```json
{
  "supplier": "65f4e123...",
  "warehouse": "65f4c456...",
  "lineItems": [
    {
      "product": "65f4b123...",
      "orderedQty": 200,
      "unitPrice": 15.00
    },
    {
      "product": "65f4b456...",
      "orderedQty": 100,
      "unitPrice": 45.00
    }
  ],
  "expectedDeliveryDate": "2026-02-20T00:00:00.000Z",
  "notes": "Urgent order"
}
```

**Validation:**
- At least 1 line item required
- All product IDs must be valid
- Unit prices must be positive
- Ordered quantities must be positive integers

**Success Response (201):**
```json
{
  "success": true,
  "message": "Purchase order created successfully",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "supplier": "65f4e123...",
    "warehouse": "65f4c456...",
    "lineItems": [
      {
        "product": "65f4b123...",
        "sku": "PEN-001",
        "orderedQty": 200,
        "receivedQty": 0,
        "unitPrice": 15.00,
        "totalPrice": 3000.00
      }
    ],
    "totalAmount": 7500.00,
    "status": "draft",
    "triggeredBy": "manual",
    "createdAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 5.4 Update Purchase Order

**Endpoint:** `PUT /purchase-orders/:id`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Update draft purchase order

**Note:** Can only update PO with status `draft`

**Request Body:**
```json
{
  "lineItems": [
    {
      "product": "65f4b123...",
      "orderedQty": 250,
      "unitPrice": 15.00
    }
  ],
  "expectedDeliveryDate": "2026-02-22T00:00:00.000Z",
  "notes": "Updated order quantity"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order updated successfully",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "totalAmount": 3750.00,
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### 5.5 Submit for Approval

**Endpoint:** `PUT /purchase-orders/:id/submit-for-approval`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Submit PO for approval

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order submitted for approval",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "status": "pending_approval",
    "updatedAt": "2026-02-15T10:35:00.000Z"
  }
}
```

---

### 5.6 Approve Purchase Order

**Endpoint:** `PUT /purchase-orders/:id/approve`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Approve pending PO

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order approved successfully",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "status": "approved",
    "approvedBy": "65f4a456...",
    "approvedAt": "2026-02-15T11:00:00.000Z"
  }
}
```

---

### 5.7 Reject Purchase Order

**Endpoint:** `PUT /purchase-orders/:id/reject`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Reject pending PO

**Request Body:**
```json
{
  "reason": "Budget exceeded for this month"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order rejected",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "status": "draft",
    "rejectionReason": "Budget exceeded for this month"
  }
}
```

---

### 5.8 Send to Supplier

**Endpoint:** `PUT /purchase-orders/:id/send`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Send approved PO to supplier

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order sent to supplier",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "status": "sent_to_supplier",
    "sentAt": "2026-02-15T11:30:00.000Z"
  }
}
```

---

### 5.9 Acknowledge (Supplier)

**Endpoint:** `PUT /purchase-orders/:id/acknowledge`  
**Auth Required:** Yes (Supplier)  
**Description:** Supplier acknowledges PO

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order acknowledged",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "status": "acknowledged",
    "acknowledgedAt": "2026-02-15T12:00:00.000Z"
  }
}
```

---

### 5.10 Receive Purchase Order

**Endpoint:** `PUT /purchase-orders/:id/receive`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Mark PO as received (full or partial)

**Request Body:**
```json
{
  "lineItems": [
    {
      "lineItemId": "item1",
      "receivedQty": 200
    },
    {
      "lineItemId": "item2",
      "receivedQty": 80
    }
  ],
  "notes": "Partial delivery - remaining 20 units to arrive tomorrow"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order received",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "status": "partially_received",
    "lineItems": [
      {
        "product": "PEN-001",
        "orderedQty": 200,
        "receivedQty": 200,
        "status": "fully_received"
      },
      {
        "product": "NOTE-001",
        "orderedQty": 100,
        "receivedQty": 80,
        "status": "partially_received"
      }
    ],
    "inventoryUpdated": true,
    "receivedAt": "2026-02-18T14:00:00.000Z"
  }
}
```

---

### 5.11 Cancel Purchase Order

**Endpoint:** `DELETE /purchase-orders/:id`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Cancel purchase order

**Success Response (200):**
```json
{
  "success": true,
  "message": "Purchase order cancelled successfully",
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000124",
    "status": "cancelled",
    "cancelledAt": "2026-02-15T15:00:00.000Z"
  }
}
```

---

### 5.12 Get PO by Number

**Endpoint:** `GET /purchase-orders/po/:poNumber`  
**Auth Required:** Yes  
**Description:** Get PO by PO number

**Example:** `GET /purchase-orders/po/PO-000123`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4f123...",
    "poNumber": "PO-000123",
    "status": "approved",
    "totalAmount": 45000.00
  }
}
```

---

### 5.13 Get Pending Approvals

**Endpoint:** `GET /purchase-orders/pending`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Get POs pending approval

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f4f123...",
      "poNumber": "PO-000125",
      "supplier": {
        "companyName": "XYZ Corp"
      },
      "totalAmount": 32000.00,
      "createdBy": {
        "name": "John Doe"
      },
      "createdAt": "2026-02-15T10:00:00.000Z"
    }
  ]
}
```

---

### 5.14 Get PO Analytics

**Endpoint:** `GET /purchase-orders/analytics`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Get PO statistics and analytics

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | date | Start date for analytics |
| endDate | date | End date for analytics |
| warehouse | string | Filter by warehouse |
| supplier | string | Filter by supplier |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 150,
      "totalValue": 2500000.00,
      "averageOrderValue": 16666.67,
      "byStatus": {
        "draft": 5,
        "pending_approval": 10,
        "approved": 20,
        "sent_to_supplier": 15,
        "acknowledged": 25,
        "partially_received": 10,
        "fully_received": 60,
        "cancelled": 5
      }
    },
    "topSuppliers": [
      {
        "supplier": "ABC Suppliers Ltd",
        "orderCount": 45,
        "totalValue": 750000.00
      }
    ],
    "monthlyTrend": [
      {
        "month": "2026-01",
        "orderCount": 50,
        "totalValue": 850000.00
      },
      {
        "month": "2026-02",
        "orderCount": 100,
        "totalValue": 1650000.00
      }
    ]
  }
}
```

---

## 6. Warehouse Management

### 6.1 Get All Warehouses

**Endpoint:** `GET /warehouses`  
**Auth Required:** Yes  
**Description:** Get list of warehouses

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by status |
| city | string | Filter by city |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f4c456...",
      "name": "Mumbai Central Warehouse",
      "code": "WH-MUM-01",
      "location": {
        "address": "123 Industrial Area, Andheri",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "pincode": "400053",
        "coordinates": {
          "lat": 19.1136,
          "lng": 72.8697
        }
      },
      "totalCapacity": 10000,
      "usedCapacity": 7500,
      "utilizationPercent": 75,
      "zones": [
        {
          "_id": "zone1",
          "zoneCode": "A1",
          "type": "standard",
          "capacityUnits": 2000,
          "currentLoad": 1500
        }
      ],
      "manager": {
        "_id": "65f4a123...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 6.2 Get Warehouse by ID

**Endpoint:** `GET /warehouses/:id`  
**Auth Required:** Yes  
**Description:** Get detailed warehouse information

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4c456...",
    "name": "Mumbai Central Warehouse",
    "code": "WH-MUM-01",
    "location": {
      "address": "123 Industrial Area, Andheri",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "pincode": "400053",
      "coordinates": {
        "lat": 19.1136,
        "lng": 72.8697
      }
    },
    "totalCapacity": 10000,
    "usedCapacity": 7500,
    "utilizationPercent": 75,
    "zones": [
      {
        "_id": "zone1",
        "zoneCode": "A1",
        "type": "standard",
        "capacityUnits": 2000,
        "currentLoad": 1500,
        "utilizationPercent": 75
      },
      {
        "_id": "zone2",
        "zoneCode": "B1",
        "type": "cold_storage",
        "capacityUnits": 1000,
        "currentLoad": 800,
        "utilizationPercent": 80
      }
    ],
    "manager": {
      "_id": "65f4a123...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91-9876543210"
    },
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 6.3 Create Warehouse

**Endpoint:** `POST /warehouses`  
**Auth Required:** Yes (Admin)  
**Description:** Create new warehouse

**Request Body:**
```json
{
  "name": "Delhi NCR Warehouse",
  "code": "WH-DEL-01",
  "location": {
    "address": "456 Logistics Park, Gurgaon",
    "city": "Gurgaon",
    "state": "Haryana",
    "country": "India",
    "pincode": "122001",
    "coordinates": {
      "lat": 28.4595,
      "lng": 77.0266
    }
  },
  "totalCapacity": 8000,
  "zones": [
    {
      "zoneCode": "A1",
      "type": "standard",
      "capacityUnits": 3000
    },
    {
      "zoneCode": "B1",
      "type": "cold_storage",
      "capacityUnits": 2000
    }
  ],
  "manager": "65f4a456..."
}
```

**Validation:**
- `code`: Unique, uppercase
- `totalCapacity`: Positive number
- Zone capacity sum <= totalCapacity

**Success Response (201):**
```json
{
  "success": true,
  "message": "Warehouse created successfully",
  "data": {
    "_id": "65f4c789...",
    "name": "Delhi NCR Warehouse",
    "code": "WH-DEL-01",
    "totalCapacity": 8000,
    "usedCapacity": 0,
    "isActive": true,
    "createdAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 6.4 Update Warehouse

**Endpoint:** `PUT /warehouses/:id`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Update warehouse details

**Request Body:**
```json
{
  "name": "Mumbai Central Warehouse - Updated",
  "totalCapacity": 12000,
  "manager": "65f4a789..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Warehouse updated successfully",
  "data": {
    "_id": "65f4c456...",
    "name": "Mumbai Central Warehouse - Updated",
    "totalCapacity": 12000,
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### 6.5 Delete Warehouse

**Endpoint:** `DELETE /warehouses/:id`  
**Auth Required:** Yes (Admin)  
**Description:** Deactivate warehouse

**Success Response (200):**
```json
{
  "success": true,
  "message": "Warehouse deleted successfully"
}
```

---

### 6.6 Get Warehouse by Code

**Endpoint:** `GET /warehouses/code/:code`  
**Auth Required:** Yes  
**Description:** Get warehouse by code

**Example:** `GET /warehouses/code/WH-MUM-01`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4c456...",
    "name": "Mumbai Central Warehouse",
    "code": "WH-MUM-01",
    "totalCapacity": 10000,
    "usedCapacity": 7500
  }
}
```

---

### 6.7 Add Zone

**Endpoint:** `POST /warehouses/:id/zones`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Add zone to warehouse

**Request Body:**
```json
{
  "zoneCode": "C1",
  "type": "bulk",
  "capacityUnits": 1500
}
```

**Zone Types:**
- `standard` - General storage
- `cold_storage` - Temperature controlled
- `hazmat` - Hazardous materials
- `bulk` - Bulk items

**Success Response (200):**
```json
{
  "success": true,
  "message": "Zone added successfully",
  "data": {
    "warehouse": "65f4c456...",
    "zone": {
      "_id": "zone3",
      "zoneCode": "C1",
      "type": "bulk",
      "capacityUnits": 1500,
      "currentLoad": 0
    }
  }
}
```

---

### 6.8 Update Zone

**Endpoint:** `PUT /warehouses/:id/zones/:zoneId`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Update zone details

**Request Body:**
```json
{
  "capacityUnits": 2000
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Zone updated successfully"
}
```

---

### 6.9 Remove Zone

**Endpoint:** `DELETE /warehouses/:id/zones/:zoneId`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Remove zone from warehouse

**Success Response (200):**
```json
{
  "success": true,
  "message": "Zone removed successfully"
}
```

---

### 6.10 Get Capacity Report

**Endpoint:** `GET /warehouses/:id/capacity-report`  
**Auth Required:** Yes  
**Description:** Get warehouse capacity utilization report

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "warehouse": {
      "code": "WH-MUM-01",
      "name": "Mumbai Central Warehouse"
    },
    "overall": {
      "totalCapacity": 10000,
      "usedCapacity": 7500,
      "availableCapacity": 2500,
      "utilizationPercent": 75
    },
    "byZone": [
      {
        "zoneCode": "A1",
        "type": "standard",
        "capacityUnits": 2000,
        "currentLoad": 1500,
        "availableCapacity": 500,
        "utilizationPercent": 75
      }
    ],
    "recommendations": [
      "Zone A1 approaching capacity limit",
      "Consider transferring excess stock to Zone C1"
    ],
    "generatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 6.11 Get Inventory Summary

**Endpoint:** `GET /warehouses/:id/inventory-summary`  
**Auth Required:** Yes  
**Description:** Get summary of inventory in warehouse

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "warehouse": {
      "code": "WH-MUM-01",
      "name": "Mumbai Central Warehouse"
    },
    "summary": {
      "totalProducts": 450,
      "totalStockUnits": 50000,
      "totalStockValue": 1500000.00,
      "lowStockProducts": 15
    },
    "byCategory": {
      "writing_instruments": {
        "productCount": 150,
        "stockUnits": 15000,
        "value": 500000.00
      },
      "paper_products": {
        "productCount": 200,
        "stockUnits": 25000,
        "value": 800000.00
      }
    },
    "topProducts": [
      {
        "sku": "PEN-001",
        "name": "Blue Ball Pen",
        "stock": 5000,
        "value": 75000.00
      }
    ]
  }
}
```

---

### 6.12 Get Warehouse Statistics

**Endpoint:** `GET /warehouses/statistics`  
**Auth Required:** Yes (Admin, Warehouse Manager)  
**Description:** Get overall warehouse statistics

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalWarehouses": 5,
    "activeWarehouses": 5,
    "totalCapacity": 50000,
    "totalUsedCapacity": 37500,
    "averageUtilization": 75,
    "byCity": {
      "Mumbai": 2,
      "Delhi": 1,
      "Bangalore": 2
    },
    "capacityDistribution": [
      {
        "warehouse": "WH-MUM-01",
        "utilizationPercent": 75
      }
    ]
  }
}
```

---

## 7. Supplier Management

### 7.1 Get All Suppliers

**Endpoint:** `GET /suppliers`  
**Auth Required:** Yes  
**Description:** Get list of suppliers

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| isApproved | boolean | Filter by approval status |
| search | string | Search by company name |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "suppliers": [
      {
        "_id": "65f4e123...",
        "companyName": "ABC Suppliers Ltd",
        "contactEmail": "contact@abcsuppliers.com",
        "contactPhone": "+91-9876543210",
        "address": {
          "street": "123 Business Park",
          "city": "Mumbai",
          "country": "India"
        },
        "rating": 4.5,
        "isApproved": true,
        "catalogProducts": 125,
        "negotiationStats": {
          "totalNegotiations": 45,
          "acceptedOffers": 38,
          "averageSavingsPercent": 12.5
        },
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

---

### 7.2 Get Supplier by ID

**Endpoint:** `GET /suppliers/:id`  
**Auth Required:** Yes  
**Description:** Get detailed supplier information

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65f4e123...",
    "companyName": "ABC Suppliers Ltd",
    "contactEmail": "contact@abcsuppliers.com",
    "contactPhone": "+91-9876543210",
    "address": {
      "street": "123 Business Park",
      "city": "Mumbai",
      "country": "India"
    },
    "catalogProducts": [
      {
        "product": {
          "_id": "65f4b123...",
          "sku": "PEN-001",
          "name": "Blue Ball Pen"
        },
        "unitPrice": 15.00,
        "leadTimeDays": 3,
        "moq": 100
      }
    ],
    "currentContractTerms": [
      {
        "field": "payment_terms",
        "agreedValue": "Net 30",
        "negotiatedAt": "2026-01-15T00:00:00.000Z"
      }
    ],
    "rating": 4.5,
    "isApproved": true,
    "negotiationStats": {
      "totalNegotiations": 45,
      "acceptedOffers": 38,
      "averageSavingsPercent": 12.5
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 7.3 Create Supplier

**Endpoint:** `POST /suppliers`  
**Auth Required:** Yes (Admin)  
**Description:** Register new supplier

**Request Body:**
```json
{
  "companyName": "XYZ Corporation",
  "contactEmail": "contact@xyz.com",
  "contactPhone": "+91-9876543211",
  "address": {
    "street": "456 Industrial Zone",
    "city": "Delhi",
    "country": "India"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "_id": "65f4e456...",
    "companyName": "XYZ Corporation",
    "contactEmail": "contact@xyz.com",
    "isApproved": false,
    "rating": null,
    "createdAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 7.4 Update Supplier

**Endpoint:** `PUT /suppliers/:id`  
**Auth Required:** Yes (Admin, Supplier)  
**Description:** Update supplier details

**Request Body:**
```json
{
  "contactPhone": "+91-9876543212",
  "address": {
    "street": "789 New Location",
    "city": "Mumbai"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Supplier updated successfully",
  "data": {
    "_id": "65f4e123...",
    "companyName": "ABC Suppliers Ltd",
    "contactPhone": "+91-9876543212",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

---

### 7.5 Delete Supplier

**Endpoint:** `DELETE /suppliers/:id`  
**Auth Required:** Yes (Admin)  
**Description:** Remove supplier

**Success Response (200):**
```json
{
  "success": true,
  "message": "Supplier deleted successfully"
}
```

---

### 7.6 Add Catalog Product

**Endpoint:** `POST /suppliers/:id/catalog`  
**Auth Required:** Yes (Admin, Supplier)  
**Description:** Add product to supplier catalog

**Request Body:**
```json
{
  "product": "65f4b123...",
  "unitPrice": 15.00,
  "leadTimeDays": 3,
  "moq": 100
}
```

**Validation:**
- Product must exist
- Unit price must be positive
- Lead time must be non-negative
- MOQ must be positive

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product added to catalog",
  "data": {
    "supplier": "65f4e123...",
    "catalogProduct": {
      "product": "65f4b123...",
      "unitPrice": 15.00,
      "leadTimeDays": 3,
      "moq": 100
    }
  }
}
```

---

### 7.7 Update Catalog Product

**Endpoint:** `PUT /suppliers/:id/catalog/:productId`  
**Auth Required:** Yes (Admin, Supplier)  
**Description:** Update catalog product pricing/terms

**Request Body:**
```json
{
  "unitPrice": 14.50,
  "leadTimeDays": 2,
  "moq": 50
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Catalog product updated",
  "data": {
    "product": "65f4b123...",
    "unitPrice": 14.50,
    "leadTimeDays": 2,
    "moq": 50
  }
}
```

---

### 7.8 Remove Catalog Product

**Endpoint:** `DELETE /suppliers/:id/catalog/:productId`  
**Auth Required:** Yes (Admin, Supplier)  
**Description:** Remove product from supplier catalog

**Success Response (200):**
```json
{
  "success": true,
  "message": "Product removed from catalog"
}
```

---

### 7.9 Update Contract Terms

**Endpoint:** `PUT /suppliers/:id/contract`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Update supplier contract terms

**Request Body:**
```json
{
  "terms": [
    {
      "field": "payment_terms",
      "agreedValue": "Net 45"
    },
    {
      "field": "minimum_order_value",
      "agreedValue": 10000
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contract terms updated",
  "data": {
    "supplier": "65f4e123...",
    "currentContractTerms": [
      {
        "field": "payment_terms",
        "agreedValue": "Net 45",
        "negotiatedAt": "2026-02-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 7.10 Approve Supplier

**Endpoint:** `PUT /suppliers/:id/approve`  
**Auth Required:** Yes (Admin)  
**Description:** Approve pending supplier

**Success Response (200):**
```json
{
  "success": true,
  "message": "Supplier approved successfully",
  "data": {
    "_id": "65f4e123...",
    "companyName": "ABC Suppliers Ltd",
    "isApproved": true,
    "approvedAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 7.11 Reject Supplier

**Endpoint:** `PUT /suppliers/:id/reject`  
**Auth Required:** Yes (Admin)  
**Description:** Reject supplier application

**Request Body:**
```json
{
  "reason": "Incomplete documentation"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Supplier rejected",
  "data": {
    "_id": "65f4e123...",
    "isApproved": false,
    "rejectionReason": "Incomplete documentation"
  }
}
```

---

### 7.12 Get Performance Metrics

**Endpoint:** `GET /suppliers/:id/performance`  
**Auth Required:** Yes  
**Description:** Get supplier performance metrics

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "supplier": {
      "_id": "65f4e123...",
      "companyName": "ABC Suppliers Ltd"
    },
    "overall": {
      "rating": 4.5,
      "totalOrders": 150,
      "completedOrders": 145,
      "cancelledOrders": 5,
      "onTimeDeliveryRate": 92,
      "averageDeliveryTime": 3.2
    },
    "financials": {
      "totalRevenue": 2500000.00,
      "averageOrderValue": 16666.67
    },
    "negotiation": {
      "totalNegotiations": 45,
      "acceptedOffers": 38,
      "rejectedOffers": 7,
      "averageSavingsPercent": 12.5
    },
    "recentOrders": [
      {
        "poNumber": "PO-000120",
        "amount": 45000.00,
        "status": "fully_received",
        "deliveredOn": "2026-02-10T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 7.13 Get Supplier Statistics

**Endpoint:** `GET /suppliers/statistics`  
**Auth Required:** Yes (Admin, Procurement Officer)  
**Description:** Get overall supplier statistics

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSuppliers": 25,
    "approvedSuppliers": 20,
    "pendingApproval": 5,
    "averageRating": 4.2,
    "topSuppliers": [
      {
        "companyName": "ABC Suppliers Ltd",
        "orderCount": 150,
        "totalRevenue": 2500000.00,
        "rating": 4.5
      }
    ],
    "suppliersByRating": {
      "5_star": 5,
      "4_star": 10,
      "3_star": 5,
      "below_3": 0
    }
  }
}
```

---

## 8. Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ],
  "stack": "Error stack trace (only in development)"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Examples

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required. Please login."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Product not found"
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 9. Rate Limiting

**Limits:**
- Auth endpoints: 5 requests per minute
- Read endpoints: 100 requests per minute
- Write endpoints: 20 requests per minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645012800
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

---

## 10. Pagination

### Standard Pagination Format

**Request:**
```
GET /products?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "currentPage": 2,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```

### Pagination Parameters

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| page | number | 1 | - |
| limit | number | 10 | 100 |

---

## Appendix

### A. Enum Values

**User Roles:**
- `admin`
- `warehouse_manager`
- `procurement_officer`
- `supplier`

**Product Categories:**
- `writing_instruments`
- `paper_products`
- `office_supplies`
- `filing_storage`
- `desk_accessories`
- `presentation`
- `technology`
- `other`

**Product Units:**
- `piece`
- `kg`
- `litre`
- `box`
- `pallet`
- `carton`

**PO Status:**
- `draft`
- `pending_approval`
- `approved`
- `sent_to_supplier`
- `acknowledged`
- `partially_received`
- `fully_received`
- `cancelled`

**Transaction Types:**
- `receipt`
- `dispatch`
- `adjustment`
- `transfer`
- `return`

**Zone Types:**
- `standard`
- `cold_storage`
- `hazmat`
- `bulk`

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Maintained By:** StationeryChain Team

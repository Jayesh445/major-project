# User Module API Documentation

## Overview
Complete user authentication and authorization module with JWT-based authentication, role-based access control (RBAC), and user management features.

## Features
- User registration (signup)
- User login with JWT token generation
- Password hashing with bcrypt
- JWT token verification
- Role-based access control (Admin, Warehouse Manager, Procurement Officer, Supplier)
- User profile management
- Password change functionality
- Admin user management (CRUD operations)
- Request validation with Zod schemas

## User Roles
- `admin` - Full system access
- `warehouse_manager` - Warehouse management access
- `procurement_officer` - Procurement operations access
- `supplier` - Supplier portal access

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. User Signup
```
POST /api/users/signup
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "warehouse_manager",
  "assignedWarehouses": ["warehouse_id_1", "warehouse_id_2"],
  "supplierRef": "supplier_id" // Required only for 'supplier' role
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "warehouse_manager",
      "isActive": true,
      "assignedWarehouses": ["warehouse_id_1", "warehouse_id_2"],
      "notificationPreferences": {
        "email": true,
        "inApp": true,
        "lowStockAlerts": true,
        "poApprovals": true,
        "negotiationUpdates": true
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### 2. User Login
```
POST /api/users/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "warehouse_manager",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### Protected Endpoints (Authentication Required)

**Authorization Header:**
```
Authorization: Bearer <jwt_token>
```

#### 3. Get Current User Profile
```
GET /api/users/profile
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "warehouse_manager",
    "assignedWarehouses": [...],
    "notificationPreferences": {...}
  }
}
```

#### 4. Update Current User Profile
```
PATCH /api/users/profile
```

**Request Body:**
```json
{
  "name": "John Smith",
  "notificationPreferences": {
    "email": false,
    "lowStockAlerts": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "user_id",
    "name": "John Smith",
    "notificationPreferences": {
      "email": false,
      "inApp": true,
      "lowStockAlerts": true,
      "poApprovals": true,
      "negotiationUpdates": true
    }
  }
}
```

#### 5. Change Password
```
POST /api/users/change-password
```

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

### Admin-Only Endpoints

#### 6. Get All Users
```
GET /api/users?role=admin&isActive=true&page=1&limit=10
```

**Query Parameters:**
- `role` (optional): Filter by user role
- `isActive` (optional): Filter by active status (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "totalPages": 5,
      "limit": 10
    }
  }
}
```

#### 7. Get User by ID
```
GET /api/users/:id
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "warehouse_manager"
  }
}
```

#### 8. Update User
```
PATCH /api/users/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "procurement_officer",
  "isActive": false,
  "assignedWarehouses": ["warehouse_id_1"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "user_id",
    "name": "Updated Name",
    "role": "procurement_officer",
    "isActive": false
  }
}
```

#### 9. Delete User
```
DELETE /api/users/:id
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

**Common Error Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (user not found)
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

## Environment Variables

Create a `.env` file with the following variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database
MONGODB_URI=mongodb://localhost:27017/supply-chain-management

# Server
PORT=3000
NODE_ENV=development
```

## Module Structure

```
src/modules/user/
├── model.ts           # Mongoose user schema and model
├── service.ts         # Business logic and authentication
├── controller.ts      # Request handlers
├── routes.ts          # Route definitions
├── validation.ts      # Zod validation schemas
└── index.ts          # Module exports
```

## Testing with cURL

### Signup
```bash
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get All Users (Admin)
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 10
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access Control**: Middleware for role verification
4. **Request Validation**: Zod schemas for input validation
5. **Error Handling**: Centralized error handling with appropriate status codes
6. **Password Not Returned**: Password hash excluded from all responses

## Next Steps

1. Set up MongoDB database connection in `src/config/database.ts`
2. Configure environment variables
3. Run the server: `npm run dev`
4. Test the endpoints using the examples above

# Refresh Token Authentication Guide

## Overview
This authentication system implements a secure access/refresh token mechanism using JWT tokens. The system provides enhanced security through short-lived access tokens and long-lived refresh tokens.

## Token Types

### Access Token
- **Purpose**: Authentication for API requests
- **Lifetime**: 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Storage**: Client-side memory or sessionStorage (NOT localStorage for security)
- **Usage**: Sent with every API request via Authorization header

### Refresh Token
- **Purpose**: Obtain new access tokens without re-authentication
- **Lifetime**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Storage**: Secure HttpOnly cookie (recommended) or secure client storage
- **Usage**: Sent to `/refresh-token` endpoint to get new access token

## Security Features

1. **Token Rotation**: New refresh token issued on every refresh
2. **Token Limiting**: Maximum 5 refresh tokens per user (prevents unlimited sessions)
3. **Device Tracking**: Stores IP address and User-Agent for each session
4. **Automatic Cleanup**: Expired tokens automatically removed
5. **Revocation**: Logout invalidates specific or all refresh tokens
6. **Token Type Validation**: Prevents using refresh token as access token and vice versa

## Environment Configuration

Add these variables to your `.env` file:

```env
# JWT Secrets (use strong, unique values in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-this-in-production

# Token Expiration
JWT_ACCESS_EXPIRES_IN=15m    # Access token expires in 15 minutes
JWT_REFRESH_EXPIRES_IN=7d    # Refresh token expires in 7 days

# Security Settings
MAX_REFRESH_TOKENS=5         # Maximum concurrent sessions per user
```

## API Endpoints

### 1. Login (Updated)
```http
POST /api/users/login
```

**Request:**
```json
{
  "email": "user@example.com",
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
      "email": "user@example.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Signup (Updated)
```http
POST /api/users/signup
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Refresh Access Token (NEW)
```http
POST /api/users/refresh-token
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
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

**Note**: A new refresh token is issued for security (token rotation).

### 4. Logout (NEW)
```http
POST /api/users/logout
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### 5. Logout from All Devices (NEW)
```http
POST /api/users/logout-all
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": null
}
```

### 6. Get Active Sessions (NEW)
```http
GET /api/users/sessions
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": {
    "sessions": [
      {
        "createdAt": "2024-01-01T10:00:00.000Z",
        "expiresAt": "2024-01-08T10:00:00.000Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      {
        "createdAt": "2024-01-02T14:30:00.000Z",
        "expiresAt": "2024-01-09T14:30:00.000Z",
        "ipAddress": "192.168.1.2",
        "userAgent": "Chrome/120.0..."
      }
    ]
  }
}
```

## Client Implementation Examples

### React + Axios Example

```typescript
// api/auth.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Store tokens in memory (more secure than localStorage)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Axios instance with interceptors
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${API_URL}/users/refresh-token`, {
          refreshToken,
        });

        accessToken = data.data.accessToken;
        refreshToken = data.data.refreshToken;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        accessToken = null;
        refreshToken = null;
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth functions
export const login = async (email: string, password: string) => {
  const { data } = await axios.post(`${API_URL}/users/login`, {
    email,
    password,
  });

  accessToken = data.data.accessToken;
  refreshToken = data.data.refreshToken;

  // Optionally store refresh token in secure storage
  localStorage.setItem('refreshToken', refreshToken);

  return data.data.user;
};

export const logout = async () => {
  try {
    await api.post('/users/logout', { refreshToken });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('refreshToken');
  }
};

export const logoutAllDevices = async () => {
  await api.post('/users/logout-all');
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('refreshToken');
};

export const getSessions = async () => {
  const { data } = await api.get('/users/sessions');
  return data.data.sessions;
};

// Initialize tokens from storage on app start
export const initializeAuth = () => {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (storedRefreshToken) {
    refreshToken = storedRefreshToken;
    // Try to get new access token
    return axios.post(`${API_URL}/users/refresh-token`, {
      refreshToken: storedRefreshToken,
    }).then(({ data }) => {
      accessToken = data.data.accessToken;
      refreshToken = data.data.refreshToken;
      localStorage.setItem('refreshToken', refreshToken);
      return true;
    }).catch(() => {
      localStorage.removeItem('refreshToken');
      return false;
    });
  }
  return Promise.resolve(false);
};

export default api;
```

### React Hook Example

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, initializeAuth } from '../api/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth on mount
    initializeAuth().then((success) => {
      if (success) {
        // Fetch user profile
        // setUser(...);
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const user = await apiLogin(email, password);
    setUser(user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return { user, loading, login, logout };
};
```

## Security Best Practices

### 1. Token Storage

**Access Token:**
- ✅ Store in memory (React state, Angular service)
- ✅ Store in sessionStorage (less secure but acceptable)
- ❌ Never store in localStorage (vulnerable to XSS)

**Refresh Token:**
- ✅ HttpOnly cookie (most secure - recommended for production)
- ✅ Secure storage with encryption
- ⚠️ localStorage (acceptable with proper XSS protection)

### 2. HTTPS Only
Always use HTTPS in production to prevent token interception.

### 3. Token Rotation
The system automatically rotates refresh tokens on every use. Always update your stored refresh token after calling `/refresh-token`.

### 4. Session Management
- Show users their active sessions via `/sessions` endpoint
- Allow users to logout from specific devices
- Implement "Logout from all devices" for security

### 5. Error Handling
- Handle 401 errors by attempting token refresh
- If refresh fails, redirect to login
- Clear all stored tokens on logout

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Get Sessions
```bash
curl -X GET http://localhost:3000/api/users/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Logout All Devices
```bash
curl -X POST http://localhost:3000/api/users/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

Refresh tokens are stored in the User model:

```typescript
{
  refreshTokens: [
    {
      token: string,
      expiresAt: Date,
      createdAt: Date,
      ipAddress?: string,
      userAgent?: string
    }
  ]
}
```

## Maintenance Tasks

### Cleanup Expired Tokens
You can manually cleanup expired tokens (or setup a cron job):

```typescript
// In your service or cron job
import UserService from './modules/user/service';

// Cleanup expired tokens
const cleanedCount = await UserService.cleanupExpiredTokens();
console.log(`Cleaned up ${cleanedCount} expired tokens`);
```

### Recommended Cron Schedule
- Run cleanup daily at off-peak hours
- Monitor number of tokens per user
- Set up alerts if a user exceeds MAX_REFRESH_TOKENS

## Migration from Old System

If you're migrating from the old single-token system:

1. Update client code to handle both `accessToken` and `refreshToken`
2. Implement token refresh logic in API client
3. Update token storage strategy
4. Test thoroughly before deployment
5. Consider supporting both systems during transition period

## Troubleshooting

### "Invalid or expired refresh token"
- Refresh token may have expired (> 7 days old)
- Token was revoked via logout
- User logged out from all devices
- Solution: Redirect user to login

### "Invalid token type"
- Using refresh token as access token or vice versa
- Solution: Ensure correct token is sent to correct endpoint

### "User not found"
- User was deleted while session was active
- Solution: Clear tokens and redirect to login

### Too many active sessions
- User has reached MAX_REFRESH_TOKENS limit
- Oldest sessions are automatically removed
- Consider increasing limit if needed

## Production Considerations

1. **Set strong JWT secrets**: Use cryptographically secure random strings
2. **Enable HTTPS**: Required for secure token transmission
3. **Configure CORS**: Restrict allowed origins
4. **Rate limiting**: Implement on `/refresh-token` endpoint
5. **Monitoring**: Track failed refresh attempts
6. **Logging**: Log token refresh and logout events
7. **Token cleanup**: Setup automated cleanup job

## API Changes Summary

### Breaking Changes
- Login and signup now return both `accessToken` and `refreshToken`
- Old `token` field is replaced with `accessToken` and `refreshToken`

### New Endpoints
- `POST /api/users/refresh-token` - Refresh access token
- `POST /api/users/logout` - Logout from current device
- `POST /api/users/logout-all` - Logout from all devices
- `GET /api/users/sessions` - Get active sessions

### Backward Compatibility
The `verifyToken()` method still works for backward compatibility but now internally uses `verifyAccessToken()`.

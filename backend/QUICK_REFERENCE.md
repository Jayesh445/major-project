# 🚀 Quick Reference: Access/Refresh Token API

## 🔑 Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-secret
MAX_REFRESH_TOKENS=5
```

## 📍 Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/signup` | ❌ Public | Register new user |
| POST | `/api/users/login` | ❌ Public | Login user |
| POST | `/api/users/refresh-token` | ❌ Public | Refresh access token |
| POST | `/api/users/logout` | ✅ Protected | Logout from current device |
| POST | `/api/users/logout-all` | ✅ Protected | Logout from all devices |
| GET | `/api/users/sessions` | ✅ Protected | Get active sessions |

### Profile Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | ✅ Protected | Get current user profile |
| PATCH | `/api/users/profile` | ✅ Protected | Update profile |
| POST | `/api/users/change-password` | ✅ Protected | Change password |

### Admin Only
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | 🔒 Admin | List all users |
| GET | `/api/users/:id` | 🔒 Admin | Get user by ID |
| PATCH | `/api/users/:id` | 🔒 Admin | Update user |
| DELETE | `/api/users/:id` | 🔒 Admin | Delete user |

## 📥 Request/Response Examples

### Login
```bash
# Request
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "_id": "...", "name": "...", "email": "..." },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token
```bash
# Request
curl -X POST http://localhost:3000/api/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# Response
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN"
  }
}
```

### Protected Endpoint
```bash
# Request
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Sessions
```bash
# Request
curl -X GET http://localhost:3000/api/users/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response
{
  "success": true,
  "data": {
    "sessions": [
      {
        "createdAt": "2024-01-01T10:00:00.000Z",
        "expiresAt": "2024-01-08T10:00:00.000Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ]
  }
}
```

### Logout
```bash
# Request
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## 💻 Client Implementation (JavaScript)

### Store Tokens
```javascript
// After login/signup
const { accessToken, refreshToken } = response.data.data;

// Store in memory or sessionStorage (access token)
sessionStorage.setItem('accessToken', accessToken);

// Store securely (refresh token)
localStorage.setItem('refreshToken', refreshToken);
```

### API Request with Auto-Refresh
```javascript
// Axios interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/users/refresh-token', { refreshToken });
      
      sessionStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

## 🔒 Token Specifications

| Token Type | Lifetime | Storage | Secret | Purpose |
|------------|----------|---------|--------|---------|
| Access | 15 minutes | Memory/sessionStorage | JWT_SECRET | API authentication |
| Refresh | 7 days | localStorage/Cookie | REFRESH_TOKEN_SECRET | Token renewal |

## 🛡️ Security Features

✅ **Token Rotation** - New refresh token on every refresh  
✅ **Token Limits** - Max 5 sessions per user  
✅ **Device Tracking** - IP + User-Agent recorded  
✅ **Auto Cleanup** - Expired tokens removed  
✅ **Type Validation** - Prevents token misuse  
✅ **Revocation** - Logout invalidates tokens  

## ⚠️ Common Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 401 | Invalid/expired access token | Refresh the token |
| 401 | Invalid/expired refresh token | Re-login required |
| 403 | Account deactivated | Contact administrator |
| 409 | Email already exists | Use different email |

## 📊 Token Lifecycle

```
Login → Access(15m) + Refresh(7d)
  ↓
Use Access Token (valid for 15m)
  ↓
Access Expires (401 error)
  ↓
Use Refresh Token → New Access + Refresh
  ↓
Old Refresh Invalid (rotation)
  ↓
Repeat...
```

## 🧪 Quick Test Commands

```bash
# 1. Signup
curl -X POST http://localhost:3000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123","role":"admin"}'

# Save the tokens from response

# 2. Get Profile
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer ACCESS_TOKEN"

# 3. Refresh Token
curl -X POST http://localhost:3000/api/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'

# 4. View Sessions
curl -X GET http://localhost:3000/api/users/sessions \
  -H "Authorization: Bearer ACCESS_TOKEN"

# 5. Logout
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"REFRESH_TOKEN"}'
```

## 📝 Checklist for Production

- [ ] Set strong JWT_SECRET and REFRESH_TOKEN_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Implement rate limiting on /refresh-token
- [ ] Set up token cleanup cron job
- [ ] Enable request logging
- [ ] Monitor failed refresh attempts
- [ ] Test token expiration thoroughly
- [ ] Document token storage strategy for clients
- [ ] Test logout functionality

## 📚 Documentation Files

- **USER_MODULE_README.md** - Full API documentation
- **REFRESH_TOKEN_GUIDE.md** - Detailed implementation guide  
- **REFRESH_TOKEN_IMPLEMENTATION.md** - Implementation summary
- **.env.example** - Environment configuration template

---

**Need Help?** Check the full documentation in the files above!

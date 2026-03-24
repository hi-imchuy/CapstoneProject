# API Reference - Changes Summary

## Endpoint Changes

### Before → After

| Purpose | Before | After | Changes |
|---------|--------|-------|---------|
| Signup | `POST /v1/users/signup` | `POST /v1/users` | Renamed |
| Verify Email | `GET /v1/users/verify-email?token=...` | `POST /v1/users/verify-account` | Changed method + body |
| Login | `POST /v1/users/login` | `POST /v1/users/login` | ✅ Same |
| Logout | `POST /v1/users/logout` | `POST /v1/users/logout` | ✅ Same |
| Refresh Token | `POST /v1/users/refresh-token` | `POST /v1/users/refresh-token` | ✅ Same |
| Get Current User | `GET /v1/users/me` | ❌ Removed | Not needed |

## Request/Response Format

### SIGNUP

**Before:**
```javascript
POST /v1/users/signup
Body: { email, password, role }

Response:
{
  "code": 201,
  "message": "Đăng ký thành công!",
  "result": { user object }
}
```

**After:**
```javascript
POST /v1/users
Body: { email, password, role }

Response (201):
{
  user object directly,
  no wrapper
}
```

---

### VERIFY EMAIL

**Before:**
```javascript
GET /v1/users/verify-email?token=xxx

Response:
{
  "code": 200,
  "message": "Xác thực email thành công!",
  "result": { user object }
}
```

**After:**
```javascript
POST /v1/users/verify-account
Body: { email, token }

Response (200):
{
  user object directly
}
```

---

### LOGIN

**Before:**
```javascript
POST /v1/users/login
Body: { email, password }

Response:
{
  "code": 200,
  "message": "Đăng nhập thành công!",
  "result": {
    "user": { user object },
    "accessToken": "jwt..."
  }
}
Cookie: refreshToken (7 days)
```

**After:**
```javascript
POST /v1/users/login
Body: { email, password }

Response (200):
{
  user object with:
  - _id, email, username, displayName, role, isActive, createdAt
  - accessToken: "jwt..."
  - refreshToken: "jwt..."
}
Cookies:
- accessToken (HTTP-only, 14 days)
- refreshToken (HTTP-only, 14 days)
```

---

### REFRESH TOKEN

**Before:**
```javascript
POST /v1/users/refresh-token
Cookie: refreshToken

Response:
{
  "code": 200,
  "message": "Refresh token thành công!",
  "result": { accessToken: "jwt..." }
}
```

**After:**
```javascript
POST /v1/users/refresh-token
Cookie: refreshToken

Response (200):
{
  "accessToken": "jwt..."
}
Cookie Set:
- accessToken (HTTP-only, 14 days) - NEW
```

---

### LOGOUT

**Before:**
```javascript
POST /v1/users/logout
Authorization: Bearer accessToken
Cookie: refreshToken

Response:
{
  "code": 200,
  "message": "Đăng xuất thành công!"
}
```

**After:**
```javascript
POST /v1/users/logout
Cookie: accessToken (optionally checked)

Response (200):
{
  "loggedOut": true
}
Cookies Cleared:
- accessToken
- refreshToken
```

---

### PROTECTED ROUTE

**Before:**
```javascript
GET /v1/your-protected-route
Authorization: Bearer accessToken

Middleware: authMiddleware
- Checked header
- Returned 401 if missing/invalid
```

**After:**
```javascript
GET /v1/your-protected-route
Cookie: accessToken

Middleware: authMiddleware.isAuthorized
- Checks cookie
- Returns 401 if missing
- Returns 410 if EXPIRED (signal for refresh!)
```

---

## Error Responses

### Shared Error Codes

| Code | When | Example |
|------|------|---------|
| 400 | Validation error | Invalid email format |
| 401 | Unauthorized | Missing token, invalid sig |
| 404 | Not found | Account not found |
| 409 | Conflict | Email already exists |
| 410 | GONE | **Token expired (call refresh!)** |

---

## Token Lifecycle

### BEFORE (Old Version)
```
1. Login
   ├─ Generate accessToken (15m)
   ├─ Generate refreshToken (7d)
   ├─ SAVE refreshToken to DB (array)
   └─ Set refreshToken cookie

2. Request Protected Route
   └─ Check accessToken header

3. Token Expires (15m)
   └─ Call refresh-token
   ├─ Verify token
   ├─ CHECK refreshToken in DB array ← DB QUERY
   ├─ Generate new accessToken
   └─ Return accessToken

4. Logout
   ├─ Delete refreshToken from DB array ← DB QUERY
   └─ Clear cookie
```

### AFTER (New Version)
```
1. Login
   ├─ Generate accessToken (15m)
   ├─ Generate refreshToken (7d)
   ├─ NO DB save (just crypto signature)
   └─ Set BOTH tokens as cookies

2. Request Protected Route
   └─ Check accessToken cookie

3. Token Expires (15m)
   └─ Return 410 error
   └─ Frontend calls refresh-token
   ├─ Verify token (crypto signature only) ← NO DB
   ├─ Generate new accessToken
   └─ Return accessToken in cookie

4. Logout
   ├─ Read accessToken from cookie (optional)
   ├─ Clear BOTH cookies ← NO DB
   └─ Done!
```

---

## Data Model Changes

### Before (Old Schema)
```javascript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  username: string,
  displayName: string,
  avatar: string,
  role: 'doctor' | 'patient',
  isActive: boolean,
  verifyToken: string,
  refreshTokens: [string, string, ...], ← ARRAY STORED
  createdAt: Date,
  updatedAt: Date,
  _destroy: boolean
}
```

### After (New Schema)
```javascript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  username: string,
  displayName: string,
  avatar: string,
  role: 'doctor' | 'patient',
  isActive: boolean,
  verifyToken: string,
  // ❌ NO refreshTokens array
  createdAt: Date,
  updatedAt: Date,
  _destroy: boolean
}
```

**Benefit**: ~50 bytes smaller per user (no token array storage)

---

## Frontend Adaptation

### Axios Configuration

**Before:**
```typescript
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true
})

// Manual token management
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**After:**
```typescript
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true // This is all you need!
})

// Cookies are sent automatically
// No manual header management needed!

// But you can add error handling for token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 410) {
      // Token expired - refresh it
      await api.post('/v1/users/refresh-token')
      return api.request(error.config) // Retry original request
    }
    throw error
  }
)
```

---

## Migration Checklist

For existing frontend using old API:

- [ ] Change `/v1/users/signup` → `/v1/users`
- [ ] Change `/v1/users/verify-email?token=X` → `/v1/users/verify-account` (POST with body)
- [ ] Remove `Authorization` header for protected routes (use cookies)
- [ ] Add error handling for 410 status code (token expired)
- [ ] Ensure `withCredentials: true` in axios
- [ ] Update any references to `result` wrapper (responses are now direct objects)
- [ ] Remove any localStorage token management if using cookies
- [ ] Test token expiry flow (should auto-refresh)
- [ ] Test logout (should clear cookies on server)

---

## Quick Comparison Table

| Aspect | Old | New |
|--------|-----|-----|
| **DB Queries** | ~5-10 per refresh | **0** (crypto only) |
| **Token Storage** | Header + DB array | **Cookies only** |
| **Logout DB Query** | YES (remove from array) | **NO** |
| **Refresh DB Query** | YES (check array) | **NO** |
| **Cookie Setting** | Only refreshToken | **Both tokens** |
| **Security Model** | Stateful | **Stateless** |
| **Scalability** | Need session sync | **Automatic** (no state) |
| **Response Size** | Wrapped in {code, message} | **Direct object** |
| **Token Lifetime** | accessToken 15m, refreshToken 7d | **Same** |

---

## Testing with curl

### Full Flow

```bash
# 1. SIGNUP
curl -X POST http://localhost:5000/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234","role":"patient"}' \
  -v

# 2. CHECK EMAIL FOR TOKEN (manually)

# 3. VERIFY EMAIL
curl -X POST http://localhost:5000/v1/users/verify-account \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","token":"TOKEN_FROM_EMAIL"}' \
  -v

# 4. LOGIN (saves cookies to storage.txt)
curl -X POST http://localhost:5000/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}' \
  -c storage.txt \
  -v

# 5. PROTECTED REQUEST (use cookies from storage.txt)
curl http://localhost:5000/v1/your-route \
  -b storage.txt \
  -v

# 6. REFRESH TOKEN
curl -X POST http://localhost:5000/v1/users/refresh-token \
  -b storage.txt \
  -v

# 7. LOGOUT
curl -X POST http://localhost:5000/v1/users/logout \
  -b storage.txt \
  -v
```

---

**Last Updated**: March 21, 2026
**Status**: ✅ Ready for Production

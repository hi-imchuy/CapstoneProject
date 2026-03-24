# User Authentication System - Trello API Style

## Overview
Hệ thống xác thực sử dụng **JWT tokens** với **HTTP-only cookies**, không lưu refreshToken vào database. Giống như kiểu dễ dàng hơn của bạn ở trello-api.

## Key Differences from Previous Version

✅ **Không lưu refreshToken trong DB** - chỉ set vào cookies
✅ **Logout đơn giản** - chỉ clear cookies (không cần DB)
✅ **Refresh token không cần kiểm tra DB** - verify từ token signature
✅ **Both tokens lưu vào HTTP-only cookies** - bảo mật hơn
✅ **Middleware kiểm tra accessToken từ cookies** - không cần header

## Architecture Flow

```
1. SIGNUP
   └─ createNew(email, password, role)
   └─ Hash password + Generate verifyToken (UUID)
   └─ Save vào DB
   └─ Send email xác thực

2. VERIFY EMAIL
   └─ verifyAccount(email, token)
   └─ Verify token match
   └─ Set isActive = true

3. LOGIN
   └─ login(email, password)
   └─ Verify password
   └─ Generate accessToken (15m) + refreshToken (7d)
   └─ Set BOTH vào HTTP-only cookies
   └─ Return user info

4. PROTECTED REQUEST
   └─ authMiddleware.isAuthorized
   └─ Lấy accessToken từ cookies
   └─ Verify token signature
   └─ req.jwtDecoded = decoded token info

5. TOKEN EXPIRED (15m)
   └─ Frontend nhận error 410 (GONE)
   └─ Call POST /refresh-token
   └─ Verify refreshToken từ cookies
   └─ Return new accessToken (set vào cookie)

6. LOGOUT
   └─ Clear 2 cookies (accessToken + refreshToken)
   └─ Không cần DB access
```

## API Endpoints

### 1. POST /v1/users (Signup)
```bash
curl -X POST http://localhost:5000/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "role": "patient"
  }'

Response (201):
{
  "_id": "...",
  "email": "user@example.com",
  "username": "user",
  "displayName": "user",
  "role": "patient",
  "isActive": false,
  "createdAt": 1234567890
}
```

### 2. POST /v1/users/verify-account (Verify Email)
```bash
curl -X POST http://localhost:5000/v1/users/verify-account \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "token": "550e8400-e29b-41d4-a716-446655440000"
  }'

Response (200):
{
  "_id": "...",
  "email": "user@example.com",
  "username": "user",
  "displayName": "user",
  "role": "patient",
  "isActive": true
}
```

### 3. POST /v1/users/login (Login)
```bash
curl -X POST http://localhost:5000/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'

Response (200) + Set-Cookie headers:
{
  "_id": "...",
  "email": "user@example.com",
  "username": "user",
  "displayName": "user",
  "role": "patient",
  "isActive": true,
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}

Cookies Set:
- accessToken (HTTP-only, 14 days)
- refreshToken (HTTP-only, 14 days)
```

### 4. POST /v1/users/refresh-token (Refresh Access Token)
```bash
curl -X POST http://localhost:5000/v1/users/refresh-token \
  --cookie "refreshToken=eyJhbGci..."

Response (200):
{
  "accessToken": "eyJhbGci... (new token)"
}

Cookies Set:
- accessToken (HTTP-only, 14 days) - NEW TOKEN
```

### 5. POST /v1/users/logout (Logout)
```bash
curl -X POST http://localhost:5000/v1/users/logout \
  --cookie "accessToken=eyJhbGci..."

Response (200):
{
  "loggedOut": true
}

Cookies Cleared:
- accessToken
- refreshToken
```

## File Structure

```
back-end/src/
├── models/userModel.js
│   ├── USER_ROLES (DOCTOR, PATIENT)
│   ├── USER_COLLECTION_SCHEMA (Joi)
│   ├── createNew()
│   ├── findOneById()
│   ├── findOneByEmail()
│   ├── update()
│   └── verifyEmail() ← no push/pull refreshToken functions
│
├── services/userService.js
│   ├── createNew(reqBody) ← signup
│   ├── verifyAccount(reqBody) ← verify email
│   ├── login(reqBody) ← generate both tokens
│   └── refreshToken(clientRefreshToken) ← return new accessToken (NO DB)
│
├── controllers/userController.js
│   ├── createNew() → set cookies
│   ├── verifyAccount()
│   ├── login() → set BOTH tokens as cookies
│   ├── logout() → clear cookies (simple!)
│   └── refreshToken() → set new accessToken cookie
│
├── middlewares/authMiddleware.js
│   └── isAuthorized() ← check accessToken from cookies
│
├── routes/v1/userRoute.js
│   ├── POST / ← signup
│   ├── POST /verify-account ← verify email
│   ├── POST /login
│   ├── POST /logout (protected)
│   └── POST /refresh-token
│
└── validations/userValidation.js
    ├── validateSignup
    └── validateLogin
```

## Key Implementation Details

### 1. User Model (Simplified - No Token Storage)
```javascript
const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
  username: Joi.string().required(), // Auto from email
  displayName: Joi.string().required(), // Auto from email
  role: Joi.string().valid('doctor', 'patient'),
  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(), // Only for email verification
  // ❌ NO refreshTokens array
})
```

### 2. User Service - Login
```javascript
const login = async (reqBody) => {
  const existingUser = await userModel.findOneByEmail(reqBody.email)
  // ... validate ...

  const userInfo = { _id: existingUser._id, email: existingUser.email }

  // Generate BOTH tokens
  const accessToken = await JwtProvider.generateToken(
    userInfo,
    env.ACCESS_TOKEN_SECRET_SIGNATURE,
    env.ACCESS_TOKEN_LIFE
  )
  const refreshToken = await JwtProvider.generateToken(
    userInfo,
    env.REFRESH_TOKEN_SECRET_SIGNATURE,
    env.REFRESH_TOKEN_LIFE
  )

  // Return both - controller will set as cookies
  return { accessToken, refreshToken, ...existingUser }
}
```

### 3. User Controller - Login
```javascript
const login = async (req, res, next) => {
  const result = await userService.login(req.body)

  // Set BOTH as HTTP-only cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days')
  })

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days')
  })

  // Return user info (without tokens - they're in cookies)
  res.status(StatusCodes.OK).json(result)
}
```

### 4. Auth Middleware - Check Cookies
```javascript
const isAuthorized = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken

  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token not found'))
    return
  }

  try {
    const decoded = await JwtProvider.verifyToken(
      clientAccessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )
    req.jwtDecoded = decoded
    next()
  } catch (error) {
    if (error?.message?.includes('jwt expired')) {
      // Return 410 so frontend knows to refresh
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token'))
      return
    }
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}
```

### 5. Refresh Token - No DB Query
```javascript
const refreshToken = async (clientRefreshToken) => {
  // Verify token signature (no DB access needed)
  const decoded = await JwtProvider.verifyToken(
    clientRefreshToken,
    env.REFRESH_TOKEN_SECRET_SIGNATURE
  )

  // Extract user info already in the token
  const userInfo = { _id: decoded._id, email: decoded.email }

  // Generate NEW accessToken
  const accessToken = await JwtProvider.generateToken(
    userInfo,
    env.ACCESS_TOKEN_SECRET_SIGNATURE,
    env.ACCESS_TOKEN_LIFE
  )

  return { accessToken }
}
```

### 6. Logout - Simple
```javascript
const logout = async (req, res, next) => {
  // No DB access needed!
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  res.status(StatusCodes.OK).json({ loggedOut: true })
}
```

## Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=your_db_name

# JWT
ACCESS_TOKEN_SECRET_SIGNATURE=your_super_secret_key_min_32_chars
ACCESS_TOKEN_LIFE=15m
REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_secret_min_32_chars
REFRESH_TOKEN_LIFE=7d

# Email
WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:3000
BREVO_API_KEY=your_brevo_api_key
ADMIN_EMAIL_ADDRESS=noreply@app.com
ADMIN_EMAIL_NAME=MyApp

# Server
APP_HOST=localhost
APP_PORT=5000
```

## Frontend Integration

### React Example
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true // Important for cookies
})

// Signup
const signup = async (email: string, password: string, role: string) => {
  const res = await api.post('/v1/users', { email, password, role })
  return res.data
}

// Verify Email (from email link)
const verifyEmail = async (email: string, token: string) => {
  const res = await api.post('/v1/users/verify-account', { email, token })
  return res.data
}

// Login (cookies set automatically)
const login = async (email: string, password: string) => {
  const res = await api.post('/v1/users/login', { email, password })
  return res.data
}

// Protected request (cookies sent automatically)
const getProfile = async () => {
  try {
    const res = await api.get('/v1/users/me')
    return res.data
  } catch (error: any) {
    if (error.response?.status === 410) {
      // Token expired, need to refresh
      await refreshAccessToken()
      return getProfile() // Retry
    }
    throw error
  }
}

// Refresh token (cookies sent automatically)
const refreshAccessToken = async () => {
  const res = await api.post('/v1/users/refresh-token')
  return res.data
}

// Logout (cookies cleared on server)
const logout = async () => {
  const res = await api.post('/v1/users/logout')
  return res.data
}
```

## Testing Checklist

- [ ] Signup creates user with email not verified
- [ ] Verify Email link works and activates account
- [ ] Login fails before verification
- [ ] Login succeeds after verification and sets cookies
- [ ] Protected routes work with valid cookie
- [ ] Protected routes return 401 without cookie
- [ ] Token expiry returns 410 (GONE)
- [ ] Refresh token generates new accessToken
- [ ] Logout clears cookies
- [ ] Username correctly extracted from email
- [ ] Password hashed securely

## Advantages of This Approach

✅ **Simpler** - No DB queries for token refresh
✅ **Faster** - No DB on every refresh request
✅ **Stateless** - Server doesn't track tokens
✅ **Scalable** - No token state to sync across servers
✅ **XSS Protection** - HTTP-only cookies
✅ **CSRF Protection** - SameSite cookie attribute
✅ **Clean Logout** - Just clear cookies (instant, no cleanup needed)
✅ **Matches Your Trello Project** - Same pattern you're familiar with

## Troubleshooting

### Cookies not setting?
- Check `withCredentials: true` in frontend axios
- Check CORS `credentials: 'include'` if using fetch
- Check secure flag (may need HTTPS in production)

### Token not found in middleware?
- Check cookie-parser middleware is mounted in server.js
- Check cookies are being sent (withCredentials, etc)
- Check cookie domain matches

### Refresh token not working?
- Check env vars for REFRESH_TOKEN_SECRET_SIGNATURE
- Check refreshToken hasn't expired (7 days)
- Check error code (should return 410 if accessToken expired)

## Notes

- **Both tokens in cookies** - More secure than storing in localStorage
- **No token tracking in DB** - Simplifies logout, refresh, scaling
- **Verify token signature, not DB** - Fast token refresh
- **Username from email** - Automatic, immutable
- **Password hashing** - bcryptjs 8 rounds (same as trello-api)
- **Email verification required** - isActive flag prevents login

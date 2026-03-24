# Quick Reference - User Authentication API

## 🚀 Quick Start

### 1️⃣ Setup Environment
```bash
# Add to .env file
ACCESS_TOKEN_SECRET_SIGNATURE=your_super_secret_key_here_32chars_min
REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_secret_key_32chars_min
WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:3000
BREVO_API_KEY=your_brevo_api_key
ADMIN_EMAIL_ADDRESS=noreply@app.com
ADMIN_EMAIL_NAME=MyApp
```

### 2️⃣ Install Dependencies
```bash
npm install bcryptjs jsonwebtoken uuid @getbrevo/brevo joi
```

### 3️⃣ Start Server
```bash
npm run dev
```

## 📝 API Endpoints

### Register User
```http
POST /v1/users/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "role": "patient"
}

✅ Response (201):
{
  "code": 201,
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản",
  "result": {
    "_id": "...",
    "email": "user@example.com",
    "username": "user",
    "displayName": "user",
    "role": "patient"
  }
}
```

### Verify Email
```http
GET /v1/users/verify-email?token=550e8400-e29b-41d4-a716-446655440000

✅ Response (200):
{
  "code": 200,
  "message": "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ",
  "result": { ... user object ... }
}
```

### Login
```http
POST /v1/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

✅ Response (200):
{
  "code": 200,
  "message": "Đăng nhập thành công!",
  "result": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  "Cookie": refreshToken (HTTP-only)
}
```

### Get Current User (Protected)
```http
GET /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

✅ Response (200):
{
  "code": 200,
  "message": "Lấy thông tin user thành công!",
  "result": { ... user object ... }
}
```

### Refresh Access Token
```http
POST /v1/users/refresh-token
Cookie: refreshToken=...

✅ Response (200):
{
  "code": 200,
  "message": "Refresh token thành công!",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Logout (Protected)
```http
POST /v1/users/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Cookie: refreshToken=...

✅ Response (200):
{
  "code": 200,
  "message": "Đăng xuất thành công!"
}
```

## 🔐 Security Features

| Feature | Implementation |
|---------|-----------------|
| Password Hashing | bcryptjs (10 salt rounds) |
| Access Token | 15 minutes (short-lived) |
| Refresh Token | 7 days (long-lived, HTTP-only) |
| Email Verification | Required, UUID token |
| Protected Fields | _id, email, username, password |
| HTTPS Support | Secure cookie flag in production |

## 📊 Database Schema

```javascript
users {
  _id: ObjectId,
  email: "user@example.com",
  username: "user",
  displayName: "user",
  password: "$2a$10$...",
  role: "patient|doctor",
  isActive: false,
  verifyToken: "uuid",
  refreshTokens: ["jwt1", "jwt2"],
  avatar: null,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  _destroy: false
}
```

## ✅ Validation Rules

| Field | Rules |
|-------|-------|
| Email | Valid email format |
| Password | 8+ chars, ≥1 letter, ≥1 number |
| Role | "doctor" or "patient" |

## 🚨 Error Responses

```javascript
// Email already exists
400 { message: "Email đã tồn tại!" }

// Invalid credentials
401 { message: "Email hoặc mật khẩu không chính xác!" }

// Email not verified
401 { message: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn!" }

// Missing token
401 { message: "Token không tìm thấy!" }

// Invalid token
401 { message: "Token không hợp lệ!" }

// Token expired
401 { message: "Token đã hết hạn!" }
```

## 🔄 Authentication Flow

```
1. User Signs Up
   └─ Email Verification Link Sent

2. User Clicks Email Link
   └─ Account Activated (isActive=true)

3. User Logs In
   ├─ accessToken (15 min) → sent in response
   └─ refreshToken (7 days) → stored in HTTP-only cookie

4. Protected Route Request
   ├─ Include: Authorization: Bearer {accessToken}
   └─ Middleware verifies token

5. Token Expired (15 min)
   ├─ Call: POST /refresh-token
   ├─ Send: Cookie with refreshToken
   └─ Receive: New accessToken

6. User Logs Out
   └─ refreshToken removed from DB and cookie
```

## 🎯 Frontend Integration

### TypeScript/React Example
```typescript
// Signup
const signup = async (email: string, password: string, role: string) => {
  const res = await fetch('/v1/users/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  })
  return res.json()
}

// Login
const login = async (email: string, password: string) => {
  const res = await fetch('/v1/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include' // Include cookies
  })
  const data = await res.json()
  localStorage.setItem('accessToken', data.result.accessToken)
  return data
}

// Protected Request
const getMe = async () => {
  const token = localStorage.getItem('accessToken')
  const res = await fetch('/v1/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return res.json()
}

// Refresh Token
const refreshToken = async () => {
  const res = await fetch('/v1/users/refresh-token', {
    method: 'POST',
    credentials: 'include' // Include cookies
  })
  const data = await res.json()
  localStorage.setItem('accessToken', data.result.accessToken)
  return data
}

// Logout
const logout = async () => {
  const token = localStorage.getItem('accessToken')
  await fetch('/v1/users/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    credentials: 'include'
  })
  localStorage.removeItem('accessToken')
}
```

## 📁 File Structure

```
back-end/src/
├── models/userModel.js          # Data layer
├── services/userService.js      # Business logic
├── controllers/userController.js # Request handlers
├── routes/v1/userRoute.js       # API routes
├── validations/
│   └── userValidation.js        # Input validation
├── middlewares/
│   └── authMiddleware.js        # JWT verification
├── providers/
│   ├── JwtProvider.js           # Token generation
│   └── BrevoProvider.js         # Email service
├── config/
│   ├── environment.js           # Config vars
│   └── mongodb.js               # DB connection
└── utils/
    ├── validators.js            # Custom rules
    └── ApiError.js              # Error class
```

## 🧪 Testing Checklist

- [ ] Signup with valid email/password
- [ ] Signup fails with existing email
- [ ] Password validation (invalid patterns rejected)
- [ ] Email verification link works
- [ ] Login fails before email verification
- [ ] Login succeeds after verification
- [ ] Access protected route with token
- [ ] Access protected route fails without token
- [ ] Token refresh generates new token
- [ ] Logout removes refresh token
- [ ] Verify username extracted from email correctly

## 📚 Documentation Files

- `AUTH_SYSTEM_COMPLETE.md` - Full system documentation with examples
- `IMPLEMENTATION_SUMMARY.md` - Implementation details and setup
- `QUICK_REFERENCE.md` - This file

## ⚙️ Configuration Summary

| Component | What It Does | Config Location |
|-----------|-------------|-----------------|
| Access Token | Short-lived JWT (15 min) | `ACCESS_TOKEN_SECRET_SIGNATURE` |
| Refresh Token | Long-lived JWT (7 days) | `REFRESH_TOKEN_SECRET_SIGNATURE` |
| Email Service | Sends verification emails | `BrevoProvider.js` |
| Password Hashing | Secures passwords | `bcryptjs` configuration |
| Validation | Checks input format | `userValidation.js` |

## 🎓 Key Concepts

**Username Extraction**: Email `john.doe@example.com` → username `john.doe`

**Email Verification**: Mandatory before login to prevent fake email signups

**Token Architecture**: Access token (short-lived, in response) + Refresh token (long-lived, in cookie)

**Protected Routes**: Require Authorization header with Bearer token

**Automatic Cleanup**: Refresh tokens removed on logout, preventing reuse

---

✅ **System Ready to Use!** Follow the Quick Start section to begin.

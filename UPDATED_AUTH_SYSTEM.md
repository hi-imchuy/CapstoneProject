# User Authentication Updated - Documentation

## 🎯 What Changed

### Frontend Input (Signup)
Frontend chỉ cần gửi:
- `email` - Email của user
- `password` - Mật khẩu (>= 8 ký tự, chứa chữ + số)
- `role` - 'doctor' hoặc 'patient'

**Username và displayName sẽ tự động được cắt từ email:**
```
Example:
- Email: chauhoanghuy562003@gmail.com
- Username: chauhuy562003
- DisplayName: chauhuy562003
```

---

## 📧 Email Verification Flow

### 1. Signup Request
```javascript
POST /v1/users/signup
{
  "email": "user@example.com",
  "password": "Password123",
  "role": "doctor"
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "user",
    "displayName": "user",
    "role": "doctor",
    "avatar": "",
    "isActive": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 2. Email Sent to User
Backend sẽ gửi mail xác thực với link:
```
https://yourdomain.com/verify-email?token=<verifyToken>
```

### 3. User Clicks Link to Verify
```
GET /v1/users/verify-email?token=<verifyToken>
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "user",
    "displayName": "user",
    "role": "doctor",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 🔑 Login with JwtProvider

### 1. Login Request
```javascript
POST /v1/users/login
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Đăng nhập thành công!",
  "result": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "username": "user",
      "displayName": "user",
      "role": "doctor",
      "avatar": "",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `refreshToken` (httpOnly, secure, sameSite=strict)

### 2. Access Token Payload
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "doctor",
  "iat": 1711000000,
  "exp": 1711000900  // 15 minutes
}
```

### 3. Refresh Token Payload
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1711000000,
  "exp": 1711604400  // 7 days
}
```

---

## 🔄 Refresh Token Endpoint

When accessToken expires, call:
```javascript
POST /v1/users/refresh-token
```

**Request:** Automatically sends refreshToken from cookie

**Response (200):**
```json
{
  "code": 200,
  "message": "Refresh token thành công!",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🛡️ Protected Endpoints

All endpoints requesting Authorization header:
```
GET /v1/users/me
POST /v1/users/logout
```

**Header:**
```
Authorization: Bearer <accessToken>
```

---

## 📊 Database Schema

```javascript
{
  _id: ObjectId,
  email: String,                    // Unique
  username: String,                 // Extracted from email
  displayName: String,              // Same as username
  password: String,                 // Hashed with bcryptjs
  role: 'doctor' | 'patient',       // User role
  avatar: String,                   // Cloudinary URL
  isActive: Boolean,                // Verification status
  verifyToken: String | null,       // Email verification token
  refreshTokens: [String],          // Array of refresh tokens
  createdAt: Date,
  updatedAt: Date,
  _destroy: Boolean                 // Soft delete flag
}
```

---

## ⚙️ Environment Variables Needed

```env
# JWT Configuration
ACCESS_TOKEN_SECRET_SIGNATURE=your_secret_key_min_32_chars_long
ACCESS_TOKEN_LIFE=15  # in minutes

REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_secret_min_32_chars
REFRESH_TOKEN_LIFE=7  # in days

# Brevo Email Configuration
BREVO_API_KEY=your_brevo_api_key
ADMIN_EMAIL_ADDRESS=admin@example.com
ADMIN_EMAIL_NAME=Your App Name

# Website Domain
WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:3000
WEBSITE_DOMAIN_PRODUCTION=https://yourdomain.com
```

---

## 🚀 API Endpoints Summary

| Method | Path | Description | Auth | Body |
|--------|------|-------------|------|------|
| POST | `/signup` | Signup user | ❌ | email, password, role |
| POST | `/login` | Login user | ❌ | email, password |
| GET | `/verify-email` | Verify email | ❌ | token (query) |
| POST | `/logout` | Logout user | ✅ | - |
| POST | `/refresh-token` | Get new token | ⭕ | - |
| GET | `/me` | Get current user | ✅ | - |

---

## 💻 Frontend Implementation Example

### Signup
```javascript
const signup = async (email, password, role) => {
  const response = await fetch('http://localhost:5000/v1/users/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  })
  return response.json()
}
```

### Login
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/v1/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Send/receive cookies
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  
  // Save token
  localStorage.setItem('accessToken', data.result.accessToken)
  localStorage.setItem('user', JSON.stringify(data.result.user))
  
  return data
}
```

### Protected Request
```javascript
const getMe = async () => {
  const token = localStorage.getItem('accessToken')
  const response = await fetch('http://localhost:5000/v1/users/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  })
  return response.json()
}
```

### Verify Email
```javascript
const verifyEmail = async (token) => {
  const response = await fetch(`http://localhost:5000/v1/users/verify-email?token=${token}`)
  return response.json()
}
```

---

## ✨ Key Features

✅ **Auto Username Generation** - Extract from email
✅ **Email Verification** - Using Brevo provider
✅ **JWT Tokens** - AccessToken + RefreshToken
✅ **JwtProvider** - Custom JWT generation/verification
✅ **BrevoProvider** - Email sending
✅ **Password Hashing** - bcryptjs with 10 salt rounds
✅ **Role Support** - doctor / patient
✅ **Account Activation** - isActive flag
✅ **Soft Delete** - _destroy flag

---

## 🔍 Error Handling

### Validation Errors (400)
```json
{
  "code": 400,
  "message": "Lỗi xác thực dữ liệu",
  "errors": [
    "Password phải có ít nhất 1 chữ, 1 số, và ít nhất 8 ký tự.",
    "Email không hợp lệ."
  ]
}
```

### Unauthorized (401)
```json
{
  "code": 401,
  "message": "Email hoặc mật khẩu không chính xác!"
}
```

### Not Found (404)
```json
{
  "code": 404,
  "message": "User không tìm thấy!"
}
```

---

## 🔐 Security Notes

- ✅ Password hashed before storage
- ✅ Refresh token in HTTP-only cookie
- ✅ Access token in header
- ✅ Token verification on protected routes
- ✅ Email verification required
- ✅ Account activation status tracked
- ✅ Soft delete support

---

Hệ thống authentication hoàn chỉnh sẵn sàng! 🎉

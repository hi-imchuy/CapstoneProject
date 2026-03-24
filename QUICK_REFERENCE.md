# 🚀 User Authentication - Quick Reference

## Environment Setup
```env
ACCESS_TOKEN_SECRET_SIGNATURE=your_secret_key_min_32_chars_long
REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_secret_key_min_32_chars
```

## Authentication Flow Chart
```
┌─────────────┐
│   Signup    │ → POST /signup {email, password, fullName}
└──────┬──────┘   ← 201: {_id, email, fullName}
       │
       ↓
┌─────────────┐
│   Login     │ → POST /login {email, password}
└──────┬──────┘   ← 200: {user, accessToken} + Cookie(refreshToken)
       │
       ↓
┌─────────────┐
│  API Call   │ → GET /me (Authorization: Bearer accessToken)
└──────┬──────┘   ← 200: {user info}
       │
       ├─ Token expires after 15 min
       │
       ↓
┌─────────────┐
│ Refresh Tok │ → POST /refresh-token (Cookie: refreshToken)
└──────┬──────┘   ← 200: {accessToken}
       │
       ↓
┌─────────────┐
│   Logout    │ → POST /logout (Authorization: Bearer accessToken)
└─────────────┘   ← 200: {message}
```

## File Locations
```
Models:        src/models/userModel.js
Controllers:   src/controllers/userController.js
Services:      src/services/userService.js
Routes:        src/routes/v1/userRoute.js
Middleware:    src/middlewares/authMiddleware.js
Validation:    src/validations/userValidation.js
```

## Endpoint Summary
```
Method | Path            | Auth  | Returns
-------|-----------------|-------|------------------
POST   | /signup         | ❌    | User object
POST   | /login          | ❌    | User + AccessToken
POST   | /logout         | ✅    | Success message
POST   | /refresh-token  | ⭕    | New AccessToken
GET    | /me             | ✅    | Current user info
```

## Quick Commands

### 1️⃣ Register User
```bash
curl -X POST http://localhost:5000/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "password": "pass123",
    "fullName": "Test User"
  }'
```

### 2️⃣ Login
```bash
curl -X POST http://localhost:5000/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "password": "pass123"
  }' \
  -c cookies.txt
```

### 3️⃣ Get Current User
```bash
curl -X GET http://localhost:5000/v1/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 4️⃣ Refresh Token
```bash
curl -X POST http://localhost:5000/v1/users/refresh-token \
  -b cookies.txt
```

### 5️⃣ Logout
```bash
curl -X POST http://localhost:5000/v1/users/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -b cookies.txt
```

## Start Server
```bash
npm run dev  # Development with hot reload
npm run build && npm run production  # Production
```

## Key Features ✨
- ✅ Password hashing (bcryptjs)
- ✅ JWT tokens (Access + Refresh)
- ✅ HTTP-only cookies
- ✅ Input validation (Joi)
- ✅ Error handling
- ✅ Protected routes
- ✅ Token refresh mechanism

## HTTP Status Codes
```
201 Created       ← Successful signup
200 OK            ← Successful request
400 Bad Request   ← Invalid input / Email exists
401 Unauthorized  ← Invalid token / Wrong password
404 Not Found     ← User not found
500 Server Error  ← Server error
```

## Default Values
```
Access Token Life:    15 minutes
Refresh Token Life:   7 days
Password Salt Rounds: 10
```

## Important Notes ⚠️
- JWT_SECRET must be >= 32 characters
- Access token expires in 15 minutes
- Refresh token valid for 7 days
- Passwords are hashed before storage
- Tokens are verified on protected routes

---

Refer to `USER_API_DOCUMENTATION.md` for complete details!

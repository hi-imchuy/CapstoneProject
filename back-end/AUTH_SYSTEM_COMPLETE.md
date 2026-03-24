# Complete User Authentication System

## Overview
A production-ready JWT-based authentication system with email verification, refresh tokens, and role-based access control using Express.js and MongoDB.

## Technology Stack
- **Framework**: Express.js
- **Database**: MongoDB (native driver)
- **Authentication**: JWT (Access + Refresh tokens)
- **Password Security**: bcryptjs (10 salt rounds)
- **Validation**: Joi
- **Email Service**: Brevo (Sendinblue)
- **Token Management**: JwtProvider, custom refresh token storage

## Architecture

### User Model (`userModel.js`)
**Responsibility**: Data access layer with Joi validation schema

```javascript
// User Schema Fields
{
  email: string (required, unique)
  password: string (hashed with bcryptjs)
  username: string (extracted from email part before @)
  displayName: string (extracted from email part before @)
  avatar: string (optional, defaults to null)
  role: 'doctor' | 'patient' (defaults to 'patient')
  isActive: boolean (false until email verified)
  verifyToken: string (UUID for email verification)
  refreshTokens: array<string> (stored for logout support)
  createdAt: timestamp
  updatedAt: timestamp
  _destroy: boolean (soft delete flag)
}
```

**Key Functions**:
- `validateBeforeCreate(data)`: Validates data against Joi schema
- `createNew(data)`: Creates new user and returns full document
- `findOneById(userId)`: Finds user by MongoDB ObjectId
- `findOneByEmail(email)`: Finds user by email
- `update(userId, updateData)`: Updates user (INVALID_UPDATE_FIELDS are protected)
- `verifyEmail(verifyToken)`: Sets isActive=true when email verified
- `pushRefreshToken(userId, token)`: Adds refresh token to user's array
- `pullRefreshToken(userId, token)`: Removes refresh token (for logout)

### User Service (`userService.js`)
**Responsibility**: Business logic layer for authentication operations

**Methods**:
1. **signup(email, password, role)**
   - Validates email doesn't exist
   - Extracts username from email (everything before @)
   - Hashes password with bcryptjs
   - Creates UUID verify token
   - Sends verification email via BrevoProvider
   - Returns created user (without sensitive fields)

2. **login(email, password)**
   - Validates user exists and not soft-deleted
   - Checks isActive flag (email must be verified)
   - Verifies password against hashed password
   - Generates access token (15 minutes)
   - Generates refresh token (7 days)
   - Stores refresh token in database
   - Returns { user, accessToken, refreshToken }

3. **logout(userId, refreshToken)**
   - Removes refresh token from user's array
   - Clears HTTP-only cookie on client

4. **refreshAccessToken(refreshToken)**
   - Verifies refresh token with REFRESH_TOKEN_SECRET_SIGNATURE
   - Checks token exists in user's refreshTokens array
   - Generates new access token
   - Returns new access token

5. **getCurrentUser(userId)**
   - Fetches user by ID
   - Returns user (without sensitive fields)

6. **verifyEmail(verifyToken)**
   - Finds user by verifyToken
   - Sets isActive=true, clears verifyToken
   - Returns updated user

### User Controller (`userController.js`)
**Responsibility**: HTTP request handlers

**Endpoints**:
1. `POST /v1/users/signup`
   - Body: { email, password, role? }
   - Response: Created user (without password/verifyToken/refreshTokens)

2. `POST /v1/users/login`
   - Body: { email, password }
   - Response: { user, accessToken }
   - Sets: HTTP-only refreshToken cookie

3. `GET /v1/users/verify-email?token=<verifyToken>`
   - Query: token (UUID from email link)
   - Response: Verified user
   - Enables user to login

4. `POST /v1/users/logout` (Protected)
   - Header: Authorization: Bearer <accessToken>
   - Response: Success message
   - Clears: refreshToken cookie

5. `POST /v1/users/refresh-token`
   - Cookie: refreshToken
   - Response: { accessToken }
   - Generates new access token

6. `GET /v1/users/me` (Protected)
   - Header: Authorization: Bearer <accessToken>
   - Response: Current user info

### Validation Layer (`userValidation.js`)
**Responsibility**: Input validation middleware

**Validators**:
1. `validateSignup` middleware
   - Validates signupSchema before signup endpoint
   - Schema: { email (required, pattern), password (required, pattern), role (optional, 'doctor'|'patient') }

2. `validateLogin` middleware
   - Validates loginSchema before login endpoint
   - Schema: { email (required, pattern), password (required) }

**Validation Rules**:
- EMAIL_RULE: `/^\S+@\S+\.\S+$/`
- PASSWORD_RULE: `/^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d\W]{8,256}$/`
  - At least 1 letter
  - At least 1 number
  - At least 8 characters

### Auth Middleware (`authMiddleware.js`)
**Responsibility**: Protect routes requiring authentication

**Flow**:
1. Extracts Bearer token from Authorization header
2. Verifies token with JwtProvider using ACCESS_TOKEN_SECRET_SIGNATURE
3. Attaches decoded user info (userId, email, role) to req.user
4. Throws 401 if token invalid or missing

## Security Features

1. **Password Security**
   - Hashed with bcryptjs (10 salt rounds)
   - Never stored in plain text
   - Password pattern enforced (letters + numbers + 8+ chars)

2. **Token Security**
   - Access Token: 15 minutes (short-lived)
   - Refresh Token: 7 days (long-lived, stored in database)
   - HTTP-only cookies prevent JavaScript access
   - Secure flag for HTTPS in production

3. **Email Verification**
   - UUID token sent via email
   - Account locked until verified (isActive=false)
   - Cannot login without verification

4. **Protected Fields**
   - Cannot update: _id, email, username, createdAt, password
   - Password only set during signup, must change separately
   - Username tied to email, immutable

5. **Soft Deletes**
   - _destroy flag prevents deleted account login
   - Data preserved for audit trail

## Request/Response Examples

### Signup
```
POST /v1/users/signup
Content-Type: application/json

{
  "email": "chauhoanghuy562003@gmail.com",
  "password": "SecurePass123",
  "role": "patient"
}

Response (201):
{
  "code": 201,
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "chauhoanghuy562003@gmail.com",
    "username": "chauhoanghuy562003",
    "displayName": "chauhoanghuy562003",
    "role": "patient",
    "isActive": false,
    "createdAt": 1234567890,
    "updatedAt": null,
    "_destroy": false
  }
}
```

### Email Verification
```
GET /v1/users/verify-email?token=550e8400-e29b-41d4-a716-446655440000

Response (200):
{
  "code": 200,
  "message": "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "chauhoanghuy562003@gmail.com",
    "username": "chauhoanghuy562003",
    "displayName": "chauhoanghuy562003",
    "role": "patient",
    "isActive": true,
    "createdAt": 1234567890,
    "_destroy": false
  }
}
```

### Login
```
POST /v1/users/login
Content-Type: application/json

{
  "email": "chauhoanghuy562003@gmail.com",
  "password": "SecurePass123"
}

Response (200, with refreshToken cookie):
{
  "code": 200,
  "message": "Đăng nhập thành công!",
  "result": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "chauhoanghuy562003@gmail.com",
      "username": "chauhoanghuy562003",
      "displayName": "chauhoanghuy562003",
      "role": "patient",
      "isActive": true,
      "createdAt": 1234567890,
      "_destroy": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

Cookies Set:
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800000
```

### Get Current User (Protected)
```
GET /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200):
{
  "code": 200,
  "message": "Lấy thông tin user thành công!",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "chauhoanghuy562003@gmail.com",
    "username": "chauhoanghuy562003",
    "displayName": "chauhoanghuy562003",
    "role": "patient",
    "isActive": true,
    "createdAt": 1234567890,
    "_destroy": false
  }
}
```

### Logout (Protected)
```
POST /v1/users/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cookie: refreshToken=...

Response (200):
{
  "code": 200,
  "message": "Đăng xuất thành công!"
}
```

### Refresh Access Token
```
POST /v1/users/refresh-token
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200):
{
  "code": 200,
  "message": "Refresh token thành công!",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Environment Configuration

Add to `.env`:
```
ACCESS_TOKEN_SECRET_SIGNATURE=your_secret_key_here
ACCESS_TOKEN_LIFE=15m
REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_secret_key_here
REFRESH_TOKEN_LIFE=7d

WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:3000
WEBSITE_DOMAIN_PRODUCTION=https://yourdomain.com

BREVO_API_KEY=your_brevo_api_key
ADMIN_EMAIL_ADDRESS=noreply@yourdomain.com
ADMIN_EMAIL_NAME=YourApp
```

## Integration with Frontend

1. **After Signup**: Show message to verify email
2. **After Verification**: Enable login
3. **On Login**: 
   - Store accessToken in memory/state
   - Cookie handles refreshToken automatically
4. **Protected Routes**: Include `Authorization: Bearer {accessToken}` header
5. **Token Expiry(15 min)**: Call `/refresh-token` endpoint to get new token
6. **On Logout**: Call logout endpoint (will clear cookie on server side)

## Error Responses

```
400 - Email already exists
{
  "code": 400,
  "message": "Email đã tồn tại!"
}

401 - Invalid credentials
{
  "code": 401,
  "message": "Email hoặc mật khẩu không chính xác!"
}

401 - Email not verified
{
  "code": 401,
  "message": "Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn!"
}

401 - Invalid token
{
  "code": 401,
  "message": "Token không hợp lệ!"
}

404 - User not found
{
  "code": 404,
  "message": "User không tìm thấy!"
}
```

## File Structure
```
back-end/src/
├── models/
│   └── userModel.js
├── services/
│   └── userService.js
├── controllers/
│   └── userController.js
├── routes/
│   └── v1/
│       └── userRoute.js
├── validations/
│   └── userValidation.js
├── middlewares/
│   └── authMiddleware.js
├── providers/
│   ├── JwtProvider.js
│   └── BrevoProvider.js
├── config/
│   └── environment.js
└── utils/
    ├── validators.js
    └── ApiError.js
```

## Key Implementation Details

### Username Extraction
- Email: `chauhoanghuy562003@gmail.com`
- Username: `chauhoanghuy562003` (everything before @)
- DisplayName: Also `chauhoanghuy562003` (user can update later)

### Email Verification Flow
1. User signs up → verifyToken (UUID) created and stored
2. Email sent with verification link: `/verify-email?token={uuid}`
3. User clicks link → verifyToken validated
4. If valid: isActive=true, verifyToken cleared
5. User can now login

### Token Lifecycle
1. **Access Token (15 min)**
   - Short-lived, used for API requests
   - Sent in Authorization header
   - Expires after 15 minutes

2. **Refresh Token (7 days)**
   - Long-lived, stored in HTTP-only cookie
   - Stored in database for validation
   - Used to generate new access tokens
   - Kept even after logout (for security tracking)

### Security Considerations
- **HTTPS Required**: Use secure flag for cookies in production
- **CORS**: Configure properly to allow frontend domain
- **Rate Limiting**: Implement on signup/login to prevent brute force
- **Password Policy**: Enforced pattern (letters + digits + 8+ chars)
- **Sensitive Field Removal**: Password, refreshTokens, verifyToken never sent to client

## Testing Checklist
- [ ] Signup with new email
- [ ] Signup with existing email (should fail)
- [ ] Verify email link works
- [ ] Login before verification (should fail)
- [ ] Login after verification
- [ ] Access protected route with token
- [ ] Access protected route without token (should fail)
- [ ] Access protected route with expired token
- [ ] Refresh token to get new access token
- [ ] Logout and verify refresh token removed
- [ ] Password validation (invalid patterns rejected)
- [ ] Email validation pattern

## Future Enhancements
- [ ] Password reset endpoint
- [ ] Change password endpoint
- [ ] Update profile endpoint (avatar, displayName)
- [ ] User roles and permissions
- [ ] Audit logging
- [ ] IP-based session tracking
- [ ] Device management
- [ ] Two-factor authentication
- [ ] OAuth integration
- [ ] Session expiry on mobile

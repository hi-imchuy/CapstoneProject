# User Authentication System - Quick Setup Guide

## 📋 What's Been Built

Tôi đã xây dựng một hệ thống xác thực hoàn chỉnh với các chức năng:

- ✅ **Đăng ký (Sign Up)** - Tạo user account mới
- ✅ **Đăng nhập (Login)** - Xác thực và cấp token
- ✅ **Đăng xuất (Logout)** - Hủy session
- ✅ **Refresh Token** - Làm mới access token
- ✅ **Get User Info** - Lấy thông tin user hiện tại
- ✅ **JWT Authentication** - Bảo mật API endpoints
- ✅ **Password Hashing** - Mã hóa password an toàn
- ✅ **Validation** - Xác thực input với Joi

---

## 📁 Files Created

### Models
- **`src/models/userModel.js`** - Database schema và queries

### Services
- **`src/services/userService.js`** - Business logic (signup, login, logout, etc.)

### Controllers
- **`src/controllers/userController.js`** - Route handlers

### Routes
- **`src/routes/v1/userRoute.js`** - User API endpoints
- **Modified: `src/routes/v1/index.js`** - Added user routes

### Middlewares
- **`src/middlewares/authMiddleware.js`** - JWT verification

### Validations
- **`src/validations/userValidation.js`** - Input validation with Joi

### Config
- **Modified: `src/config/environment.js`** - Added JWT aliases

### Server
- **Modified: `src/server.js`** - Added user collection initialization

### Documentation
- **`USER_API_DOCUMENTATION.md`** - Tài liệu API chi tiết
- **`.env.example`** - Ví dụ biến môi trường

---

## 🚀 Quick Start

### 1. Cài đặt Dependencies
Các dependencies cần thiết đã có trong `package.json`:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `joi` - Input validation
- `http-status-codes` - HTTP status codes
- `mongodb` - MongoDB driver

### 2. Cấu hình Environment Variables

Tạo file `.env` trong `back-end/` với:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=capstone_project

# App
APP_HOST=localhost
APP_PORT=5000
BUILD_MODE=dev

# Author
AUTHOR=Your Name

# JWT (Important: Phải >= 32 ký tự)
ACCESS_TOKEN_SECRET_SIGNATURE=your_secret_key_here_at_least_32_characters_long_minimum
ACCESS_TOKEN_LIFE=15

REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_secret_key_min_32_chars_long_here
REFRESH_TOKEN_LIFE=7

# Optional config
WEBSITE_DOMAIN_DEVELOPMENT=http://localhost:3000
```

### 3. Khởi động Server

```bash
# Development mode (với hot reload)
npm run dev

# Production mode
npm run production
```

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/v1/users`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | Đăng ký user mới | ❌ |
| POST | `/login` | Đăng nhập | ❌ |
| POST | `/logout` | Đăng xuất | ✅ |
| POST | `/refresh-token` | Làm mới token | ⭕ |
| GET | `/me` | Lấy user info | ✅ |

**Auth:**
- ❌ No authentication required
- ✅ Bearer token required
- ⭕ Refresh token in cookie required

---

## 💡 Usage Examples

### 1. Đăng ký
```bash
curl -X POST http://localhost:5000/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe"
  }'
```

### 2. Đăng nhập
```bash
curl -X POST http://localhost:5000/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

### 3. Lấy thông tin user
```bash
curl -X GET http://localhost:5000/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Đăng xuất
```bash
curl -X POST http://localhost:5000/v1/users/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

---

## 🔒 Security Features

✅ **Password Hashing** - bcryptjs (salt rounds: 10)
✅ **JWT Tokens** - ACCESS_TOKEN (15 min) + REFRESH_TOKEN (7 days)
✅ **HTTP-only Cookies** - Refresh token được lưu an toàn
✅ **Token Validation** - Verification middleware trên endpoints có bảo vệ
✅ **Input Validation** - Joi schema validation
✅ **Error Handling** - Centralized error handling với status codes

---

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,              // Unique
  password: String,           // Hashed
  fullName: String,
  avatar: String,             // Optional
  refreshTokens: [String],    // Array of refresh tokens
  createdAt: Date,
  updatedAt: Date
}
```

---

## ❓ Troubleshooting

### Issue: Token expired error
**Solution:** Gọi `/refresh-token` endpoint để lấy access token mới

### Issue: "Email đã tồn tại"
**Solution:** Email này đã được đăng ký, hãy dùng email khác hoặc đăng nhập

### Issue: "Token không hợp lệ"
**Solution:** 
- Kiểm tra access token chính xác
- Kiểm tra JWT secret key trong `.env`
- Kiểm tra token chưa hết hạn

### Issue: Collection not found error
**Solution:** Đảm bảo MongoDB server đang chạy và biến `MONGODB_URI` đúng

---

## 📚 Additional References

- Xem file `USER_API_DOCUMENTATION.md` để biết chi tiết đầy đủ
- JWT Docs: https://jwt.io
- bcryptjs Docs: https://github.com/dcodeIO/bcrypt.js
- Joi Validation: https://joi.dev

---

## ✨ Next Steps

Có thể mở rộng hệ thống với:
- Password reset / forgot password
- Email verification
- Social login (Google, Facebook)
- Two-factor authentication (2FA)
- User profile update
- Permission/Role management

---

**Xong! Hệ thống user authentication đã sẵn sàng sử dụng.** 🎉

Nếu có câu hỏi hoặc gặp lỗi, vui lòng kiểm tra `USER_API_DOCUMENTATION.md` hoặc xem logs chi tiết.

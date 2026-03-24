# User API Documentation

## Overview
Tài liệu này mô tả các endpoint cho quản lý user (Đăng ký, Đăng nhập, Đăng xuất).

## Base URL
```
http://localhost:5000/v1/users
```

---

## Endpoints

### 1. **Đăng ký (Sign Up)**
**Endpoint:** `POST /signup`

**Mô tả:** Tạo user account mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A"
}
```

**Validation:**
- `email`: Bắt buộc, phải là email hợp lệ
- `password`: Bắt buộc, tối thiểu 6 ký tự
- `fullName`: Bắt buộc, không được rỗng

**Success Response (201 Created):**
```json
{
  "code": 201,
  "message": "Đăng ký thành công!",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "avatar": "",
    "createdAt": "2024-03-21T10:00:00.000Z",
    "updatedAt": "2024-03-21T10:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "code": 400,
  "message": "Email đã tồn tại!",
  "statusCode": 400
}
```

---

### 2. **Đăng nhập (Login)**
**Endpoint:** `POST /login`

**Mô tả:** Đăng nhập vào tài khoản, lấy access token và refresh token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:**
- `email`: Bắt buộc, phải là email hợp lệ
- `password`: Bắt buộc

**Success Response (200 OK):**
```json
{
  "code": 200,
  "message": "Đăng nhập thành công!",
  "result": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "avatar": "",
      "createdAt": "2024-03-21T10:00:00.000Z",
      "updatedAt": "2024-03-21T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies:** Refresh token được lưu trong cookie `refreshToken` (httpOnly, secure, sameSite)

**Error Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Email hoặc mật khẩu không chính xác!",
  "statusCode": 401
}
```

---

### 3. **Đăng xuất (Logout)**
**Endpoint:** `POST /logout`

**Mô tả:** Đăng xuất, xóa refresh token

**Authentication:** Bắt buộc (Bearer Token)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "code": 200,
  "message": "Đăng xuất thành công!"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Token không hợp lệ!",
  "statusCode": 401
}
```

---

### 4. **Làm mới Access Token (Refresh Token)**
**Endpoint:** `POST /refresh-token`

**Mô tả:** Lấy access token mới khi token cũ hết hạn

**Cookies:** Refresh token từ cookie `refreshToken`

**Success Response (200 OK):**
```json
{
  "code": 200,
  "message": "Refresh token thành công!",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Token không hợp lệ!",
  "statusCode": 401
}
```

---

### 5. **Lấy Thông Tin Người Dùng (Get Current User)**
**Endpoint:** `GET /me`

**Mô tả:** Lấy thông tin user hiện tại

**Authentication:** Bắt buộc (Bearer Token)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "code": 200,
  "message": "Lấy thông tin user thành công!",
  "result": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "avatar": "",
    "createdAt": "2024-03-21T10:00:00.000Z",
    "updatedAt": "2024-03-21T10:00:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Token không hợp lệ!",
  "statusCode": 401
}
```

---

## Authentication Flow

### 1. Đăng ký mới
```
POST /signup
  ↓
Tạo user và trả về
```

### 2. Đăng nhập
```
POST /login
  ↓
Trả về access token (Header)
Trả về refresh token (Cookie)
```

### 3. Sử dụng API có bảo vệ
```
GET /me (với Authorization: Bearer <access_token>)
  ↓
Trả về user info
```

### 4. Khi Access Token hết hạn
```
POST /refresh-token (Cookie có refreshToken)
  ↓
Trả về access token mới
```

### 5. Đăng xuất
```
POST /logout (với Authorization: Bearer <access_token>)
  ↓
Xóa refresh token
Clear cookie
```

---

## Environment Variables

Đảm bảo các biến môi trường sau được cấu hình trong file `.env`:

```
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=capstone_project

ACCESS_TOKEN_SECRET_SIGNATURE=your_secret_key_min_32_chars
ACCESS_TOKEN_LIFE=15

REFRESH_TOKEN_SECRET_SIGNATURE=your_refresh_secret_key_min_32_chars
REFRESH_TOKEN_LIFE=7
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 201 | Created - Tài khoản được tạo thành công |
| 200 | OK - Yêu cầu thành công |
| 400 | Bad Request - Dữ liệu không hợp lệ hoặc email đã tồn tại |
| 401 | Unauthorized - Token không hợp lệ hoặc không có quyền |
| 404 | Not Found - Tài nguyên không tìm thấy |
| 500 | Internal Server Error - Lỗi server |

---

## CURL Examples

### 1. Đăng ký
```bash
curl -X POST http://localhost:5000/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Nguyễn Văn A"
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

### 3. Lấy thông tin user (với token)
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

### 5. Refresh Token
```bash
curl -X POST http://localhost:5000/v1/users/refresh-token \
  -b cookies.txt
```

---

## File Structure

```
src/
├── controllers/
│   └── userController.js       # Xử lý request/response
├── services/
│   └── userService.js          # Business logic
├── models/
│   └── userModel.js            # Database schema
├── routes/
│   └── v1/
│       ├── userRoute.js        # API endpoints
│       └── index.js            # Route aggregation
├── validations/
│   └── userValidation.js       # Input validation
├── middlewares/
│   └── authMiddleware.js       # JWT verification
└── config/
    └── environment.js          # Environment variables
```

---

## Security Notes

1. ✅ Password được hash bằng bcryptjs trước khi lưu
2. ✅ Refresh token được lưu trong HTTP-only cookie
3. ✅ Access token được gửi qua Authorization header
4. ✅ JWT token được xác thực trước khi xử lý request
5. ✅ Refresh token được xóa khi logout

---

## Testing

Bạn có thể sử dụng Postman hoặc Thunder Client để test các endpoint.

### Import vào Postman:
1. Tạo collection mới: "User API"
2. Thêm các endpoint theo danh sách ở trên
3. Set environment variables: `{{base_url}}` = `http://localhost:5000`

---

Chúc bạn phát triển thành công! 🚀

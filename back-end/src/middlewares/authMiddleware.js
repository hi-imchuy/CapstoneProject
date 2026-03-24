/**
 * Authentication Middleware - Xác thực JWT token từ cookies
 */

import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'

const isAuthorized = async (req, res, next) => {
  try {
    // Lấy accessToken từ cookies
    const clientAccessToken = req.cookies?.accessToken

    // Kiểm tra token tồn tại
    if (!clientAccessToken) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (Token not found)'))
      return
    }

    // Verify token
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)

    // Lưu decoded info vào req.jwtDecoded để sử dụng ở route handler
    req.jwtDecoded = accessTokenDecoded

    // Cho phép request đi tiếp
    next()
  } catch (error) {
    // Nếu token hết hạn, trả về 410 để FE biết gọi refresh token
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token'))
      return
    }

    // Token không hợp lệ
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}

export const authMiddleware = {
  isAuthorized
}

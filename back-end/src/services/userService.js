/* eslint-disable no-useless-catch */
/**
 * User Service - Chứa logic xử lý user
 */

import bcryptjs from 'bcryptjs'
import crypto from 'crypto'
import { env } from '~/config/environment'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

const OTP_EXPIRY_MS = 10 * 60 * 1000
const OTP_RESEND_COOLDOWN_MS = 60 * 1000
const MAX_OTP_ATTEMPTS = 5

const clearPasswordResetOtp = async (userId) => {
  return await userModel.update(userId, {
    verifyToken: null,
    verifyTokenExpiresAt: null,
    verifyTokenSentAt: null,
    verifyTokenAttempts: 0,
    updatedAt: Date.now()
  })
}

const validatePasswordResetOtp = async (existingUser, otp) => {
  if (!existingUser.verifyToken || !existingUser.verifyTokenExpiresAt) {
    throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Mã OTP không tồn tại. Vui lòng yêu cầu mã mới')
  }

  if (Date.now() > new Date(existingUser.verifyTokenExpiresAt).getTime()) {
    await clearPasswordResetOtp(existingUser._id)
    throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới')
  }

  const currentAttempts = Number(existingUser.verifyTokenAttempts || 0)

  if (currentAttempts >= MAX_OTP_ATTEMPTS) {
    await clearPasswordResetOtp(existingUser._id)
    throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã OTP mới')
  }

  if (otp !== existingUser.verifyToken) {
    const nextAttempts = currentAttempts + 1

    if (nextAttempts >= MAX_OTP_ATTEMPTS) {
      await clearPasswordResetOtp(existingUser._id)
      throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'Bạn đã nhập sai 5 lần. Vui lòng yêu cầu mã OTP mới')
    }

    await userModel.update(existingUser._id, {
      verifyTokenAttempts: nextAttempts,
      updatedAt: Date.now()
    })

    throw new ApiError(
      StatusCodes.NOT_ACCEPTABLE,
      `Mã OTP không chính xác. Bạn còn ${MAX_OTP_ATTEMPTS - nextAttempts} lần thử`
    )
  }
}

const userService = {
  getProfile: async (userId) => {
    try {
      const existingUser = await userModel.findOneById(userId)
      if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tai khoan khong ton tai')
      if (!existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tai khoan chua duoc kich hoat')

      delete existingUser.password
      delete existingUser.verifyToken

      return existingUser
    } catch (error) {
      throw error
    }
  },

  /**
   * Tạo user mới - Đăng ký
   */
  createNew: async (reqBody) => {
    try {
      // Kiểm tra user đã tồn tại chưa
      const existingUser = await userModel.findOneByEmail(reqBody.email)
      if (existingUser) {
        throw new ApiError(StatusCodes.CONFLICT, 'Email đã tồn tại!')
      }

      // Extract username từ email (phần trước @)
      const nameFromEmail = reqBody.email.split('@')[0]

      // Hash password
      const hashedPassword = bcryptjs.hashSync(reqBody.password, 8)

      // Tạo user mới
      const newUser = {
        email: reqBody.email,
        password: hashedPassword,
        username: nameFromEmail,
        displayName: nameFromEmail,
        role: reqBody.role || userModel.USER_ROLES.PATIENT,
        isActive: true,
        verifyToken: null
      }

      // Lưu vào DB
      const getNewUser = await userModel.createNew(newUser)

      // Xóa sensitive fields trước khi return
      delete getNewUser.password
      delete getNewUser.verifyToken

      return getNewUser
    } catch (error) {
      throw error
    }
  },

  requestPasswordReset: async (reqBody) => {
    try {
      const existingUser = await userModel.findOneByEmail(reqBody.email)
      if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tìm thấy')

      const sentAt = existingUser.verifyTokenSentAt
        ? new Date(existingUser.verifyTokenSentAt).getTime()
        : 0
      const cooldownRemaining = OTP_RESEND_COOLDOWN_MS - (Date.now() - sentAt)

      if (cooldownRemaining > 0) {
        throw new ApiError(
          StatusCodes.TOO_MANY_REQUESTS,
          `Vui lòng chờ ${Math.ceil(cooldownRemaining / 1000)} giây trước khi gửi lại mã OTP`
        )
      }

      const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0')
      const now = Date.now()

      await userModel.update(existingUser._id, {
        verifyToken: otp,
        verifyTokenExpiresAt: now + OTP_EXPIRY_MS,
        verifyTokenSentAt: now,
        verifyTokenAttempts: 0,
        updatedAt: now
      })

      const htmlContent = `
        <h2>Đặt lại mật khẩu</h2>
        <p>Chào ${existingUser.displayName || existingUser.username},</p>
        <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</p>
        <p>Mã này sẽ hết hạn sau 10 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      `

      try {
        await BrevoProvider.sendEmail(
          existingUser.email,
          'Mã OTP đặt lại mật khẩu',
          htmlContent
        )
      } catch (error) {
        await clearPasswordResetOtp(existingUser._id)
        throw error
      }

      return { email: existingUser.email, otpExpiresInSeconds: OTP_EXPIRY_MS / 1000 }
    } catch (error) {
      throw error
    }
  },

  verifyPasswordResetOtp: async (reqBody) => {
    try {
      const existingUser = await userModel.findOneByEmail(reqBody.email)
      if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tìm thấy')

      await validatePasswordResetOtp(existingUser, reqBody.otp)

      return { verified: true }
    } catch (error) {
      throw error
    }
  },

  resetPassword: async (reqBody) => {
    try {
      const existingUser = await userModel.findOneByEmail(reqBody.email)
      if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tìm thấy')

      await validatePasswordResetOtp(existingUser, reqBody.otp)

      await userModel.update(existingUser._id, {
        password: bcryptjs.hashSync(reqBody.newPassword, 8),
        verifyToken: null,
        verifyTokenExpiresAt: null,
        verifyTokenSentAt: null,
        verifyTokenAttempts: 0,
        updatedAt: Date.now()
      })

      return { passwordReset: true }
    } catch (error) {
      throw error
    }
  },

  /**
   * Đăng nhập
   */
  login: async (reqBody) => {
    try {
      const existingUser = await userModel.findOneByEmail(reqBody.email)
      if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tìm thấy')
      if (!existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn')
      if (!bcryptjs.compareSync(reqBody.password, existingUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Email hoặc mật khẩu không chính xác')
      }

      // Tạo userInfo cho token
      const userInfo = {
        _id: existingUser._id,
        email: existingUser.email
      }

      // Tạo access token
      const accessToken = await JwtProvider.generateToken(
        userInfo,
        env.ACCESS_TOKEN_SECRET_SIGNATURE,
        env.ACCESS_TOKEN_LIFE
      )

      // Tạo refresh token
      const refreshToken = await JwtProvider.generateToken(
        userInfo,
        env.REFRESH_TOKEN_SECRET_SIGNATURE,
        env.REFRESH_TOKEN_LIFE
      )

      // Xóa sensitive fields
      delete existingUser.password
      delete existingUser.verifyToken

      return { accessToken, refreshToken, ...existingUser }
    } catch (error) {
      throw error
    }
  },

  /**
   * Refresh access token - không cần DB access
   */
  refreshToken: async (clientRefreshToken) => {
    try {
      const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_TOKEN_SECRET_SIGNATURE)

      // Lấy user info từ decoded token
      const userInfo = {
        _id: refreshTokenDecoded._id,
        email: refreshTokenDecoded.email
      }

      // Tạo access token mới
      const accessToken = await JwtProvider.generateToken(
        userInfo,
        env.ACCESS_TOKEN_SECRET_SIGNATURE,
        env.ACCESS_TOKEN_LIFE
      )

      return { accessToken }
    } catch (error) {
      throw error
    }
  },

  /**
   * Update user info
   */
  update: async (userId, reqBody, userAvatarFile) => {
    try {
      // Query User và kiểm tra
      const existingUser = await userModel.findOneById(userId)
      if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tìm thấy!')
      if (!existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tài khoản của bạn chưa được kích hoạt!')

      // Khởi tạo kết quả updated User ban đầu là empty
      let updatedUser = {}

      // Trường hợp change password
      if (reqBody.current_password && reqBody.new_password) {
        // Kiểm tra current_password có đúng hay không
        if (!bcryptjs.compareSync(reqBody.current_password, existingUser.password)) {
          throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Mật khẩu hiện tại không chính xác!')
        }
        // Nếu như current password đúng thì sẽ hash mật khẩu mới và update lại vào db
        updatedUser = await userModel.update(existingUser._id, {
          password: bcryptjs.hashSync(reqBody.new_password, 8)
        })
      } else if (userAvatarFile) {
        // Trường hợp upload file lên cloudStorage
        const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'CP_users')

        // Lưu url của file ảnh vào trong db
        updatedUser = await userModel.update(existingUser._id, {
          avatar: uploadResult.secure_url
        })
      } else {
        // Trường hợp update các thông tin chung như displayName
        updatedUser = await userModel.update(existingUser._id, reqBody)
      }

      // Xóa sensitive fields
      delete updatedUser.password
      delete updatedUser.verifyToken

      return updatedUser
    } catch (error) {
      throw error
    }
  }
}

export default userService

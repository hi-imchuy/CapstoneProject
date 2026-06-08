/* eslint-disable no-useless-catch */
/**
 * User Service - Chứa logic xử lý user
 */

import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { env } from '~/config/environment'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

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

      // Tạo verify token
      const verifyToken = uuidv4()

      // Tạo user mới
      const newUser = {
        email: reqBody.email,
        password: hashedPassword,
        username: nameFromEmail,
        displayName: nameFromEmail,
        role: reqBody.role || userModel.USER_ROLES.PATIENT,
        verifyToken
      }

      // Lưu vào DB
      const getNewUser = await userModel.createNew(newUser)

      // Gửi mail xác thực
      const verificationLink = `${env.WEBSITE_DOMAIN_DEVELOPMENT}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
      const customSubject = 'Xác thực email tài khoản'
      const htmlContent = `
        <h2>Xác thực email của bạn</h2>
        <p>Chào ${getNewUser.username},</p>
        <p>Vui lòng nhấn vào link dưới đây để xác thực email của bạn:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Xác thực email
        </a>
        <p>Link sẽ hết hạn sau 24 giờ.</p>
        <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
      `

      await BrevoProvider.sendEmail(getNewUser.email, customSubject, htmlContent)

      // Xóa sensitive fields trước khi return
      delete getNewUser.password
      delete getNewUser.verifyToken

      return getNewUser
    } catch (error) {
      throw error
    }
  },

  /**
   * Xác thực email
   */
  verifyAccount: async (reqBody) => {
    try {
      const existingUser = await userModel.findOneByEmail(reqBody.email)
      if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tìm thấy')
      if (existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tài khoản đã được xác thực')
      if (reqBody.token !== existingUser.verifyToken) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token xác thực không hợp lệ')

      // Update user
      const updateData = {
        isActive: true,
        verifyToken: null
      }
      const updatedUser = await userModel.update(existingUser._id, updateData)

      // Xóa sensitive fields
      delete updatedUser.password
      delete updatedUser.verifyToken

      return updatedUser
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

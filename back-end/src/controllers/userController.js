/**
 * User Controller - Xử lý các request từ client
 */

import { StatusCodes } from 'http-status-codes'
import userService from '~/services/userService'
import ms from 'ms'
import { env } from '~/config/environment'

const authCookieOptions = {
  httpOnly: true,
  secure: env.BUILD_MODE !== 'dev',
  sameSite: env.BUILD_MODE === 'dev' ? 'lax' : 'none',
  maxAge: ms('14 days')
}

const clearAuthCookieOptions = {
  httpOnly: true,
  secure: env.BUILD_MODE !== 'dev',
  sameSite: env.BUILD_MODE === 'dev' ? 'lax' : 'none'
}

const userController = {
  getProfile: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await userService.getProfile(userId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /v1/users/signup
   * Đăng ký user mới
   */
  createNew: async (req, res, next) => {
    try {
      const createdUser = await userService.createNew(req.body)
      res.status(StatusCodes.CREATED).json(createdUser)
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /v1/users/verify-account
   * Xác thực email
   */
  verifyAccount: async (req, res, next) => {
    try {
      const result = await userService.verifyAccount(req.body)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /v1/users/login
   * Đăng nhập
   */
  login: async (req, res, next) => {
    try {
      const result = await userService.login(req.body)

      // Set HTTP-only cookies cho accessToken và refreshToken
      res.cookie('accessToken', result.accessToken, authCookieOptions)

      res.cookie('refreshToken', result.refreshToken, authCookieOptions)

      // Xóa password, verifyToken trước khi return
      delete result.password
      delete result.verifyToken

      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /v1/users/logout
   * Đăng xuất
   */
  logout: async (req, res, next) => {
    try {
      // Chỉ cần clear cookies, không cần DB access
      res.clearCookie('accessToken', clearAuthCookieOptions)
      res.clearCookie('refreshToken', clearAuthCookieOptions)

      res.status(StatusCodes.OK).json({ loggedOut: true })
    } catch (error) {
      next(error)
    }
  },

  /**
   * POST /v1/users/refresh-token
   * Refresh access token
   */
  refreshToken: async (req, res, next) => {
    try {
      const result = await userService.refreshToken(req.cookies?.refreshToken)

      // Set cookie cho access token mới
      res.cookie('accessToken', result.accessToken, authCookieOptions)

      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  /**
   * PUT /v1/users/:id
   * Update user info
   */
  update: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const userAvatarFile = req.file

      const updatedUser = await userService.update(userId, req.body, userAvatarFile)
      res.status(StatusCodes.OK).json(updatedUser)
    } catch (error) {
      next(error)
    }
  }
}

export default userController

/**
 * User Route - Định tuyến các request user
 */

import express from 'express'
import userController from '~/controllers/userController'
import validateUserInput from '~/validations/userValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUpdloadMiddleware } from '~/middlewares/multerUploadMiddleware'

const Router = express.Router()

// POST /v1/users - Đăng ký user mới
Router.post('/', validateUserInput.validateSignup, userController.createNew)

Router.post(
  '/forgot-password/request',
  validateUserInput.validateForgotPasswordRequest,
  userController.requestPasswordReset
)

Router.post(
  '/forgot-password/verify',
  validateUserInput.validateForgotPasswordVerify,
  userController.verifyPasswordResetOtp
)

Router.post(
  '/forgot-password/reset',
  validateUserInput.validateForgotPasswordReset,
  userController.resetPassword
)

// POST /v1/users/login - Đăng nhập
Router.post('/login', validateUserInput.validateLogin, userController.login)

// POST /v1/users/logout - Đăng xuất
Router.post('/logout', authMiddleware.isAuthorized, userController.logout)

// POST /v1/users/refresh-token - Refresh access token
Router.post('/refresh-token', userController.refreshToken)

// GET /v1/users/profile - Lay thong tin user hien tai tu cookie token
Router.get('/profile', authMiddleware.isAuthorized, userController.getProfile)

// PUT /v1/users - Update user info (change password, upload avatar, update displayName)
Router.put('/', authMiddleware.isAuthorized, multerUpdloadMiddleware.upload.single('avatar'), validateUserInput.validateUpdate, userController.update)

export default Router

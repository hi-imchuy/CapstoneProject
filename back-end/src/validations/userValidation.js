/**
 * User Validation - Xác thực dữ liệu input từ client
 */

import Joi from 'joi'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from '~/utils/validators'

const signupSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_RULE).required().trim().messages({
    'string.pattern.base': EMAIL_RULE_MESSAGE,
    'any.required': 'Email là bắt buộc'
  }),
  password: Joi.string().pattern(PASSWORD_RULE).required().messages({
    'string.pattern.base': PASSWORD_RULE_MESSAGE,
    'any.required': 'Mật khẩu là bắt buộc'
  }),
  role: Joi.string().valid('doctor', 'patient').optional().messages({
    'any.only': 'Role chỉ có thể là doctor hoặc patient'
  })
})

const updateSchema = Joi.object({
  displayName: Joi.string().trim().strict(),
  current_password: Joi.string().pattern(PASSWORD_RULE).messages({
    'string.pattern.base': `current_password: ${PASSWORD_RULE_MESSAGE}`
  }),
  new_password: Joi.string().pattern(PASSWORD_RULE).messages({
    'string.pattern.base': `new_password: ${PASSWORD_RULE_MESSAGE}`
  })
})

const loginSchema = Joi.object({
  email: Joi.string().pattern(EMAIL_RULE).required().trim().messages({
    'string.pattern.base': EMAIL_RULE_MESSAGE,
    'any.required': 'Email là bắt buộc'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Mật khẩu là bắt buộc'
  })
})

const validateUserInput = {
  validateSignup: async (req, res, next) => {
    try {
      await signupSchema.validateAsync(req.body, { abortEarly: false })
      next()
    } catch (error) {
      const errorMessages = error.details.map(detail => detail.message)
      return res.status(400).json({
        code: 400,
        message: 'Lỗi xác thực dữ liệu',
        errors: errorMessages
      })
    }
  },

  validateLogin: async (req, res, next) => {
    try {
      await loginSchema.validateAsync(req.body, { abortEarly: false })
      next()
    } catch (error) {
      const errorMessages = error.details.map(detail => detail.message)
      return res.status(400).json({
        code: 400,
        message: 'Lỗi xác thực dữ liệu',
        errors: errorMessages
      })
    }
  },

  validateUpdate: async (req, res, next) => {
    try {
      await updateSchema.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
      next()
    } catch (error) {
      const errorMessages = error.details.map(detail => detail.message)
      return res.status(400).json({
        code: 400,
        message: 'Lỗi xác thực dữ liệu',
        errors: errorMessages
      })
    }
  }
}

export default validateUserInput

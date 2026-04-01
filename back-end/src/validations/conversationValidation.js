import Joi from 'joi'

import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const createConversationSchema = Joi.object({
  targetUserId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
})

const sendMessageSchema = Joi.object({
  content: Joi.string().allow('', null)
})

const conversationValidation = {
  createConversation: async (req, res, next) => {
    try {
      await createConversationSchema.validateAsync(req.body, { abortEarly: false })
      next()
    } catch (error) {
      const errorMessages = error.details.map(detail => detail.message)
      return res.status(400).json({
        code: 400,
        message: 'Loi xac thuc du lieu',
        errors: errorMessages
      })
    }
  },

  sendMessage: async (req, res, next) => {
    try {
      await sendMessageSchema.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
      next()
    } catch (error) {
      const errorMessages = error.details.map(detail => detail.message)
      return res.status(400).json({
        code: 400,
        message: 'Loi xac thuc du lieu',
        errors: errorMessages
      })
    }
  }
}

export default conversationValidation

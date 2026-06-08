import Joi from 'joi'

const titleSchema = Joi.string().trim().min(1).max(120)

const createConversationSchema = Joi.object({
  title: titleSchema.optional()
})

const updateConversationSchema = Joi.object({
  title: titleSchema.required()
})

const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(10000).required()
})

const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validateAsync(req.body, {
      abortEarly: false,
      stripUnknown: true
    })
    next()
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: 'Lỗi xác thực dữ liệu',
      errors: error.details.map((detail) => detail.message)
    })
  }
}

const aiConversationValidation = {
  createConversation: validate(createConversationSchema),
  updateConversation: validate(updateConversationSchema),
  sendMessage: validate(sendMessageSchema)
}

export default aiConversationValidation

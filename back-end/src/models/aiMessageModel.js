import Joi from 'joi'

import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const AI_MESSAGE_COLLECTION_NAME = 'ai_messages'
const AI_MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant'
}

const AI_MESSAGE_COLLECTION_SCHEMA = Joi.object({
  conversationId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  role: Joi.string().valid(...Object.values(AI_MESSAGE_ROLES)).required(),
  content: Joi.string().trim().strict().min(1).required(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await AI_MESSAGE_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(AI_MESSAGE_COLLECTION_NAME).insertOne(validData)
    return await GET_DB().collection(AI_MESSAGE_COLLECTION_NAME).findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const findManyByConversationId = async (conversationId) => {
  try {
    return await GET_DB()
      .collection(AI_MESSAGE_COLLECTION_NAME)
      .find({
        conversationId: String(conversationId),
        _destroy: false
      })
      .sort({ createdAt: 1 })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const findLatestByConversationId = async (conversationId) => {
  try {
    return await GET_DB()
      .collection(AI_MESSAGE_COLLECTION_NAME)
      .find({
        conversationId: String(conversationId),
        _destroy: false
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .next()
  } catch (error) {
    throw new Error(error)
  }
}

const findLatestManyByConversationId = async (conversationId, limit = 20) => {
  try {
    const limitedCount = Math.min(Math.max(Number(limit) || 20, 1), 50)
    const messages = await GET_DB()
      .collection(AI_MESSAGE_COLLECTION_NAME)
      .find({
        conversationId: String(conversationId),
        _destroy: false
      })
      .sort({ createdAt: -1 })
      .limit(limitedCount)
      .toArray()

    return messages.reverse()
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByConversationId = async (conversationId) => {
  try {
    return await GET_DB().collection(AI_MESSAGE_COLLECTION_NAME).deleteMany({
      conversationId: String(conversationId)
    })
  } catch (error) {
    throw new Error(error)
  }
}

export const aiMessageModel = {
  AI_MESSAGE_COLLECTION_NAME,
  AI_MESSAGE_COLLECTION_SCHEMA,
  AI_MESSAGE_ROLES,
  createNew,
  findManyByConversationId,
  findLatestByConversationId,
  findLatestManyByConversationId,
  deleteManyByConversationId
}

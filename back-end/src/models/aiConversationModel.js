import Joi from 'joi'
import { ObjectId } from 'mongodb'

import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const AI_CONVERSATION_COLLECTION_NAME = 'ai_conversations'
const AI_CONVERSATION_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().trim().strict().min(1).max(120).required(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(Date.now),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await AI_CONVERSATION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(AI_CONVERSATION_COLLECTION_NAME).insertOne(validData)
    return await GET_DB().collection(AI_CONVERSATION_COLLECTION_NAME).findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const findManyByUserId = async (userId) => {
  try {
    return await GET_DB()
      .collection(AI_CONVERSATION_COLLECTION_NAME)
      .find({
        userId: String(userId),
        _destroy: false
      })
      .sort({ updatedAt: -1 })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByIdAndUserId = async (conversationId, userId) => {
  try {
    if (!ObjectId.isValid(String(conversationId))) return null

    return await GET_DB().collection(AI_CONVERSATION_COLLECTION_NAME).findOne({
      _id: new ObjectId(String(conversationId)),
      userId: String(userId),
      _destroy: false
    })
  } catch (error) {
    throw new Error(error)
  }
}

const updateByIdAndUserId = async (conversationId, userId, updateData = {}, options = {}) => {
  try {
    if (!ObjectId.isValid(String(conversationId))) return null

    const nextUpdateData = { ...updateData }
    if (options.touchUpdatedAt !== false) {
      nextUpdateData.updatedAt = Date.now()
    }

    return await GET_DB().collection(AI_CONVERSATION_COLLECTION_NAME).findOneAndUpdate(
      {
        _id: new ObjectId(String(conversationId)),
        userId: String(userId),
        _destroy: false
      },
      { $set: nextUpdateData },
      { returnDocument: 'after' }
    )
  } catch (error) {
    throw new Error(error)
  }
}

export const aiConversationModel = {
  AI_CONVERSATION_COLLECTION_NAME,
  AI_CONVERSATION_COLLECTION_SCHEMA,
  createNew,
  findManyByUserId,
  findOneByIdAndUserId,
  updateByIdAndUserId
}

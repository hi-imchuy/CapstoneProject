import Joi from 'joi'
import { ObjectId } from 'mongodb'

import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { userModel } from '~/models/userModel'

const MESSAGE_COLLECTION_NAME = 'messages'
const MESSAGE_COLLECTION_SCHEMA = Joi.object({
  conversationId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  sender: Joi.string().valid(...Object.values(userModel.USER_ROLES)).required(),
  content: Joi.string().allow('', null).default(null),
  image: Joi.string().allow(null).default(null),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await MESSAGE_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(MESSAGE_COLLECTION_NAME).insertOne(validData)
    return await GET_DB().collection(MESSAGE_COLLECTION_NAME).findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const findManyByConversationId = async (conversationId) => {
  try {
    return await GET_DB()
      .collection(MESSAGE_COLLECTION_NAME)
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
      .collection(MESSAGE_COLLECTION_NAME)
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

const findOneById = async (messageId) => {
  try {
    return await GET_DB().collection(MESSAGE_COLLECTION_NAME).findOne({
      _id: new ObjectId(String(messageId)),
      _destroy: false
    })
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByConversationId = async (conversationId) => {
  try {
    return await GET_DB().collection(MESSAGE_COLLECTION_NAME).deleteMany({
      conversationId: String(conversationId)
    })
  } catch (error) {
    throw new Error(error)
  }
}

const softDeleteById = async (messageId) => {
  try {
    return await GET_DB().collection(MESSAGE_COLLECTION_NAME).updateOne(
      { _id: new ObjectId(String(messageId)), _destroy: false },
      { $set: { _destroy: true } }
    )
  } catch (error) {
    throw new Error(error)
  }
}

export const messageModel = {
  MESSAGE_COLLECTION_NAME,
  MESSAGE_COLLECTION_SCHEMA,
  createNew,
  findManyByConversationId,
  findLatestByConversationId,
  findOneById,
  deleteManyByConversationId,
  softDeleteById
}

import Joi from 'joi'
import { ObjectId } from 'mongodb'

import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const CONVERSATION_COLLECTION_NAME = 'conversations'
const CONVERSATION_COLLECTION_SCHEMA = Joi.object({
  doctorId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  patientId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(Date.now),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await CONVERSATION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(CONVERSATION_COLLECTION_NAME).insertOne(validData)
    return await GET_DB().collection(CONVERSATION_COLLECTION_NAME).findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (conversationId) => {
  try {
    return await GET_DB().collection(CONVERSATION_COLLECTION_NAME).findOne({
      _id: new ObjectId(String(conversationId)),
      _destroy: false
    })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByParticipants = async (doctorId, patientId) => {
  try {
    return await GET_DB().collection(CONVERSATION_COLLECTION_NAME).findOne({
      doctorId: String(doctorId),
      patientId: String(patientId),
      _destroy: false
    })
  } catch (error) {
    throw new Error(error)
  }
}

const findManyByUserId = async (userId) => {
  try {
    return await GET_DB()
      .collection(CONVERSATION_COLLECTION_NAME)
      .find({
        _destroy: false,
        $or: [
          { doctorId: String(userId) },
          { patientId: String(userId) }
        ]
      })
      .sort({ updatedAt: -1 })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (conversationId, updateData) => {
  try {
    return await GET_DB().collection(CONVERSATION_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(conversationId)) },
      { $set: { ...updateData, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
  } catch (error) {
    throw new Error(error)
  }
}

export const conversationModel = {
  CONVERSATION_COLLECTION_NAME,
  CONVERSATION_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByParticipants,
  findManyByUserId,
  update
}

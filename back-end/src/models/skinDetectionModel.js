import Joi from 'joi'
import { ObjectId } from 'mongodb'

import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const SKIN_DETECTION_COLLECTION_NAME = 'skin_detections'
const SKIN_DETECTION_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  url_anh_goc: Joi.string().required().trim().strict(),
  url_anh_ket_qua: Joi.string().required().trim().strict(),
  public_id_anh_goc: Joi.string().allow('').default(''),
  public_id_anh_ket_qua: Joi.string().allow('').default(''),
  cac_benh_nhan_dien: Joi.array().items(
    Joi.object({
      ten_benh: Joi.string().required().trim().strict(),
      do_chinh_xac: Joi.number().min(0).max(100).required()
    })
  ).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
  return await SKIN_DETECTION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const result = await GET_DB().collection(SKIN_DETECTION_COLLECTION_NAME).insertOne(validData)
    return await GET_DB().collection(SKIN_DETECTION_COLLECTION_NAME).findOne({ _id: result.insertedId })
  } catch (error) {
    throw new Error(error)
  }
}

const findManyByUserId = async (userId) => {
  try {
    return await GET_DB()
      .collection(SKIN_DETECTION_COLLECTION_NAME)
      .find({
        userId: String(userId),
        _destroy: false
      })
      .sort({ createdAt: -1 })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (detectionId) => {
  try {
    return await GET_DB().collection(SKIN_DETECTION_COLLECTION_NAME).findOne({
      _id: new ObjectId(String(detectionId)),
      _destroy: false
    })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByIdAndUserId = async (detectionId, userId) => {
  try {
    if (!ObjectId.isValid(String(detectionId))) return null

    return await GET_DB().collection(SKIN_DETECTION_COLLECTION_NAME).findOne({
      _id: new ObjectId(String(detectionId)),
      userId: String(userId),
      _destroy: false
    })
  } catch (error) {
    throw new Error(error)
  }
}

const hardDeleteOneByIdAndUserId = async (detectionId, userId) => {
  try {
    if (!ObjectId.isValid(String(detectionId))) return { deletedCount: 0 }

    return await GET_DB().collection(SKIN_DETECTION_COLLECTION_NAME).deleteOne({
      _id: new ObjectId(String(detectionId)),
      userId: String(userId),
      _destroy: false
    })
  } catch (error) {
    throw new Error(error)
  }
}

export const skinDetectionModel = {
  SKIN_DETECTION_COLLECTION_NAME,
  SKIN_DETECTION_COLLECTION_SCHEMA,
  createNew,
  findManyByUserId,
  findOneById,
  findOneByIdAndUserId,
  hardDeleteOneByIdAndUserId
}

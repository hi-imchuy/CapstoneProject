import { StatusCodes } from 'http-status-codes'

import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { skinDetectionModel } from '~/models/skinDetectionModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { getPythonServerUrl } from '~/utils/envHelpers'

const ensureExistingActiveUser = async (userId) => {
  const existingUser = await userModel.findOneById(userId)
  if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tai khoan khong ton tai')
  if (!existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tai khoan chua duoc kich hoat')
  return existingUser
}

const normalizeDetections = (detections) => {
  if (!Array.isArray(detections)) return []

  return detections
    .map((item) => ({
      ten_benh: String(item?.ten_benh || item?.name || '').trim(),
      do_chinh_xac: Number(item?.do_chinh_xac ?? item?.confidence ?? 0)
    }))
    .filter((item) => item.ten_benh)
}

const parseDetectionsHeader = (headerValue) => {
  if (!headerValue) return []

  try {
    return normalizeDetections(JSON.parse(decodeURIComponent(headerValue)))
  } catch (error) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Python Server tra ve metadata nhan dien khong hop le')
  }
}

const callPythonDetectionServer = async (imageUrl) => {
  const pythonServerUrl = getPythonServerUrl()

  let response
  try {
    response = await fetch(`${pythonServerUrl}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    })
  } catch (error) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Khong ket noi duoc Python Server nhan dien')
  }

  if (!response.ok) {
    let errorMessage = 'Python Server xu ly anh that bai'
    try {
      const errorData = await response.json()
      errorMessage = errorData?.detail || errorData?.message || errorMessage
    } catch (error) {
      // Keep the default upstream error message.
    }
    throw new ApiError(StatusCodes.BAD_GATEWAY, errorMessage)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('image/jpeg') && !contentType.includes('image/jpg')) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Python Server khong tra ve anh JPEG hop le')
  }

  const resultImageBuffer = Buffer.from(await response.arrayBuffer())
  if (!resultImageBuffer.length) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Anh ket qua tu Python Server bi rong')
  }

  return {
    resultImageBuffer,
    detections: parseDetectionsHeader(response.headers.get('x-detections')),
    message: decodeURIComponent(response.headers.get('x-detection-message') || '')
  }
}

const buildDetectionResponse = (detection) => ({
  ...detection,
  _id: String(detection._id)
})

const extractCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl) return ''

  try {
    const url = new URL(imageUrl)
    const uploadMarker = '/upload/'
    const uploadIndex = url.pathname.indexOf(uploadMarker)
    if (uploadIndex === -1) return ''

    let publicPath = url.pathname.slice(uploadIndex + uploadMarker.length)
    publicPath = publicPath.replace(/^v\d+\//, '')
    publicPath = publicPath.replace(/\.[^/.]+$/, '')

    return decodeURIComponent(publicPath).replace(/^\/+/, '')
  } catch (error) {
    return ''
  }
}

const getDetectionPublicIds = (detection) => {
  return [
    detection.public_id_anh_goc || extractCloudinaryPublicId(detection.url_anh_goc),
    detection.public_id_anh_ket_qua || extractCloudinaryPublicId(detection.url_anh_ket_qua)
  ].filter(Boolean)
}

const deleteDetectionImages = async (detection) => {
  const publicIds = getDetectionPublicIds(detection)
  await Promise.all(publicIds.map((publicId) => CloudinaryProvider.destroyImage(publicId)))
}

const skinDetectionService = {
  createNew: async (userId, imageFile) => {
    await ensureExistingActiveUser(userId)

    if (!imageFile) {
      throw new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Vui long chon anh can nhan dien')
    }

    let originalUploadResult
    try {
      originalUploadResult = await CloudinaryProvider.streamUpload(
        imageFile.buffer,
        'CP_skin_detections/originals'
      )
    } catch (error) {
      throw new ApiError(StatusCodes.BAD_GATEWAY, 'Upload anh goc len Cloudinary that bai')
    }

    const pythonResult = await callPythonDetectionServer(originalUploadResult.secure_url)

    let resultUploadResult
    try {
      resultUploadResult = await CloudinaryProvider.streamUpload(
        pythonResult.resultImageBuffer,
        'CP_skin_detections/results'
      )
    } catch (error) {
      throw new ApiError(StatusCodes.BAD_GATEWAY, 'Upload anh ket qua len Cloudinary that bai')
    }

    const createdDetection = await skinDetectionModel.createNew({
      userId: String(userId),
      url_anh_goc: originalUploadResult.secure_url,
      url_anh_ket_qua: resultUploadResult.secure_url,
      public_id_anh_goc: originalUploadResult.public_id || '',
      public_id_anh_ket_qua: resultUploadResult.public_id || '',
      cac_benh_nhan_dien: pythonResult.detections
    })

    return {
      ...buildDetectionResponse(createdDetection),
      message: pythonResult.message || (
        pythonResult.detections.length
          ? 'Nhan dien thanh cong'
          : 'Khong phat hien benh da lieu trong anh'
      )
    }
  },

  getHistory: async (userId) => {
    await ensureExistingActiveUser(userId)
    const detections = await skinDetectionModel.findManyByUserId(userId)
    return detections.map(buildDetectionResponse)
  },

  deleteHistoryItem: async (userId, detectionId) => {
    await ensureExistingActiveUser(userId)

    const existingDetection = await skinDetectionModel.findOneByIdAndUserId(detectionId, userId)
    if (!existingDetection) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Khong tim thay lich su nhan dien')
    }

    try {
      await deleteDetectionImages(existingDetection)
    } catch (error) {
      throw new ApiError(StatusCodes.BAD_GATEWAY, 'Xoa anh tren Cloudinary that bai')
    }

    const result = await skinDetectionModel.hardDeleteOneByIdAndUserId(detectionId, userId)
    if (!result.deletedCount) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Khong tim thay lich su nhan dien')
    }

    return { deleted: true, detectionId: String(detectionId) }
  }
}

export default skinDetectionService

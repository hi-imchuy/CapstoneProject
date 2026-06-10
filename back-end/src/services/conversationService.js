import { StatusCodes } from 'http-status-codes'

import ApiError from '~/utils/ApiError'
import { userModel } from '~/models/userModel'
import { conversationModel } from '~/models/conversationModel'
import { messageModel } from '~/models/messageModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { chatSocket } from '~/sockets/chatSocket'

const sanitizeUser = (user) => {
  if (!user) return null

  return {
    _id: user._id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role
  }
}

const buildConversationSummary = async (conversation) => {
  const counterpartUserId = conversation.doctorId === conversation.currentUserId
    ? conversation.patientId
    : conversation.doctorId

  const participant = sanitizeUser(await userModel.findOneById(counterpartUserId))
  const latestMessage = await messageModel.findLatestByConversationId(conversation._id)

  return {
    _id: String(conversation._id),
    doctorId: conversation.doctorId,
    patientId: conversation.patientId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    participant,
    latestMessage: latestMessage ? {
      ...latestMessage,
      _id: String(latestMessage._id)
    } : null
  }
}

const ensureExistingActiveUser = async (userId) => {
  const existingUser = await userModel.findOneById(userId)
  if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tai khoan khong ton tai')
  if (!existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tai khoan chua duoc kich hoat')
  return existingUser
}

const ensureConversationParticipant = async (userId, conversationId) => {
  const conversation = await conversationModel.findOneById(conversationId)
  if (!conversation) throw new ApiError(StatusCodes.NOT_FOUND, 'Khong tim thay cuoc tro chuyen')

  const isParticipant = [conversation.doctorId, conversation.patientId].includes(String(userId))
  if (!isParticipant) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Ban khong co quyen truy cap cuoc tro chuyen nay')
  }

  return conversation
}

const conversationService = {
  getContacts: async (userId) => {
    const currentUser = await ensureExistingActiveUser(userId)
    const targetRole = currentUser.role === userModel.USER_ROLES.PATIENT
      ? userModel.USER_ROLES.DOCTOR
      : userModel.USER_ROLES.PATIENT

    const users = await userModel.findManyByRole(targetRole, userId)
    return users.map(sanitizeUser)
  },

  getConversations: async (userId) => {
    await ensureExistingActiveUser(userId)
    const conversations = await conversationModel.findManyByUserId(userId)

    return await Promise.all(
      conversations.map((conversation) => buildConversationSummary({
        ...conversation,
        currentUserId: String(userId)
      }))
    )
  },

  createOrGetConversation: async (userId, reqBody) => {
    const currentUser = await ensureExistingActiveUser(userId)
    const targetUser = await ensureExistingActiveUser(reqBody.targetUserId)

    if (String(currentUser._id) === String(targetUser._id)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Khong the tu tao cuoc tro chuyen voi chinh minh')
    }

    if (currentUser.role === targetUser.role) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Cuoc tro chuyen chi duoc tao giua doctor va patient')
    }

    const doctorId = currentUser.role === userModel.USER_ROLES.DOCTOR ? String(currentUser._id) : String(targetUser._id)
    const patientId = currentUser.role === userModel.USER_ROLES.PATIENT ? String(currentUser._id) : String(targetUser._id)

    let conversation = await conversationModel.findOneByParticipants(doctorId, patientId)
    let isNewConversation = false

    if (!conversation) {
      conversation = await conversationModel.createNew({ doctorId, patientId })
      isNewConversation = true
    }

    const summary = await buildConversationSummary({
      ...conversation,
      currentUserId: String(userId)
    })

    if (isNewConversation) {
      const counterpartUserId = String(userId) === doctorId ? patientId : doctorId
      const counterpartSummary = await buildConversationSummary({
        ...conversation,
        currentUserId: counterpartUserId
      })

      chatSocket.emitConversationCreated([
        { userId: String(userId), conversation: summary },
        { userId: counterpartUserId, conversation: counterpartSummary }
      ])
    }

    return summary
  },

  getMessages: async (userId, conversationId) => {
    await ensureExistingActiveUser(userId)
    await ensureConversationParticipant(userId, conversationId)

    const messages = await messageModel.findManyByConversationId(conversationId)
    return messages.map((message) => ({
      ...message,
      _id: String(message._id)
    }))
  },

  sendMessage: async (userId, conversationId, reqBody, messageImageFile) => {
    const currentUser = await ensureExistingActiveUser(userId)
    const conversation = await ensureConversationParticipant(userId, conversationId)

    const trimmedContent = reqBody?.content?.trim?.() || ''
    if (!trimmedContent && !messageImageFile) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tin nhan phai co noi dung hoac hinh anh')
    }

    let imageUrl = null
    if (messageImageFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(messageImageFile.buffer, 'CP_messages')
      imageUrl = uploadResult.secure_url
    }

    const createdMessage = await messageModel.createNew({
      conversationId: String(conversation._id),
      sender: currentUser.role,
      content: trimmedContent || null,
      image: imageUrl
    })

    const updatedConversation = await conversationModel.update(conversation._id, {})
    const summary = await buildConversationSummary({
      ...updatedConversation,
      currentUserId: String(userId)
    })
    const counterpartUserId = String(userId) === conversation.doctorId ? conversation.patientId : conversation.doctorId
    const counterpartSummary = await buildConversationSummary({
      ...updatedConversation,
      currentUserId: counterpartUserId
    })

    const responseData = {
      conversation: summary,
      message: {
        ...createdMessage,
        _id: String(createdMessage._id)
      }
    }

    chatSocket.emitMessageCreated({
      message: responseData.message,
      conversationPayloads: [
        { userId: String(userId), conversation: summary },
        { userId: counterpartUserId, conversation: counterpartSummary }
      ]
    })

    return responseData
  },

  clearMessages: async (userId, conversationId) => {
    await ensureExistingActiveUser(userId)
    const conversation = await ensureConversationParticipant(userId, conversationId)

    await messageModel.deleteManyByConversationId(conversation._id)

    const updatedConversation = await conversationModel.update(conversation._id, {})
    const summary = await buildConversationSummary({
      ...updatedConversation,
      currentUserId: String(userId)
    })
    const counterpartUserId = String(userId) === conversation.doctorId ? conversation.patientId : conversation.doctorId
    const counterpartSummary = await buildConversationSummary({
      ...updatedConversation,
      currentUserId: counterpartUserId
    })

    chatSocket.emitMessagesCleared({
      conversationPayloads: [
        { userId: String(userId), conversation: summary },
        { userId: counterpartUserId, conversation: counterpartSummary }
      ]
    })

    return summary
  },

  deleteMessage: async (userId, conversationId, messageId) => {
    const currentUser = await ensureExistingActiveUser(userId)
    const conversation = await ensureConversationParticipant(userId, conversationId)
    const message = await messageModel.findOneById(messageId)

    if (!message || String(message.conversationId) !== String(conversation._id)) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Khong tim thay tin nhan')
    }

    if (message.sender !== currentUser.role) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Ban chi co the xoa tin nhan cua chinh minh')
    }

    await messageModel.softDeleteById(message._id)

    const summary = await buildConversationSummary({
      ...conversation,
      currentUserId: String(userId)
    })
    const counterpartUserId = String(userId) === conversation.doctorId ? conversation.patientId : conversation.doctorId
    const counterpartSummary = await buildConversationSummary({
      ...conversation,
      currentUserId: counterpartUserId
    })

    const responseData = {
      conversation: summary,
      messageId: String(message._id)
    }

    chatSocket.emitMessageDeleted({
      messageId: responseData.messageId,
      conversationPayloads: [
        { userId: String(userId), conversation: summary },
        { userId: counterpartUserId, conversation: counterpartSummary }
      ]
    })

    return responseData
  }
}

export default conversationService

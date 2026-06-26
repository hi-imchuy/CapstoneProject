import { StatusCodes } from 'http-status-codes'

import { aiConversationModel } from '~/models/aiConversationModel'
import { aiMessageModel } from '~/models/aiMessageModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { getPythonServerUrl } from '~/utils/envHelpers'

const MAX_AI_HISTORY_MESSAGES = 20

const DEFAULT_CONVERSATION_TITLE = 'Cuộc trò chuyện mới'

const serializeMessage = (message) => ({
  ...message,
  _id: String(message._id)
})

const buildConversationSummary = async (conversation) => {
  const latestMessage = await aiMessageModel.findLatestByConversationId(conversation._id)

  return {
    _id: String(conversation._id),
    userId: conversation.userId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    latestMessage: latestMessage ? serializeMessage(latestMessage) : null
  }
}

const ensureExistingActiveUser = async (userId) => {
  const existingUser = await userModel.findOneById(userId)
  if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Tài khoản không tồn tại')
  if (!existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Tài khoản chưa được kích hoạt')
  return existingUser
}

const ensureConversationOwner = async (userId, conversationId) => {
  const conversation = await aiConversationModel.findOneByIdAndUserId(conversationId, userId)
  if (!conversation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy cuộc trò chuyện AI')
  }
  return conversation
}

const buildChatHistory = async (conversationId) => {
  const messages = await aiMessageModel.findLatestManyByConversationId(
    conversationId,
    MAX_AI_HISTORY_MESSAGES
  )

  return messages.map((message) => ({
    role: message.role,
    content: message.content
  }))
}

const callPythonChatServer = async (message, mode, history = []) => {
  const pythonServerUrl = getPythonServerUrl()

  let response
  try {
    response = await fetch(`${pythonServerUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode, history })
    })
  } catch (error) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Không kết nối được máy chủ AI')
  }

  if (!response.ok) {
    let errorMessage = 'Máy chủ AI xử lý tin nhắn thất bại'
    try {
      const errorData = await response.json()
      errorMessage = errorData?.detail || errorData?.message || errorMessage
    } catch (error) {
      // Keep the default upstream error message.
    }
    throw new ApiError(StatusCodes.BAD_GATEWAY, errorMessage)
  }

  const responseData = await response.json()
  const answer = String(responseData?.answer || '').trim()
  if (!answer) {
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Máy chủ AI không trả về nội dung hợp lệ')
  }

  return answer
}

const aiConversationService = {
  getConversations: async (userId) => {
    await ensureExistingActiveUser(userId)
    const conversations = await aiConversationModel.findManyByUserId(userId)
    return await Promise.all(conversations.map(buildConversationSummary))
  },

  createConversation: async (userId, reqBody = {}) => {
    await ensureExistingActiveUser(userId)
    const title = reqBody.title?.trim?.() || DEFAULT_CONVERSATION_TITLE
    const conversation = await aiConversationModel.createNew({
      userId: String(userId),
      title
    })
    return await buildConversationSummary(conversation)
  },

  updateConversation: async (userId, conversationId, reqBody) => {
    await ensureExistingActiveUser(userId)
    await ensureConversationOwner(userId, conversationId)

    const updatedConversation = await aiConversationModel.updateByIdAndUserId(
      conversationId,
      userId,
      { title: reqBody.title.trim() },
      { touchUpdatedAt: false }
    )
    return await buildConversationSummary(updatedConversation)
  },

  getMessages: async (userId, conversationId) => {
    await ensureExistingActiveUser(userId)
    await ensureConversationOwner(userId, conversationId)
    const messages = await aiMessageModel.findManyByConversationId(conversationId)
    return messages.map(serializeMessage)
  },

  sendMessage: async (userId, conversationId, reqBody) => {
    const currentUser = await ensureExistingActiveUser(userId)
    const conversation = await ensureConversationOwner(userId, conversationId)
    const content = reqBody.message.trim()
    const history = await buildChatHistory(conversation._id)

    const userMessage = await aiMessageModel.createNew({
      conversationId: String(conversation._id),
      role: aiMessageModel.AI_MESSAGE_ROLES.USER,
      content
    })
    await aiConversationModel.updateByIdAndUserId(conversationId, userId)

    const answer = await callPythonChatServer(content, currentUser.role, history)
    const assistantMessage = await aiMessageModel.createNew({
      conversationId: String(conversation._id),
      role: aiMessageModel.AI_MESSAGE_ROLES.ASSISTANT,
      content: answer
    })
    const updatedConversation = await aiConversationModel.updateByIdAndUserId(
      conversationId,
      userId,
      {},
      { touchUpdatedAt: false }
    )

    return {
      conversation: await buildConversationSummary(updatedConversation),
      messages: [
        serializeMessage(userMessage),
        serializeMessage(assistantMessage)
      ]
    }
  },

  clearMessages: async (userId, conversationId) => {
    await ensureExistingActiveUser(userId)
    await ensureConversationOwner(userId, conversationId)
    await aiMessageModel.deleteManyByConversationId(conversationId)

    const updatedConversation = await aiConversationModel.updateByIdAndUserId(conversationId, userId)
    return await buildConversationSummary(updatedConversation)
  }
}

export default aiConversationService

import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'

let chatIoInstance = null

const parseCookies = (cookieString = '') => {
  return cookieString.split(';').reduce((result, item) => {
    const [rawKey, ...rawValue] = item.trim().split('=')
    if (!rawKey) return result
    result[rawKey] = decodeURIComponent(rawValue.join('='))
    return result
  }, {})
}

const buildUserRoom = (userId) => `user:${String(userId)}`
const buildConversationRoom = (conversationId) => `conversation:${String(conversationId)}`

const getAccessTokenFromHandshake = (socket) => {
  const cookies = parseCookies(socket.handshake?.headers?.cookie)
  if (cookies?.accessToken) return cookies.accessToken

  const authToken = socket.handshake?.auth?.token
  if (authToken) return authToken

  const authorizationHeader = socket.handshake?.headers?.authorization
  if (authorizationHeader?.startsWith('Bearer ')) {
    return authorizationHeader.replace('Bearer ', '')
  }

  return null
}

const initializeChatSocket = (io) => {
  chatIoInstance = io

  io.use(async (socket, next) => {
    try {
      const accessToken = getAccessTokenFromHandshake(socket)
      if (!accessToken) {
        return next(new Error('Unauthorized'))
      }

      const accessTokenDecoded = await JwtProvider.verifyToken(accessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
      socket.user = accessTokenDecoded
      next()
    } catch (error) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(buildUserRoom(socket.user._id))

    socket.on('conversation:join', (conversationId) => {
      if (!conversationId) return
      socket.join(buildConversationRoom(conversationId))
    })

    socket.on('conversation:leave', (conversationId) => {
      if (!conversationId) return
      socket.leave(buildConversationRoom(conversationId))
    })
  })
}

const emitConversationCreated = (conversationPayloads = []) => {
  if (!chatIoInstance) return

  conversationPayloads.forEach(({ userId, conversation }) => {
    chatIoInstance.to(buildUserRoom(userId)).emit('conversation:created', conversation)
  })
}

const emitMessageCreated = ({ conversationPayloads = [], message }) => {
  if (!chatIoInstance) return

  conversationPayloads.forEach(({ userId, conversation }) => {
    chatIoInstance.to(buildUserRoom(userId)).emit('conversation:message-created', {
      conversation,
      message
    })
  })
}

const emitMessagesCleared = ({ conversationPayloads = [] }) => {
  if (!chatIoInstance) return

  conversationPayloads.forEach(({ userId, conversation }) => {
    chatIoInstance.to(buildUserRoom(userId)).emit('conversation:messages-cleared', conversation)
  })
}

const emitMessageDeleted = ({ conversationPayloads = [], messageId }) => {
  if (!chatIoInstance) return

  conversationPayloads.forEach(({ userId, conversation }) => {
    chatIoInstance.to(buildUserRoom(userId)).emit('conversation:message-deleted', {
      conversation,
      messageId
    })
  })
}

export const chatSocket = {
  initializeChatSocket,
  emitConversationCreated,
  emitMessageCreated,
  emitMessagesCleared,
  emitMessageDeleted,
  buildUserRoom,
  buildConversationRoom
}

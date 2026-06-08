import { StatusCodes } from 'http-status-codes'

import aiConversationService from '~/services/aiConversationService'

const aiConversationController = {
  getConversations: async (req, res, next) => {
    try {
      const result = await aiConversationService.getConversations(req.jwtDecoded._id)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  createConversation: async (req, res, next) => {
    try {
      const result = await aiConversationService.createConversation(req.jwtDecoded._id, req.body)
      res.status(StatusCodes.CREATED).json(result)
    } catch (error) {
      next(error)
    }
  },

  updateConversation: async (req, res, next) => {
    try {
      const result = await aiConversationService.updateConversation(
        req.jwtDecoded._id,
        req.params.conversationId,
        req.body
      )
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  getMessages: async (req, res, next) => {
    try {
      const result = await aiConversationService.getMessages(
        req.jwtDecoded._id,
        req.params.conversationId
      )
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  sendMessage: async (req, res, next) => {
    try {
      const result = await aiConversationService.sendMessage(
        req.jwtDecoded._id,
        req.params.conversationId,
        req.body
      )
      res.status(StatusCodes.CREATED).json(result)
    } catch (error) {
      next(error)
    }
  },

  clearMessages: async (req, res, next) => {
    try {
      const result = await aiConversationService.clearMessages(
        req.jwtDecoded._id,
        req.params.conversationId
      )
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default aiConversationController

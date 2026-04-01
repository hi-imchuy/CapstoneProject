import { StatusCodes } from 'http-status-codes'

import conversationService from '~/services/conversationService'

const conversationController = {
  getContacts: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await conversationService.getContacts(userId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  getConversations: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await conversationService.getConversations(userId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  createOrGetConversation: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await conversationService.createOrGetConversation(userId, req.body)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  getMessages: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await conversationService.getMessages(userId, req.params.conversationId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  sendMessage: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await conversationService.sendMessage(userId, req.params.conversationId, req.body, req.file)
      res.status(StatusCodes.CREATED).json(result)
    } catch (error) {
      next(error)
    }
  },

  clearMessages: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await conversationService.clearMessages(userId, req.params.conversationId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default conversationController

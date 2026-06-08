import { StatusCodes } from 'http-status-codes'

import skinDetectionService from '~/services/skinDetectionService'

const skinDetectionController = {
  createNew: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await skinDetectionService.createNew(userId, req.file)
      res.status(StatusCodes.CREATED).json(result)
    } catch (error) {
      next(error)
    }
  },

  getHistory: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await skinDetectionService.getHistory(userId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  },

  deleteHistoryItem: async (req, res, next) => {
    try {
      const userId = req.jwtDecoded._id
      const result = await skinDetectionService.deleteHistoryItem(userId, req.params.detectionId)
      res.status(StatusCodes.OK).json(result)
    } catch (error) {
      next(error)
    }
  }
}

export default skinDetectionController

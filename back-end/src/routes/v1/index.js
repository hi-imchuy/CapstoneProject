import express from 'express'
import { StatusCodes } from 'http-status-codes'
import userRoute from './userRoute'
import conversationRoute from './conversationRoute'

const Router = express.Router()

// Check APIs v1/status
Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use!' })
})

// User routes
Router.use('/users', userRoute)
Router.use('/conversations', conversationRoute)

export const APIs_V1 = Router

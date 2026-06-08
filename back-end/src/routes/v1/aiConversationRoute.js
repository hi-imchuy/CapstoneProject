import express from 'express'

import aiConversationController from '~/controllers/aiConversationController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import aiConversationValidation from '~/validations/aiConversationValidation'

const Router = express.Router()

Router.use(authMiddleware.isAuthorized)

Router.get('/', aiConversationController.getConversations)
Router.post('/', aiConversationValidation.createConversation, aiConversationController.createConversation)
Router.patch(
  '/:conversationId',
  aiConversationValidation.updateConversation,
  aiConversationController.updateConversation
)
Router.get('/:conversationId/messages', aiConversationController.getMessages)
Router.post(
  '/:conversationId/messages',
  aiConversationValidation.sendMessage,
  aiConversationController.sendMessage
)
Router.delete('/:conversationId/messages', aiConversationController.clearMessages)

export default Router

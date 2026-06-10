import express from 'express'

import conversationController from '~/controllers/conversationController'
import conversationValidation from '~/validations/conversationValidation'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUpdloadMiddleware } from '~/middlewares/multerUploadMiddleware'

const Router = express.Router()

Router.use(authMiddleware.isAuthorized)

Router.get('/contacts', conversationController.getContacts)
Router.get('/', conversationController.getConversations)
Router.post('/', conversationValidation.createConversation, conversationController.createOrGetConversation)
Router.get('/:conversationId/messages', conversationController.getMessages)
Router.post(
  '/:conversationId/messages',
  multerUpdloadMiddleware.upload.single('image'),
  conversationValidation.sendMessage,
  conversationController.sendMessage
)
Router.delete('/:conversationId/messages', conversationController.clearMessages)
Router.delete('/:conversationId/messages/:messageId', conversationController.deleteMessage)

export default Router

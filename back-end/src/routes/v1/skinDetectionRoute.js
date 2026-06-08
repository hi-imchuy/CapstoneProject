import express from 'express'

import skinDetectionController from '~/controllers/skinDetectionController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUpdloadMiddleware } from '~/middlewares/multerUploadMiddleware'

const Router = express.Router()

Router.use(authMiddleware.isAuthorized)

Router.get('/', skinDetectionController.getHistory)
Router.post('/', multerUpdloadMiddleware.upload.single('image'), skinDetectionController.createNew)
Router.delete('/:detectionId', skinDetectionController.deleteHistoryItem)

export default Router

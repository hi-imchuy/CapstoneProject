import express from 'express'
import cors from 'cors'
import exitHook from 'async-exit-hook'
import socketIo from 'socket.io'
import http from 'http'
import cookieParser from 'cookie-parser'

import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment.js'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import { chatSocket } from './sockets/chatSocket'

const START_SERVER = async () => {
  const app = express()

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.use(cookieParser())
  app.use(cors(corsOptions))
  app.use(express.json())

  app.use('/v1', APIs_V1)
  app.use(errorHandlingMiddleware)

  const server = http.createServer(app)
  const io = socketIo(server, { cors: corsOptions })
  chatSocket.initializeChatSocket(io)

  if (env.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
      console.log(`3. Production: Hello ${env.AUTHOR}, BE is successfully running at Port :${process.env.PORT}/`)
    })
  } else {
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      console.log(`3. Hello ${env.AUTHOR}, BE is successfully running at ${env.APP_HOST}:${env.APP_PORT}/`)
    })
  }

  exitHook(() => {
    CLOSE_DB().then(() => {
      console.log('4. MongoDB connection closed.')
    })
  })
}

(async () => {
  try {
    console.log('1. Connecting to MongoDB...')
    await CONNECT_DB()
    console.log('2. MongoDB connection successful!')

    START_SERVER()
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(0)
  }
})()

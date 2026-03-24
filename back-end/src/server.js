import express from 'express'
import cors from 'cors'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment.js'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'
//Xử lý socket real-time với socket.io
import socketIo from 'socket.io'
import http from 'http'
// import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'

const START_SERVER = async () => {
  const app = express()

  //Fix Cache form disk cuar ExpressJs
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  //Cấu hình cookieParser
  app.use(cookieParser())

  //Xu ly CORS
  app.use(cors(corsOptions))

  // enable req.body json data
  app.use(express.json())

  //use API v1
  app.use('/v1', APIs_V1)

  //Middleware xử lý lỗi tập trung
  app.use(errorHandlingMiddleware)

  //Tạo 1 server mới bọc app của express để làm realtime với socket.io
  const server = http.createServer(app)
  //Khởi tạo biến io với server và cors
  const io = socketIo(server, { cors: corsOptions })
  io.on('connection', (socket) => {
    //Gọi các socket tùy theo tính năng ở đây
    // inviteUserToBoardSocket(socket)
    // ...vv
  })

  if (env.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
      console.log(`3. Production: Hello ${env.AUTHOR}, BE is successfully running at Port :${ process.env.PORT }/`)
    })
  } else {
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      console.log(`3. Hello ${env.AUTHOR}, BE is successfully running at ${ env.APP_HOST }:${ env.APP_PORT }/`)
    })
  }

  //Cleanup khi server dừng
  exitHook(() => {
    CLOSE_DB().then(() => {
      console.log('4. MongoDB connection closed.')
    })
  })
}

//Chỉ khi kết nối thành công đến DB thì mới khởi động server
// IIFE - Immediately Invoked Function Expression
(async () => {
  try {
    console.log('1. Connecting to MongoDB...')
    await CONNECT_DB()
    console.log('2. MongoDB connection successful!')

    // Tạo collections

    // Khởi động server sau khi kết nối DB thành công
    START_SERVER()
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(0)
  }
})()

import { env } from './environment.js'
import { MongoClient, ServerApiVersion } from 'mongodb'

// Khởi tạo kết nối MongoDB và xuất các biến cần thiết
let trelloDatabaseInstance = null

// Kết nối đến MongoDB Client
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

// Hàm kết nối đến cơ sở dữ liệu
export const CONNECT_DB = async () => {
  // Kết nối đến MongoDB Atlas
  await mongoClientInstance.connect()

  //Kết nối thành công đến database
  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}

//GET_DB này có nhiệm vụ export ra biến database đã kết nối
export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('Database not connected. Please call CONNECT_DB first.')
  return trelloDatabaseInstance
}

export const CLOSE_DB = async () => {
  if (mongoClientInstance) {
    await mongoClientInstance.close()
  }
}
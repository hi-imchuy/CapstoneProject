import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { env } from '~/config/environment'

//Cấu hình cloudinary
const cloudinaryV2 = cloudinary.v2
cloudinaryV2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
})

//Khởi tạo function để upload file lên Cloudinanry
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    //Tạo luồng stream để upload lên cloudinary
    const stream = cloudinaryV2.uploader.upload_stream(
      { folder: folderName },
      (err, result) => {
        if (err) reject(err)
        else resolve(result)
      }
    )
    //upload luồng trên bằng lib streamifier
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

export const CloudinaryProvider = {
  streamUpload
}
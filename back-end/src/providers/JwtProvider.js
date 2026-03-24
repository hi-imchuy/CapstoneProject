//https://www.npmjs.com/package/jsonwebtoken
import JWT from 'jsonwebtoken'

// Function tạo mới 1 token - cần 3 tham số đầu vào
// userInfo: Những thông tin muốn đính kèm vào token
// secretSignature: Chữ ký bí mật (dạng 1 chuỗi string ngẫu nhiên) trên docs thì để tên là privateKey tùy ý
// tokenLife: Thời gian sống của token
const generateToken = async (userInfo, secretSignature, tokenLife) => {
  try {
    //Hàm sign của JWT có thuật toán mặc định là HS256
    return JWT.sign(userInfo, secretSignature, { algorithm: 'HS256', expiresIn: tokenLife })
  } catch (error) {
    throw new Error(error)
  }
}

// Function kiểm tra một token có hợp lệ hay không
// Hợp lệ ở đây được hiểu đơn giản là token được tạo ra có đúng với secretSignature trong dự án không
const verifyToken = async (token, secretSignature) => {
  try {
    // Hàm verify của thư viện Jwt
    return JWT.verify(token, secretSignature)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken
}
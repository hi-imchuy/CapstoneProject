/**
 * TrungQuanDev: https://youtube.com/@trungquandev
 */

// Một vài biểu thức chính quy - Regular Expression và custom message.
// Về Regular Expression khá hại não: https://viblo.asia/p/hoc-regular-expression-va-cuoc-doi-ban-se-bot-kho-updated-v22-Az45bnoO5xY
export const FIELD_REQUIRED_MESSAGE = 'Vui lòng nhập thông tin này.'
export const EMAIL_RULE = /^\S+@\S+\.\S+$/
export const EMAIL_RULE_MESSAGE = 'Email không hợp lệ. (example@chauhuyne.com)'
export const PASSWORD_RULE = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d\W]{8,256}$/
export const PASSWORD_RULE_MESSAGE = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số.'
export const PASSWORD_CONFIRMATION_MESSAGE = 'Mật khẩu xác nhận không khớp!'


// Liên quan đến Validate File
export const LIMIT_COMMON_FILE_SIZE = 10485760 // byte = 10 MB
export const ALLOW_COMMON_FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png']
export const singleFileValidator = (file) => {
  if (!file || !file.name || !file.size || !file.type) {
    return 'Vui lòng chọn tệp.'
  }
  if (file.size > LIMIT_COMMON_FILE_SIZE) {
    return 'Dung lượng tệp vượt quá giới hạn. (10MB)'
  }
  if (!ALLOW_COMMON_FILE_TYPES.includes(file.type)) {
    return 'Định dạng tệp không hợp lệ. Chỉ chấp nhận jpg, jpeg và png.'
  }
  return null
}

//Brevo là tên thương hiệu mới của sib - sendinblue
//vì vậy trong phàn hướng dẫn trên github có thể nó vẫn giữ tên biến SibApiV3Sdk
//https://github.com/getbrevo/brevo-node
const SibApiV3Sdk = require('@getbrevo/brevo')
import { env } from '~/config/environment'

//Cấu hình Brevo
let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
  //Khởi tạo sendSmtpEmail với những thông tin cần thiết
  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

  //Tài khoản gửi mail (Là tài khoản admin email đã tạo tài khoản trên Brevo)
  sendSmtpEmail.sender = { email: env.ADMIN_EMAIL_ADDRESS, name: env.ADMIN_EMAIL_NAME }

  //Những tài khoản nhận mail
  //'to' phải là 1 Array để sau chúng ta còn có thể tùy biến gửi 1 email tới nhiều user tùy tính năng dự án
  sendSmtpEmail.to = [{ email: recipientEmail }]

  //email title
  sendSmtpEmail.subject = customSubject

  //email content
  sendSmtpEmail.htmlContent = htmlContent

  //Gọi hành động gửi mail
  //sendTransacEmail sẽ return 1 promise
  return apiInstance.sendTransacEmail(sendSmtpEmail)
}

export const BrevoProvider = {
  sendEmail
}
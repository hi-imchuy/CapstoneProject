import { env } from '~/config/environment'

const sendEmail = async (recipientEmail, customSubject, htmlContent) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { email: env.ADMIN_EMAIL_ADDRESS, name: env.ADMIN_EMAIL_NAME },
      to: [{ email: recipientEmail }],
      subject: customSubject,
      htmlContent
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Brevo send email failed: ${errorText}`)
  }

  return await response.json()
}

export const BrevoProvider = {
  sendEmail
}

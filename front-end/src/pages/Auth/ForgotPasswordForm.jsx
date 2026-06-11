import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CardActions from '@mui/material/CardActions'
import LockResetIcon from '@mui/icons-material/LockReset'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Zoom from '@mui/material/Zoom'
import { Card as MuiCard } from '@mui/material'
import { toast } from 'react-toastify'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  FIELD_REQUIRED_MESSAGE,
  PASSWORD_CONFIRMATION_MESSAGE,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE
} from '~/utils/validators'
import {
  requestPasswordResetAPI,
  resetPasswordAPI,
  verifyPasswordResetOtpAPI
} from '~/apis'

const RESEND_COOLDOWN_SECONDS = 60
const STEPS = ['Email', 'Mã OTP', 'Mật khẩu mới']

function ForgotPasswordForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [verifiedOtp, setVerifiedOtp] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors }
  } = useForm()

  useEffect(() => {
    if (resendSeconds <= 0) return

    const timer = setInterval(() => {
      setResendSeconds(current => Math.max(0, current - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [resendSeconds])

  const authCardSx = {
    minWidth: 380,
    maxWidth: 420,
    marginTop: '6em',
    bgcolor: '#ffffff',
    color: '#2C3E50',
    border: '1px solid #dfe6e9',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)'
  }

  const authTextFieldSx = {
    '& .MuiInputLabel-root': { color: '#5c6b7a' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#2C3E50' },
    '& .MuiOutlinedInput-root': {
      color: '#2C3E50',
      bgcolor: '#ffffff',
      '& fieldset': { borderColor: '#b2bec3' },
      '&:hover fieldset': { borderColor: '#2C3E50' },
      '&.Mui-focused fieldset': { borderColor: '#2C3E50' }
    }
  }

  const sendOtp = async (targetEmail) => {
    await toast.promise(
      requestPasswordResetAPI({ email: targetEmail }),
      { pending: 'Đang gửi mã OTP...' }
    )
    toast.success('Mã OTP đã được gửi đến email của bạn.')
    setResendSeconds(RESEND_COOLDOWN_SECONDS)
  }

  const submitEmail = async (data) => {
    try {
      await sendOtp(data.email)
      setEmail(data.email)
      reset({ otp: '' })
      setStep(1)
    } catch {
      // Error toast is handled by the shared Axios interceptor.
    }
  }

  const submitOtp = async (data) => {
    try {
      await toast.promise(
        verifyPasswordResetOtpAPI({ email, otp: data.otp }),
        { pending: 'Đang kiểm tra mã OTP...' }
      )
      setVerifiedOtp(data.otp)
      reset({ newPassword: '', passwordConfirmation: '' })
      setStep(2)
    } catch {
      // Error toast is handled by the shared Axios interceptor.
    }
  }

  const submitNewPassword = async (data) => {
    try {
      await toast.promise(
        resetPasswordAPI({
          email,
          otp: verifiedOtp,
          newPassword: data.newPassword
        }),
        { pending: 'Đang cập nhật mật khẩu...' }
      )
      toast.success('Đặt lại mật khẩu thành công.')
      navigate('/login?passwordReset=true')
    } catch {
      // Error toast is handled by the shared Axios interceptor.
    }
  }

  const resendOtp = async () => {
    if (resendSeconds > 0) return
    try {
      await sendOtp(email)
      reset({ otp: '' })
    } catch {
      // Error toast is handled by the shared Axios interceptor.
    }
  }

  const submitHandlers = [submitEmail, submitOtp, submitNewPassword]

  return (
    <form onSubmit={handleSubmit(submitHandlers[step])}>
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <MuiCard sx={authCardSx}>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Avatar sx={{ bgcolor: '#2C3E50', color: '#ffffff' }}>
              <LockResetIcon />
            </Avatar>
          </Box>

          <Typography variant='h6' align='center' sx={{ mt: 1 }}>
            Quên mật khẩu
          </Typography>

          <Stepper activeStep={step} alternativeLabel sx={{ px: 2, pt: 2 }}>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ px: 2, pt: 2 }}>
            {step === 0 && (
              <>
                <Alert severity='info' sx={{ mb: 2 }}>
                  Nhập email đã đăng ký để nhận mã OTP gồm 6 chữ số.
                </Alert>
                <TextField
                  autoFocus
                  fullWidth
                  sx={authTextFieldSx}
                  label='Email'
                  error={!!errors.email}
                  {...register('email', {
                    required: FIELD_REQUIRED_MESSAGE,
                    pattern: {
                      value: EMAIL_RULE,
                      message: EMAIL_RULE_MESSAGE
                    }
                  })}
                />
                <FieldErrorAlert errors={errors} fieldName='email' />
              </>
            )}

            {step === 1 && (
              <>
                <Alert severity='success' sx={{ mb: 2 }}>
                  Mã OTP đã được gửi đến <strong>{email}</strong> và có hiệu lực trong 10 phút.
                </Alert>
                <TextField
                  autoFocus
                  fullWidth
                  sx={authTextFieldSx}
                  label='Mã OTP'
                  inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                  error={!!errors.otp}
                  {...register('otp', {
                    required: FIELD_REQUIRED_MESSAGE,
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Mã OTP phải gồm đúng 6 chữ số.'
                    }
                  })}
                />
                <FieldErrorAlert errors={errors} fieldName='otp' />
                <Button
                  type='button'
                  onClick={resendOtp}
                  disabled={resendSeconds > 0}
                  sx={{ mt: 1 }}
                >
                  {resendSeconds > 0
                    ? `Gửi lại sau ${resendSeconds} giây`
                    : 'Gửi lại mã OTP'}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <TextField
                  autoFocus
                  fullWidth
                  sx={authTextFieldSx}
                  label='Mật khẩu mới'
                  type='password'
                  error={!!errors.newPassword}
                  {...register('newPassword', {
                    required: FIELD_REQUIRED_MESSAGE,
                    pattern: {
                      value: PASSWORD_RULE,
                      message: PASSWORD_RULE_MESSAGE
                    }
                  })}
                />
                <FieldErrorAlert errors={errors} fieldName='newPassword' />

                <TextField
                  fullWidth
                  sx={{ ...authTextFieldSx, mt: 2 }}
                  label='Nhập lại mật khẩu mới'
                  type='password'
                  error={!!errors.passwordConfirmation}
                  {...register('passwordConfirmation', {
                    required: FIELD_REQUIRED_MESSAGE,
                    validate: value =>
                      value === getValues('newPassword') ||
                      PASSWORD_CONFIRMATION_MESSAGE
                  })}
                />
                <FieldErrorAlert errors={errors} fieldName='passwordConfirmation' />
              </>
            )}
          </Box>

          <CardActions sx={{ px: 2, py: 2 }}>
            <Button
              className='interceptor-loading'
              type='submit'
              variant='contained'
              size='large'
              fullWidth
              sx={{
                bgcolor: '#2C3E50',
                color: '#ffffff',
                '&:hover': { bgcolor: '#1f2b3c' }
              }}
            >
              {step === 0 && 'Gửi mã OTP'}
              {step === 1 && 'Xác nhận mã OTP'}
              {step === 2 && 'Đặt lại mật khẩu'}
            </Button>
          </CardActions>

          <Box sx={{ pb: 2, textAlign: 'center' }}>
            <Link to='/login' style={{ textDecoration: 'none' }}>
              <Typography sx={{
                color: '#2C3E50',
                '&:hover': { color: '#ffbb39' }
              }}>
                Quay lại đăng nhập
              </Typography>
            </Link>
          </Box>
        </MuiCard>
      </Zoom>
    </form>
  )
}

export default ForgotPasswordForm

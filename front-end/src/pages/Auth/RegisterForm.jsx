// TrungQuanDev: https://youtube.com/@trungquandev
import { Link, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import LockIcon from '@mui/icons-material/Lock'
import Typography from '@mui/material/Typography'
import { Card as MuiCard } from '@mui/material'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import Zoom from '@mui/material/Zoom'
import { useForm, Controller } from 'react-hook-form'
import {
  EMAIL_RULE,
  PASSWORD_RULE,
  FIELD_REQUIRED_MESSAGE,
  PASSWORD_RULE_MESSAGE,
  EMAIL_RULE_MESSAGE
} from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { registerUserAPI } from '~/apis'
import { toast } from 'react-toastify'
import { USER_ROLE } from '~/utils/constant'

function RegisterForm() {
  const authCardSx = {
    minWidth: 380,
    maxWidth: 380,
    marginTop: '6em',
    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#f5f6fa' : '#ffffff',
    color: '#2C3E50',
    border: '1px solid #dfe6e9',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.25)'
  }
  const authTextFieldSx = {
    '& .MuiInputLabel-root': {
      color: '#5c6b7a'
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#2C3E50'
    },
    '& .MuiOutlinedInput-root': {
      color: '#2C3E50',
      bgcolor: '#ffffff',
      '& fieldset': {
        borderColor: '#b2bec3'
      },
      '&:hover fieldset': {
        borderColor: '#2C3E50'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2C3E50'
      }
    }
  }
  const { control, register, handleSubmit, formState: { errors }, watch } = useForm()
  const navigate = useNavigate()

  const submitRegister = (data) => {
    const { email, password, role } = data
    toast.promise(registerUserAPI({ email, password, role }),
      { pending: 'Đang đăng ký tài khoản...' }
    ).then(user => {
      navigate(`/login?registeredEmail=${user.email}`)
    })
  }
  return (
    <form onSubmit={handleSubmit(submitRegister)}>
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <MuiCard sx={authCardSx}>
          <Box sx={{
            margin: '1em',
            display: 'flex',
            justifyContent: 'center',
            gap: 1
          }}>
            <Avatar sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#dbeafe' : '#2C3E50',
              color: (theme) => theme.palette.mode === 'dark' ? '#1e3a8a' : '#ffffff'
            }}><LockIcon /></Avatar>
          </Box>
          <Box sx={{ marginTop: '1em', display: 'flex', justifyContent: 'center', color: '#5c6b7a' }}>
            Author: chauhuyne
          </Box>
          <Box sx={{ padding: '0 1em 1em 1em' }}>
            <Box sx={{ marginTop: '1em' }}>
              <TextField
                // autoComplete="nope"
                autoFocus
                fullWidth
                sx={authTextFieldSx}
                label="Nhập email..."
                type="text"
                variant="outlined"
                error={!!errors['email']}
                {...register('email', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: {
                    value: EMAIL_RULE,
                    message: EMAIL_RULE_MESSAGE
                  }
                })}
              />
              <FieldErrorAlert errors={errors} fieldName={'email'} />
            </Box>

            <Controller
              name="role"
              defaultValue={USER_ROLE.DOCTOR}
              control={control}
              render={({ field }) => (
                <RadioGroup
                  {...field}
                  row
                  sx={{ color: '#2C3E50' }}
                  onChange={(event, value) => field.onChange(value)}
                  value={field.value}
                >
                  <FormControlLabel
                    value={USER_ROLE.DOCTOR}
                    control={<Radio size="small" sx={{
                      color: '#2C3E50',
                      '&.Mui-checked': {
                        color: '#2C3E50'
                      }
                    }} />}
                    label="Bác sĩ"
                    labelPlacement="start"
                  />
                  <FormControlLabel
                    value={USER_ROLE.PATIENT}
                    control={<Radio size="small" sx={{
                      color: '#2C3E50',
                      '&.Mui-checked': {
                        color: '#2C3E50'
                      }
                    }} />}
                    label="Bệnh nhân"
                    labelPlacement="start"
                  />
                </RadioGroup>
                  )}
                />

            <Box sx={{ marginTop: '1em' }}>
              <TextField
                fullWidth
                sx={authTextFieldSx}
                label="Nhập mật khẩu..."
                type="password"
                variant="outlined"
                error={!!errors['password']}
                {...register('password', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: {
                    value: PASSWORD_RULE,
                    message: PASSWORD_RULE_MESSAGE
                  }
                })}
              />
              <FieldErrorAlert errors={errors} fieldName={'password'} />

            </Box>
            <Box sx={{ marginTop: '1em' }}>
              <TextField
                fullWidth
                sx={authTextFieldSx}
                label="Nhập lại mật khẩu..."
                type="password"
                variant="outlined"
                error={!!errors['password_confirmation']}
                {...register('password_confirmation', {
                  validate: (value) => {
                    if (value === watch('password')) return true
                    return 'Mật khẩu xác nhận không khớp!'
                  }
                })}
              />
              <FieldErrorAlert errors={errors} fieldName={'password_confirmation'} />
            </Box>
          </Box>
          <CardActions sx={{ padding: '0 1em 1em 1em' }}>
            <Button
              className="interceptor-loading"
              type="submit"
              variant="contained"
              sx={{
                bgcolor: '#2C3E50',
                color: '#ffffff',
                '&:hover': { bgcolor: '#1f2b3c' }
              }}
              size="large"
              fullWidth
            >
              Đăng ký
            </Button>
          </CardActions>
          <Box sx={{ padding: '0 1em 1em 1em', textAlign: 'center' }}>
            <Typography sx={{ color: '#2C3E50' }}>Bạn đã có tài khoản?</Typography>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography sx={{
                color: '#2C3E50',
                '&:hover': { color: '#ffbb39' }
              }}>Đăng nhập!</Typography>
            </Link>
          </Box>
        </MuiCard>
      </Zoom>
    </form>
  )
}

export default RegisterForm

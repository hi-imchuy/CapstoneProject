// TrungQuanDev: https://youtube.com/@trungquandev
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import LockIcon from '@mui/icons-material/Lock'
import Typography from '@mui/material/Typography'
import { Card as MuiCard } from '@mui/material'
// import { ReactComponent as TrelloIcon } from '~/assets/trello.svg'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import Zoom from '@mui/material/Zoom'
import Alert from '@mui/material/Alert'
import { useForm } from 'react-hook-form'
import {
  EMAIL_RULE,
  PASSWORD_RULE,
  FIELD_REQUIRED_MESSAGE,
  PASSWORD_RULE_MESSAGE,
  EMAIL_RULE_MESSAGE
} from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { loginUserAPI } from '~/redux/user/userSlice'

function LoginForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
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

  const { register, handleSubmit, formState: { errors } } = useForm()
  let [searchParams] = useSearchParams()
  const registeredEmail = searchParams.get('registeredEmail')
  const passwordReset = searchParams.get('passwordReset')

  const submitLogIn = (data) => {
    const { email, password } = data
    toast.promise(
      dispatch(loginUserAPI({ email, password })),
      { pending: 'Đang đăng nhập...' }
    ).then(res => {
      console.log(res)
      //Đoạn này kiểm tra đăng nhập không có lỗi mới redirect về route '/'
      if (!res.error) navigate('/')
    })
  }

  return (
    <form onSubmit={handleSubmit(submitLogIn)}>
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
          <Box sx={{ marginTop: '1em', display: 'flex', justifyContent: 'center', flexDirection: 'column', padding: '0 1em' }}>
            {passwordReset === 'true' &&
            <Alert severity="success" sx={{ '.MuiAlert-message': { overflow: 'hidden' } }}>
              Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
            </Alert>}
            {registeredEmail &&
            <Alert severity="info" sx={{ '.MuiAlert-message': { overflow: 'hidden' } }}>
              Tài khoản&nbsp;
              <Typography component="span" sx={{ fontWeight: 'bold', '&:hover': { color: '#fdba26' } }}>{registeredEmail}</Typography>
              &nbsp;đã được tạo thành công. Bạn có thể đăng nhập ngay.
            </Alert>}
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
              Đăng nhập
            </Button>
          </CardActions>
          <Box sx={{ padding: '0 1em 1em 1em', textAlign: 'center' }}>
            <Typography sx={{ color: '#2C3E50' }}>Bạn chưa có tài khoản?</Typography>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography sx={{
                color: '#2C3E50',
                '&:hover': { color: '#ffbb39' }
              }}>Tạo tài khoản!</Typography>
            </Link>
            <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
              <Typography sx={{
                mt: 1,
                color: '#2C3E50',
                '&:hover': { color: '#ffbb39' }
              }}>Quên mật khẩu?</Typography>
            </Link>
          </Box>
        </MuiCard>
      </Zoom>
    </form>
  )
}

export default LoginForm

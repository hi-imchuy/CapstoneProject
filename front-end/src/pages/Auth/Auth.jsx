// TrungQuanDev: https://youtube.com/@trungquandev
import { Navigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
import authBackground from '~/assets/auth/login-register-bg.jpg'

function Auth({ mode }) {
  const location = useLocation()
  const currentUser = useSelector(selectCurrentUser)
  if (currentUser) {
    return <Navigate to='/settings/account' replace={true}/>
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundImage: `url(${authBackground})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      boxShadow: 'inset 0 0 0 2000px rgba(0, 0, 0, 0.2)'
    }}>
      {mode === 'login' && <LoginForm key={`login-${location.search}`} />}
      {mode === 'register' && <RegisterForm key='register' />}
    </Box>
  )
}

export default Auth

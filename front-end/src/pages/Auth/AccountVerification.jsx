import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import { verifyUserAPI } from '~/apis'

function AccountVerification() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')?.trim()
  const token = searchParams.get('token')?.trim()
  const [status, setStatus] = useState('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!email || !token) return

    let isMounted = true

    verifyUserAPI({ email, token })
      .then(() => {
        if (isMounted) setStatus('verified')
      })
      .catch((error) => {
        if (!isMounted) return

        setErrorMessage(
          error.response?.data?.message ||
          'Không thể xác thực tài khoản. Vui lòng thử lại hoặc yêu cầu một email xác thực mới.'
        )
        setStatus('error')
      })

    return () => {
      isMounted = false
    }
  }, [email, token])

  if (!email || !token) {
    return <Navigate to='/404' replace />
  }

  if (status === 'verifying') {
    return <PageLoadingSpinner caption='Đang xác thực tài khoản' />
  }

  if (status === 'error') {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2
      }}>
        <Box sx={{ width: '100%', maxWidth: 560 }}>
          <Alert severity='error' sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
          <Button component={Link} to='/login' variant='contained' fullWidth>
            Quay lại đăng nhập
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Navigate
      to={`/login?verifiedEmail=${encodeURIComponent(email)}`}
      replace
    />
  )
}

export default AccountVerification

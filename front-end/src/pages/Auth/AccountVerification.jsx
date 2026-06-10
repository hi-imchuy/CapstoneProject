import { useState, useEffect } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import PageLoadingSpinner from '~/components/Loading/PageLoadingSpinner'
import { verifyUserAPI } from '~/apis'

function AccountVerification() {
  //Lay gia tri email va token tu url
  let [searchParams] = useSearchParams()
  const { email, token } = Object.fromEntries([...searchParams])

  //Tạo 1 biến state để biết được đã verify tài khoản thành công hay chưa
  const [verified, setVerified] = useState(false)

  //Goi API de verify tai khoan
  useEffect(() => {
    if (email && token)
      verifyUserAPI({ email, token }).then(() => setVerified(true))
  }, [email, token])

  //Nếu url có vấn đề, không tồn tại 1 trong 2 giá trị email hoặc token thì đá ra trang 404
  if (!email || !token) {
    return <Navigate to='/404'/>
  }

  //Nếu chưa verify xong thì hiện loading
  if (!verified) {
    return (
      <PageLoadingSpinner caption="Đang xác thực tài khoản" />
    )
  }

  //Nếu thành công và không gặp vấn đề gì thì điều hướng về loading cùng giá trị verified email

  return (
    <Navigate to={`/login?verifiedEmail=${email}`} />
  )
}

export default AccountVerification

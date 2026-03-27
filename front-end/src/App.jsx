import { Routes, Route, Navigate, Outlet } from 'react-router-dom'

import NotFound from './pages/404/NotFound'
import Auth from '~/pages/Auth/Auth'
import AccountVerification from './pages/Auth/AccountVerification'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
import Settings from '~/pages/Settings/Settings'
import Main from './pages/Users/main'

const ProtectedRoute = ({ user }) => {
  if (!user) return <Navigate to='/login' replace={true}/>
  return <Outlet />
}

function App() {
  const currentUser = useSelector(selectCurrentUser)
  return (
    <Routes>
      {/* Redirect Route */}
      {/* <Route path='/' element={
        <Navigate to={currentUser ? '/settings/account' : '/login'} replace={true}/>
      } /> */}

      <Route path='/' element={<Main/>}/>

      {/* ProtectedRoutes (Hiểu đơn giản là những route chỉ cho phép truy cập sau khi login) */}
      <Route element={<ProtectedRoute user={currentUser}/>}>

        {/* User Settings */}
        <Route path='/settings/account' element={<Settings />} />
        <Route path='/settings/security' element={<Settings />} />

      </Route>

      {/* Authentication */}
      <Route path='/login' element={ <Auth key='auth-login' mode='login' /> } />
      <Route path='/register' element={ <Auth key='auth-register' mode='register' /> } />
      <Route path='/account/verification' element={<AccountVerification/>} />

      {/* 404 not found page */}
      <Route path='*' element={ <NotFound/> } />
    </Routes>
  )
}

export default App

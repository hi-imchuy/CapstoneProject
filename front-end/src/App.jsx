import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'

import NotFound from './pages/404/NotFound'
import Auth from '~/pages/Auth/Auth'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCurrentUserAPI, selectCurrentUser } from '~/redux/user/userSlice'
import Settings from '~/pages/Settings/Settings'
import Main from './pages/Main/main'
import DoctorChat from './pages/Chat/DoctorChat'
import AIChat from './pages/Chat/AIChat'
import SkinDetection from './pages/SkinDetection/SkinDetection'

const ProtectedRoute = ({ user }) => {
  const dispatch = useDispatch()
  const userId = user?._id
  const [checkedUserId, setCheckedUserId] = useState('')

  useEffect(() => {
    let isMounted = true

    if (!userId) return

    dispatch(fetchCurrentUserAPI()).finally(() => {
      if (isMounted) setCheckedUserId(userId)
    })

    return () => {
      isMounted = false
    }
  }, [dispatch, userId])

  if (userId && checkedUserId !== userId) return null
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

        <Route path='/skin-detection' element={<SkinDetection/>}/>
        <Route path='/chat/doctor' element={<DoctorChat/>}/>
        <Route path='/chat/ai' element={<AIChat/>}/>

      </Route>

      {/* Authentication */}
      <Route path='/login' element={ <Auth key='auth-login' mode='login' /> } />
      <Route path='/register' element={ <Auth key='auth-register' mode='register' /> } />
      <Route path='/forgot-password' element={ <Auth key='auth-forgot-password' mode='forgot-password' /> } />

      {/* 404 not found page */}
      <Route path='*' element={ <NotFound/> } />
    </Routes>
  )
}

export default App

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constant'

//Khoi tao gia tri State cua mot Slice trong Redux
const initialState = {
  currentUser: null
}

//Cac hanh dong goi API (bat dong bo) va cap nhat du lieu vao redux, dung MiddleWare createAsyncThunk di kem voi extraReducers
//https://redux-toolkit.js.org/api/createAsyncThunk
export const loginUserAPI = createAsyncThunk(
  'user/loginUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/login/`, data)
    //Axios se tra ve ket qua qua property cua no la data
    return response.data
  }
)

export const logoutUserAPI = createAsyncThunk(
  'user/logoutUserAPI',
  async (showSuccessMessage = true) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/logout`)
    if (showSuccessMessage) {
      toast.success('Logged out Successfully!')
    }
    return response.data
  }
)

export const updateUserAPI = createAsyncThunk(
  'user/updateUserAPI',
  async (data) => {
    const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users`, data)
    return response.data
  }
)

export const fetchCurrentUserAPI = createAsyncThunk(
  'user/fetchCurrentUserAPI',
  async () => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/profile`)
    return response.data
  }
)

//Khoi tao mot Slice trong kho luu tru Redux Store
export const userSlice = createSlice({
  name: 'user',
  initialState,
  //Reducers: Noi xu ly du lieu dong bo
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null
    }
  },
  //Nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    builder.addCase(loginUserAPI.fulfilled, (state, action) => {
      //action.payload ở đây chính là response.data trả về của hàm ở trên
      const user = action.payload
      state.currentUser = user
    })
    builder.addCase(logoutUserAPI.fulfilled, (state) => {
      state.currentUser = null
    })
    builder.addCase(updateUserAPI.fulfilled, (state, action) => {
      const user = action.payload
      state.currentUser = user
    })
    builder.addCase(fetchCurrentUserAPI.fulfilled, (state, action) => {
      state.currentUser = action.payload
    })
    builder.addCase(fetchCurrentUserAPI.rejected, (state) => {
      state.currentUser = null
    })
  }
})

// Action creators are generated for each case reducer function
export const { clearCurrentUser } = userSlice.actions

//Selectors: Là nơi dành cho các components bên dưới gọi bằng hook useSelector() để lấy dữ liệu từ trong kho redux ra ngoài để sử dụng
export const selectCurrentUser = (state) => {
  return state.user.currentUser
}

// export default activeBoardSlice.reducer
export const userReducer = userSlice.reducer

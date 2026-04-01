// Redux: State management tool
import { configureStore } from '@reduxjs/toolkit'
import { userReducer } from './user/userSlice'
import { conversationReducer } from './conversation/conversationSlice'

import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'

const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null)
    },
    setItem(_key, value) {
      return Promise.resolve(value)
    },
    removeItem() {
      return Promise.resolve()
    }
  }
}

const createBrowserStorage = () => {
  return {
    getItem(key) {
      return Promise.resolve(window.localStorage.getItem(key))
    },
    setItem(key, value) {
      window.localStorage.setItem(key, value)
      return Promise.resolve(value)
    },
    removeItem(key) {
      window.localStorage.removeItem(key)
      return Promise.resolve()
    }
  }
}

const storage = typeof window !== 'undefined'
  ? createBrowserStorage()
  : createNoopStorage()

const rootPersistConfig = {
  key: 'root', //key của persist do chúng ta chỉ định, để mặc định là root
  storage: storage, //Biến storage ở trên - lưu vào localstorage
  whitelist: ['user'] //định nghĩa các slice được phép duy trì qua mỗi lần f5 trình duyệt
  // blacklist: [''] //định nghĩa các slice KHÔNG được phép duy trì qua mỗi lần f5 trình duyệt
}

//Combine các reducers trong dự án
const reducers = combineReducers({
  user: userReducer,
  conversation: conversationReducer
})

const persistedReducer = persistReducer(rootPersistConfig, reducers)

export const store = configureStore({
  reducer: persistedReducer,

  //fix warning error when implement redux-persist
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
})

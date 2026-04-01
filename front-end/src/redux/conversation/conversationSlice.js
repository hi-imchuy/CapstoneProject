import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constant'

const initialState = {
  contacts: [],
  conversations: [],
  messagesByConversation: {},
  activeConversation: null
}

const updateOrInsertConversation = (conversationList, conversation) => {
  const nextList = [...conversationList]
  const existingConversationIndex = nextList.findIndex(item => item._id === conversation._id)

  if (existingConversationIndex >= 0) {
    nextList[existingConversationIndex] = conversation
  } else {
    nextList.push(conversation)
  }

  nextList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  return nextList
}

const appendMessage = (messageList = [], message) => {
  if (messageList.some(item => item._id === message._id)) return messageList
  return [...messageList, message]
}

export const fetchContactsAPI = createAsyncThunk(
  'conversation/fetchContactsAPI',
  async () => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/conversations/contacts`)
    return response.data
  }
)

export const fetchConversationsAPI = createAsyncThunk(
  'conversation/fetchConversationsAPI',
  async () => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/conversations`)
    return response.data
  }
)

export const createOrGetConversationAPI = createAsyncThunk(
  'conversation/createOrGetConversationAPI',
  async (targetUserId) => {
    const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/conversations`, { targetUserId })
    return response.data
  }
)

export const fetchMessagesAPI = createAsyncThunk(
  'conversation/fetchMessagesAPI',
  async (conversationId) => {
    const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/conversations/${conversationId}/messages`)
    return {
      conversationId,
      messages: response.data
    }
  }
)

export const sendMessageAPI = createAsyncThunk(
  'conversation/sendMessageAPI',
  async ({ conversationId, formData }) => {
    const response = await authorizedAxiosInstance.post(
      `${API_ROOT}/v1/conversations/${conversationId}/messages`,
      formData
    )
    return response.data
  }
)

export const clearConversationMessagesAPI = createAsyncThunk(
  'conversation/clearConversationMessagesAPI',
  async (conversationId) => {
    const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/conversations/${conversationId}/messages`)
    return response.data
  }
)

export const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload
    },
    receiveConversationCreated: (state, action) => {
      state.conversations = updateOrInsertConversation(state.conversations, action.payload)
    },
    receiveRealtimeMessage: (state, action) => {
      const { conversation, message } = action.payload
      state.conversations = updateOrInsertConversation(state.conversations, conversation)
      state.messagesByConversation[conversation._id] = appendMessage(
        state.messagesByConversation[conversation._id],
        message
      )

      if (state.activeConversation?._id === conversation._id) {
        state.activeConversation = conversation
      }
    },
    receiveMessagesCleared: (state, action) => {
      const conversation = action.payload
      state.conversations = updateOrInsertConversation(state.conversations, conversation)
      state.messagesByConversation[conversation._id] = []

      if (state.activeConversation?._id === conversation._id) {
        state.activeConversation = conversation
      }
    },
    resetConversationState: () => initialState
  },
  extraReducers: (builder) => {
    builder.addCase(fetchContactsAPI.fulfilled, (state, action) => {
      state.contacts = action.payload
    })
    builder.addCase(fetchConversationsAPI.fulfilled, (state, action) => {
      state.conversations = action.payload
      if (state.activeConversation) {
        state.activeConversation = action.payload.find(
          conversation => conversation._id === state.activeConversation._id
        ) || state.activeConversation
      }
    })
    builder.addCase(createOrGetConversationAPI.fulfilled, (state, action) => {
      state.conversations = updateOrInsertConversation(state.conversations, action.payload)
      state.activeConversation = action.payload
    })
    builder.addCase(fetchMessagesAPI.fulfilled, (state, action) => {
      state.messagesByConversation[action.payload.conversationId] = action.payload.messages
    })
    builder.addCase(sendMessageAPI.fulfilled, (state, action) => {
      const { conversation, message } = action.payload
      state.conversations = updateOrInsertConversation(state.conversations, conversation)
      state.messagesByConversation[conversation._id] = appendMessage(
        state.messagesByConversation[conversation._id],
        message
      )
      if (state.activeConversation?._id === conversation._id) {
        state.activeConversation = conversation
      }
    })
    builder.addCase(clearConversationMessagesAPI.fulfilled, (state, action) => {
      const conversation = action.payload
      state.conversations = updateOrInsertConversation(state.conversations, conversation)
      state.messagesByConversation[conversation._id] = []
      if (state.activeConversation?._id === conversation._id) {
        state.activeConversation = conversation
      }
    })
  }
})

export const {
  setActiveConversation,
  receiveConversationCreated,
  receiveRealtimeMessage,
  receiveMessagesCleared,
  resetConversationState
} = conversationSlice.actions

export const selectConversationContacts = (state) => state.conversation.contacts
export const selectConversationList = (state) => state.conversation.conversations
export const selectActiveConversation = (state) => state.conversation.activeConversation
export const selectMessagesByConversation = (state) => state.conversation.messagesByConversation

export const conversationReducer = conversationSlice.reducer

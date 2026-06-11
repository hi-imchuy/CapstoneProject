import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constant'
import { toast } from 'react-toastify'

//Khong try catch vi se bat loi tap trung o Interceptors

//Board
//Đã moved vào redux
// export const fetchBoardDetailsAPI = async (boardId) => {
//   const response = await axios.get(`${API_ROOT}/v1/boards/${boardId}`)
//   //Axios se tra ve ket qua qua property cua no la data
//   return response.data
// }

export const createNewBoardAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/boards`, data)
  toast.success('Board Created Successfully')
  return response.data
}

export const fetchBoardsAPI = async (searchPath) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards${searchPath}`)
  return response.data
}

export const updateBoardDetailsAPI = async (boardId, updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/boards/${boardId}`, updateData)
  //Axios se tra ve ket qua qua property cua no la data
  return response.data
}

export const moveCardToDifferentColumnAPI = async (updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/boards/supports/moving_card`, updateData)
  //Axios se tra ve ket qua qua property cua no la data
  return response.data
}

export const inviteUserToBoardAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/invitations/board`, data)
  toast.success('User is invited to board successfully!')
  return response.data
}

//Columns
export const createNewColumnAPI = async (newColumnData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/columns`, newColumnData)
  return response.data
}

export const updateColumnDetailsAPI = async (columnId, updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/columns/${columnId}`, updateData)
  //Axios se tra ve ket qua qua property cua no la data
  return response.data
}

export const deleteColumnDetailsAPI = async (columnId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/columns/${columnId}`)
  //Axios se tra ve ket qua qua property cua no la data
  return response.data
}

//Cards
export const createNewCardAPI = async (newCardData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/cards`, newCardData)
  return response.data
}

export const updateCardDetailsAPI = async (cardId, updateData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/cards/${cardId}`, updateData)
  return response.data
}

/** Users */
export const registerUserAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users`, data)
  toast.success('Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.', { theme: 'colored' })
  return response.data
}

export const requestPasswordResetAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot-password/request`, data)
  return response.data
}

export const verifyPasswordResetOtpAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot-password/verify`, data)
  return response.data
}

export const resetPasswordAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/forgot-password/reset`, data)
  return response.data
}

export const refreshTokenAPI = async () => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/refresh-token`)
  return response.data
}

/** Skin detections */
export const createSkinDetectionAPI = async (data) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/skin-detections`, data)
  return response.data
}

export const fetchSkinDetectionsAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/skin-detections`)
  return response.data
}

export const deleteSkinDetectionAPI = async (detectionId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/skin-detections/${detectionId}`)
  return response.data
}

/** AI conversations */
export const fetchAIConversationsAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/ai-conversations`)
  return response.data
}

export const createAIConversationAPI = async (data = {}) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/ai-conversations`, data)
  return response.data
}

export const updateAIConversationAPI = async (conversationId, data) => {
  const response = await authorizedAxiosInstance.patch(`${API_ROOT}/v1/ai-conversations/${conversationId}`, data)
  return response.data
}

export const fetchAIConversationMessagesAPI = async (conversationId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/ai-conversations/${conversationId}/messages`)
  return response.data
}

export const sendAIMessageAPI = async (conversationId, message) => {
  const response = await authorizedAxiosInstance.post(
    `${API_ROOT}/v1/ai-conversations/${conversationId}/messages`,
    { message }
  )
  return response.data
}

export const clearAIConversationMessagesAPI = async (conversationId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/ai-conversations/${conversationId}/messages`)
  return response.data
}

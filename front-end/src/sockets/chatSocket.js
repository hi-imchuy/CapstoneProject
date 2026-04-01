import { io } from 'socket.io-client'

import { API_ROOT } from '~/utils/constant'

let socketInstance = null

export const connectChatSocket = () => {
  if (!socketInstance) {
    socketInstance = io(API_ROOT, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })
  }

  if (!socketInstance.connected) {
    socketInstance.connect()
  }

  return socketInstance
}

export const getChatSocket = () => socketInstance

export const disconnectChatSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

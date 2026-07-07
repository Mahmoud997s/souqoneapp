import { io, Socket } from 'socket.io-client'
import { Config } from '../constants/config'
import { storage } from './storage'

let socket: Socket | null = null

export const getSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket

  const token = await storage.getToken()
  socket = io(Config.socketUrl, {
    auth: { token },
    transports: ['websocket'],
  })
  return socket
}

export const disconnectSocket = (): void => {
  socket?.disconnect()
  socket = null
}

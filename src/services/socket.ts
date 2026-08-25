import { io, Socket } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import { Config } from '../constants/config'
import { useSocketStore } from '../store/socketStore'

class SocketService {
  private socket: Socket | null = null
  private hasLoggedConnectionError = false

  async connect() {
    if (this.socket?.connected) return this.socket

    // If disconnected socket exists, destroy it before creating new one
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    const token = await SecureStore.getItemAsync('accessToken')

    // Append /chat namespace to match the backend Gateway configuration
    const url = Config.socketUrl.endsWith('/') 
      ? `${Config.socketUrl}chat`
      : `${Config.socketUrl}/chat`

    this.socket = io(url, {
      auth: { token: token ?? '' },
      autoConnect: false, // Don't auto-connect, we'll call connect manually
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    })

    this.socket.on('connect', () => {
      this.hasLoggedConnectionError = false
      console.log('[Socket] Connected:', this.socket?.id)
      useSocketStore.setState({ 
        isConnected: true, 
        lastError: null,
        retryCount: 0,
      })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      useSocketStore.setState({ isConnected: false })
    })

    this.socket.on('connect_error', (err) => {
      if (!this.hasLoggedConnectionError) {
        if (__DEV__) {
          console.warn(`[Socket] Connection Error: ${err.message} (further socket errors silenced)`)
        }
        this.hasLoggedConnectionError = true
      }
      useSocketStore.setState({ 
        isConnected: false,
        lastError: err.message,
      })
    })

    this.socket.connect()
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      console.log('[Socket] Manual disconnect triggered')
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn(`[Socket] Cannot emit ${event}, socket not connected`)
    }
  }

  listen(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback)
      } else {
        this.socket.off(event)
      }
    }
  }

  joinRoom(roomId: string) {
    this.emit('join-conversation', { conversationId: roomId })
  }

  leaveRoom(roomId: string) {
    this.emit('leave-conversation', { conversationId: roomId })
  }

  async refreshTokenAndReconnect(newToken: string) {
    if (this.socket) {
      this.socket.auth = { token: newToken }
      this.socket.disconnect() // Force disconnect to reconnect with new auth
      this.socket.connect()
      console.log('[Socket] Reconnected with new token')
    } else {
      await this.connect()
    }
  }
}

export const socketService = new SocketService()

// Backward compatibility for existing imports
export const connectSocket = () => socketService.connect()
export const disconnectSocket = () => socketService.disconnect()
export const getSocket = () => socketService.getSocket()

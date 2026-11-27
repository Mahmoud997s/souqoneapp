import { io, Socket } from 'socket.io-client'
import * as SecureStore from 'expo-secure-store'
import { Config } from '../constants/config'
import { useSocketStore } from '../store/socketStore'
import { logWarn } from '../utils/safeLog'

type SocketEventCallback = (...args: unknown[]) => void

class SocketService {
  private socket: Socket | null = null
  private hasLoggedConnectionError = false
  private connectPromise: Promise<Socket> | null = null
  private listeners = new Map<string, Set<SocketEventCallback>>()

  async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = (async () => {
      try {
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
          useSocketStore.setState({ 
            isConnected: true, 
            lastError: null,
            retryCount: 0,
          })
        })

        this.socket.on('account-status', (payload: { code?: string }) => {
          const code = payload?.code
          if (code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED') {
            if (this.socket) {
              try {
                this.socket.io.opts.reconnection = false
              } catch {}
              this.socket.disconnect()
              this.socket = null
            }
            const { handleBlockedOrSuspended } = require('../api/client')
            handleBlockedOrSuspended(code, null)
          }
        })

        this.socket.on('disconnect', () => {
          useSocketStore.setState({ isConnected: false })
        })

        this.socket.on('connect_error', (err) => {
          if (!this.hasLoggedConnectionError) {
            logWarn('Socket:Connection', err)
            this.hasLoggedConnectionError = true
          }
          useSocketStore.setState({ 
            isConnected: false, 
            lastError: err.message,
          })
        })

        for (const [event, callbacks] of this.listeners.entries()) {
          for (const cb of callbacks) {
            this.socket.on(event, cb)
          }
        }

        this.socket.connect()
        return this.socket
      } finally {
        this.connectPromise = null
      }
    })()

    return this.connectPromise
  }

  disconnect() {
    this.connectPromise = null
    if (this.socket) {
      try {
        this.socket.io.opts.reconnection = false
      } catch {}
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  emit(event: string, data: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      logWarn('Socket:Emit', `Cannot emit ${event}, socket not connected`)
    }
  }

  listen<T = unknown>(event: string, callback: (data: T) => void) {
    const fn = callback as SocketEventCallback
    let callbacks = this.listeners.get(event)
    if (!callbacks) {
      callbacks = new Set<SocketEventCallback>()
      this.listeners.set(event, callbacks)
    }
    const alreadyRegistered = callbacks.has(fn)
    callbacks.add(fn)
    if (this.socket && !alreadyRegistered) {
      this.socket.on(event, fn)
    }
  }

  off<T = unknown>(event: string, callback?: (data: T) => void) {
    if (callback) {
      const fn = callback as SocketEventCallback
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        callbacks.delete(fn)
        if (callbacks.size === 0) {
          this.listeners.delete(event)
        }
      }
      if (this.socket) {
        this.socket.off(event, fn)
      }
    } else {
      this.listeners.delete(event)
      if (this.socket) {
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
    this.connectPromise = null
    if (this.socket) {
      this.socket.auth = { token: newToken }
      this.socket.disconnect() // Force disconnect to reconnect with new auth
      this.socket.connect()
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

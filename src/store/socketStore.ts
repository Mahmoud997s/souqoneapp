import { create } from 'zustand'

interface SocketState {
  isConnected: boolean
  lastError: string | null
  retryCount: number
  setIsConnected: (connected: boolean) => void
  setLastError: (error: string | null) => void
  setRetryCount: (count: number) => void
  reset: () => void
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  lastError: null,
  retryCount: 0,
  
  setIsConnected: (connected) => set({ isConnected: connected }),
  setLastError: (error) => set({ lastError: error }),
  setRetryCount: (count) => set({ retryCount: count }),
  reset: () => set({ isConnected: false, lastError: null, retryCount: 0 }),
}))

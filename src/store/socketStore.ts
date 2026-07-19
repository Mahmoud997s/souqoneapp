import { create } from 'zustand'

interface SocketStoreState {
  isConnected: boolean
  lastError: string | null
  retryCount: number
  setState: (state: Partial<SocketStoreState>) => void
}

export const useSocketStore = create<SocketStoreState>((set) => ({
  isConnected: false,
  lastError: null,
  retryCount: 0,
  setState: (state) => set(state),
}))

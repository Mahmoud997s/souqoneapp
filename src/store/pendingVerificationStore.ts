import { create } from 'zustand'

export interface PendingVerificationData {
  email?: string
  token?: string
  accessToken?: string
  refreshToken?: string
  user?: any
}

interface PendingVerificationStoreState {
  pending: PendingVerificationData | null
  setPending: (data: PendingVerificationData) => void
  clear: () => void
}

export const usePendingVerificationStore = create<PendingVerificationStoreState>((set) => ({
  pending: null,
  setPending: (data) => set({ pending: data }),
  clear: () => set({ pending: null }),
}))

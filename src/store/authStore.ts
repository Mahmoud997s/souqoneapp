import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { User } from '../types/auth.types'
import { clearAllUserData } from '../utils/clearUserData'

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    set({ user, isLoggedIn: true })
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken')
      if (refreshToken) {
        const { authApi } = await import('../api/auth')
        await authApi.logout(refreshToken).catch(() => {})
      }
    } finally {
      await clearAllUserData()
      set({ user: null, isLoggedIn: false })
    }
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken')
      if (token) {
        set({ isLoggedIn: true })
        try {
          const { authApi } = await import('../api/auth')
          const res = await authApi.me()
          const data = res.data as any
          const user = data?.user ?? data
          if (user?.id) set({ user })
        } catch {}
      }
    } finally {
      set({ isLoading: false })
    }
  },

  updateUser: (updates) => {
    const current = get().user
    if (current) set({ user: { ...current, ...updates } })
  },
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { authApi } from '../api/auth'
import { User } from '../types/auth.types'
import { clearAllUserData, clearLocalUserDraftsAndHistory } from '../utils/clearUserData'
import { logWarn } from '../utils/safeLog'
import { useBlockedStore } from './blockedStore'
import { toastService } from './toastStore'
import { usePendingVerificationStore } from './pendingVerificationStore'

export type ActiveAuthScreen = 'login' | 'register' | 'verify-email' | null

export const LAST_USER_ID_KEY = '@souqone_last_user_id'

async function clearDraftsIfUserChanged(nextUserId?: string): Promise<void> {
  if (!nextUserId) return
  try {
    const prevUserId = await AsyncStorage.getItem(LAST_USER_ID_KEY)
    if (prevUserId && prevUserId !== nextUserId) {
      await clearLocalUserDraftsAndHistory()
    }
  } catch (error) {
    logWarn('authStore:CheckLastUserId', error)
  }
}

async function persistLastUserId(userId?: string): Promise<void> {
  if (!userId) return
  try {
    await AsyncStorage.setItem(LAST_USER_ID_KEY, userId)
  } catch (error) {
    logWarn('authStore:PersistLastUserId', error)
  }
}

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  isGuest: boolean
  isLoading: boolean
  activeAuthScreen: ActiveAuthScreen
  setActiveAuthScreen: (screen: ActiveAuthScreen) => void
  setAuth: (
    user: User,
    accessToken: string,
    refreshToken: string,
    opts?: { mode?: 'login' | 'register'; silent?: boolean }
  ) => Promise<void>
  setGuest: (isGuest: boolean) => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isGuest: false,
  isLoading: true,
  activeAuthScreen: null,

  setActiveAuthScreen: (screen) => {
    set({ activeAuthScreen: screen })
  },

  setAuth: async (user, accessToken, refreshToken, opts) => {
    const prevState = get()
    await clearDraftsIfUserChanged(user?.id)
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    await persistLastUserId(user?.id)
    try {
      const { resetSessionExpiredNotice } = require('../api/client') as typeof import('../api/client')
      resetSessionExpiredNotice()
    } catch (error) {
      logWarn('authStore:ResetSessionNotice', error)
    }
    try {
      useBlockedStore.getState().clear()
    } catch (error) {
      logWarn('authStore:ClearBlocked', error)
    }
    set({ user, isLoggedIn: true, isGuest: false })

    const isSameActiveUser = Boolean(
      prevState.isLoggedIn && prevState.user?.id && prevState.user.id === user?.id
    )
    if (!opts?.silent && !isSameActiveUser) {
      let pendingSignup = false
      try {
        pendingSignup = Boolean(usePendingVerificationStore.getState().pending)
      } catch {
        pendingSignup = false
      }
      const isRegistration =
        opts?.mode === 'register' ||
        prevState.activeAuthScreen === 'register' ||
        prevState.activeAuthScreen === 'verify-email' ||
        pendingSignup
      toastService.show({
        kind: 'success',
        title: isRegistration ? 'تم إنشاء حسابك' : 'تم تسجيل الدخول',
      })
    }
  },

  setGuest: (isGuest) => {
    set({ isGuest })
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken')
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {})
      }
    } finally {
      await clearAllUserData()
      set({ user: null, isLoggedIn: false, isGuest: false })
    }
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken')
      if (token) {
        set({ isLoggedIn: true })
        try {
          const res = await authApi.me()
          const data = res.data as { user?: User } | User
          const user = 'user' in data && data.user ? data.user : (data as User)
          if (user?.id) {
            await clearDraftsIfUserChanged(user.id)
            await persistLastUserId(user.id)
            set({ user })
          }
        } catch (error) {
          logWarn('authStore:InitializeMe', error)
        }
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

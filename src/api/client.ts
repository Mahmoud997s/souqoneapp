import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { dialogService } from '../store/dialogStore'
import { Config } from '../constants/config'
import { isProfilePhoneRequiredError, promptProfilePhoneRequired } from '../utils/profilePhoneGuard'

// ── Operation-Aware Timeout Policy Constants (G4) ──────────────────────────
export const TIMEOUT_INTERACTIVE_MS = 10000 // 10s: default GET detail/profile/auth
export const TIMEOUT_LIST_SEARCH_MS = 15000 // 15s: GET list/browse/search/autocomplete
export const TIMEOUT_MUTATION_MS = 15000 // 15s: POST, PUT, PATCH, DELETE non-upload
export const TIMEOUT_UPLOAD_MS = 60000 // 60s: /uploads URLs or multipart/form-data

export function resolveRequestTimeoutMs(config: {
  method?: string
  url?: string
  timeout?: number
  headers?: any
}): number {
  const url = (config.url || '').toLowerCase()
  const method = (config.method || 'get').toUpperCase()
  const contentType =
    config.headers?.['Content-Type'] ||
    config.headers?.['content-type'] ||
    ''

  // 1. Uploads (highest priority)
  if (url.includes('/uploads') || String(contentType).includes('multipart/form-data')) {
    return TIMEOUT_UPLOAD_MS
  }

  // 2. Mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return TIMEOUT_MUTATION_MS
  }

  // 3. Lists / Search / Browse
  if (
    url.includes('search') ||
    url.includes('browse') ||
    url.includes('page=') ||
    url.includes('limit=')
  ) {
    return TIMEOUT_LIST_SEARCH_MS
  }

  // 4. Default interactive GET
  return TIMEOUT_INTERACTIVE_MS
}

// ── Session Expiry Single-Flight Notice (G2 / S8a) ─────────────────────────
let sessionExpiredNoticeShown = false

export function resetSessionExpiredNotice() {
  sessionExpiredNoticeShown = false
}

export function notifySessionExpiredOnce() {
  try {
    const { useBlockedStore } = require('../store/blockedStore')
    if (useBlockedStore.getState().isBlocked) {
      return
    }

    const { useAuthStore } = require('../store/authStore')
    const authState = useAuthStore.getState()
    const isLoggedIn = authState?.isLoggedIn

    // Always ensure logout is triggered on expired session
    if (typeof authState?.logout === 'function') {
      authState.logout().catch(() => {})
    }

    // Only show single-flight warning if user was actually logged in and not yet notified
    if (isLoggedIn !== false && !sessionExpiredNoticeShown) {
      sessionExpiredNoticeShown = true
      dialogService.alert(
        'انتهت الجلسة',
        'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى للمتابعة.',
        'warning'
      )
    }
  } catch {}
}

export const apiClient = axios.create({
  baseURL: Config.apiUrl,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  // Apply smart operation timeout if unset or default 60000 and not upload
  if (!config.timeout || config.timeout === 60000) {
    config.timeout = resolveRequestTimeoutMs(config)
  }

  if (config.headers?.Authorization) {
    return config
  }
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const AUTH_EXCLUDED_URLS = [
  '/auth/login',
  '/auth/signup',
  '/auth/google',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
]

export function isAuthExcludedUrl(url?: string): boolean {
  if (!url) return false
  return AUTH_EXCLUDED_URLS.some((path) => url.includes(path))
}

// Module-level single-flight promise to avoid multiple simultaneous refresh calls
let refreshPromise: Promise<string> | null = null

export async function refreshAuthToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const refresh = await SecureStore.getItemAsync('refreshToken')
      if (!refresh) {
        notifySessionExpiredOnce()
        throw new Error('No refresh token stored')
      }

      const { data } = await axios.post(`${Config.apiUrl}/auth/refresh`, { refreshToken: refresh })
      await SecureStore.setItemAsync('accessToken', data.accessToken)
      await SecureStore.setItemAsync('refreshToken', data.refreshToken)

      if (data?.deletionScheduledAt !== undefined) {
        try {
          const { useAuthStore } = require('../store/authStore')
          useAuthStore.getState().updateUser({ deletionScheduledAt: data.deletionScheduledAt ?? null })
        } catch {}
      }

      try {
        const { socketService } = require('../services/socket')
        socketService.refreshTokenAndReconnect(data.accessToken)
      } catch (err) {
        if (__DEV__) {
          console.warn('[Socket] Failed to reconnect with new token:', err)
        }
      }

      return data.accessToken
    } catch (refreshError: any) {
      const status = refreshError.response?.status
      const data = refreshError.response?.data
      const code = data?.code

      // If refresh fails with 403 ACCOUNT_BANNED or ACCOUNT_SUSPENDED
      if (status === 403 && (code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED')) {
        handleBlockedOrSuspended(code, data?.suspendedUntil)
      } else if (status === 401 || status === 403) {
        // Logout ONLY if the refresh token is rejected by backend (401 or 403)
        notifySessionExpiredOnce()
      }
      // On network errors, timeouts, 5xx: DO NOT logout. Re-throw to caller.
      throw refreshError
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export function handleBlockedOrSuspended(code: string, suspendedUntil?: string | null) {
  const { useBlockedStore } = require('../store/blockedStore')
  const { isBlocked } = useBlockedStore.getState()
  if (isBlocked) {
    // Single-flight: already blocked, do not duplicate logout or navigation
    return
  }

  // 1. setBlocked first
  useBlockedStore.getState().setBlocked({
    code: code as 'ACCOUNT_BANNED' | 'ACCOUNT_SUSPENDED',
    suspendedUntil: suspendedUntil ?? null,
  })

  // 2. logout second
  const { useAuthStore } = require('../store/authStore')
  useAuthStore.getState().logout().catch(() => {})

  // 3. router.replace third
  const { router } = require('expo-router')
  router.replace('/(auth)/account-blocked')
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const data = error.response?.data
    const code = data?.code

    // 1. Handle live session 401 with blocked/suspended codes
    if (status === 401 && (code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED')) {
      handleBlockedOrSuspended(code, data?.suspendedUntil)
      return Promise.reject(error)
    }

    // 2. Handle live session 401 with ACCOUNT_INACTIVE (logout without blocked screen)
    if (status === 401 && code === 'ACCOUNT_INACTIVE') {
      notifySessionExpiredOnce()
      return Promise.reject(error)
    }

    // 3. Single-flight refresh on 401 (excluding auth endpoints and already retried requests)
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthExcludedUrl(original.url)
    ) {
      original._retry = true
      try {
        const newAccessToken = await refreshAuthToken()
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(original)
      } catch {
        return Promise.reject(error)
      }
    }

    const skipDialog = Boolean(error.config?.skipErrorDialog)
    if (!skipDialog) {
      if (isProfilePhoneRequiredError(error)) {
        promptProfilePhoneRequired()
      } else if (error.response?.status >= 500) {
        dialogService.alert('عذراً', 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً', 'error')
      } else if (error.message === 'Network Error') {
        dialogService.alert('انقطاع الاتصال', 'يرجى التحقق من اتصالك بالإنترنت', 'warning')
      }
    }
    return Promise.reject(error)
  }
)

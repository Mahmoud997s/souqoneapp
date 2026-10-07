import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { dialogService } from '../store/dialogStore'
import { Config } from '../constants/config'

export const apiClient = axios.create({
  baseURL: Config.apiUrl,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const AUTH_EXCLUDED_URLS = [
  '/auth/login',
  '/auth/signup',
  '/auth/google',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
]

function isAuthExcludedUrl(url?: string): boolean {
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
        const { useAuthStore } = require('../store/authStore')
        useAuthStore.getState().logout()
        throw new Error('No refresh token stored')
      }

      const { data } = await axios.post(`${Config.apiUrl}/auth/refresh`, { refreshToken: refresh })
      await SecureStore.setItemAsync('accessToken', data.accessToken)
      await SecureStore.setItemAsync('refreshToken', data.refreshToken)

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
      // Logout ONLY if the refresh token is rejected by backend (401 or 403)
      if (status === 401 || status === 403) {
        const { useAuthStore } = require('../store/authStore')
        useAuthStore.getState().logout()
      }
      // On network errors, timeouts, 5xx: DO NOT logout. Re-throw to caller.
      throw refreshError
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // Single-flight refresh on 401 (excluding auth endpoints and already retried requests)
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

    if (error.response?.status >= 500) {
      dialogService.alert('عذراً', 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً', 'error')
    } else if (error.message === 'Network Error') {
      dialogService.alert('انقطاع الاتصال', 'يرجى التحقق من اتصالك بالإنترنت', 'warning')
    }
    return Promise.reject(error)
  }
)

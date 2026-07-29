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

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = await SecureStore.getItemAsync('refreshToken')
      if (!refresh) {
        const { useAuthStore } = require('../store/authStore')
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(`${Config.apiUrl}/auth/refresh`, { refreshToken: refresh })
        await SecureStore.setItemAsync('accessToken', data.accessToken)
        await SecureStore.setItemAsync('refreshToken', data.refreshToken)
        
        const { socketService } = require('../services/socket')
        socketService.refreshTokenAndReconnect(data.accessToken)

        original.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(original)
      } catch {
        const { useAuthStore } = require('../store/authStore')
        useAuthStore.getState().logout()
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

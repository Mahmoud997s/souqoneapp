import * as SecureStore from 'expo-secure-store'

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0

/**
 * Persists the rotated tokens returned by the backend after a password change,
 * so the current device stays logged in. No-op when the backend (older version)
 * does not return both tokens. Returns true if tokens were stored.
 */
export async function storeRotatedTokens(data: any): Promise<boolean> {
  const accessToken = data?.accessToken
  const refreshToken = data?.refreshToken
  if (!isNonEmptyString(accessToken) || !isNonEmptyString(refreshToken)) return false

  await SecureStore.setItemAsync('accessToken', accessToken)
  await SecureStore.setItemAsync('refreshToken', refreshToken)

  try {
    const { socketService } = require('../services/socket')
    socketService.refreshTokenAndReconnect(accessToken)
  } catch (err) {
    if (__DEV__) {
      console.warn('[Socket] Failed to reconnect with new token:', err)
    }
  }
  return true
}

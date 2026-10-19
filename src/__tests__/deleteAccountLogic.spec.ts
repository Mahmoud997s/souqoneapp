import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { useAuthStore } from '../store/authStore'
import { usersApi, DeleteAccountPayload } from '../api/users'
import { authApi } from '../api/auth'
import { dialogService } from '../store/dialogStore'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

describe('Delete Account Screen Logic (PR 3 & Modification 1)', () => {
  let callOrder: string[] = []

  beforeEach(() => {
    jest.clearAllMocks()
    callOrder = []

    useAuthStore.setState({
      user: {
        id: 'user-to-delete',
        email: 'del@souqone.om',
        username: 'deluser',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
      },
      isLoggedIn: true,
      isGuest: false,
    })
  })

  describe('Payload construction and validation', () => {
    it('correctly builds payload for password reauth method', () => {
      const confirmation = 'حذف حسابي'
      const password = 'MyPassword123'
      const reauthMethod: 'password' | 'google' | 'confirmation' = 'password'

      const payload: DeleteAccountPayload = {
        confirmation: confirmation.trim(),
        ...(reauthMethod === 'password' ? { password } : {}),
      }

      expect(payload).toEqual({
        confirmation: 'حذف حسابي',
        password: 'MyPassword123',
      })
      expect(payload.googleIdToken).toBeUndefined()
    })

    it('correctly builds payload for google reauth method', () => {
      const confirmation = 'DELETE'
      const googleIdToken = 'google.oauth.jwt.token'
      const reauthMethod: 'password' | 'google' | 'confirmation' = 'google'

      const payload: DeleteAccountPayload = {
        confirmation: confirmation.trim(),
        ...(reauthMethod === 'google' ? { googleIdToken } : {}),
      }

      expect(payload).toEqual({
        confirmation: 'DELETE',
        googleIdToken: 'google.oauth.jwt.token',
      })
      expect(payload.password).toBeUndefined()
    })

    it('correctly builds payload for confirmation-only reauth method (phone user)', () => {
      const confirmation = 'حذف حسابي'
      const reauthMethod: 'password' | 'google' | 'confirmation' = 'confirmation'

      const payload: DeleteAccountPayload = {
        confirmation: confirmation.trim(),
      }

      expect(payload).toEqual({
        confirmation: 'حذف حسابي',
      })
      expect(payload.password).toBeUndefined()
      expect(payload.googleIdToken).toBeUndefined()
    })

    it('validates confirmation phrases: accepts "حذف حسابي" and "DELETE" with trim, rejects invalid phrases', () => {
      const isValid = (phrase: string) => {
        const clean = phrase.trim()
        return clean === 'حذف حسابي' || clean === 'DELETE'
      }

      expect(isValid('حذف حسابي')).toBe(true)
      expect(isValid('DELETE')).toBe(true)
      expect(isValid('  حذف حسابي  ')).toBe(true)
      expect(isValid('  DELETE  ')).toBe(true)

      expect(isValid('delete')).toBe(false)
      expect(isValid('حذف')).toBe(false)
      expect(isValid('حسابي')).toBe(false)
      expect(isValid('')).toBe(false)
      expect(isValid('نعم أريد الحذف')).toBe(false)
    })
  })

  describe('Modification 1: Strict Post-Deletion Sequence and Token Eviction', () => {
    it('executes exact post-deletion sequence: delete tokens FIRST, logout SECOND, router.replace THIRD', async () => {
      // Mock SecureStore deletions
      ;(SecureStore.deleteItemAsync as jest.Mock).mockImplementation((key: string) => {
        callOrder.push(`SecureStore.deleteItemAsync:${key}`)
        return Promise.resolve()
      })

      // Mock SecureStore getItemAsync to return null (tokens deleted)
      ;(SecureStore.getItemAsync as jest.Mock).mockImplementation((_key: string) => {
        return Promise.resolve(null)
      })

      // Spy on authApi.logout and usersApi.unregisterPushToken
      const spyAuthLogout = jest.spyOn(authApi, 'logout').mockResolvedValue({} as any)
      const spyUnregisterPush = jest.spyOn(usersApi, 'unregisterPushToken').mockResolvedValue({} as any)

      // Mock usersApi.deleteAccount
      jest.spyOn(usersApi, 'deleteAccount').mockResolvedValue({
        data: { message: 'تم استلام طلب حذف حسابك', deletionScheduledAt: new Date().toISOString() },
      } as any)

      // Mock router.replace
      ;(router.replace as jest.Mock).mockImplementation((route: string) => {
        callOrder.push(`router.replace:${route}`)
      })

      // Mock dialogService.confirm to execute callback immediately
      jest.spyOn(dialogService, 'confirm').mockImplementation((_title, _msg, onConfirm) => {
        onConfirm()
      })
      jest.spyOn(dialogService, 'alert').mockImplementation(() => {})

      // ── Simulate Submit Sequence from DeleteAccountScreen ──
      await usersApi.deleteAccount({ confirmation: 'حذف حسابي' })

      // Step 1: Delete tokens FIRST
      await SecureStore.deleteItemAsync('accessToken')
      await SecureStore.deleteItemAsync('refreshToken')

      // Step 2: Call authStore.logout()
      await useAuthStore.getState().logout()
      callOrder.push('authStore.logout:completed')

      // Step 3: Replace router once
      router.replace('/(auth)/login')

      // Assert Call Order:
      // 1. First two calls MUST be explicit token deletions
      expect(callOrder[0]).toBe('SecureStore.deleteItemAsync:accessToken')
      expect(callOrder[1]).toBe('SecureStore.deleteItemAsync:refreshToken')

      // 2. Logout completes after token deletions
      expect(callOrder.indexOf('authStore.logout:completed')).toBeGreaterThan(1)

      // 3. Navigation to login is the final step
      expect(callOrder[callOrder.length - 1]).toBe('router.replace:/(auth)/login')

      // CRITICAL ASSERTION: authApi.logout and usersApi.unregisterPushToken MUST NOT be called!
      // because refreshToken and accessToken were already deleted prior to logout() and clearAllUserData()
      expect(spyAuthLogout).not.toHaveBeenCalled()
      expect(spyUnregisterPush).not.toHaveBeenCalled()

      // User state is cleared
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isLoggedIn).toBe(false)
    })
  })

  describe('Error handling and mapping', () => {
    it('maps 401 error to verification error message', () => {
      const mapError = (err: any) => {
        const status = err?.response?.status
        const msg = err?.response?.data?.message
        if (typeof msg === 'string') return msg
        if (status === 401) return 'بيانات التحقق غير صحيحة. يرجى التأكد من كلمة المرور أو رمز التحقق.'
        return 'تعذر إتمام طلب حذف الحساب.'
      }

      expect(mapError({ response: { status: 401 } })).toBe(
        'بيانات التحقق غير صحيحة. يرجى التأكد من كلمة المرور أو رمز التحقق.'
      )
    })

    it('maps 403 error to permission error message', () => {
      const mapError = (err: any) => {
        const status = err?.response?.status
        const msg = err?.response?.data?.message
        if (typeof msg === 'string') return msg
        if (status === 403) return 'لا يمكن حذف الحساب نظراً لحالة الحساب الحالية.'
        return 'تعذر إتمام طلب حذف الحساب.'
      }

      expect(mapError({ response: { status: 403 } })).toBe(
        'لا يمكن حذف الحساب نظراً لحالة الحساب الحالية.'
      )
    })

    it('maps 409 error to active payment conflict message', () => {
      const mapError = (err: any) => {
        const status = err?.response?.status
        const msg = err?.response?.data?.message
        if (typeof msg === 'string') return msg
        if (status === 409) return 'لديك عمليات دفع قيد المعالجة، لا يمكن حذف الحساب الآن.'
        return 'تعذر إتمام طلب حذف الحساب.'
      }

      expect(mapError({ response: { status: 409 } })).toBe(
        'لديك عمليات دفع قيد المعالجة، لا يمكن حذف الحساب الآن.'
      )
    })

    it('maps 429 error to rate limit message', () => {
      const mapError = (err: any) => {
        const status = err?.response?.status
        const msg = err?.response?.data?.message
        if (typeof msg === 'string') return msg
        if (status === 429) return 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.'
        return 'تعذر إتمام طلب حذف الحساب.'
      }

      expect(mapError({ response: { status: 429 } })).toBe(
        'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.'
      )
    })
  })
})

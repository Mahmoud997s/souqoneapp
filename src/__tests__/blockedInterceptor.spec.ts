import { handleBlockedOrSuspended, refreshAuthToken } from '../api/client'
import { useBlockedStore } from '../store/blockedStore'
import { useAuthStore } from '../store/authStore'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

describe('Blocked / Suspended Interceptor & Handlers', () => {
  const mockLogout = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    useBlockedStore.getState().clear()
    useAuthStore.setState({
      logout: mockLogout,
      isLoggedIn: true,
      user: { id: 'u1', email: 'test@souqone.com' } as any,
    })
  })

  describe('handleBlockedOrSuspended', () => {
    it('executes in exact order: setBlocked -> logout -> router.replace', () => {
      const order: string[] = []

      const origSetBlocked = useBlockedStore.getState().setBlocked
      jest.spyOn(useBlockedStore.getState(), 'setBlocked').mockImplementation((args) => {
        order.push('setBlocked')
        origSetBlocked(args)
      })

      mockLogout.mockImplementation(async () => {
        order.push('logout')
      })

      ;(router.replace as jest.Mock).mockImplementation(() => {
        order.push('router.replace')
      })

      handleBlockedOrSuspended('ACCOUNT_BANNED')

      expect(order).toEqual(['setBlocked', 'logout', 'router.replace'])
      expect(useBlockedStore.getState().isBlocked).toBe(true)
      expect(useBlockedStore.getState().code).toBe('ACCOUNT_BANNED')
      expect(useBlockedStore.getState().suspendedUntil).toBeNull()
      expect(router.replace).toHaveBeenCalledWith('/(auth)/account-blocked')
    })

    it('sets suspendedUntil when provided for ACCOUNT_SUSPENDED', () => {
      const date = '2026-11-20T14:00:00.000Z'
      handleBlockedOrSuspended('ACCOUNT_SUSPENDED', date)

      expect(useBlockedStore.getState().isBlocked).toBe(true)
      expect(useBlockedStore.getState().code).toBe('ACCOUNT_SUSPENDED')
      expect(useBlockedStore.getState().suspendedUntil).toBe(date)
    })

    it('implements single-flight: does not duplicate logout or navigation if already blocked', () => {
      useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_BANNED' })
      expect(useBlockedStore.getState().isBlocked).toBe(true)

      mockLogout.mockClear()
      ;(router.replace as jest.Mock).mockClear()

      handleBlockedOrSuspended('ACCOUNT_BANNED')

      expect(mockLogout).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    })
  })

  describe('refreshAuthToken with blocked status', () => {
    it('catches 403 ACCOUNT_BANNED from refresh and triggers handleBlockedOrSuspended', async () => {
      ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue('fake-refresh-token')
      const postSpy = jest.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 403,
          data: { code: 'ACCOUNT_BANNED', message: 'User is banned' },
        },
      })

      await expect(refreshAuthToken()).rejects.toBeDefined()

      expect(useBlockedStore.getState().isBlocked).toBe(true)
      expect(useBlockedStore.getState().code).toBe('ACCOUNT_BANNED')
      expect(router.replace).toHaveBeenCalledWith('/(auth)/account-blocked')
      postSpy.mockRestore()
    })

    it('catches 403 ACCOUNT_SUSPENDED with suspendedUntil from refresh', async () => {
      const until = '2026-12-01T00:00:00.000Z'
      ;(SecureStore.getItemAsync as jest.Mock).mockResolvedValue('fake-refresh-token')
      const postSpy = jest.spyOn(axios, 'post').mockRejectedValueOnce({
        response: {
          status: 403,
          data: { code: 'ACCOUNT_SUSPENDED', suspendedUntil: until },
        },
      })

      await expect(refreshAuthToken()).rejects.toBeDefined()

      expect(useBlockedStore.getState().isBlocked).toBe(true)
      expect(useBlockedStore.getState().code).toBe('ACCOUNT_SUSPENDED')
      expect(useBlockedStore.getState().suspendedUntil).toBe(until)
      expect(router.replace).toHaveBeenCalledWith('/(auth)/account-blocked')
      postSpy.mockRestore()
    })
  })
})

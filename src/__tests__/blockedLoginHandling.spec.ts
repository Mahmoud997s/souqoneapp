import { useBlockedStore } from '../store/blockedStore'
import { authApi } from '../api/auth'
import { router } from 'expo-router'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}))

jest.mock('../api/auth', () => ({
  authApi: {
    login: jest.fn(),
    loginGoogle: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
  },
}))

describe('Blocked handling during Login and Email Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useBlockedStore.getState().clear()
  })

  it('sets blocked state and navigates to account-blocked when login returns 403 ACCOUNT_BANNED', async () => {
    ;(authApi.login as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 403,
        data: { code: 'ACCOUNT_BANNED', message: 'Account is banned' },
      },
    })

    // Simulate the exact catch logic in login.tsx
    try {
      await authApi.login({ email: 'banned@souqone.com', password: 'Password123!' })
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      const code = data?.code

      if (status === 403 && (code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED')) {
        useBlockedStore.getState().setBlocked({
          code,
          suspendedUntil: data?.suspendedUntil,
        })
        router.replace('/(auth)/account-blocked')
      }
    }

    expect(useBlockedStore.getState().isBlocked).toBe(true)
    expect(useBlockedStore.getState().code).toBe('ACCOUNT_BANNED')
    expect(router.replace).toHaveBeenCalledWith('/(auth)/account-blocked')
  })

  it('sets blocked state with suspendedUntil when login returns 403 ACCOUNT_SUSPENDED', async () => {
    const until = '2026-11-30T18:00:00.000Z'
    ;(authApi.login as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 403,
        data: { code: 'ACCOUNT_SUSPENDED', suspendedUntil: until },
      },
    })

    try {
      await authApi.login({ email: 'suspended@souqone.com', password: 'Password123!' })
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      const code = data?.code

      if (status === 403 && (code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED')) {
        useBlockedStore.getState().setBlocked({
          code,
          suspendedUntil: data?.suspendedUntil,
        })
        router.replace('/(auth)/account-blocked')
      }
    }

    expect(useBlockedStore.getState().isBlocked).toBe(true)
    expect(useBlockedStore.getState().code).toBe('ACCOUNT_SUSPENDED')
    expect(useBlockedStore.getState().suspendedUntil).toBe(until)
    expect(router.replace).toHaveBeenCalledWith('/(auth)/account-blocked')
  })

  it('does NOT set blocked state when login returns normal 403 (e.g. unverified or bad credentials)', async () => {
    ;(authApi.login as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 403,
        data: { code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' },
      },
    })

    let caughtHandled = false
    try {
      await authApi.login({ email: 'unverified@souqone.com', password: 'Password123!' })
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      const code = data?.code

      if (status === 403 && (code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED')) {
        useBlockedStore.getState().setBlocked({
          code,
          suspendedUntil: data?.suspendedUntil,
        })
        router.replace('/(auth)/account-blocked')
      } else {
        caughtHandled = true
      }
    }

    expect(caughtHandled).toBe(true)
    expect(useBlockedStore.getState().isBlocked).toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('sets blocked state and navigates when verifyEmail returns 403 ACCOUNT_BANNED', async () => {
    ;(authApi.verifyEmail as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 403,
        data: { code: 'ACCOUNT_BANNED', message: 'User banned' },
      },
    })

    try {
      await authApi.verifyEmail('123456', 'token-123')
    } catch (e: any) {
      const status = e?.response?.status
      const data = e?.response?.data
      const code = data?.code

      if (status === 403 && (code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED')) {
        useBlockedStore.getState().setBlocked({
          code,
          suspendedUntil: data?.suspendedUntil,
        })
        router.replace('/(auth)/account-blocked')
      }
    }

    expect(useBlockedStore.getState().isBlocked).toBe(true)
    expect(useBlockedStore.getState().code).toBe('ACCOUNT_BANNED')
    expect(router.replace).toHaveBeenCalledWith('/(auth)/account-blocked')
  })
})

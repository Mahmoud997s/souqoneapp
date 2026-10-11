import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native'
import VerifyEmailScreen from '../../app/(auth)/verify-email'
import { usePendingVerificationStore } from '../store/pendingVerificationStore'
import { authApi } from '../api/auth'
import { router } from 'expo-router'

const mockSetAuth = jest.fn()

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ redirect: '/listings/abc' }),
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}))
jest.mock('../api/auth', () => ({
  authApi: { verifyEmail: jest.fn(), resendVerification: jest.fn() },
}))
jest.mock('../store/authStore', () => ({
  useAuthStore: () => ({ setAuth: mockSetAuth }),
}))
jest.mock('../store/dialogStore', () => ({
  dialogService: { alert: jest.fn(), confirm: jest.fn() },
}))

const replace = router.replace as jest.Mock

const fillOtp = async (code: string) => {
  for (const d of code.split('')) {
    const [firstEmpty] = screen.getAllByDisplayValue('')
    await fireEvent.changeText(firstEmpty, d)
  }
}

describe('VerifyEmailScreen navigation after clearing pending', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePendingVerificationStore.setState({
      pending: {
        email: 'a@b.com',
        token: 'vtoken',
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: 'u1' },
      },
    })
  })

  it('redirects to login when pending is missing and the flow is not done', async () => {
    usePendingVerificationStore.setState({ pending: null })
    await render(<VerifyEmailScreen />)
    expect(replace).toHaveBeenCalledWith('/(auth)/login')
  })

  it('on success navigates only to the redirect, never to login', async () => {
    ;(authApi.verifyEmail as jest.Mock).mockResolvedValue({ data: {} })
    await render(<VerifyEmailScreen />)
    await fillOtp('123456')
    await act(async () => {
      await fireEvent.press(screen.getByText('تأكيد الرمز'))
    })
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/listings/abc'))
    expect(usePendingVerificationStore.getState().pending).toBeNull()
    expect(replace).not.toHaveBeenCalledWith('/(auth)/login')
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('when no session is resolved goes to login exactly once', async () => {
    usePendingVerificationStore.setState({ pending: { email: 'a@b.com', token: 'vtoken' } })
    ;(authApi.verifyEmail as jest.Mock).mockResolvedValue({ data: {} })
    await render(<VerifyEmailScreen />)
    await fillOtp('123456')
    await act(async () => {
      await fireEvent.press(screen.getByText('تأكيد الرمز'))
    })
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/(auth)/login'))
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('"change email" goes to register and not to login', async () => {
    await render(<VerifyEmailScreen />)
    await fireEvent.press(screen.getByText('تغيير البريد الإلكتروني'))
    expect(usePendingVerificationStore.getState().pending).toBeNull()
    expect(replace).toHaveBeenCalledWith('/(auth)/register')
    expect(replace).not.toHaveBeenCalledWith('/(auth)/login')
    expect(replace).toHaveBeenCalledTimes(1)
  })
})

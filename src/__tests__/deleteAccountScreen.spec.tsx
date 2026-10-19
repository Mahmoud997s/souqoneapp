import React from 'react'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react-native'
import DeleteAccountScreen from '../../app/profile/delete-account'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { usersApi } from '../api/users'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('../services/googleAuth', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ type: 'success', data: { idToken: 'mock-google-id-token' } }),
  },
  isGoogleSignInAvailable: () => true,
  isSuccessResponse: () => true,
  isErrorWithCode: () => false,
  statusCodes: { SIGN_IN_CANCELLED: '1', IN_PROGRESS: '2' },
}))

describe('DeleteAccountScreen UI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'ahmed@souqone.om',
        username: 'ahmed',
        displayName: 'أحمد',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'password',
      },
      isLoggedIn: true,
      isGuest: false,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders correctly in non-scheduled state with red warning banner and password input', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-1',
        email: 'ahmed@souqone.om',
        username: 'ahmed',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'password',
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByText('حذف الحساب إجراء لا يمكن التراجع عنه بعد انتهاء المهلة')).toBeTruthy()
    })

    // 5 "what will happen" bullet items
    expect(screen.getByText('ماذا سيحدث عند الحذف')).toBeTruthy()
    expect(screen.getByText(/عند تأكيد الطلب يتم إخفاء إعلاناتك وملفاتك الشخصية فوراً/)).toBeTruthy()
    expect(screen.getByText(/لديك 5 أيام لإلغاء الطلب من الإعدادات/)).toBeTruthy()
    expect(screen.getByText(/بعد انتهاء المهلة تُحذف بياناتك الشخصية/)).toBeTruthy()
    expect(screen.getByText(/الرسائل التي أرسلتها تبقى ظاهرة للطرف الآخر/)).toBeTruthy()
    expect(screen.getByText(/لن يتم استرداد قيمة أي اشتراك أو خدمة مدفوعة/)).toBeTruthy()

    // Password input and confirmation input present
    expect(screen.getByTestId('delete-account-password-input')).toBeTruthy()
    expect(screen.getByTestId('delete-account-confirm-input')).toBeTruthy()

    // Submit button is initially disabled
    const submitBtn = screen.getByTestId('delete-account-submit-btn')
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true)
  })

  it('enables submit button only when confirmation phrase matches and password is typed', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-1',
        email: 'ahmed@souqone.om',
        username: 'ahmed',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'password',
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-confirm-input')).toBeTruthy()
    })

    const passInput = screen.getByTestId('delete-account-password-input')
    const confInput = screen.getByTestId('delete-account-confirm-input')

    await act(async () => {
      fireEvent.changeText(passInput, 'Password123!')
      fireEvent.changeText(screen.getByTestId('delete-account-confirm-input'), 'حذف حسابي')
    })

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-submit-btn').props.accessibilityState?.disabled).toBe(false)
    })
  })

  it('renders correctly in scheduled state with orange card and cancel button', async () => {
    const scheduledDate = '2026-10-25T11:15:00.000Z'
    useAuthStore.setState({
      user: {
        id: 'u-2',
        email: 'scheduled@souqone.om',
        username: 'scheduled',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: scheduledDate,
      },
    })

    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-2',
        email: 'scheduled@souqone.om',
        username: 'scheduled',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: scheduledDate,
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByText('حسابك مجدول للحذف')).toBeTruthy()
    })

    // Formatted Oman date is displayed
    expect(screen.getByText(/الأحد 25 أكتوبر 2026 الساعة 3:15 م بتوقيت عُمان/)).toBeTruthy()

    // What happens after date
    expect(screen.getByText('ماذا سيحدث بعد الموعد')).toBeTruthy()

    // Cancel deletion button in footer
    expect(screen.getByTestId('delete-account-cancel-btn')).toBeTruthy()
    expect(screen.getByText('إلغاء طلب الحذف')).toBeTruthy()
  })

  it('renders Google sign in button when deletionReauthMethod is google', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-google',
        email: 'google@souqone.om',
        username: 'googleuser',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'google',
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-google-btn')).toBeTruthy()
    })

    expect(screen.getByText('تأكيد بحساب Google')).toBeTruthy()
    expect(screen.queryByTestId('delete-account-password-input')).toBeNull()
  })
})

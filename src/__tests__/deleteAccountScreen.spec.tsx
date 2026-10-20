import React from 'react'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react-native'
import DeleteAccountScreen from '../../app/profile/delete-account'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { usersApi } from '../api/users'
import { Platform } from 'react-native'
import { dialogService } from '../store/dialogStore'
import * as appleAuthService from '../services/appleAuth'
import { AppleAuthError } from '../services/appleAuth'

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

jest.mock('../services/appleAuth', () => {
  const actual = jest.requireActual('../services/appleAuth')
  return {
    ...actual,
    isAppleAuthAvailable: jest.fn().mockResolvedValue(true),
    performAppleReauth: jest.fn().mockResolvedValue({
      appleIdentityToken: 'mock-apple-id-token',
      appleNonce: 'mock-apple-raw-nonce',
      appleAuthorizationCode: 'mock-apple-auth-code',
    }),
  }
})

describe('DeleteAccountScreen UI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Platform.OS = 'ios'
    ;(appleAuthService.isAppleAuthAvailable as jest.Mock).mockResolvedValue(true)
    ;(appleAuthService.performAppleReauth as jest.Mock).mockResolvedValue({
      appleIdentityToken: 'mock-apple-id-token',
      appleNonce: 'mock-apple-raw-nonce',
      appleAuthorizationCode: 'mock-apple-auth-code',
    })
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

  it('renders Apple re-authentication button when deletionReauthMethod is apple on iOS', async () => {
    Platform.OS = 'ios'
    ;(appleAuthService.isAppleAuthAvailable as jest.Mock).mockResolvedValue(true)

    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-apple',
        email: 'apple@souqone.om',
        username: 'appleuser',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'apple',
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-apple-btn')).toBeTruthy()
    })

    expect(screen.getByText('تأكيد بحساب Apple')).toBeTruthy()
    expect(screen.queryByTestId('delete-account-password-input')).toBeNull()
    expect(screen.queryByTestId('delete-account-google-btn')).toBeNull()

    // Submit button is disabled before Apple confirmation
    const submitBtn = screen.getByTestId('delete-account-submit-btn')
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true)
  })

  it('completes Apple re-authentication, displays confirmed row, and enables submit', async () => {
    Platform.OS = 'ios'
    ;(appleAuthService.isAppleAuthAvailable as jest.Mock).mockResolvedValue(true)
    ;(appleAuthService.performAppleReauth as jest.Mock).mockResolvedValue({
      appleIdentityToken: 'mock-apple-id-token',
      appleNonce: 'mock-apple-raw-nonce',
      appleAuthorizationCode: 'mock-apple-auth-code',
    })

    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-apple-2',
        email: 'apple2@souqone.om',
        username: 'appleuser2',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'apple',
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-apple-btn')).toBeTruthy()
    })

    const appleBtn = screen.getByTestId('delete-account-apple-btn')
    await act(async () => {
      fireEvent.press(appleBtn)
    })

    await waitFor(() => {
      expect(screen.getByText('تم التأكيد بحساب Apple')).toBeTruthy()
    })

    // Now enter confirmation phrase
    const confInput = screen.getByTestId('delete-account-confirm-input')
    await act(async () => {
      fireEvent.changeText(confInput, 'حذف حسابي')
    })

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-submit-btn').props.accessibilityState?.disabled).toBe(false)
    })
  })

  it('submits all 3 Apple fields together in deleteAccount payload', async () => {
    Platform.OS = 'ios'
    ;(appleAuthService.isAppleAuthAvailable as jest.Mock).mockResolvedValue(true)
    ;(appleAuthService.performAppleReauth as jest.Mock).mockResolvedValue({
      appleIdentityToken: 'mock-apple-id-token',
      appleNonce: 'mock-apple-raw-nonce',
      appleAuthorizationCode: 'mock-apple-auth-code',
    })

    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-apple-3',
        email: 'apple3@souqone.om',
        username: 'appleuser3',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'apple',
      },
    } as any)

    const deleteSpy = jest.spyOn(usersApi, 'deleteAccount').mockResolvedValue({
      data: { message: 'ok', deletionScheduledAt: '2026-10-25T00:00:00Z' },
    } as any)

    jest.spyOn(dialogService, 'confirm').mockImplementation((title, msg, onConfirm) => {
      onConfirm()
    })

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-apple-btn')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('delete-account-apple-btn'))
    })

    await waitFor(() => {
      expect(screen.getByText('تم التأكيد بحساب Apple')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('delete-account-confirm-input'), 'حذف حسابي')
    })

    const submitBtn = screen.getByTestId('delete-account-submit-btn')
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith({
        confirmation: 'حذف حسابي',
        appleIdentityToken: 'mock-apple-id-token',
        appleNonce: 'mock-apple-raw-nonce',
        appleAuthorizationCode: 'mock-apple-auth-code',
      })
    })
  })

  it('renders unsupported message on Android and keeps submit disabled', async () => {
    Platform.OS = 'android'
    ;(appleAuthService.isAppleAuthAvailable as jest.Mock).mockResolvedValue(false)

    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-apple-android',
        email: 'apple.android@souqone.om',
        username: 'appleandroid',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'apple',
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('apple-unsupported-message')).toBeTruthy()
    })

    expect(
      screen.getByText(/حسابك مسجل باستخدام Apple. لإتمام حذف الحساب، يرجى المتابعة من جهاز iOS أو تعيين كلمة مرور لحسابك أولاً/)
    ).toBeTruthy()

    // Apple button is not present
    expect(screen.queryByTestId('delete-account-apple-btn')).toBeNull()

    // Even if confirmation phrase is typed, submit remains disabled
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('delete-account-confirm-input'), 'حذف حسابي')
    })

    const submitBtn = screen.getByTestId('delete-account-submit-btn')
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true)
  })

  it('resets apple credentials, redisplays Apple button, and disables submit when deletion fails with 401 APPLE_REAUTH_REQUIRED', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-apple-reauth-fail',
        email: 'apple-fail@souqone.om',
        username: 'applefail',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'apple',
      },
    } as any)

    const alertSpy = jest.spyOn(dialogService, 'alert')
    jest.spyOn(dialogService, 'confirm').mockImplementation((title, msg, onConfirm) => {
      onConfirm()
    })

    const deleteSpy = jest.spyOn(usersApi, 'deleteAccount').mockRejectedValue({
      response: {
        status: 401,
        data: {
          code: 'APPLE_REAUTH_REQUIRED',
          message: 'Apple token expired or revoked',
        },
      },
    } as any)

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-apple-btn')).toBeTruthy()
    })

    // 1. Confirm with Apple
    await act(async () => {
      fireEvent.press(screen.getByTestId('delete-account-apple-btn'))
    })

    await waitFor(() => {
      expect(screen.getByText('تم التأكيد بحساب Apple')).toBeTruthy()
    })

    // 2. Type confirmation phrase
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('delete-account-confirm-input'), 'حذف حسابي')
    })

    const submitBtn = screen.getByTestId('delete-account-submit-btn')
    expect(submitBtn.props.accessibilityState?.disabled).toBe(false)

    // 3. Press submit -> backend rejects with 401 APPLE_REAUTH_REQUIRED
    await act(async () => {
      fireEvent.press(submitBtn)
    })

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledTimes(1)
    })

    expect(alertSpy).toHaveBeenCalledWith(
      'خطأ',
      'يرجى إعادة المصادقة باستخدام Apple لمتابعة حذف الحساب.'
    )

    // Verification of Bug Fix 1:
    // Apple confirm button must reappear so user can re-authenticate
    await waitFor(() => {
      expect(screen.getByTestId('delete-account-apple-btn')).toBeTruthy()
    })

    // Confirmation badge must be gone
    expect(screen.queryByText('تم التأكيد بحساب Apple')).toBeNull()

    // Final submit button must be disabled again
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true)
  })

  it('displays custom AppleAuthError message when performAppleReauth throws AppleAuthError', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-apple-err1',
        email: 'apple-err1@souqone.om',
        username: 'appleerr1',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'apple',
      },
    } as any)

    const alertSpy = jest.spyOn(dialogService, 'alert')
    jest.spyOn(appleAuthService, 'performAppleReauth').mockRejectedValueOnce(
      new AppleAuthError('لم يتم استلام رمز التفويض من Apple لإلغاء الحساب')
    )

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-apple-btn')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('delete-account-apple-btn'))
    })

    expect(alertSpy).toHaveBeenCalledWith(
      'خطأ',
      'لم يتم استلام رمز التفويض من Apple لإلغاء الحساب'
    )
  })

  it('displays generic Arabic fallback message when performAppleReauth throws native/unknown error', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue({
      data: {
        id: 'u-apple-err2',
        email: 'apple-err2@souqone.om',
        username: 'appleerr2',
        role: 'user',
        isVerified: true,
        createdAt: '2026-01-01',
        deletionScheduledAt: null,
        deletionReauthMethod: 'apple',
      },
    } as any)

    const alertSpy = jest.spyOn(dialogService, 'alert')
    jest.spyOn(appleAuthService, 'performAppleReauth').mockRejectedValueOnce(
      new Error('Native error: The authorization attempt failed for an unknown reason (code 1000)')
    )

    await render(<DeleteAccountScreen />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-apple-btn')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('delete-account-apple-btn'))
    })

    expect(alertSpy).toHaveBeenCalledWith(
      'خطأ',
      'فشل التحقق عبر حساب Apple. يرجى إعادة المحاولة.'
    )
  })

})

import React from 'react'
import { AppState, Linking } from 'react-native'
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import SettingsScreen, { resolveHasPassword } from '../settings'
import { dialogService } from '../../../src/store/dialogStore'
import type { User } from '../../../src/types/auth.types'

jest.setTimeout(15000)

const mockLogout = jest.fn()
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()

let mockAuthState: {
  user: User | null
  isGuest: boolean
  logout: () => Promise<void>
} = {
  user: null,
  isGuest: false,
  logout: mockLogout,
}

jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
  }
})

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
}))

jest.mock('../../../src/store/authStore', () => ({
  useAuthStore: () => mockAuthState,
}))

jest.mock('../../../src/store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
  },
}))

jest.mock('../../../src/components/ui/GlassNavBar', () => ({
  GlassNavBar: () => null,
}))

jest.mock('../../../src/components/ui/SupportHelpButton', () => ({
  SupportHelpButton: () => null,
}))

jest.mock('../../../src/components/profile/DeletionScheduledBanner', () => ({
  DeletionScheduledBanner: () => null,
}))

const baseUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  username: 'user1',
  role: 'user',
  isVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('D-335: SettingsScreen OAuth note, resolveHasPassword, local notif prefs & OS permission banner', () => {
  let appStateListeners: Array<(state: string) => void> = []

  beforeEach(() => {
    jest.clearAllMocks()
    appStateListeners = []
    ;(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' })
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
    ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event: any, cb: any) => {
      appStateListeners.push(cb)
      return { remove: jest.fn() } as any
    })
    jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined)
    mockAuthState = {
      user: { ...baseUser, hasPassword: true, hasGoogle: false, hasApple: false },
      isGuest: false,
      logout: mockLogout,
    }
  })

  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
  })

  describe('1. resolveHasPassword (backend flags vs legacy fallback)', () => {
    it('uses explicit backend hasPassword boolean when present', () => {
      expect(resolveHasPassword({ ...baseUser, hasPassword: true, deletionReauthMethod: 'google' })).toBe(true)
      expect(resolveHasPassword({ ...baseUser, hasPassword: false, deletionReauthMethod: 'password' })).toBe(false)
    })

    it('falls back to deletionReauthMethod when hasPassword flag is absent', () => {
      expect(resolveHasPassword({ ...baseUser })).toBe(true)
      expect(resolveHasPassword({ ...baseUser, deletionReauthMethod: 'password' })).toBe(true)
      expect(resolveHasPassword({ ...baseUser, deletionReauthMethod: 'google' })).toBe(false)
      expect(resolveHasPassword({ ...baseUser, deletionReauthMethod: 'apple' })).toBe(false)
      expect(resolveHasPassword(null)).toBe(false)
    })
  })

  describe('2. Change-Password row vs OAuth Account Note visibility', () => {
    it('hides both Change Password and OAuth Note for guest users', async () => {
      mockAuthState = { user: null, isGuest: true, logout: mockLogout }
      const { queryByTestId } = await render(<SettingsScreen />)
      expect(queryByTestId('settings-change-password-row')).toBeNull()
      expect(queryByTestId('settings-oauth-account-note')).toBeNull()
    })

    it('shows Change Password and hides OAuth Note for password-based account', async () => {
      mockAuthState = {
        user: { ...baseUser, hasPassword: true, hasGoogle: false, hasApple: false },
        isGuest: false,
        logout: mockLogout,
      }
      const { getByTestId, queryByTestId } = await render(<SettingsScreen />)
      expect(getByTestId('settings-change-password-row')).toBeTruthy()
      expect(queryByTestId('settings-oauth-account-note')).toBeNull()
    })

    it('hides Change Password and shows Google OAuth Note for Google-only account', async () => {
      mockAuthState = {
        user: { ...baseUser, hasPassword: false, hasGoogle: true, hasApple: false },
        isGuest: false,
        logout: mockLogout,
      }
      const { getByTestId, getByText, queryByTestId } = await render(<SettingsScreen />)
      expect(queryByTestId('settings-change-password-row')).toBeNull()
      expect(getByTestId('settings-oauth-account-note')).toBeTruthy()
      expect(getByText('حسابك مرتبط بـ Google')).toBeTruthy()
      expect(getByText('تسجيل الدخول يتم عبر مزود الحساب دون كلمة مرور')).toBeTruthy()
      expect(getByText('متصل')).toBeTruthy()
    })

    it('hides Change Password and shows Apple OAuth Note for Apple-only account', async () => {
      mockAuthState = {
        user: { ...baseUser, hasPassword: false, hasGoogle: false, hasApple: true },
        isGuest: false,
        logout: mockLogout,
      }
      const { getByTestId, getByText, queryByTestId } = await render(<SettingsScreen />)
      expect(queryByTestId('settings-change-password-row')).toBeNull()
      expect(getByTestId('settings-oauth-account-note')).toBeTruthy()
      expect(getByText('حسابك مرتبط بـ Apple')).toBeTruthy()
    })

    it('shows combined Google & Apple OAuth Note when both are linked without password', async () => {
      mockAuthState = {
        user: { ...baseUser, hasPassword: false, hasGoogle: true, hasApple: true },
        isGuest: false,
        logout: mockLogout,
      }
      const { getByText, queryByTestId } = await render(<SettingsScreen />)
      expect(queryByTestId('settings-change-password-row')).toBeNull()
      expect(getByText('حسابك مرتبط بـ Google و Apple')).toBeTruthy()
    })
  })

  describe('3. OS Notification Permission Banner & AppState re-check', () => {
    it('shows OS banner when permission is denied and opens OS settings on button press', async () => {
      ;(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' })
      const { getByTestId, getByText } = await render(<SettingsScreen />)

      await waitFor(() => {
        expect(getByTestId('settings-os-notif-banner')).toBeTruthy()
      })
      expect(getByText('الإشعارات متوقفة من إعدادات الجهاز')).toBeTruthy()

      fireEvent.press(getByTestId('settings-open-os-settings-btn'))
      expect(Linking.openSettings).toHaveBeenCalledTimes(1)
    })

    it('hides OS banner when returning to active state after user grants permission', async () => {
      ;(Notifications.getPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 'denied' })
        .mockResolvedValueOnce({ status: 'granted' })

      const { getByTestId, queryByTestId } = await render(<SettingsScreen />)
      await waitFor(() => {
        expect(getByTestId('settings-os-notif-banner')).toBeTruthy()
      })

      await act(async () => {
        appStateListeners.forEach((cb) => cb('active'))
      })

      await waitFor(() => {
        expect(queryByTestId('settings-os-notif-banner')).toBeNull()
      })
    })
  })

  describe('4. Local Per-Account Notification Prefs & Rollback on Storage Failure', () => {
    it('saves per-user notification prefs in AsyncStorage and rolls back + alerts on failure', async () => {
      const { getByTestId } = await render(<SettingsScreen />)

      const adSwitch = getByTestId('settings-ad-notif-switch')
      expect(adSwitch.props.value).toBe(false)

      await act(async () => {
        fireEvent(adSwitch, 'valueChange', true)
      })

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@souqone_notification_prefs:user-1',
        JSON.stringify({ msgNotif: true, adNotif: true })
      )

      ;(AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'))
      const msgSwitch = getByTestId('settings-msg-notif-switch')
      expect(msgSwitch.props.value).toBe(true)

      await act(async () => {
        fireEvent(msgSwitch, 'valueChange', false)
      })

      await waitFor(() => {
        expect(dialogService.alert).toHaveBeenCalledWith(
          'خطأ',
          'تعذر حفظ تفضيلات الإشعارات على الجهاز. حاول مرة أخرى.',
          'error'
        )
      })
      expect(getByTestId('settings-msg-notif-switch').props.value).toBe(true)
    })
  })
})

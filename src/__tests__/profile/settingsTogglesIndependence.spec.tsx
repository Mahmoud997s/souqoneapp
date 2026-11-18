import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsScreen from '../../../app/profile/settings'
import { useAuthStore } from '../../store/authStore'
import { usersApi } from '../../api/users'
import { saveNotificationPrefs } from '../../utils/notificationPrefsStorage'
import type { UserWithContactVisibility } from '../../types/profile.types'

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}))

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('../../api/users', () => ({
  usersApi: {
    updateProfile: jest.fn(),
  },
}))

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
    confirm: jest.fn(),
    show: jest.fn(),
  },
}))

jest.mock('../../components/ui/GlassNavBar', () => ({
  GlassNavBar: () => null,
}))

jest.mock('../../components/ui/SupportHelpButton', () => ({
  SupportHelpButton: () => null,
}))

jest.mock('../../components/profile/DeletionScheduledBanner', () => ({
  DeletionScheduledBanner: () => null,
}))

jest.mock('../../utils/notificationPrefsStorage', () => ({
  DEFAULT_NOTIFICATION_PREFS: { msgNotif: true, adNotif: true },
  loadNotificationPrefs: jest.fn().mockResolvedValue({ msgNotif: true, adNotif: true }),
  saveNotificationPrefs: jest.fn().mockResolvedValue(undefined),
}))

describe('D-361: Settings 4 switches independence & stable instance across re-renders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const baseUser: UserWithContactVisibility = {
      id: 'user-1',
      username: 'ahmed_om',
      displayName: 'أحمد العماني',
      phone: '+96891234567',
      email: 'ahmed@example.com',
      role: 'user',
      isVerified: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      showPhoneOnProfile: false,
      showWhatsappOnProfile: false,
    }
    useAuthStore.setState({ user: baseUser, isGuest: false, isLoading: false })
  })

  it('keeps Switch instances mounted (not remounted) and keeps all 4 switches independent when each is toggled', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    ;(usersApi.updateProfile as jest.Mock).mockImplementation(async (patch) => ({
      data: {
        ...useAuthStore.getState().user,
        ...patch,
      },
    }))

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <SettingsScreen />
      </QueryClientProvider>
    )

    const phoneBefore = getByTestId('settings-show-phone-switch')
    const whatsappBefore = getByTestId('settings-show-whatsapp-switch')
    const msgBefore = getByTestId('settings-msg-notif-switch')
    const adBefore = getByTestId('settings-ad-notif-switch')

    expect(phoneBefore.props.value).toBe(false)
    expect(whatsappBefore.props.value).toBe(false)
    expect(msgBefore.props.value).toBe(true)
    expect(adBefore.props.value).toBe(true)

    // 1. Toggle showPhoneOnProfile -> true
    fireEvent(phoneBefore, 'valueChange', true)
    await waitFor(() => {
      expect(getByTestId('settings-show-phone-switch').props.value).toBe(true)
    })
    expect(getByTestId('settings-show-whatsapp-switch').props.value).toBe(false)
    expect(getByTestId('settings-msg-notif-switch').props.value).toBe(true)
    expect(getByTestId('settings-ad-notif-switch').props.value).toBe(true)

    // Assert Switch instances were NOT remounted
    expect(getByTestId('settings-msg-notif-switch')).toBe(msgBefore)
    expect(getByTestId('settings-ad-notif-switch')).toBe(adBefore)
    expect(getByTestId('settings-show-whatsapp-switch')).toBe(whatsappBefore)

    // 2. Toggle msgNotif -> false, then immediately toggle adNotif -> false
    fireEvent(getByTestId('settings-msg-notif-switch'), 'valueChange', false)
    fireEvent(getByTestId('settings-ad-notif-switch'), 'valueChange', false)

    await waitFor(() => {
      expect(getByTestId('settings-msg-notif-switch').props.value).toBe(false)
      expect(getByTestId('settings-ad-notif-switch').props.value).toBe(false)
    })
    expect(getByTestId('settings-show-phone-switch').props.value).toBe(true)
    expect(getByTestId('settings-show-whatsapp-switch').props.value).toBe(false)
    expect(saveNotificationPrefs).toHaveBeenLastCalledWith('user-1', {
      msgNotif: false,
      adNotif: false,
    })

    // 3. Toggle showWhatsappOnProfile -> true
    fireEvent(getByTestId('settings-show-whatsapp-switch'), 'valueChange', true)
    await waitFor(() => {
      expect(getByTestId('settings-show-whatsapp-switch').props.value).toBe(true)
    })
    expect(getByTestId('settings-show-phone-switch').props.value).toBe(true)
    expect(getByTestId('settings-msg-notif-switch').props.value).toBe(false)
    expect(getByTestId('settings-ad-notif-switch').props.value).toBe(false)
  }, 15000)
})

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsScreen from '../../../app/profile/settings'
import { useAuthStore } from '../../store/authStore'
import { usersApi } from '../../api/users'
import { toastService } from '../../store/toastStore'
import type { UserWithContactVisibility } from '../../types/profile.types'

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
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

jest.mock('../../store/toastStore', () => ({
  toastService: {
    show: jest.fn(),
    confirm: jest.fn(),
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

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function seedUser(overrides: Partial<UserWithContactVisibility> = {}) {
  const baseUser: UserWithContactVisibility = {
    id: 'user-1',
    username: 'ahmed_om',
    displayName: 'أحمد العماني',
    phone: '+96891234567',
    email: 'ahmed@example.com',
    governorate: 'مسقط',
    city: 'السيب',
    role: 'user',
    isVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    showPhoneOnProfile: false,
    showWhatsappOnProfile: false,
    ...overrides,
  }
  useAuthStore.setState({
    user: baseUser,
    isGuest: false,
    isLoading: false,
  })
  return baseUser
}

describe('SettingsScreen — Profile Contact Visibility Toggles (D-357)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders profile visibility section with both toggles defaulting to false', async () => {
    seedUser({
      showPhoneOnProfile: undefined,
      showWhatsappOnProfile: undefined,
    })
    const queryClient = createQueryClient()

    const { getByText, getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <SettingsScreen />
      </QueryClientProvider>
    )

    expect(getByText('الظهور في الملف الشخصي')).toBeTruthy()
    expect(getByText('إظهار رقم الاتصال')).toBeTruthy()
    expect(getByText('يظهر رقمك لزوار ملفك الشخصي')).toBeTruthy()
    expect(getByText('إظهار الواتساب')).toBeTruthy()
    expect(getByText('يظهر زر واتساب على رقمك')).toBeTruthy()

    const phoneSwitch = getByTestId('settings-show-phone-switch')
    const whatsappSwitch = getByTestId('settings-show-whatsapp-switch')
    expect(phoneSwitch.props.value).toBe(false)
    expect(whatsappSwitch.props.value).toBe(false)
    expect(phoneSwitch.props.disabled).toBeFalsy()
    expect(whatsappSwitch.props.disabled).toBeFalsy()
  })

  it('optimistically toggles showPhoneOnProfile, sends single-field PATCH, and invalidates ["me"]', async () => {
    const user = seedUser({ showPhoneOnProfile: false, showWhatsappOnProfile: false })
    const queryClient = createQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    ;(usersApi.updateProfile as jest.Mock).mockResolvedValue({
      data: {
        ...user,
        showPhoneOnProfile: true,
      },
    })

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <SettingsScreen />
      </QueryClientProvider>
    )

    const phoneSwitch = getByTestId('settings-show-phone-switch')
    fireEvent(phoneSwitch, 'valueChange', true)

    await waitFor(() => {
      expect(getByTestId('settings-show-phone-switch').props.value).toBe(true)
    })

    expect(usersApi.updateProfile).toHaveBeenCalledTimes(1)
    expect(usersApi.updateProfile).toHaveBeenCalledWith({ showPhoneOnProfile: true })
    expect((useAuthStore.getState().user as UserWithContactVisibility | null)?.showPhoneOnProfile).toBe(true)

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me'] })
    })
  })

  it('optimistically toggles showWhatsappOnProfile, sends single-field PATCH, and invalidates ["me"]', async () => {
    const user = seedUser({ showPhoneOnProfile: false, showWhatsappOnProfile: false })
    const queryClient = createQueryClient()
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
    ;(usersApi.updateProfile as jest.Mock).mockResolvedValue({
      data: {
        ...user,
        showWhatsappOnProfile: true,
      },
    })

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <SettingsScreen />
      </QueryClientProvider>
    )

    const whatsappSwitch = getByTestId('settings-show-whatsapp-switch')
    fireEvent(whatsappSwitch, 'valueChange', true)

    await waitFor(() => {
      expect(getByTestId('settings-show-whatsapp-switch').props.value).toBe(true)
    })

    expect(usersApi.updateProfile).toHaveBeenCalledTimes(1)
    expect(usersApi.updateProfile).toHaveBeenCalledWith({ showWhatsappOnProfile: true })
    expect((useAuthStore.getState().user as UserWithContactVisibility | null)?.showWhatsappOnProfile).toBe(true)

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['me'] })
    })
  })

  it('rolls back switch state and shows error dialog when updateProfile fails', async () => {
    seedUser({ showPhoneOnProfile: false, showWhatsappOnProfile: false })
    const queryClient = createQueryClient()
    ;(usersApi.updateProfile as jest.Mock).mockRejectedValue(new Error('Network Error'))

    const { getByTestId } = await render(
      <QueryClientProvider client={queryClient}>
        <SettingsScreen />
      </QueryClientProvider>
    )

    fireEvent(getByTestId('settings-show-phone-switch'), 'valueChange', true)

    await waitFor(() => {
      expect(toastService.show).toHaveBeenCalledWith({
        kind: 'error',
        title: 'تعذر تحديث إعدادات الظهور، حاول مرة أخرى',
      })
    })

    expect(getByTestId('settings-show-phone-switch').props.value).toBe(false)
    expect((useAuthStore.getState().user as UserWithContactVisibility | null)?.showPhoneOnProfile).toBe(false)
  })

  it('disables both toggles with a short hint when user has no phone number', async () => {
    seedUser({ phone: undefined, showPhoneOnProfile: false, showWhatsappOnProfile: false })
    const queryClient = createQueryClient()

    const { getByTestId, getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <SettingsScreen />
      </QueryClientProvider>
    )

    expect(getByTestId('settings-show-phone-switch').props.disabled).toBe(true)
    expect(getByTestId('settings-show-whatsapp-switch').props.disabled).toBe(true)
    expect(getByText(/أضف رقم هاتف/)).toBeTruthy()
    expect(usersApi.updateProfile).not.toHaveBeenCalled()
  })
})

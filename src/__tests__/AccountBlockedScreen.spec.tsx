import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import AccountBlockedScreen from '../../app/(auth)/account-blocked'
import { useBlockedStore } from '../store/blockedStore'
import { useAuthStore } from '../store/authStore'
import { router } from 'expo-router'
import { BackHandler, Linking } from 'react-native'
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../constants/support'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn() },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}))

describe('AccountBlockedScreen UI', () => {
  const mockLogout = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    useBlockedStore.getState().clear()
    useAuthStore.setState({ logout: mockLogout })
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any)
    jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any)
  })

  it('renders correctly for ACCOUNT_BANNED with single title in card and no date line', async () => {
    useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_BANNED' })

    await render(<AccountBlockedScreen />)

    // Title appears once (in card only, not duplicated in header)
    expect(screen.getAllByText('تم حظر الحساب')).toHaveLength(1)
    expect(screen.getByText('تم حظر حسابك لمخالفة شروط الاستخدام.')).toBeTruthy()
    expect(screen.queryByTestId('account-blocked-suspended-date')).toBeNull()
    expect(screen.getByTestId('account-blocked-icon').props.name).toBe('ban-outline')
  })

  it('renders correctly for ACCOUNT_SUSPENDED with valid date, single title, and prominent date line', async () => {
    const suspendedDate = new Date(2026, 11, 25, 12, 0).toISOString()
    useBlockedStore.getState().setBlocked({
      code: 'ACCOUNT_SUSPENDED',
      suspendedUntil: suspendedDate,
    })

    await render(<AccountBlockedScreen />)

    // Title appears once
    expect(screen.getAllByText('الحساب موقوف مؤقتاً')).toHaveLength(1)
    expect(screen.getByTestId('account-blocked-icon').props.name).toBe('time-outline')
    // Subtitle updated
    expect(screen.getByText('تم إيقاف حسابك مؤقتاً. سيُعاد تفعيله تلقائياً في:')).toBeTruthy()
    // Prominent date line appears
    const dateLine = screen.getByTestId('account-blocked-suspended-date')
    expect(dateLine).toBeTruthy()
    expect(dateLine.props.children).toMatch(/2026\/12\/25/)
  })

  it('renders fallback copy for ACCOUNT_SUSPENDED with null date and no separate date line', async () => {
    useBlockedStore.getState().setBlocked({
      code: 'ACCOUNT_SUSPENDED',
      suspendedUntil: null,
    })

    await render(<AccountBlockedScreen />)

    // Title appears once
    expect(screen.getAllByText('الحساب موقوف مؤقتاً')).toHaveLength(1)
    expect(screen.getByText('تم إيقاف حسابك مؤقتاً حتى إشعار آخر.')).toBeTruthy()
    // No separate date line when date is null
    expect(screen.queryByTestId('account-blocked-suspended-date')).toBeNull()
  })

  it('pressing return button clears store, logs out, and redirects to /(auth)/login', async () => {
    useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_BANNED' })

    await render(<AccountBlockedScreen />)
    const returnBtn = screen.getByTestId('account-blocked-return-btn')

    await act(async () => {
      fireEvent.press(returnBtn)
    })

    expect(useBlockedStore.getState().isBlocked).toBe(false)
    expect(mockLogout).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/(auth)/login')
  })

  it('pressing circular top back button clears store, logs out, and redirects to /(auth)/login', async () => {
    useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_SUSPENDED' })

    await render(<AccountBlockedScreen />)
    const backBtn = screen.getByTestId('account-blocked-back-btn')

    await act(async () => {
      fireEvent.press(backBtn)
    })

    expect(useBlockedStore.getState().isBlocked).toBe(false)
    expect(mockLogout).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/(auth)/login')
  })

  it('registers Android hardwareBackPress handler that clears store and navigates to login', async () => {
    useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_BANNED' })

    await render(<AccountBlockedScreen />)

    expect(BackHandler.addEventListener).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function)
    )

    const backHandlerCallback = (BackHandler.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'hardwareBackPress'
    )?.[1]

    expect(backHandlerCallback).toBeDefined()
    let consumed = false
    await act(async () => {
      consumed = backHandlerCallback()
    })

    expect(consumed).toBe(true)
    expect(useBlockedStore.getState().isBlocked).toBe(false)
    expect(mockLogout).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/(auth)/login')
  })

  it(`tapping support email opens ${SUPPORT_MAILTO}`, async () => {
    useBlockedStore.getState().setBlocked({ code: 'ACCOUNT_BANNED' })

    await render(<AccountBlockedScreen />)
    const emailLink = screen.getByText(SUPPORT_EMAIL)

    await act(async () => {
      fireEvent.press(emailLink)
    })

    expect(Linking.openURL).toHaveBeenCalledWith(SUPPORT_MAILTO)
  })
})

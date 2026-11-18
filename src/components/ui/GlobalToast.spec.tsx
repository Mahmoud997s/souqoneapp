import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react-native'
import { usePathname } from 'expo-router'
import { GlobalToast, TOAST_ENTER_OFFSET_Y, TOAST_EXIT_OFFSET_Y } from './GlobalToast'
import { useToastStore } from '../../store/toastStore'
import {
  classifyToastRoute,
  computeGlobalToastBottomOffset,
} from '../../constants/toastLayout'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => '/'),
}))

describe('GlobalToast', () => {
  beforeEach(() => {
    useToastStore.setState({ current: null })
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders nothing when there is no active toast', async () => {
    await render(<GlobalToast />)
    expect(screen.queryByTestId('global-toast-container')).toBeNull()
  })

  it('renders toast with title and message when provided', async () => {
    useToastStore.setState({
      current: {
        id: '1',
        kind: 'success',
        title: 'تمت إضافة الإعلان إلى المفضلة',
        message: 'حافلة مرسيدس 2024',
        durationMs: 60000,
      },
    })

    await render(<GlobalToast />)
    await waitFor(() => {
      expect(screen.getByTestId('global-toast-container')).toBeTruthy()
      expect(screen.getByText('تمت إضافة الإعلان إلى المفضلة')).toBeTruthy()
      expect(screen.getByText('حافلة مرسيدس 2024')).toBeTruthy()
    })
  })

  it('renders only title without empty message line when message is absent', async () => {
    useToastStore.setState({
      current: {
        id: '2',
        kind: 'neutral',
        title: 'تمت إزالة الإعلان من المفضلة',
        durationMs: 60000,
      },
    })

    await render(<GlobalToast />)
    await waitFor(() => {
      expect(screen.getByText('تمت إزالة الإعلان من المفضلة')).toBeTruthy()
      expect(screen.queryByText('undefined')).toBeNull()
    })
  })

  it('dismisses toast on card press', async () => {
    useToastStore.setState({
      current: {
        id: '3',
        kind: 'error',
        title: 'إشعار',
        durationMs: 60000,
      },
    })

    await render(<GlobalToast />)
    const card = await screen.findByTestId('global-toast-card')
    fireEvent.press(card)
    await waitFor(() => {
      expect(useToastStore.getState().current).toBeNull()
    })
  })

  it('auto-dismisses toast after durationMs', async () => {
    useToastStore.setState({
      current: {
        id: 'timer-1',
        kind: 'success',
        title: 'تمت إضافة الإعلان إلى المفضلة',
        durationMs: 300,
      },
    })
    await render(<GlobalToast />)
    await waitFor(() => {
      expect(screen.getByTestId('global-toast-container')).toBeTruthy()
    })

    await waitFor(
      () => {
        expect(useToastStore.getState().current).toBeNull()
      },
      { timeout: 1500 }
    )
  })

  it('anchors at the bottom (no top) with positive slide-up/slide-down offsets and reacts to usePathname navigation', async () => {
    const mockedUsePathname = usePathname as jest.Mock
    mockedUsePathname.mockReturnValue('/cars/123')

    useToastStore.setState({
      current: {
        id: '10',
        kind: 'success',
        title: 'تمت الإضافة إلى المفضلة',
        durationMs: 60000,
      },
    })

    await render(<GlobalToast />)
    const host = screen.getByTestId('global-toast-host')
    const hostStyle = StyleSheet.flatten(host.props.style)
    expect(hostStyle.top).toBeUndefined()
    expect(hostStyle.bottom).toBe(
      computeGlobalToastBottomOffset({ pathname: '/cars/123', bottomInset: 0 })
    )
    expect(TOAST_ENTER_OFFSET_Y).toBeGreaterThan(0)
    expect(TOAST_EXIT_OFFSET_Y).toBeGreaterThan(0)

    // Simulate route navigation to a plain screen
    mockedUsePathname.mockReturnValue('/profile/settings')
    await act(async () => {
      useToastStore.setState({
        current: {
          id: '11',
          kind: 'neutral',
          title: 'تم التحديث',
          durationMs: 60000,
        },
      })
    })
    const updatedStyle = StyleSheet.flatten(screen.getByTestId('global-toast-host').props.style)
    expect(updatedStyle.bottom).toBe(
      computeGlobalToastBottomOffset({ pathname: '/profile/settings', bottomInset: 0 })
    )
  })

  it('computes safe bottom offsets for iPhone (34) and Android (0) across all screen kinds and keyboard states', () => {
    // Initial mount fallback when pathname is empty/undefined -> plain
    expect(classifyToastRoute(undefined)).toBe('plain')
    expect(classifyToastRoute('')).toBe('plain')

    // Closed keyboard — iPhone (bottomInset = 34)
    expect(computeGlobalToastBottomOffset({ pathname: '/', bottomInset: 34 })).toBe(102)
    expect(computeGlobalToastBottomOffset({ pathname: '/cars/browse', bottomInset: 34 })).toBe(102)
    expect(computeGlobalToastBottomOffset({ pathname: '/cars/abc', bottomInset: 34 })).toBe(111)
    expect(computeGlobalToastBottomOffset({ pathname: '/cars/new', bottomInset: 34 })).toBe(116)
    expect(computeGlobalToastBottomOffset({ pathname: '/chat/r1', bottomInset: 34 })).toBe(118)
    expect(computeGlobalToastBottomOffset({ pathname: '/profile/settings', bottomInset: 34 })).toBe(50)

    // Closed keyboard — Android (bottomInset = 0)
    expect(computeGlobalToastBottomOffset({ pathname: '/', bottomInset: 0 })).toBe(84)
    expect(computeGlobalToastBottomOffset({ pathname: '/cars/browse', bottomInset: 0 })).toBe(80)
    expect(computeGlobalToastBottomOffset({ pathname: '/cars/abc', bottomInset: 0 })).toBe(89)
    expect(computeGlobalToastBottomOffset({ pathname: '/cars/new', bottomInset: 0 })).toBe(94)
    expect(computeGlobalToastBottomOffset({ pathname: '/chat/r1', bottomInset: 0 })).toBe(96)
    expect(computeGlobalToastBottomOffset({ pathname: '/profile/settings', bottomInset: 0 })).toBe(28)

    // Keyboard open branches: iOS adds keyboardHeight; Android adjustResize does not double-add
    expect(
      computeGlobalToastBottomOffset({
        pathname: '/cars/new',
        bottomInset: 34,
        keyboardHeight: 300,
        platformOS: 'ios',
      })
    ).toBe(312)
    expect(
      computeGlobalToastBottomOffset({
        pathname: '/chat/r1',
        bottomInset: 34,
        keyboardHeight: 300,
        platformOS: 'ios',
      })
    ).toBe(384)
    expect(
      computeGlobalToastBottomOffset({
        pathname: '/cars/new',
        bottomInset: 0,
        keyboardHeight: 280,
        platformOS: 'android',
      })
    ).toBe(16)
    expect(
      computeGlobalToastBottomOffset({
        pathname: '/chat/r1',
        bottomInset: 0,
        keyboardHeight: 280,
        platformOS: 'android',
      })
    ).toBe(84)
  })
})

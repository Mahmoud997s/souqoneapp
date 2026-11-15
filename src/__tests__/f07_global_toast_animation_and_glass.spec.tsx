import React from 'react'
import { AccessibilityInfo, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GlobalToast } from '../components/ui/GlobalToast'
import { useToastStore, toastService, TOAST_DURATION_MS } from '../store/toastStore'
import { useFavoriteToggle } from '../features/favorites/useFavoriteToggle'
import { favoritesApi } from '../api/favorites'
import { useAuthStore } from '../store/authStore'
import { Radius } from '../constants/radius'

let mockReducedMotion = false

jest.mock('../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: () => mockReducedMotion,
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: jest.fn(() => '/'),
}))

jest.mock('../api/favorites', () => ({
  favoritesApi: {
    add: jest.fn(),
    ids: jest.fn(),
    check: jest.fn(),
  },
}))

jest.mock('../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
  },
}))

jest.mock('@expo/vector-icons', () => {
  const ReactActual = require('react')
  const { Text: RNText } = require('react-native')
  return {
    Ionicons: ({
      name,
      size,
      color,
    }: {
      name: string
      size?: number
      color?: string
    }) =>
      ReactActual.createElement(
        RNText,
        {
          testID: 'toast-vector-icon',
          accessibilityLabel: `${name}|${size ?? ''}|${color ?? ''}`,
        },
        name
      ),
  }
})

function FavoriteHarness({ initialIsFavorite }: { initialIsFavorite: boolean }) {
  const { toggle } = useFavoriteToggle('CAR_LISTING', 'car-101', initialIsFavorite, {
    title: 'تويوتا كامري 2024',
  })
  return (
    <View>
      <TouchableOpacity testID="fav-toggle-btn" onPress={toggle}>
        <Text>toggle</Text>
      </TouchableOpacity>
    </View>
  )
}

describe('F-07 GlobalToast Liquid Glass Capsule, Icon Mapping & Smooth Exit', () => {
  let reduceTransparencySpy: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    mockReducedMotion = false
    useToastStore.setState({ current: null })
    useAuthStore.setState({ isLoggedIn: true })
    reduceTransparencySpy = jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(false)
    ;(favoritesApi.ids as jest.Mock).mockResolvedValue({ data: [] })
    ;(favoritesApi.check as jest.Mock).mockResolvedValue({ data: { favorited: false } })
  })

  afterEach(async () => {
    await cleanup()
    await act(async () => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    reduceTransparencySpy.mockRestore()
    jest.clearAllMocks()
  })

  it('preserves TOAST_DURATION_MS = 5000 and supports optional icon on toastStore', () => {
    expect(TOAST_DURATION_MS).toBe(5000)

    toastService.show({
      kind: 'success',
      icon: 'heart',
      title: 'تمت الإضافة',
    })
    const withIcon = useToastStore.getState().current
    expect(withIcon?.icon).toBe('heart')
    expect(withIcon?.durationMs).toBe(5000)

    toastService.show({
      kind: 'success',
      title: 'تم الحفظ',
    })
    expect(useToastStore.getState().current?.icon).toBeUndefined()
  })

  it('passes favorite-specific icons from useFavoriteToggle while generic success uses checkmark icon', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    ;(favoritesApi.add as jest.Mock).mockResolvedValueOnce({ data: { favorited: true } })
    await render(
      <QueryClientProvider client={queryClient}>
        <FavoriteHarness initialIsFavorite={false} />
      </QueryClientProvider>
    )

    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-toggle-btn'))
      await Promise.resolve()
    })

    const addedToast = useToastStore.getState().current
    expect(addedToast?.kind).toBe('success')
    expect(addedToast?.icon).toBe('heart')
    expect(addedToast?.title).toBe('تمت إضافة الإعلان إلى المفضلة')

    await cleanup()
    ;(favoritesApi.add as jest.Mock).mockResolvedValueOnce({ data: { favorited: false } })
    await render(
      <QueryClientProvider client={queryClient}>
        <FavoriteHarness initialIsFavorite />
      </QueryClientProvider>
    )

    await act(async () => {
      fireEvent.press(screen.getByTestId('fav-toggle-btn'))
      await Promise.resolve()
    })

    const removedToast = useToastStore.getState().current
    expect(removedToast?.kind).toBe('neutral')
    expect(removedToast?.icon).toBe('heart-dislike-outline')
    expect(removedToast?.title).toBe('تمت إزالة الإعلان من المفضلة')

    queryClient.clear()
  })

  it('renders GlassSurface capsule with compact proportions, default icons, and bottom placement', async () => {
    await render(<GlobalToast />)

    await act(async () => {
      toastService.show({
        kind: 'success',
        title: 'تم حفظ التعديلات بنجاح',
        message: 'تم تحديث بيانات حسابك بنجاح',
      })
      await Promise.resolve()
    })

    const host = screen.getByTestId('global-toast-host')
    const hostStyle = StyleSheet.flatten(host.props.style)
    expect(hostStyle.top).toBeUndefined()
    expect(typeof hostStyle.bottom).toBe('number')
    expect(hostStyle.bottom).toBeGreaterThan(0)

    const glassElements = [
      ...screen.queryAllByTestId('global-toast-glass-liquid'),
      ...screen.queryAllByTestId('global-toast-glass-blur'),
    ]
    expect(glassElements.length).toBeGreaterThan(0)

    const container = screen.getByTestId('global-toast-container')
    const containerStyle = StyleSheet.flatten(container.props.style)
    expect(containerStyle.borderRadius).toBe(Radius.pill)
    expect(containerStyle.overflow).toBe('hidden')

    const iconChip = screen.getByTestId('global-toast-icon-chip')
    const iconChipStyle = StyleSheet.flatten(iconChip.props.style)
    expect(iconChipStyle.width).toBeLessThanOrEqual(32)
    expect(iconChipStyle.height).toBeLessThanOrEqual(32)

    const icon = screen.getByTestId('toast-vector-icon')
    expect(icon.props.children).toBe('checkmark-circle-outline')

    const title = screen.getByText('تم حفظ التعديلات بنجاح')
    expect(title.props.numberOfLines).toBe(2)

    await act(async () => {
      toastService.show({
        kind: 'neutral',
        title: 'تنبيه عام',
      })
      await Promise.resolve()
    })
    expect(screen.getByTestId('toast-vector-icon').props.children).toBe(
      'information-circle-outline'
    )

    await act(async () => {
      toastService.show({
        kind: 'error',
        title: 'حدث خطأ',
      })
      await Promise.resolve()
    })
    expect(screen.getByTestId('toast-vector-icon').props.children).toBe('alert-circle-outline')
  })

  it('keeps toast mounted during exit transition (~180ms) before clearing store, and bypasses wait on reduced motion', async () => {
    await render(<GlobalToast />)

    await act(async () => {
      toastService.show({
        kind: 'success',
        title: 'تنبيه متحرك',
        durationMs: 5000,
      })
      await Promise.resolve()
    })

    expect(screen.getByTestId('global-toast-container')).toBeTruthy()

    await act(async () => {
      fireEvent.press(screen.getByTestId('global-toast-card'))
    })

    // During smooth exit (~50ms), toast must still remain rendered (not wiped at t=0)
    await act(async () => {
      jest.advanceTimersByTime(50)
    })
    expect(screen.queryByTestId('global-toast-container')).toBeTruthy()
    expect(useToastStore.getState().current).not.toBeNull()

    // After exit completes (>=180ms), toast store clears and container unmounts
    await act(async () => {
      jest.advanceTimersByTime(200)
    })
    expect(useToastStore.getState().current).toBeNull()
    expect(screen.queryByTestId('global-toast-container')).toBeNull()

    // With reduced motion enabled, dismiss clears immediately at t=0
    await cleanup()
    mockReducedMotion = true
    await render(<GlobalToast />)

    await act(async () => {
      toastService.show({
        kind: 'success',
        title: 'تنبيه بدون حركة',
      })
      await Promise.resolve()
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('global-toast-card'))
    })

    expect(useToastStore.getState().current).toBeNull()
    expect(screen.queryByTestId('global-toast-container')).toBeNull()
  })

  it('prevents an in-flight exit timer from dismissing a newer toast', async () => {
    await render(<GlobalToast />)

    await act(async () => {
      toastService.show({
        kind: 'neutral',
        title: 'إشعار أول',
      })
      await Promise.resolve()
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('global-toast-card'))
    })

    await act(async () => {
      jest.advanceTimersByTime(50)
      toastService.show({
        kind: 'success',
        title: 'إشعار أحدث',
      })
      await Promise.resolve()
    })

    await act(async () => {
      jest.advanceTimersByTime(250)
    })

    expect(useToastStore.getState().current?.title).toBe('إشعار أحدث')
    expect(screen.getByText('إشعار أحدث')).toBeTruthy()
  })
})

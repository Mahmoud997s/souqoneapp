import React from 'react'
import fs from 'fs'
import path from 'path'
import { StyleSheet } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook, waitFor, within } from '@testing-library/react-native'
import { Colors } from '../../constants/colors'
import { computeChatUnreadTotal, useChatRooms, useChatTabUnreadCount } from '../../hooks/useChat'
import { chatApi } from '../../api/chat'
import { CustomTabBar } from '../../../app/(tabs)/_layout'
import { GlassNavBar } from '../../components/ui/GlassNavBar'
import type { ChatRoom } from '../../types/listing.types'

let mockNavHiddenValue = 0

jest.mock('expo-router', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    useRouter: () => ({ push: jest.fn() }),
    Tabs: Object.assign((props: any) => React.createElement(View, props), {
      Screen: (props: any) => React.createElement(View, props),
    }),
  }
})

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ isLoggedIn: true }),
}))

jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({ navHidden: { value: mockNavHiddenValue } }),
}))

jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: () => false,
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}))

jest.mock('expo-blur', () => {
  const React = require('react')
  const { View } = require('react-native')
  return { BlurView: (props: any) => React.createElement(View, props) }
})

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) => React.createElement(View, { testID: `icon-Ionicons-${props.name}`, ...props }),
  }
})

jest.mock('../../components/navigation/glassSupport', () => ({
  GlassSurface: 'GlassSurface',
  useGlassSupport: () => ({ mode: 'solid' }),
}))

jest.mock('../../api/chat', () => ({
  chatApi: {
    getRooms: jest.fn(),
  },
}))

function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = hexLuminance(hexA)
  const l2 = hexLuminance(hexB)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

function makeRoom(overrides: Partial<ChatRoom>): ChatRoom {
  return {
    id: 'r1',
    entityType: 'CAR',
    entityId: 'c1',
    participants: [],
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
    archived: false,
    ...overrides,
  }
}

function makeTabBarProps(index = 0) {
  const routes = [
    { key: 'index-key', name: 'index' },
    { key: 'search-key', name: 'search' },
    { key: 'post-key', name: 'post' },
    { key: 'chat-key', name: 'chat' },
    { key: 'profile-key', name: 'profile' },
  ]
  return {
    state: {
      index,
      routes,
      routeNames: routes.map((r) => r.name),
      key: 'tabs-state',
      type: 'tab',
      stale: false,
      history: [],
    } as any,
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() } as any,
    descriptors: {
      'index-key': { options: { title: 'الرئيسية' } },
      'search-key': { options: { title: 'البحث' } },
      'post-key': { options: { title: 'أضف' } },
      'chat-key': { options: { title: 'رسائل' } },
      'profile-key': { options: { title: 'حسابي' } },
    } as any,
    insets: { top: 0, bottom: 20, left: 0, right: 0 },
  }
}

describe('D-399 — Chat Tab Badge & Round Nav Buttons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavHiddenValue = 0
  })

  it('1. computeChatUnreadTotal excludes archived rooms and sums non-archived unread counts', () => {
    expect(computeChatUnreadTotal([])).toBe(0)
    expect(computeChatUnreadTotal([makeRoom({ id: 'a1', archived: true, unreadCount: 12 })])).toBe(0)
    expect(
      computeChatUnreadTotal([
        makeRoom({ id: 'r1', archived: false, unreadCount: 2 }),
        makeRoom({ id: 'r2', archived: false, unreadCount: 1 }),
        makeRoom({ id: 'a1', archived: true, unreadCount: 9 }),
      ])
    ).toBe(3)
  })

  it('2. useChatTabUnreadCount shares the single chat-rooms query (only 1 request)', async () => {
    ;(chatApi.getRooms as jest.Mock).mockResolvedValue({
      data: [makeRoom({ id: 'r1', unreadCount: 3 }), makeRoom({ id: 'a1', archived: true, unreadCount: 5 })],
    })
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    )

    const { result } = await renderHook(
      () => ({
        rooms: useChatRooms(),
        unread: useChatTabUnreadCount(true),
      }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.unread).toBe(3))
    expect(chatApi.getRooms).toHaveBeenCalledTimes(1)
  })

  it('3. badge contrast >= 4.5, hidden at 0 / archived-only, shows 3 and 99+, and sets accessibilityLabel + RTL end', async () => {
    expect(contrastRatio(Colors.white, Colors.primaryStrong)).toBeGreaterThanOrEqual(4.5)

    ;(chatApi.getRooms as jest.Mock).mockResolvedValue({
      data: [makeRoom({ id: 'a1', archived: true, unreadCount: 4 })],
    })
    const qc0 = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    const view0 = await render(
      <QueryClientProvider client={qc0}>
        <CustomTabBar {...makeTabBarProps(0)} />
      </QueryClientProvider>
    )
    await waitFor(() => expect(chatApi.getRooms).toHaveBeenCalledTimes(1))
    expect(view0.queryByTestId('chat-tab-badge')).toBeNull()

    ;(chatApi.getRooms as jest.Mock).mockResolvedValue({
      data: [makeRoom({ id: 'r1', unreadCount: 3 })],
    })
    const qc3 = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    const view3 = await render(
      <QueryClientProvider client={qc3}>
        <CustomTabBar {...makeTabBarProps(0)} />
      </QueryClientProvider>
    )
    await waitFor(() => expect(view3.getByTestId('chat-tab-badge')).toBeTruthy())
    const badge3 = view3.getByTestId('chat-tab-badge')
    const badge3Style = StyleSheet.flatten(badge3.props.style)
    expect(badge3Style.backgroundColor).toBe(Colors.primaryStrong)
    expect(badge3Style.end).toBe(-4)
    expect(badge3Style.right).toBeUndefined()
    expect(within(badge3).getByText('3')).toBeTruthy()
    expect(view3.getByLabelText('رسائل، 3 غير مقروءة')).toBeTruthy()

    ;(chatApi.getRooms as jest.Mock).mockResolvedValue({
      data: [makeRoom({ id: 'r1', unreadCount: 105 })],
    })
    const qc105 = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    const view105 = await render(
      <QueryClientProvider client={qc105}>
        <CustomTabBar {...makeTabBarProps(0)} />
      </QueryClientProvider>
    )
    await waitFor(() => expect(view105.getByTestId('chat-tab-badge')).toBeTruthy())
    expect(within(view105.getByTestId('chat-tab-badge')).getByText('99+')).toBeTruthy()
  })

  it('4. GlassNavBar defaults to rounded (12) for non-chat screens and supports circle (19 = 38/2) for chat', async () => {
    const defaultView = await render(
      <GlassNavBar
        title="إضافة سيارة"
        paddingTop={20}
        onBackPress={jest.fn()}
        actions={[{ icon: 'ellipsis-vertical', onPress: jest.fn(), accessibilityLabel: 'خيارات', testID: 'act-btn' }]}
      />
    )
    const defaultBack = StyleSheet.flatten(defaultView.getByTestId('glass-nav-bar-back-btn').props.style)
    const defaultAction = StyleSheet.flatten(defaultView.getByTestId('act-btn').props.style)
    expect(defaultBack.borderRadius).toBe(12)
    expect(defaultAction.borderRadius).toBe(12)
    expect(StyleSheet.flatten(defaultView.getByTestId('glass-nav-bar-back-glass-backing').props.style).borderRadius).toBe(12)

    const circleView = await render(
      <GlassNavBar
        title="محمد الكندي"
        paddingTop={20}
        onBackPress={jest.fn()}
        buttonShape="circle"
        testID="chat-room-nav-bar"
        actions={[{ icon: 'ellipsis-vertical', onPress: jest.fn(), accessibilityLabel: 'خيارات', testID: 'chat-act-btn' }]}
      />
    )
    const circleBack = StyleSheet.flatten(circleView.getByTestId('chat-room-nav-bar-back-btn').props.style)
    const circleAction = StyleSheet.flatten(circleView.getByTestId('chat-act-btn').props.style)
    expect(circleBack.width).toBe(38)
    expect(circleBack.borderRadius).toBe(19)
    expect(circleAction.borderRadius).toBe(19)
    expect(StyleSheet.flatten(circleView.getByTestId('chat-room-nav-bar-back-glass-backing').props.style).borderRadius).toBe(19)

    const repoRoot = path.resolve(__dirname, '..', '..', '..')
    const chatRoomSrc = fs.readFileSync(path.join(repoRoot, 'app', 'chat', '[id].tsx'), 'utf8')
    const carsNewSrc = fs.readFileSync(path.join(repoRoot, 'app', 'cars', 'new.tsx'), 'utf8')
    expect(chatRoomSrc).toContain('buttonShape="circle"')
    expect(carsNewSrc).not.toContain('buttonShape="circle"')
  })
})

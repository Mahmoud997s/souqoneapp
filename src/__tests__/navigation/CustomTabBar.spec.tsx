import React from 'react'
import { View } from 'react-native'
import { render, fireEvent, cleanup, within } from '@testing-library/react-native'
import { CustomTabBar } from '../../../app/(tabs)/_layout'
import { BottomBarTokens } from '../../constants/bottomBarTokens'

// Mock expo-router
const mockPush = jest.fn()
jest.mock('expo-router', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    useRouter: () => ({
      push: mockPush,
    }),
    Tabs: Object.assign(
      (props: any) => React.createElement(View, props),
      {
        Screen: (props: any) => React.createElement(View, props),
      }
    ),
  }
})

// Mock authStore
let mockIsLoggedIn = true
jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    isLoggedIn: mockIsLoggedIn,
  }),
}))

// Mock NavVisibilityContext with mutable shared value
const mockNavHidden = { value: 0 }
jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: mockNavHidden,
  }),
}))

// Mock useAppReducedMotion
jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: jest.fn(() => false),
}))

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}))

// Mock expo-blur
jest.mock('expo-blur', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: any) => React.createElement(View, props),
  }
})

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) =>
      React.createElement(View, { testID: `icon-Ionicons-${props.name}`, ...props }),
  }
})

const routes = [
  { key: 'index-key', name: 'index' },
  { key: 'search-key', name: 'search' },
  { key: 'post-key', name: 'post' },
  { key: 'chat-key', name: 'chat' },
  { key: 'profile-key', name: 'profile' },
]

function makeProps(overrides?: {
  index?: number
  defaultPrevented?: boolean
  profileTabBarStyle?: any
}) {
  const index = overrides?.index ?? 0
  const state = {
    index,
    routes,
    routeNames: routes.map((r) => r.name),
    key: 'tabs-state',
    type: 'tab',
    stale: false,
    history: [],
  } as any

  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented: overrides?.defaultPrevented ?? false })),
    navigate: jest.fn(),
  } as any

  const descriptors = {
    'index-key': { options: { title: 'الرئيسية' } },
    'search-key': { options: { title: 'البحث' } },
    'post-key': { options: { title: 'أضف' } },
    'chat-key': { options: { title: 'رسائل' } },
    'profile-key': {
      options: {
        title: 'حسابي',
        tabBarStyle: overrides?.profileTabBarStyle ?? (index === 4 ? { display: 'none' } : undefined),
      },
    },
  } as any

  const insets = { top: 0, bottom: 20, left: 0, right: 0 }

  return { state, navigation, descriptors, insets }
}

describe('CustomTabBar (Task D-168 Stage 3 Adoption)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoggedIn = true
    mockNavHidden.value = 0
  })

  afterEach(() => {
    cleanup()
  })

  it('(a) tab press navigates as before', async () => {
    const props = makeProps({ index: 0 })
    const { getByText } = await render(<CustomTabBar {...props} />)

    // Press search tab
    const searchTab = getByText('البحث')
    fireEvent.press(searchTab)

    expect(props.navigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'search-key',
      canPreventDefault: true,
    })
    expect(props.navigation.navigate).toHaveBeenCalledWith('search')
  })

  it('(b) logged-out press on chat/profile redirects to login and does not navigate', async () => {
    mockIsLoggedIn = false
    const props = makeProps({ index: 0 })
    const { getByText } = await render(<CustomTabBar {...props} />)

    // Press chat tab while logged out
    const chatTab = getByText('رسائل')
    fireEvent.press(chatTab)

    expect(mockPush).toHaveBeenCalledWith('/(auth)/login')
    expect(props.navigation.navigate).not.toHaveBeenCalled()
  })

  it('(c1) "+" in the expanded bar calls the post flow when logged in', async () => {
    mockNavHidden.value = 0
    mockIsLoggedIn = true
    const props = makeProps({ index: 0 })
    const { getByTestId } = await render(<CustomTabBar {...props} />)

    const postFab = getByTestId('tab-post-fab')
    fireEvent.press(postFab)
    expect(mockPush).toHaveBeenCalledWith('/(modals)/post-category')
  })

  it('(c2) "+" in the expanded bar redirects to login when logged out', async () => {
    mockNavHidden.value = 0
    mockIsLoggedIn = false
    const props = makeProps({ index: 0 })
    const { getByTestId } = await render(<CustomTabBar {...props} />)

    const postFab = getByTestId('tab-post-fab')
    fireEvent.press(postFab)
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login')
  })

  it('(d) returns null when the focused route hides the tab bar (e.g. Profile tab)', async () => {
    const props = makeProps({
      index: 4,
      profileTabBarStyle: { display: 'none' },
    })
    const { toJSON, queryByTestId } = await render(<CustomTabBar {...props} />)

    expect(toJSON()).toBeNull()
    expect(queryByTestId('custom-tab-bar')).toBeNull()
  })

  it('(e) collapsed state shows only current tab icon, tap expands and does not navigate', async () => {
    mockNavHidden.value = 1
    // Focused tab = search (index: 1)
    const props = makeProps({ index: 1 })
    const { getByTestId } = await render(<CustomTabBar {...props} />)

    const collapsedBtn = getByTestId('bottom-bar-collapsed-button')
    expect(collapsedBtn).toBeTruthy()

    const collapsedScope = within(collapsedBtn)
    // Current tab icon is search
    expect(collapsedScope.getByTestId('icon-Ionicons-search')).toBeTruthy()
    // Non-active tab icons are NOT in collapsed button
    expect(collapsedScope.queryByTestId('icon-Ionicons-home')).toBeNull()
    expect(collapsedScope.queryByTestId('icon-Ionicons-chatbubble')).toBeNull()

    // Tapping collapsed button expands (resets navHidden to 0) and NEVER navigates or calls router.push
    fireEvent.press(collapsedBtn)
    expect(mockNavHidden.value).toBe(0)
    expect(props.navigation.navigate).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('(f) the old floating capsule no longer exists (no floatingFabWrap)', async () => {
    mockNavHidden.value = 1
    const props = makeProps({ index: 0 })
    const { queryByTestId } = await render(<CustomTabBar {...props} />)

    // No old floating capsule or floating fab element
    expect(queryByTestId('floating-fab-wrap')).toBeNull()
    expect(queryByTestId('floating-fab')).toBeNull()
  })

  it('(g1) badge on the chat tab is rendered in expanded bar', async () => {
    mockNavHidden.value = 0
    const props = makeProps({ index: 0 })
    const { getByTestId } = await render(<CustomTabBar {...props} />)

    expect(getByTestId('chat-tab-badge')).toBeTruthy()
  })

  it('(g2) badge on the chat tab is rendered when chat tab is focused in collapsed circle', async () => {
    mockNavHidden.value = 1
    const props = makeProps({ index: 3 })
    const { getByTestId } = await render(<CustomTabBar {...props} />)

    const collapsedBtn = getByTestId('bottom-bar-collapsed-button')
    expect(collapsedBtn).toBeTruthy()
    const collapsedScope = within(collapsedBtn)
    expect(collapsedScope.getByTestId('collapsed-chat-badge')).toBeTruthy()
    expect(collapsedScope.getByTestId('icon-Ionicons-chatbubble')).toBeTruthy()
  })
})

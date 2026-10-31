import React from 'react'
import { AccessibilityInfo, View, StyleSheet } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { TopBarTokens } from '../../constants/topBarTokens'
import { Radius } from '../../constants/radius'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}))

jest.mock('expo-blur', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: 'mock-blur-view', ...props }),
  }
})

jest.mock('expo-image', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Image: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: 'mock-expo-image', ...props }),
  }
})

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: { name: string }) =>
      React.createElement(View, { testID: `icon-Ionicons-${props.name}`, ...props }),
  }
})

describe('AnimatedHeroHeader — Liquid Glass Controls & Navbar Chat Button', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('Tooth a (Blur branch): circular buttons (back, notif, chat) render GlassSurface blur branch with transparent container and radius 19', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true)

    const { getByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        onBackPress={jest.fn()}
        onHeaderIconPress={jest.fn()}
        onChatPress={jest.fn()}
      />
    )
    await act(async () => {})

    const backBtn = getByTestId('hero-header-back-btn')
    const notifBtn = getByTestId('hero-header-notification-btn')
    const chatBtn = getByTestId('hero-header-chat-btn')

    // 1. Transparent background and overflow hidden
    const backStyle = StyleSheet.flatten(backBtn.props.style)
    expect(backStyle.width).toBe(TopBarTokens.buttonSize)
    expect(backStyle.height).toBe(TopBarTokens.buttonSize)
    expect(backStyle.borderRadius).toBe(TopBarTokens.buttonRadius)
    expect(backStyle.backgroundColor).toBe('transparent')
    expect(backStyle.overflow).toBe('hidden')
    expect(backStyle.borderWidth).toBeUndefined()

    const notifStyle = StyleSheet.flatten(notifBtn.props.style)
    expect(notifStyle.backgroundColor).toBe('transparent')
    expect(notifStyle.overflow).toBe('hidden')
    expect(notifStyle.borderWidth).toBeUndefined()

    const chatStyle = StyleSheet.flatten(chatBtn.props.style)
    expect(chatStyle.backgroundColor).toBe('transparent')
    expect(chatStyle.overflow).toBe('hidden')
    expect(chatStyle.borderWidth).toBeUndefined()

    // 2. GlassSurface blur instances
    const backBlur = getByTestId('hero-header-back-btn-glass-blur')
    expect(backBlur).toBeTruthy()
    expect(StyleSheet.flatten(backBlur.props.style).borderRadius).toBe(TopBarTokens.buttonRadius)

    const notifBlur = getByTestId('hero-header-notification-btn-glass-blur')
    expect(notifBlur).toBeTruthy()
    expect(StyleSheet.flatten(notifBlur.props.style).borderRadius).toBe(TopBarTokens.buttonRadius)

    const chatBlur = getByTestId('hero-header-chat-btn-glass-blur')
    expect(chatBlur).toBeTruthy()
    expect(StyleSheet.flatten(chatBlur.props.style).borderRadius).toBe(TopBarTokens.buttonRadius)
  })

  it('Tooth b (Liquid branch): circular buttons render native GlassView when liquid glass is supported', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false)

    const { getByTestId, queryByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        onBackPress={jest.fn()}
        onHeaderIconPress={jest.fn()}
        onChatPress={jest.fn()}
      />
    )
    await act(async () => {})

    expect(getByTestId('hero-header-back-btn-glass-liquid')).toBeTruthy()
    expect(getByTestId('hero-header-notification-btn-glass-liquid')).toBeTruthy()
    expect(getByTestId('hero-header-chat-btn-glass-liquid')).toBeTruthy()
    expect(getByTestId('hero-header-compact-filter-btn-glass-liquid')).toBeTruthy()
    expect(getByTestId('hero-header-large-filter-btn-glass-liquid')).toBeTruthy()
    expect(queryByTestId('hero-header-back-btn-glass-blur')).toBeNull()
    expect(queryByTestId('hero-header-notification-btn-glass-blur')).toBeNull()
    expect(queryByTestId('hero-header-chat-btn-glass-blur')).toBeNull()
    expect(queryByTestId('hero-header-compact-filter-btn-glass-blur')).toBeNull()
    expect(queryByTestId('hero-header-large-filter-btn-glass-blur')).toBeNull()
  })

  it('Tooth c (Navbar Chat button & Add button removal): navbar renders Chat button and NO add listing button remains', async () => {
    const onChatMock = jest.fn()
    const { getByTestId, queryByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        hideBackButton
        onChatPress={onChatMock}
      />
    )

    // Chat button exists with chat icon
    const chatBtn = getByTestId('hero-header-chat-btn')
    expect(chatBtn).toBeTruthy()
    expect(chatBtn.props.accessibilityLabel).toBe('الرسائل والمحادثات')
    expect(chatBtn.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)
    expect(getByTestId('icon-Ionicons-chatbubble-ellipses-outline')).toBeTruthy()

    // Press calls onChatPress
    fireEvent.press(chatBtn)
    expect(onChatMock).toHaveBeenCalledTimes(1)

    // No Add listing button exists in navbar
    expect(queryByTestId('hero-header-add-btn')).toBeNull()
  })

  it('Tooth d (Liquid Glass Search Bars): both compact and large search bars render GlassSurface with transparent background', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true)

    const { getByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        hideBackButton
      />
    )
    await act(async () => {})

    // 1. Compact Search Bar (Row 1)
    const compactSearch = getByTestId('hero-header-compact-search')
    const compactStyle = StyleSheet.flatten(compactSearch.props.style)
    expect(compactStyle.backgroundColor).toBe('transparent')
    expect(compactStyle.overflow).toBe('hidden')
    expect(compactStyle.height).toBe(TopBarTokens.searchHeight)
    expect(compactStyle.borderRadius).toBe(TopBarTokens.searchRadius)
    expect(getByTestId('hero-header-compact-search-glass-blur')).toBeTruthy()

    // 2. Large Search Bar (Row 2)
    const largeSearch = getByTestId('hero-header-large-search')
    const largeStyle = StyleSheet.flatten(largeSearch.props.style)
    expect(largeStyle.backgroundColor).toBe('transparent')
    expect(largeStyle.overflow).toBe('hidden')
    expect(largeStyle.height).toBe(44)
    expect(largeStyle.borderRadius).toBe(Radius.md)
    expect(getByTestId('hero-header-large-search-glass-blur')).toBeTruthy()

    // 3. Compact Search Filter Button (Inside Compact Search)
    const compactFilter = getByTestId('hero-header-compact-filter-btn')
    const compactFilterStyle = StyleSheet.flatten(compactFilter.props.style)
    expect(compactFilterStyle.backgroundColor).toBe('transparent')
    expect(compactFilterStyle.overflow).toBe('hidden')
    expect(compactFilterStyle.width).toBe(26)
    expect(compactFilterStyle.height).toBe(26)
    expect(compactFilterStyle.borderRadius).toBe(13)
    expect(getByTestId('hero-header-compact-filter-btn-glass-blur')).toBeTruthy()

    // 4. Large Search Filter Button (Inside Large Search)
    const largeFilter = getByTestId('hero-header-large-filter-btn')
    const largeFilterStyle = StyleSheet.flatten(largeFilter.props.style)
    expect(largeFilterStyle.backgroundColor).toBe('transparent')
    expect(largeFilterStyle.overflow).toBe('hidden')
    expect(largeFilterStyle.width).toBe(28)
    expect(largeFilterStyle.height).toBe(28)
    expect(largeFilterStyle.borderRadius).toBe(Radius.sm)
    expect(getByTestId('hero-header-large-filter-btn-glass-blur')).toBeTruthy()
  })

  it('Tooth e (Callbacks & HitSlop): back and notification buttons preserve hitSlop and press callbacks', async () => {
    const onBackMock = jest.fn()
    const onNotifMock = jest.fn()

    const { getByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        onBackPress={onBackMock}
        onHeaderIconPress={onNotifMock}
      />
    )

    const backBtn = getByTestId('hero-header-back-btn')
    const notifBtn = getByTestId('hero-header-notification-btn')

    expect(backBtn.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)
    expect(notifBtn.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)

    fireEvent.press(backBtn)
    expect(onBackMock).toHaveBeenCalledTimes(1)

    fireEvent.press(notifBtn)
    expect(onNotifMock).toHaveBeenCalledTimes(1)
  })
})

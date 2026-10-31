import React from 'react'
import { AccessibilityInfo, View, StyleSheet } from 'react-native'
import { render, fireEvent, act } from '@testing-library/react-native'
import { AnimatedHeroHeader } from '../../components/ui/AnimatedHeroHeader'
import { ADD_BUTTON_ASSET } from '../../components/navigation/AddListingButton'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
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

describe('AnimatedHeroHeader — Liquid Glass Buttons & Glossy Turquoise Add Button', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('Tooth a (Blur branch): circular buttons render GlassSurface blur branch with transparent container and radius 19', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true)

    const { getByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        onBackPress={jest.fn()}
        onHeaderIconPress={jest.fn()}
      />
    )
    await act(async () => {})

    const backBtn = getByTestId('hero-header-back-btn')
    const notifBtn = getByTestId('hero-header-notification-btn')

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

    const backBlur = getByTestId('hero-header-back-btn-glass-blur')
    expect(backBlur).toBeTruthy()
    expect(StyleSheet.flatten(backBlur.props.style).borderRadius).toBe(TopBarTokens.buttonRadius)

    const notifBlur = getByTestId('hero-header-notification-btn-glass-blur')
    expect(notifBlur).toBeTruthy()
    expect(StyleSheet.flatten(notifBlur.props.style).borderRadius).toBe(TopBarTokens.buttonRadius)
  })

  it('Tooth b (Liquid branch): circular buttons render native GlassView when liquid glass is supported', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(false)

    const { getByTestId, queryByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        onBackPress={jest.fn()}
        onHeaderIconPress={jest.fn()}
      />
    )
    await act(async () => {})

    expect(getByTestId('hero-header-back-btn-glass-liquid')).toBeTruthy()
    expect(getByTestId('hero-header-notification-btn-glass-liquid')).toBeTruthy()
    expect(queryByTestId('hero-header-back-btn-glass-blur')).toBeNull()
    expect(queryByTestId('hero-header-notification-btn-glass-blur')).toBeNull()
  })

  it('Tooth c (Glossy Turquoise Add Button): primaryCta renders AddListingButton with ADD_BUTTON_ASSET and calls onPress', async () => {
    const onPostMock = jest.fn()
    const { getByTestId, queryByTestId } = await render(
      <AnimatedHeroHeader
        title="ســوق ون"
        hideBackButton
        primaryCta={{
          label: 'إضافة إعلان',
          icon: 'add',
          onPress: onPostMock,
        }}
      />
    )

    const addBtn = getByTestId('hero-header-add-btn')
    expect(addBtn).toBeTruthy()
    expect(addBtn.props.accessibilityLabel).toBe('إضافة إعلان')
    expect(addBtn.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)

    const addImg = getByTestId('hero-header-add-btn-image')
    expect(addImg).toBeTruthy()
    expect(addImg.props.source).toBe(ADD_BUTTON_ASSET)

    await act(async () => {
      fireEvent.press(addBtn)
    })
    expect(onPostMock).toHaveBeenCalledTimes(1)

    expect(queryByTestId('icon-Ionicons-add')).toBeNull()
  })

  it('Tooth d (Callbacks & HitSlop): back and notification buttons preserve hitSlop and press callbacks', async () => {
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

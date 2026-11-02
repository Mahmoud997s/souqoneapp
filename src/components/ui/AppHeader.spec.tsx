import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AppHeader } from './AppHeader'
import { Colors } from '../../constants/colors'
import { TopBarTokens } from '../../constants/topBarTokens'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }))
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Defs: 'Defs',
  Pattern: 'Pattern',
  Path: 'Path',
  Rect: 'Rect',
}))
jest.mock('./TopBarGlassSurface', () => ({
  TopBarGlassSurface: 'TopBarGlassSurface',
}))

function renderHeader(element: React.ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer!
}

describe('AppHeader Home glass default', () => {
  test('uses the glass background by default in the dark theme without a back button', () => {
    const renderer = renderHeader(<AppHeader title="الرئيسية" />)

    expect(renderer.root.findAllByProps({ testID: 'browse-header' })).toHaveLength(1)
    expect(renderer.root.findAllByType(TouchableOpacity)).toHaveLength(0)
    expect(renderer.root.findByType(Text).props.style).toContainEqual(
      expect.objectContaining({ color: Colors.text }),
    )
  })

  test('uses a real ice-glass back control and readable title in the dark theme', () => {
    const renderer = renderHeader(<AppHeader title="إضافة إعلان" showBack />)
    const backButton = renderer.root.findByType(TouchableOpacity)
    const style = StyleSheet.flatten(backButton.props.style)

    expect(renderer.root.findAllByProps({ testID: 'app-header-back-glass' })).toHaveLength(1)
    expect(style).toMatchObject({
      width: TopBarTokens.buttonSize,
      height: TopBarTokens.buttonSize,
      borderRadius: TopBarTokens.buttonRadius,
      backgroundColor: TopBarTokens.iceGlass,
    })
    expect(backButton.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)
    expect(renderer.root.findByType(Text).props.style).toContainEqual(
      expect.objectContaining({ color: Colors.text }),
    )
  })

  test('keeps the light theme glass and preserves back and right-slot controls', () => {
    const renderer = renderHeader(
      <AppHeader
        theme="light"
        title="الإشعارات"
        showBack
        rightSlot={<View testID="notification-mark-all-read" />}
      />,
    )

    expect(renderer.root.findAllByProps({ testID: 'browse-header' })).toHaveLength(1)
    expect(renderer.root.findAllByProps({ testID: 'app-header-back-glass' })).toHaveLength(1)
    expect(
      renderer.root
        .findAllByType(View)
        .some(({ props }) => props.testID === 'notification-mark-all-read'),
    ).toBe(true)
  })

  test('uses an ice-glass right icon button in the dark theme', () => {
    const renderer = renderHeader(
      <AppHeader title="التقييمات والمراجعات" rightIcon="share-outline" />,
    )
    const button = renderer.root.findByType(TouchableOpacity)
    const style = StyleSheet.flatten(button.props.style)

    expect(renderer.root.findAllByProps({ testID: 'app-header-right-glass' })).toHaveLength(1)
    expect(style).toMatchObject({
      width: TopBarTokens.buttonSize,
      height: TopBarTokens.buttonSize,
      borderRadius: TopBarTokens.buttonRadius,
      backgroundColor: TopBarTokens.iceGlass,
    })
    expect(button.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)
  })

  test('keeps an explicit legacy escape hatch', () => {
    const renderer = renderHeader(
      <AppHeader title="Legacy" showBack glassBackground={false} />,
    )

    expect(renderer.root.findAll((node) => String(node.type) === 'TopBarGlassSurface')).toHaveLength(0)
    expect(renderer.root.findAll((node) => String(node.type) === 'LinearGradient')).toHaveLength(1)
  })

  test('smoke renders the post, notifications, subscription, and reviews route props', () => {
    const routeHeaders = [
      <AppHeader key="post" title="إضافة إعلان" showBack />,
      <AppHeader
        key="notifications"
        title="الإشعارات"
        showBack
        rightSlot={<View testID="notifications-action" />}
      />,
      <AppHeader key="subscription" title="SouqOne" showBack />,
      <AppHeader key="reviews" title="التقييمات والمراجعات" showBack />,
    ]

    for (const header of routeHeaders) {
      const renderer = renderHeader(header)
      expect(renderer.root.findAllByProps({ testID: 'browse-header' })).toHaveLength(1)
      expect(renderer.root.findAllByProps({ testID: 'app-header-back-glass' })).toHaveLength(1)
    }
  })
})

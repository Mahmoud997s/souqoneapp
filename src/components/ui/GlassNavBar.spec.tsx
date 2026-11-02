import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { GlassNavBar } from './GlassNavBar'
import { TopBarTokens } from '../../constants/topBarTokens'
import type { GlassNavBarAction } from './GlassNavBar'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('../navigation/glassSupport', () => ({ GlassSurface: 'GlassSurface' }))
jest.mock('./TopBarGlassSurface', () => ({
  TopBarGlassSurface: 'TopBarGlassSurface',
}))

function renderNavBar(props: React.ComponentProps<typeof GlassNavBar>) {
  let renderer: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<GlassNavBar {...props} />)
  })
  return renderer!
}

const profileScreens: Array<{
  name: string
  title: string
  actions: GlassNavBarAction[]
}> = [
  {
    name: 'profile tab',
    title: 'الملف الشخصي',
    actions: [
      { icon: 'chatbubble-outline', onPress: jest.fn(), accessibilityLabel: 'الرسائل' },
      { icon: 'notifications-outline', onPress: jest.fn(), accessibilityLabel: 'الإشعارات' },
      { icon: 'create-outline', onPress: jest.fn(), accessibilityLabel: 'تعديل الملف الشخصي' },
    ],
  },
  {
    name: 'my listings',
    title: 'إعلاناتي',
    actions: [{ icon: 'filter-outline', onPress: jest.fn(), accessibilityLabel: 'تصفية الإعلانات' }],
  },
  {
    name: 'favorites',
    title: 'المفضلة',
    actions: [{ icon: 'filter-outline', onPress: jest.fn(), accessibilityLabel: 'تصفية المفضلة' }],
  },
  {
    name: 'edit profile',
    title: 'تعديل الملف الشخصي',
    actions: [{ icon: 'checkmark-outline', onPress: jest.fn(), accessibilityLabel: 'حفظ' }],
  },
]

describe('GlassNavBar profile-only Home recipe', () => {
  test('keeps the default glass recipe unchanged for other routes', () => {
    const renderer = renderNavBar({
      title: 'إعدادات الحساب',
      paddingTop: 24,
      onBackPress: jest.fn(),
      actions: [
        {
          icon: 'filter-outline',
          onPress: jest.fn(),
          accessibilityLabel: 'تصفية',
        },
      ],
    })
    const icons = renderer.root.findAll((node) => String(node.type) === 'Ionicons')

    expect(renderer.root.findAll((node) => String(node.type) === 'TopBarGlassSurface')).toHaveLength(0)
    expect(renderer.root.findAll((node) => String(node.type) === 'GlassSurface')).toHaveLength(1)
    expect(icons).toHaveLength(2)
    expect(icons.every((icon) => icon.props.color === TopBarTokens.legacyNavIconColor)).toBe(true)
  })

  test.each(profileScreens)('smoke renders the $name route controls', ({ title, actions }) => {
    const props: React.ComponentProps<typeof GlassNavBar> & { appearance: 'home' } = {
      title,
      paddingTop: 24,
      onBackPress: jest.fn(),
      actions,
      appearance: 'home',
    }
    const renderer = renderNavBar(props)
    const surfaces = renderer.root.findAll((node) => String(node.type) === 'TopBarGlassSurface')
    const iceControls = surfaces.filter((surface) => surface.props.kind === 'ice-control')
    const backButton = renderer.root.findAllByType(TouchableOpacity)[0]
    const backStyle = StyleSheet.flatten(backButton.props.style)

    expect(surfaces.some((surface) => surface.props.kind === 'background')).toBe(true)
    expect(iceControls).toHaveLength(actions.length + 1)
    expect(backStyle).toMatchObject({
      width: TopBarTokens.buttonSize,
      height: TopBarTokens.buttonSize,
      borderRadius: TopBarTokens.buttonRadius,
      backgroundColor: TopBarTokens.iceGlass,
    })
    expect(backButton.props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)
  })
})

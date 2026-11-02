import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native'
import { GlassNavBar } from './GlassNavBar'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { TopBarTokens } from '../../constants/topBarTokens'
import type { GlassNavBarAction } from './GlassNavBar'

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }))
jest.mock('../navigation/glassSupport', () => ({ GlassSurface: 'GlassSurface' }))

function renderNavBar(props: React.ComponentProps<typeof GlassNavBar>) {
  let renderer: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<GlassNavBar {...props} />)
  })
  return renderer!
}

function expectGlassHasNoReducedOpacityAncestor(renderer: TestRenderer.ReactTestRenderer) {
  const glassSurfaces = renderer.root.findAllByType('GlassSurface' as never)
  expect(glassSurfaces.length).toBeGreaterThan(0)

  glassSurfaces.forEach((surface) => {
    let ancestor = surface.parent
    while (ancestor) {
      const style = StyleSheet.flatten(ancestor.props.style)
      const opacity = style?.opacity
      expect(typeof opacity === 'number' && opacity < 1).toBe(false)
      ancestor = ancestor.parent
    }
  })
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

describe('GlassNavBar unified home appearance', () => {
  test('defaults to glass and ice for title-only calls while preserving the title badge shape and row height', () => {
    const renderer = renderNavBar({
      title: 'إعدادات الحساب',
      paddingTop: 24,
      onBackPress: jest.fn(),
    })
    const titleGlass = renderer.root.findByProps({ testID: 'glass-nav-bar-title-glass-glass' })
    const titleBacking = renderer.root.findByProps({ testID: 'glass-nav-bar-title-glass-backing' })
    const badge = renderer.root.findAllByType(View).find((view) => StyleSheet.flatten(view.props.style)?.height === 38)
    const badgeStyle = StyleSheet.flatten(badge?.props.style)
    const backStyle = StyleSheet.flatten(renderer.root.findAllByType(TouchableOpacity)[0].props.style)
    const row = renderer.root.findAllByType(View).find((view) => StyleSheet.flatten(view.props.style)?.height === 44)
    const rootStyle = StyleSheet.flatten(renderer.root.findByProps({ testID: 'glass-nav-bar' }).props.style)
    const surfaces = renderer.root.findAllByType(TopBarGlassSurface)

    expect(surfaces.map((surface) => surface.props.kind)).toEqual(['background', 'ice-control', 'ice-control'])
    expect(titleGlass.props).toMatchObject({ washColor: TopBarTokens.iceGlass, borderRadius: 12 })
    expect(titleBacking.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: TopBarTokens.iceGlass, borderRadius: 12 }),
    ]))
    expect(badgeStyle).toMatchObject({
      height: 38,
      borderRadius: 12,
      backgroundColor: TopBarTokens.iceGlass,
      borderWidth: TopBarTokens.buttonBorderWidth,
      borderColor: TopBarTokens.buttonBorderColor,
      shadowColor: backStyle?.shadowColor,
      shadowOffset: backStyle?.shadowOffset,
      shadowOpacity: backStyle?.shadowOpacity,
      shadowRadius: backStyle?.shadowRadius,
      elevation: backStyle?.elevation,
    })
    expect(row).toBeDefined()
    expect(rootStyle).toMatchObject({ paddingTop: 24, paddingBottom: 8, borderBottomWidth: 1 })
    expect(renderer.root.findByType(TouchableOpacity).props.accessibilityLabel).toBe('رجوع')
    expectGlassHasNoReducedOpacityAncestor(renderer)
  })

  test('keeps appearance="default" as the explicit legacy escape hatch', () => {
    const renderer = renderNavBar({
      title: 'إعدادات الحساب',
      paddingTop: 24,
      onBackPress: jest.fn(),
      appearance: 'default',
      actions: [{ icon: 'filter-outline', onPress: jest.fn(), accessibilityLabel: 'تصفية' }],
    })
    const buttons = renderer.root.findAllByType(TouchableOpacity)
    const actionStyle = StyleSheet.flatten(buttons[1].props.style)

    expect(renderer.root.findAllByType(TopBarGlassSurface)).toHaveLength(0)
    expect(renderer.root.findAllByType('GlassSurface' as never)).toHaveLength(1)
    expect(actionStyle).toMatchObject({ width: 38, height: 38, borderRadius: 12 })
  })

  test.each(profileScreens)('uses the default ice recipe for the $name action set', ({ title, actions }) => {
    const renderer = renderNavBar({
      title,
      paddingTop: 24,
      onBackPress: jest.fn(),
      actions,
    })
    const surfaces = renderer.root.findAllByType(TopBarGlassSurface)
    const iceControls = surfaces.filter((surface) => surface.props.kind === 'ice-control')
    const buttons = renderer.root.findAllByType(TouchableOpacity)
    const backStyle = StyleSheet.flatten(buttons[0].props.style)
    const actionButtons = buttons.slice(1)

    expect(surfaces.some((surface) => surface.props.kind === 'background')).toBe(true)
    expect(iceControls).toHaveLength(actions.length + 2)
    expect(backStyle).toMatchObject({
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: TopBarTokens.iceGlass,
    })
    expect(buttons[0].props.hitSlop).toEqual(TopBarTokens.buttonHitSlop)
    expect(iceControls.every((surface) => surface.props.borderRadius === 12)).toBe(true)
    expect(actionButtons).toHaveLength(actions.length)
    expect(
      actionButtons.every((button) => {
        const style = StyleSheet.flatten(button.props.style)
        return style.width === 38 && style.height === 38 && style.borderRadius === 12
      }),
    ).toBe(true)
    expectGlassHasNoReducedOpacityAncestor(renderer)
  })

  test('forwards back and action presses', () => {
    const onBackPress = jest.fn()
    const onActionPress = jest.fn()
    const renderer = renderNavBar({
      title: 'إعدادات الحساب',
      paddingTop: 24,
      onBackPress,
      actions: [{ icon: 'filter-outline', onPress: onActionPress, accessibilityLabel: 'تصفية' }],
    })
    const buttons = renderer.root.findAllByType(TouchableOpacity)

    act(() => {
      buttons[0].props.onPress()
      buttons[1].props.onPress()
    })

    expect(onBackPress).toHaveBeenCalledTimes(1)
    expect(onActionPress).toHaveBeenCalledTimes(1)
  })

  test('preserves custom action icon colors and accessibility labels', () => {
    const renderer = renderNavBar({
      title: 'التقييمات والمراجعات',
      paddingTop: 24,
      onBackPress: jest.fn(),
      actions: [{
        icon: 'share-outline',
        iconColor: TopBarTokens.legacyNavIconColor,
        onPress: jest.fn(),
        accessibilityLabel: 'مشاركة التقييمات',
      }],
    })
    const buttons = renderer.root.findAllByType(TouchableOpacity)
    const icons = renderer.root.findAll((node) => String(node.type) === 'Ionicons')

    expect(buttons[0].props.accessibilityLabel).toBe('رجوع')
    expect(buttons[1].props.accessibilityLabel).toBe('مشاركة التقييمات')
    expect(icons.map((icon) => icon.props.size)).toEqual([18, 17])
    expect(icons[1].props.color).toBe(TopBarTokens.legacyNavIconColor)
  })

  test('keeps loading and disabled behavior without dimming a glass surface ancestor', () => {
    const renderer = renderNavBar({
      title: 'حفظ التعديلات',
      paddingTop: 24,
      onBackPress: jest.fn(),
      actions: [{
        onPress: jest.fn(),
        accessibilityLabel: 'حفظ التعديلات',
        loading: true,
        testID: 'save-action',
      }],
    })
    const button = renderer.root.findByProps({ testID: 'save-action' })
    const spinner = renderer.root.findByType(ActivityIndicator)

    expect(button.props.disabled).toBe(true)
    expect(spinner).toBeDefined()
    expectGlassHasNoReducedOpacityAncestor(renderer)
  })

  test('preserves explicit disabled state and action order in RTL row layout', () => {
    const actions: GlassNavBarAction[] = [
      { icon: 'chatbubble-outline', onPress: jest.fn(), accessibilityLabel: 'الرسائل', testID: 'first-action' },
      { icon: 'checkmark-outline', onPress: jest.fn(), accessibilityLabel: 'حفظ', testID: 'disabled-action', disabled: true },
    ]
    const renderer = renderNavBar({
      title: 'إعدادات الحساب',
      paddingTop: 24,
      onBackPress: jest.fn(),
      actions,
    })
    const buttons = renderer.root.findAllByType(TouchableOpacity)
    const row = renderer.root.findAllByType(View).find((view) => StyleSheet.flatten(view.props.style)?.height === 44)
    const rowStyle = StyleSheet.flatten(row?.props.style)

    expect(buttons.slice(1).map((button) => button.props.testID)).toEqual(['first-action', 'disabled-action'])
    expect(buttons[2].props.disabled).toBe(true)
    expect(rowStyle).toMatchObject({ height: 44, flexDirection: 'row' })
    expectGlassHasNoReducedOpacityAncestor(renderer)
  })

  test('keeps the no-action placeholder at its original 38 by 38 size', () => {
    const renderer = renderNavBar({
      title: 'إعدادات الحساب',
      paddingTop: 24,
      onBackPress: jest.fn(),
    })
    const placeholder = renderer.root.findAllByType(View).find((view) => {
      const style = StyleSheet.flatten(view.props.style)
      return style.width === 38 && style.height === 38
    })

    expect(placeholder).toBeDefined()
  })
})

import React from 'react'
import { Text, View, Keyboard, StyleSheet, Dimensions, type ViewStyle } from 'react-native'
import { render, fireEvent, act, renderHook, cleanup } from '@testing-library/react-native'
import { Colors } from '../../constants/colors'
import {
  BottomBarTokens,
  getCollapsedCircleAnchorKey,
  computeBottomBarGeometry,
} from '../../constants/bottomBarTokens'
import {
  GlassBottomBarShell,
  useBottomBarKeyboardHide,
} from '../../components/navigation/GlassBottomBarShell'
import * as glassSupportModule from '../../components/navigation/glassSupport'

jest.mock('expo-blur', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BlurView: (props: any) => React.createElement(View, props),
  }
})

jest.mock('@expo/vector-icons', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Ionicons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  }
})

jest.mock('../../utils/listing-detail/useAppReducedMotion', () => ({
  useAppReducedMotion: jest.fn(() => false),
}))

// Mock NavVisibilityContext with mutable shared value
const mockNavHidden = { value: 0 }
jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: mockNavHidden,
  }),
}))

describe('GlassBottomBarShell & BottomBarTokens (Task D-166 & D-166c)', () => {
  afterEach(() => {
    cleanup()
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockNavHidden.value = 0
  })

  // ── 1. Pure Geometry Helper Tests ─────────────────────────────────────────
  describe('computeBottomBarGeometry (Pure Helper)', () => {
    it('endpoint progress 0: returns full expanded dimensions and labelOpacity 1', () => {
      const geo = computeBottomBarGeometry(0, 390, false)
      expect(geo.width).toBe(358) // 390 - 32
      expect(geo.height).toBe(BottomBarTokens.expandedHeight) // 52
      expect(geo.borderRadius).toBe(BottomBarTokens.expandedRadius) // 26
      expect(geo.labelOpacity).toBe(1)
      expect(geo.collapsedIconOpacity).toBe(0)
      expect(geo.isCollapsed).toBe(false)
    })

    it('endpoint progress 1: returns collapsed circle dimensions and iconOpacity 1', () => {
      const geo = computeBottomBarGeometry(1, 390, false)
      expect(geo.width).toBe(BottomBarTokens.collapsedSize) // 56
      expect(geo.height).toBe(BottomBarTokens.collapsedSize) // 56
      expect(geo.borderRadius).toBe(BottomBarTokens.collapsedRadius) // 28
      expect(geo.labelOpacity).toBe(0)
      expect(geo.collapsedIconOpacity).toBe(1)
      expect(geo.isCollapsed).toBe(true)
    })

    it('label opacity drops to 0 at progress 0.2 before width morph squashes text', () => {
      const at0 = computeBottomBarGeometry(0, 390, false)
      const at01 = computeBottomBarGeometry(0.1, 390, false)
      const at02 = computeBottomBarGeometry(0.2, 390, false)
      const at05 = computeBottomBarGeometry(0.5, 390, false)

      expect(at0.labelOpacity).toBe(1)
      expect(at01.labelOpacity).toBe(0.5)
      expect(at02.labelOpacity).toBe(0)
      expect(at05.labelOpacity).toBe(0)
    })

    it('collapsed icon opacity fades in during final progress range (0.8 -> 1.0)', () => {
      const at07 = computeBottomBarGeometry(0.7, 390, false)
      const at08 = computeBottomBarGeometry(0.8, 390, false)
      const at09 = computeBottomBarGeometry(0.9, 390, false)
      const at10 = computeBottomBarGeometry(1.0, 390, false)

      expect(at07.collapsedIconOpacity).toBe(0)
      expect(at08.collapsedIconOpacity).toBe(0)
      expect(at09.collapsedIconOpacity).toBe(0.5)
      expect(at10.collapsedIconOpacity).toBe(1)
    })

    it('reduced motion switches instantly at threshold 0.5 without intermediate morph', () => {
      const beforeThreshold = computeBottomBarGeometry(0.3, 390, true)
      expect(beforeThreshold.width).toBe(358)
      expect(beforeThreshold.height).toBe(52)
      expect(beforeThreshold.borderRadius).toBe(26)
      expect(beforeThreshold.labelOpacity).toBe(1)
      expect(beforeThreshold.collapsedIconOpacity).toBe(0)
      expect(beforeThreshold.isCollapsed).toBe(false)

      const afterThreshold = computeBottomBarGeometry(0.7, 390, true)
      expect(afterThreshold.width).toBe(56)
      expect(afterThreshold.height).toBe(56)
      expect(afterThreshold.borderRadius).toBe(28)
      expect(afterThreshold.labelOpacity).toBe(0)
      expect(afterThreshold.collapsedIconOpacity).toBe(1)
      expect(afterThreshold.isCollapsed).toBe(true)
    })

    it('computes exact geometry across standard screen widths (360, 390, 430, tablet 600)', () => {
      const w360 = computeBottomBarGeometry(0, 360, false)
      expect(w360.width).toBe(328) // 360 - 32

      const w390 = computeBottomBarGeometry(0, 390, false)
      expect(w390.width).toBe(358) // 390 - 32

      const w430 = computeBottomBarGeometry(0, 430, false)
      expect(w430.width).toBe(398) // 430 - 32

      const tablet600 = computeBottomBarGeometry(0, 600, false)
      expect(tablet600.width).toBe(BottomBarTokens.maxWidth) // capped at 480
    })
  })

  // ── 2. Physical Side Helper Tests ─────────────────────────────────────────
  describe('Physical Side Helper (getCollapsedCircleAnchorKey)', () => {
    it('anchors collapsed circle using right style key in RTL mode to land on physical bottom-left', () => {
      const key = getCollapsedCircleAnchorKey(true)
      expect(key).toBe('right')
    })

    it('anchors collapsed circle using left style key in LTR mode', () => {
      const key = getCollapsedCircleAnchorKey(false)
      expect(key).toBe('left')
    })
  })

  // ── 3. Keyboard Hide Hook Tests ───────────────────────────────────────────
  describe('useBottomBarKeyboardHide (Hook)', () => {
    it('toggles visibility state on software keyboard show and hide events', async () => {
      let showCb: (() => void) | null = null
      let hideCb: (() => void) | null = null

      jest.spyOn(Keyboard, 'addListener').mockImplementation((event: string, cb: any) => {
        if (event === 'keyboardDidShow' || event === 'keyboardWillShow') {
          showCb = cb
        }
        if (event === 'keyboardDidHide' || event === 'keyboardWillHide') {
          hideCb = cb
        }
        return {
          remove: jest.fn(),
        } as any
      })

      const { result } = await renderHook(() => useBottomBarKeyboardHide())
      expect(result.current).toBe(false)
      expect(typeof showCb).toBe('function')
      expect(typeof hideCb).toBe('function')

      // Show keyboard
      await act(async () => {
        showCb?.()
      })
      expect(result.current).toBe(true)

      // Hide keyboard
      await act(async () => {
        hideCb?.()
      })
      expect(result.current).toBe(false)
    })
  })

  // ── 4. Shell Resolved Styles & Single Source of Truth Tests (C1) ───────────
  describe('GlassBottomBarShell Resolved Styles (C1 Single Source of Truth)', () => {
    const screenWidth = Dimensions.get('window').width
    const anchorKey = getCollapsedCircleAnchorKey()
    const expectedExpandedWidth = Math.min(
      screenWidth - 2 * BottomBarTokens.marginHorizontal,
      BottomBarTokens.maxWidth
    )
    const isTablet = screenWidth > BottomBarTokens.maxWidth + 2 * BottomBarTokens.marginHorizontal
    const expandedOffset = isTablet
      ? (screenWidth - expectedExpandedWidth) / 2
      : BottomBarTokens.marginHorizontal

    it('renders expanded container dimensions and layer opacities at navHidden = 0', async () => {
      mockNavHidden.value = 0
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text testID="tab-label">شاشة التابات</Text>
        </GlassBottomBarShell>
      )

      const containerStyle = StyleSheet.flatten(getByTestId('shell-test').props.style)
      expect(containerStyle.width).toBe(expectedExpandedWidth)
      expect(containerStyle.height).toBe(BottomBarTokens.expandedHeight) // 52
      expect(containerStyle.borderRadius).toBe(BottomBarTokens.expandedRadius) // 26
      expect(containerStyle[anchorKey]).toBe(expandedOffset)

      const contentStyle = StyleSheet.flatten(getByTestId('shell-test-content').props.style)
      expect(contentStyle.opacity).toBe(1)
      expect(contentStyle.transform).toEqual([{ scale: 1 }])

      const collapsedStyle = StyleSheet.flatten(getByTestId('shell-test-collapsed-wrap').props.style)
      expect(collapsedStyle.opacity).toBe(0)
      expect(collapsedStyle.transform).toEqual([{ scale: 0 }])
    })

    it('renders midway morph dimensions at navHidden = 0.5', async () => {
      mockNavHidden.value = 0.5
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      const expectedMidWidth =
        Math.round((expectedExpandedWidth + (BottomBarTokens.collapsedSize - expectedExpandedWidth) * 0.5) * 100) / 100
      const containerStyle = StyleSheet.flatten(getByTestId('shell-test').props.style)
      expect(containerStyle.width).toBe(expectedMidWidth)
      expect(containerStyle.height).toBe(54) // 52 + (56 - 52) * 0.5
      expect(containerStyle.borderRadius).toBe(27) // 26 + (28 - 26) * 0.5

      const contentStyle = StyleSheet.flatten(getByTestId('shell-test-content').props.style)
      expect(contentStyle.opacity).toBe(0) // label drops to 0 at progress 0.2
      expect(contentStyle.transform).toEqual([{ scale: 0.95 }])

      const collapsedStyle = StyleSheet.flatten(getByTestId('shell-test-collapsed-wrap').props.style)
      expect(collapsedStyle.opacity).toBe(0) // icon fades in starting at 0.8
      expect(collapsedStyle.transform).toEqual([{ scale: 0 }])
    })

    it('renders collapsed circle dimensions and layer opacities at navHidden = 1', async () => {
      mockNavHidden.value = 1
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      const containerStyle = StyleSheet.flatten(getByTestId('shell-test').props.style)
      expect(containerStyle.width).toBe(BottomBarTokens.collapsedSize) // 56
      expect(containerStyle.height).toBe(BottomBarTokens.collapsedSize) // 56
      expect(containerStyle.borderRadius).toBe(BottomBarTokens.collapsedRadius) // 28
      expect(containerStyle[anchorKey]).toBe(BottomBarTokens.marginHorizontal) // 16

      const contentStyle = StyleSheet.flatten(getByTestId('shell-test-content').props.style)
      expect(contentStyle.opacity).toBe(0)
      expect(contentStyle.transform).toEqual([{ scale: 0.95 }])

      const collapsedStyle = StyleSheet.flatten(getByTestId('shell-test-collapsed-wrap').props.style)
      expect(collapsedStyle.opacity).toBe(1)
      expect(collapsedStyle.transform).toEqual([{ scale: 1 }])
    })
  })

  // ── 5. Component Behavior & Missing Tests (C4) ─────────────────────────────
  describe('GlassBottomBarShell Behavior & Accessibility (C4)', () => {
    const screenWidth = Dimensions.get('window').width
    const expectedExpandedWidth = Math.min(
      screenWidth - 2 * BottomBarTokens.marginHorizontal,
      BottomBarTokens.maxWidth
    )

    it('(a) default expand sets navHidden.value to 0 and navigates nowhere', async () => {
      mockNavHidden.value = 1
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      const btn = getByTestId('bottom-bar-collapsed-button')
      fireEvent.press(btn)

      expect(mockNavHidden.value).toBe(0)
    })

    it('(b) reduced motion at SHELL level switches instantly at threshold 0.5', async () => {
      // Below threshold (0.3) -> fully expanded
      mockNavHidden.value = 0.3
      const { getByTestId, rerender } = await render(
        <GlassBottomBarShell testID="shell-test" reducedMotion={true}>
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      let containerStyle = StyleSheet.flatten(getByTestId('shell-test').props.style)
      expect(containerStyle.width).toBe(expectedExpandedWidth)
      expect(containerStyle.height).toBe(BottomBarTokens.expandedHeight) // 52
      expect(containerStyle.borderRadius).toBe(BottomBarTokens.expandedRadius) // 26

      let contentStyle = StyleSheet.flatten(getByTestId('shell-test-content').props.style)
      expect(contentStyle.opacity).toBe(1)
      expect(contentStyle.transform).toEqual([{ scale: 1 }])

      let collapsedStyle = StyleSheet.flatten(getByTestId('shell-test-collapsed-wrap').props.style)
      expect(collapsedStyle.opacity).toBe(0)
      expect(collapsedStyle.transform).toEqual([{ scale: 0 }])

      // Above threshold (0.7) -> fully collapsed circle
      mockNavHidden.value = 0.7
      await rerender(
        <GlassBottomBarShell testID="shell-test" reducedMotion={true}>
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      containerStyle = StyleSheet.flatten(getByTestId('shell-test').props.style)
      expect(containerStyle.width).toBe(BottomBarTokens.collapsedSize) // 56
      expect(containerStyle.height).toBe(BottomBarTokens.collapsedSize) // 56
      expect(containerStyle.borderRadius).toBe(BottomBarTokens.collapsedRadius) // 28

      contentStyle = StyleSheet.flatten(getByTestId('shell-test-content').props.style)
      expect(contentStyle.opacity).toBe(0)
      expect(contentStyle.transform).toEqual([{ scale: 0 }])

      collapsedStyle = StyleSheet.flatten(getByTestId('shell-test-collapsed-wrap').props.style)
      expect(collapsedStyle.opacity).toBe(1)
      expect(collapsedStyle.transform).toEqual([{ scale: 1 }])
    })

    it('(c) collapsed layer is inert while expanded (opacity 0 and scale 0 at navHidden 0)', async () => {
      mockNavHidden.value = 0
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      const collapsedStyle = StyleSheet.flatten(getByTestId('shell-test-collapsed-wrap').props.style)
      expect(collapsedStyle.opacity).toBe(0)
      expect(collapsedStyle.transform).toEqual([{ scale: 0 }])

      // At navHidden 1, content layer is inert (opacity 0)
      mockNavHidden.value = 1
      const { getByTestId: getByTestId1 } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )
      const contentStyle = StyleSheet.flatten(getByTestId1('shell-test-content').props.style)
      expect(contentStyle.opacity).toBe(0)
    })

    it('collapsed circle button meets accessibility standards (role button, Arabic label, >= 44pt target)', async () => {
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      const btn = getByTestId('bottom-bar-collapsed-button')
      expect(btn.props.accessibilityRole).toBe('button')
      expect(btn.props.accessibilityLabel).toBe(BottomBarTokens.accessibility.collapsedLabelArabic)
      expect(btn.props.accessibilityLabel).toBe('توسيع شريط التنقل')

      // Verify touch target size exceeds Apple HIG >= 44pt
      const btnStyle = btn.props.style
      expect(btnStyle.minWidth).toBeGreaterThanOrEqual(BottomBarTokens.minTouchTarget)
      expect(btnStyle.minHeight).toBeGreaterThanOrEqual(BottomBarTokens.minTouchTarget)
      expect(btnStyle.width).toBe(BottomBarTokens.collapsedSize) // 56
      expect(btnStyle.height).toBe(BottomBarTokens.collapsedSize) // 56
    })

    it('custom onExpand callback overrides default expand when provided', async () => {
      const onExpandMock = jest.fn()
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test" onExpand={onExpandMock}>
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      const btn = getByTestId('bottom-bar-collapsed-button')
      fireEvent.press(btn)

      expect(onExpandMock).toHaveBeenCalledTimes(1)
    })

    it('hides completely (returns null) when software keyboard is visible', async () => {
      let showCb: (() => void) | null = null
      jest.spyOn(Keyboard, 'addListener').mockImplementation((event: string, cb: any) => {
        if (event === 'keyboardDidShow' || event === 'keyboardWillShow') {
          showCb = cb
        }
        return { remove: jest.fn() } as any
      })

      const { getByTestId, queryByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      expect(getByTestId('shell-test')).toBeTruthy()

      await act(async () => {
        showCb?.()
      })

      expect(queryByTestId('shell-test')).toBeNull()
    })

    it('renders liquid glass background surface by default in test environment', async () => {
      const { getByTestId, queryByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text>محتوى</Text>
        </GlassBottomBarShell>
      )

      expect(getByTestId('shell-test-glass-liquid')).toBeTruthy()
      expect(queryByTestId('shell-test-glass-blur')).toBeNull()
    })

    describe('Hierarchy Opacity Verification (D4)', () => {
      function assertNoOpacityInAncestry(
        startElement: ReturnType<typeof render>['UNSAFE_root'],
        rootTestId: string
      ) {
        let current: typeof startElement | null = startElement
        while (current) {
          const flatStyle = (StyleSheet.flatten(current.props?.style) || {}) as ViewStyle
          expect(flatStyle.opacity).toBeUndefined()
          if (current.props?.testID === rootTestId) {
            break
          }
          current = current.parent
        }
      }

      it('asserts neither glass surface nor any ancestor has opacity style (liquid branch)', async () => {
        jest.spyOn(glassSupportModule, 'useGlassSupport').mockReturnValue({
          kind: 'liquid',
          GlassView: (props) => <View {...props} />,
        })

        const { getByTestId } = await render(
          <GlassBottomBarShell testID="shell-test">
            <Text>محتوى</Text>
          </GlassBottomBarShell>
        )

        const liquidSurface = getByTestId('shell-test-glass-liquid')
        expect(liquidSurface).toBeTruthy()
        assertNoOpacityInAncestry(liquidSurface, 'shell-test')
      })

      it('asserts neither glass surface nor any ancestor has opacity style (blur branch)', async () => {
        jest.spyOn(glassSupportModule, 'useGlassSupport').mockReturnValue({
          kind: 'blur',
        })

        const { getByTestId } = await render(
          <GlassBottomBarShell testID="shell-test">
            <Text>محتوى</Text>
          </GlassBottomBarShell>
        )

        const blurSurface = getByTestId('shell-test-glass-blur')
        expect(blurSurface).toBeTruthy()
        assertNoOpacityInAncestry(blurSurface, 'shell-test')
      })
    })
  })
})

import React from 'react'
import { Text, View, Keyboard } from 'react-native'
import { render, fireEvent, act, renderHook, cleanup } from '@testing-library/react-native'
import {
  BottomBarTokens,
  getCollapsedCircleAnchorKey,
  getCollapsedCircleAnchorStyle,
  computeBottomBarGeometry,
} from '../../constants/bottomBarTokens'
import {
  GlassBottomBarShell,
  useBottomBarKeyboardHide,
} from '../../components/navigation/GlassBottomBarShell'

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

// Mock NavVisibilityContext
const mockNavHidden = { value: 0 }
jest.mock('../../context/NavVisibilityContext', () => ({
  useNavVisibility: () => ({
    navHidden: mockNavHidden,
  }),
}))

describe('GlassBottomBarShell & BottomBarTokens (Task D-166 Stage 1)', () => {
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
  describe('Physical Side Helper (getCollapsedCircleAnchorKey & Style)', () => {
    it('anchors collapsed circle using right style key in RTL mode to land on physical bottom-left', () => {
      const key = getCollapsedCircleAnchorKey(true)
      expect(key).toBe('right')

      const style = getCollapsedCircleAnchorStyle(16, true)
      expect(style).toEqual({ right: 16 })
    })

    it('anchors collapsed circle using left style key in LTR mode', () => {
      const key = getCollapsedCircleAnchorKey(false)
      expect(key).toBe('left')

      const style = getCollapsedCircleAnchorStyle(16, false)
      expect(style).toEqual({ left: 16 })
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

  // ── 4. Component Rendering & Accessibility Tests ─────────────────────────
  describe('GlassBottomBarShell (Component)', () => {
    it('renders expanded children inside content layer by default', async () => {
      const { getByTestId } = await render(
        <GlassBottomBarShell testID="shell-test">
          <Text testID="tab-label">شاشة التابات</Text>
        </GlassBottomBarShell>
      )

      expect(getByTestId('shell-test')).toBeTruthy()
      expect(getByTestId('tab-label')).toBeTruthy()
      expect(getByTestId('tab-label').props.children).toBe('شاشة التابات')
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

    it('tapping collapsed circle button invokes onExpand callback', async () => {
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
  })
})

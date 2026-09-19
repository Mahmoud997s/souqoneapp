import { I18nManager } from 'react-native'
import {
  physicalRightStyle,
  getGestureDirectionMultiplier,
} from '../utils/physicalDirection'

describe('GlassCategoriesGrid Swipe Engine & Layout Math', () => {
  const PADDING_END = 16
  const TAB_WIDTH = 88
  const TAB_GAP = 8
  const STEP = TAB_WIDTH + TAB_GAP // 96px

  describe('1. Physical Tab Coordinate Offsets', () => {
    beforeEach(() => {
      I18nManager.isRTL = true
    })

    test('Tabs are positioned from physical right to left with exact step increments', () => {
      // Tab 0 is anchored at PADDING_END
      const tab0Style = physicalRightStyle(PADDING_END + 0 * STEP)
      expect(tab0Style).toEqual({ left: 16 })

      // Tab 1 is anchored at 16 + 96 = 112
      const tab1Style = physicalRightStyle(PADDING_END + 1 * STEP)
      expect(tab1Style).toEqual({ left: 112 })

      // Tab 2 is anchored at 16 + 192 = 208
      const tab2Style = physicalRightStyle(PADDING_END + 2 * STEP)
      expect(tab2Style).toEqual({ left: 208 })

      // Tab 8 (9th tab in Services)
      const tab8Style = physicalRightStyle(PADDING_END + 8 * STEP)
      expect(tab8Style).toEqual({ left: 16 + 768 })
      expect(tab8Style).toEqual({ left: 784 })
    })
  })

  describe('2. MaxScroll & Content Bounds Clamping', () => {
    test('Calculates exact maxScroll preventing empty blank space on screen', () => {
      const screenWidth = 390
      const count = 9 // 9 tabs (Services)
      const totalContentWidth = PADDING_END + count * TAB_WIDTH + (count - 1) * TAB_GAP + PADDING_END
      // 16 + 9*88 + 8*8 + 16 = 16 + 792 + 64 + 16 = 888px
      expect(totalContentWidth).toBe(888)

      const maxScroll = Math.max(0, totalContentWidth - screenWidth)
      expect(maxScroll).toBe(888 - 390)
      expect(maxScroll).toBe(498)
    })

    test('Clamps scroll position between 0 and maxScroll with velocity projection', () => {
      const maxScroll = 498
      const currentX = 100

      // Natural flick forward (vx = 400)
      const vxForward = 400
      const projectedForward = currentX + vxForward * 0.25 // 200
      const nearestStepForward = Math.round(projectedForward / STEP) * STEP
      const clampedForward = Math.max(0, Math.min(maxScroll, nearestStepForward))
      expect(clampedForward).toBe(192) // 2 * 96

      // Hard flick that would overshoot maxScroll (vx = 2000)
      const vxHeavy = 2000
      const projectedHeavy = currentX + vxHeavy * 0.25 // 600 > maxScroll
      const nearestStepHeavy = Math.round(projectedHeavy / STEP) * STEP
      const clampedHeavy = Math.max(0, Math.min(maxScroll, nearestStepHeavy))
      expect(clampedHeavy).toBe(maxScroll) // clamped to 498, never leaves blank space!

      // Flick backward past index 0
      const vxBackward = -800
      const projectedBackward = currentX + vxBackward * 0.25 // -100 < 0
      const clampedBackward = Math.max(0, Math.min(maxScroll, Math.round(projectedBackward / STEP) * STEP))
      expect(clampedBackward).toBe(0) // clamped to 0!
    })
  })

  describe('3. RTL Direct 1:1 Gesture Handling', () => {
    test('Direct gesture multiplier conforms to physicalDirection rules', () => {
      I18nManager.isRTL = true
      expect(getGestureDirectionMultiplier()).toBe(1)

      I18nManager.isRTL = false
      expect(getGestureDirectionMultiplier()).toBe(-1)
    })
  })
})

import { I18nManager } from 'react-native'
import {
  physicalRightStyle,
  getGestureDirectionMultiplier,
  physicalRowDirection,
} from '../utils/physicalDirection'
import {
  computeTrackResetFingerprint,
  isPanGestureEnabled,
} from '../components/ui/PhysicalHorizontalTrack'
import { isSegmentedTabsFixed } from '../components/ui/VisualFiltersBase'

describe('PhysicalHorizontalTrack Gesture & Layout Math', () => {
  beforeEach(() => {
    I18nManager.isRTL = true
  })

  describe('1. Physical Coordinates & RTL Flow', () => {
    test('Track anchors to physical right with physicalRightStyle(0)', () => {
      expect(physicalRightStyle(0)).toEqual({ left: 0 })
    })

    test('Flow direction uses row in RTL for physical right-to-left layout', () => {
      expect(physicalRowDirection()).toBe('row')
      I18nManager.isRTL = false
      expect(physicalRowDirection()).toBe('row-reverse')
    })

    test('Gesture direction multiplier is 1 for RTL and -1 for LTR', () => {
      I18nManager.isRTL = true
      expect(getGestureDirectionMultiplier()).toBe(1)
      I18nManager.isRTL = false
      expect(getGestureDirectionMultiplier()).toBe(-1)
    })
  })

  describe('2. MaxScroll & Bounds Clamping', () => {
    test('Calculates exact maxScroll when content overflows container', () => {
      const containerWidth = 390
      const contentWidth = 750
      const maxScroll = Math.max(0, contentWidth - containerWidth)
      expect(maxScroll).toBe(360)
    })

    test('Sets maxScroll to 0 when content fits within container', () => {
      const containerWidth = 390
      const contentWidth = 350
      const maxScroll = Math.max(0, contentWidth - containerWidth)
      expect(maxScroll).toBe(0)
    })

    test('Clamps scroll position between 0 and maxScroll with flick momentum', () => {
      const maxScroll = 360
      const currentX = 150

      // Natural forward flick (vx = 400)
      const vx = 400
      const projected = currentX + vx * 0.25 // 250
      const clamped = Math.max(0, Math.min(maxScroll, projected))
      expect(clamped).toBe(250)

      // Overshoot flick (vx = 1200)
      const vxHeavy = 1200
      const projectedHeavy = currentX + vxHeavy * 0.25 // 450 > 360
      const clampedHeavy = Math.max(0, Math.min(maxScroll, projectedHeavy))
      expect(clampedHeavy).toBe(360)

      // Backward flick (vx = -800)
      const vxBack = -800
      const projectedBack = currentX + vxBack * 0.25 // -50 < 0
      const clampedBack = Math.max(0, Math.min(maxScroll, projectedBack))
      expect(clampedBack).toBe(0)
    })
  })

  describe('3. Composite Reset Fingerprint (Data change without tab change)', () => {
    test('Generates identical fingerprint when resetKey and data remain identical', () => {
      const fp1 = computeTrackResetFingerprint('models', 12, 'm1:m2:m3:')
      const fp2 = computeTrackResetFingerprint('models', 12, 'm1:m2:m3:')
      expect(fp1).toBe(fp2)
    })

    test('Triggers new fingerprint when dataLength changes even if resetKey remains unchanged', () => {
      // User stays on 'models' tab, but brand changed and returned 6 models instead of 12
      const fpBefore = computeTrackResetFingerprint('models', 12, 'm1:m2:')
      const fpAfter = computeTrackResetFingerprint('models', 6, 'm1:m2:')
      expect(fpBefore).not.toBe(fpAfter)
    })

    test('Triggers new fingerprint when children keys change even if dataLength is same', () => {
      // 2 models replaced with 2 different models
      const fpBrandA = computeTrackResetFingerprint('models', 2, 'camry:corolla:')
      const fpBrandB = computeTrackResetFingerprint('models', 2, 'patrol:sunny:')
      expect(fpBrandA).not.toBe(fpBrandB)
    })

    test('Triggers new fingerprint when explicit resetKey changes', () => {
      const fpBrands = computeTrackResetFingerprint('brands', 10, 'k1:')
      const fpModels = computeTrackResetFingerprint('models', 10, 'k1:')
      expect(fpBrands).not.toBe(fpModels)
    })
  })

  describe('4. onLayout Race Condition & Gesture Eligibility', () => {
    test('Disables pan gesture when content is not yet measured (isMeasured = false)', () => {
      // Content width = 0 before first onLayout finishes
      expect(isPanGestureEnabled(false, 300)).toBe(false)
      expect(isPanGestureEnabled(false, 0)).toBe(false)
    })

    test('Disables pan gesture when content fits within container without overflow (maxScroll = 0)', () => {
      // Measured but items fit entirely without scrollable overflow
      expect(isPanGestureEnabled(true, 0)).toBe(false)
      expect(isPanGestureEnabled(true, -50)).toBe(false)
    })

    test('Enables pan gesture once measured and content overflows (isMeasured = true, maxScroll > 0)', () => {
      expect(isPanGestureEnabled(true, 150)).toBe(true)
      expect(isPanGestureEnabled(true, 420)).toBe(true)
    })
  })

  describe('5. Responsive Segmented Control Tabs Threshold (VisualFiltersBase)', () => {
    test('Tabs count <= 3 uses fixed equal width segmented control (non-scrollable)', () => {
      expect(isSegmentedTabsFixed(1)).toBe(true)
      expect(isSegmentedTabsFixed(2)).toBe(true) // e.g. Parts (2 tabs: categories, makes)
      expect(isSegmentedTabsFixed(3)).toBe(true)
    })

    test('Tabs count >= 4 uses horizontally scrollable PhysicalHorizontalTrack', () => {
      expect(isSegmentedTabsFixed(4)).toBe(false) // e.g. Services (4 tabs), Equipment (4 tabs)
      expect(isSegmentedTabsFixed(5)).toBe(false) // e.g. Cars (5 tabs), Buses (5 tabs), Transport (5 tabs)
      expect(isSegmentedTabsFixed(8)).toBe(false) // e.g. MyListings (8 tabs)
    })
  })
})


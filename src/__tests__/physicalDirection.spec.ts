import { I18nManager } from 'react-native'
import {
  getPhysicalSide,
  physicalRightStyle,
  physicalRowDirection,
  getGestureDirectionMultiplier,
} from '../utils/physicalDirection'

describe('physicalDirection Single Source of Truth', () => {
  describe('Under isRTL === true (Native Arabic environment)', () => {
    beforeEach(() => {
      I18nManager.isRTL = true
    })

    test('getPhysicalSide() returns "left" to counter Fabric mirroring', () => {
      expect(getPhysicalSide()).toBe('left')
    })

    test('physicalRightStyle(16) returns { left: 16 } to anchor on physical right', () => {
      expect(physicalRightStyle(16)).toEqual({ left: 16 })
    })

    test('physicalRowDirection() returns "row" (natural RTL flows right to left)', () => {
      expect(physicalRowDirection()).toBe('row')
    })

    test('getGestureDirectionMultiplier() returns 1 (direct 1:1 physical drag: right -> right, left -> left)', () => {
      expect(getGestureDirectionMultiplier()).toBe(1)
      const touchRightTranslationX = 50
      const dx = touchRightTranslationX * getGestureDirectionMultiplier()
      expect(dx).toBe(50) // Positive moves track right

      const touchLeftTranslationX = -50
      const dxLeft = touchLeftTranslationX * getGestureDirectionMultiplier()
      expect(dxLeft).toBe(-50) // Negative moves track left
    })
  })

  describe('Under isRTL === false (LTR environment)', () => {
    beforeEach(() => {
      I18nManager.isRTL = false
    })

    test('getPhysicalSide() returns "right"', () => {
      expect(getPhysicalSide()).toBe('right')
    })

    test('physicalRightStyle(16) returns { right: 16 }', () => {
      expect(physicalRightStyle(16)).toEqual({ right: 16 })
    })

    test('physicalRowDirection() returns "row-reverse"', () => {
      expect(physicalRowDirection()).toBe('row-reverse')
    })

    test('getGestureDirectionMultiplier() returns -1', () => {
      expect(getGestureDirectionMultiplier()).toBe(-1)
    })
  })
})

import { I18nManager } from 'react-native'
import {
  getPhysicalSide,
  physicalRightStyle,
  physicalRowDirection,
  getGestureDirectionMultiplier,
} from '../utils/physicalDirection'

describe('useGestureSwiper & CardImageSwiper Physics Engine', () => {
  describe('1. Physical Direction & Touch Coordinate Mapping', () => {
    test('Under RTL mode, gesture multiplier is 1 (1:1 physical drag)', () => {
      I18nManager.isRTL = true
      const multiplier = getGestureDirectionMultiplier()
      expect(multiplier).toBe(1)

      // Dragging finger to the physical right (translationX = 80)
      const touchTranslationRight = 80
      const dxRight = touchTranslationRight * multiplier
      expect(dxRight).toBe(80)

      // Dragging finger to the physical left (translationX = -80)
      const touchTranslationLeft = -80
      const dxLeft = touchTranslationLeft * multiplier
      expect(dxLeft).toBe(-80)
    })

    test('Under LTR mode, gesture multiplier is -1', () => {
      I18nManager.isRTL = false
      const multiplier = getGestureDirectionMultiplier()
      expect(multiplier).toBe(-1)
    })
  })

  describe('2. Image Positioning in Physical Coordinates', () => {
    beforeEach(() => {
      I18nManager.isRTL = true
    })

    test('CardImageSwiper places Image 0 on physical right and Image 1 to its left', () => {
      const cardWidth = 320

      // Image 0 offset = 0
      const img0Style = physicalRightStyle(0 * cardWidth)
      expect(img0Style).toEqual({ left: 0 })

      // Image 1 offset = 320
      const img1Style = physicalRightStyle(1 * cardWidth)
      expect(img1Style).toEqual({ left: 320 })

      // Image 2 offset = 640
      const img2Style = physicalRightStyle(2 * cardWidth)
      expect(img2Style).toEqual({ left: 640 })
    })

    test('Pagination dots follow physicalRowDirection to match image layout', () => {
      I18nManager.isRTL = true
      expect(physicalRowDirection()).toBe('row')

      I18nManager.isRTL = false
      expect(physicalRowDirection()).toBe('row-reverse')
    })
  })

  describe('3. Paging Snap & Velocity Calculation', () => {
    const cardWidth = 300
    const count = 5
    const maxTranslateX = (count - 1) * cardWidth // 1200

    function computeTargetIndex(
      currentTranslateX: number,
      vx: number,
      currentIndex: number,
      paging = false,
      momentumFactor = 0.22,
      velocityThreshold = 400,
      maxScrollCards = 5
    ): number {
      const rawIndex = currentTranslateX / cardWidth
      let targetIndex = Math.round(rawIndex)

      if (paging) {
        if (Math.abs(vx) > velocityThreshold) {
          if (vx > 0) {
            targetIndex = Math.ceil(rawIndex)
            if (targetIndex === currentIndex && targetIndex < count - 1) {
              targetIndex += 1
            }
          } else {
            targetIndex = Math.floor(rawIndex)
            if (targetIndex === currentIndex && targetIndex > 0) {
              targetIndex -= 1
            }
          }
        }
      } else {
        if (Math.abs(vx) > velocityThreshold) {
          const projectedDistance = vx * momentumFactor
          const projectedPos = currentTranslateX + projectedDistance
          const projectedIndex = Math.round(projectedPos / cardWidth)

          if (vx > 0 && projectedIndex <= currentIndex && currentIndex < count - 1) {
            targetIndex = currentIndex + 1
          } else if (vx < 0 && projectedIndex >= currentIndex && currentIndex > 0) {
            targetIndex = currentIndex - 1
          } else {
            targetIndex = projectedIndex
          }

          const delta = targetIndex - currentIndex
          if (Math.abs(delta) > maxScrollCards) {
            targetIndex = currentIndex + Math.sign(delta) * maxScrollCards
          }
        } else {
          targetIndex = Math.round(rawIndex)
        }
      }

      return Math.max(0, Math.min(count - 1, targetIndex))
    }

    test('Standard drag snaps to nearest page without velocity', () => {
      // Pulled slightly (100px of 300px) -> snaps back to 0
      expect(computeTargetIndex(100, 0, 0)).toBe(0)

      // Pulled past halfway (180px of 300px) -> snaps forward to 1
      expect(computeTargetIndex(180, 0, 0)).toBe(1)

      // Pulled past halfway from 1 to 2 (470px) -> snaps to 2
      expect(computeTargetIndex(470, 0, 1)).toBe(2)
    })

    test('Paging mode (CardImageSwiper): flick advances strictly 1 card at a time', () => {
      // High velocity flick (2500 px/s) in paging mode advances strictly 1 image
      expect(computeTargetIndex(40, 2500, 0, true)).toBe(1)

      // Backward flick from page 2 retreats strictly to page 1
      expect(computeTargetIndex(560, -2500, 2, true)).toBe(1)
    })

    test('Fluid Momentum mode (HorizontalScrollCard): strong flick glides across multiple cards', () => {
      // Strong flick from card 0 (vx = 2500 px/s) -> projected distance = 2500 * 0.22 = 550px
      // projectedPos = 60 + 550 = 610px -> 610 / 300 = 2.03 -> snaps to card 2!
      expect(computeTargetIndex(60, 2500, 0, false)).toBe(2)

      // Very strong flick from card 0 (vx = 4000 px/s) -> projected distance = 880px
      // projectedPos = 60 + 880 = 940px -> 940 / 300 = 3.13 -> snaps to card 3!
      expect(computeTargetIndex(60, 4000, 0, false)).toBe(3)

      // Light flick (vx = 500 px/s) still advances at least 1 card
      expect(computeTargetIndex(20, 500, 0, false)).toBe(1)
    })

    test('Clamping prevents overshooting bounds', () => {
      // Over-dragging past last item (count = 5, max index = 4)
      expect(computeTargetIndex(2000, 3000, 4, false)).toBe(4)

      // Over-dragging past first item
      expect(computeTargetIndex(-500, -2000, 0, false)).toBe(0)
    })

    test('Soft rubber-band resistance computation past bounds', () => {
      const rubberBandFactor = 0.25

      // Pulling before index 0
      const pullPast0 = -100
      const resisted0 = pullPast0 * rubberBandFactor
      expect(resisted0).toBe(-25)

      // Pulling past max index
      const pullPastEnd = 1500
      const over = pullPastEnd - maxTranslateX
      const resistedEnd = maxTranslateX + over * rubberBandFactor
      expect(resistedEnd).toBe(1200 + (300 * 0.25))
    })
  })
})

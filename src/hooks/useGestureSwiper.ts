import { useState, useCallback, useMemo } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated'
import { getGestureDirectionMultiplier } from '../utils/physicalDirection'

export interface UseGestureSwiperOptions {
  /** Total number of items/pages to swipe through */
  count: number
  /** Step distance in pixels for each snap point (cardWidth + gap, or cardWidth) */
  step: number
  /** Optional initial active index (default: 0) */
  initialIndex?: number
  /**
   * Optional manual override for gesture direction inversion.
   * When omitted (default), direction is automatically computed via getGestureDirectionMultiplier().
   */
  invertedGesture?: boolean
  /** Callback fired when snap animation completes with the new index */
  onActiveIndexChange?: (index: number) => void
  /** Sensitivity threshold for velocity flicks in px/s (default: 400) */
  velocityThreshold?: number
  /** Resistance factor when dragging past bounds (default: 0.25) */
  rubberBandFactor?: number
  /**
   * Whether to strictly enforce paging by 1 item at a time (default: false).
   * When true (e.g. CardImageSwiper), each swipe advances at most 1 card/image.
   * When false (e.g. HorizontalScrollCard), allows multi-card fluid momentum scrolling based on velocity.
   */
  paging?: boolean
  /**
   * Momentum projection factor in seconds used to project fling landing position (default: 0.22s).
   * Higher values produce longer glides.
   */
  momentumFactor?: number
  /**
   * Maximum number of cards that can be traversed in a single swipe when paging is false (default: 5).
   */
  maxScrollCards?: number
}

/**
 * useGestureSwiper
 *
 * Shared hook extracting the zero-RTL-dependent gesture and Reanimated physics engine
 * used by HorizontalScrollCard and CardImageSwiper.
 *
 * Features:
 * - Direct 1:1 physical touch tracking via getGestureDirectionMultiplier()
 * - Fail-safe offset boundaries for vertical scrolling (failOffsetY)
 * - Soft rubber-band resistance when pulling past index 0 or index (count - 1)
 * - Velocity-based flick recognition & fluid momentum projection
 * - Smooth spring physics with velocity preservation for liquid 60fps animations
 */
export function useGestureSwiper({
  count,
  step,
  initialIndex = 0,
  invertedGesture,
  onActiveIndexChange,
  velocityThreshold = 400,
  rubberBandFactor = 0.25,
  paging = false,
  momentumFactor = 0.22,
  maxScrollCards = 5,
}: UseGestureSwiperOptions) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  const directionMultiplier =
    invertedGesture !== undefined
      ? invertedGesture
        ? -1
        : 1
      : getGestureDirectionMultiplier()

  const maxTranslateX = Math.max(0, (count - 1) * step)

  // Reanimated shared values
  const translateX = useSharedValue(initialIndex * step)
  const startX = useSharedValue(initialIndex * step)
  const currentIndex = useSharedValue(initialIndex)

  const handleSnapComplete = useCallback(
    (newIndex: number) => {
      setActiveIndex(newIndex)
      onActiveIndexChange?.(newIndex)
    },
    [onActiveIndexChange]
  )

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10]) // Don't trigger on tiny taps, allowing child clicks
      .failOffsetY([-15, 15])   // Fail quickly on vertical scrolls so screen ScrollView works smoothly
      .onStart(() => {
        cancelAnimation(translateX)
        startX.value = translateX.value
      })
      .onUpdate((event) => {
        if (count <= 1 || step <= 0) return

        const dx = event.translationX * directionMultiplier
        const rawX = startX.value + dx

        if (rawX < 0) {
          // Soft resistance when pulling past Item 0
          translateX.value = rawX * rubberBandFactor
        } else if (rawX > maxTranslateX) {
          // Soft resistance when pulling past the last item
          const over = rawX - maxTranslateX
          translateX.value = maxTranslateX + over * rubberBandFactor
        } else {
          translateX.value = rawX
        }
      })
      .onEnd((event) => {
        if (count <= 1 || step <= 0) {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
          return
        }

        const vx = event.velocityX * directionMultiplier
        const currentPos = translateX.value
        const rawIndex = step > 0 ? currentPos / step : 0
        let targetIndex = Math.round(rawIndex)

        if (paging) {
          // Strictly 1 card/page at a time (e.g. CardImageSwiper)
          if (Math.abs(vx) > velocityThreshold) {
            if (vx > 0) {
              targetIndex = Math.ceil(rawIndex)
              if (targetIndex === currentIndex.value && targetIndex < count - 1) {
                targetIndex += 1
              }
            } else {
              targetIndex = Math.floor(rawIndex)
              if (targetIndex === currentIndex.value && targetIndex > 0) {
                targetIndex -= 1
              }
            }
          }
        } else {
          // Fluid momentum scrolling for multi-card lists (HorizontalScrollCard)
          if (Math.abs(vx) > velocityThreshold) {
            // Projected landing position with natural velocity momentum
            const projectedDistance = vx * momentumFactor
            const projectedPos = currentPos + projectedDistance
            const projectedIndex = Math.round(projectedPos / step)

            // Ensure a deliberate flick advances at least 1 card in flick direction
            if (vx > 0 && projectedIndex <= currentIndex.value && currentIndex.value < count - 1) {
              targetIndex = currentIndex.value + 1
            } else if (vx < 0 && projectedIndex >= currentIndex.value && currentIndex.value > 0) {
              targetIndex = currentIndex.value - 1
            } else {
              targetIndex = projectedIndex
            }

            // Cap the maximum cards traversed in one swipe to keep control
            const delta = targetIndex - currentIndex.value
            if (Math.abs(delta) > maxScrollCards) {
              targetIndex = currentIndex.value + Math.sign(delta) * maxScrollCards
            }
          } else {
            // Gentle drag without high velocity flick: snap to nearest card
            targetIndex = Math.round(rawIndex)
          }
        }

        // Clamp to valid range [0, count - 1]
        targetIndex = Math.max(0, Math.min(count - 1, targetIndex))

        const targetX = targetIndex * step
        translateX.value = withSpring(
          targetX,
          {
            velocity: vx,
            damping: 24,
            stiffness: 135,
            mass: 0.8,
            overshootClamping: false,
          },
          (finished) => {
            if (finished) {
              currentIndex.value = targetIndex
              runOnJS(handleSnapComplete)(targetIndex)
            }
          }
        )
      })
  }, [
    count,
    step,
    maxTranslateX,
    directionMultiplier,
    handleSnapComplete,
    velocityThreshold,
    rubberBandFactor,
    paging,
    momentumFactor,
    maxScrollCards,
  ])

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return {
    panGesture,
    animatedTrackStyle,
    translateX,
    activeIndex,
    setActiveIndex,
    directionMultiplier,
  }
}

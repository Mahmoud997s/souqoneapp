import React, { useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, Dimensions, StyleProp, ViewStyle } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

export interface HorizontalScrollCardProps<T> {
  /** Array of items to display */
  data: T[]
  /** Render function for each card */
  renderItem: (info: { item: T; index: number }) => React.ReactNode
  /** Exact width in pixels for each card */
  cardWidth: number
  /** Optional fixed height for each card container */
  cardHeight?: number
  /** Spacing between cards in pixels (default: 12) */
  gap?: number
  /** Padding from the physical right edge in pixels (default: 16) */
  paddingEnd?: number
  /** Whether to display pagination dots below the cards (default: false) */
  showDots?: boolean
  /**
   * Invert gesture direction if desired.
   * By default (true), dragging to the left pulls subsequent cards from the left into view (RTL friendly).
   */
  invertedGesture?: boolean
  /** Callback fired when the active card index changes after snapping */
  onActiveIndexChange?: (index: number) => void
  /** Unique key extractor for each item */
  keyExtractor?: (item: T, index: number) => string
  /** Style for the outer container */
  containerStyle?: StyleProp<ViewStyle>
  /** Style for the cards track container */
  trackStyle?: StyleProp<ViewStyle>
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

/**
 * HorizontalScrollCard
 * 
 * A zero-RTL-dependent horizontal card scroller built on Gesture.Pan() and Reanimated.
 * - Card 0 is physically pinned to the right edge of the screen.
 * - Cards 1, 2, ... are placed to the left of Card 0 in physical coordinates.
 * - Never uses native ScrollView, pagingEnabled, contentOffset, or scaleX inversion hacks.
 * - Sits completely independent of I18nManager.isRTL or system language changes.
 * - Direct manipulation: cards follow touch 1:1, with velocity-based snapping and soft rubber-banding.
 */
export function HorizontalScrollCard<T>({
  data,
  renderItem,
  cardWidth,
  cardHeight,
  gap = Spacing.space3,
  paddingEnd = Spacing.space5,
  showDots = false,
  invertedGesture = true,
  onActiveIndexChange,
  keyExtractor,
  containerStyle,
  trackStyle,
}: HorizontalScrollCardProps<T>) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH)
  const [activeIndex, setActiveIndex] = useState(0)
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(cardHeight)

  const count = data.length
  const step = cardWidth + gap
  const maxTranslateX = Math.max(0, (count - 1) * step)

  // Reanimated shared values
  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)
  const currentIndex = useSharedValue(0)

  // Callback to update JS state when snapping completes
  const handleSnapComplete = useCallback(
    (newIndex: number) => {
      setActiveIndex(newIndex)
      onActiveIndexChange?.(newIndex)
    },
    [onActiveIndexChange]
  )

  // Pan gesture configuration
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10]) // Don't trigger pan on minor horizontal touch, allowing child taps
      .failOffsetY([-15, 15])   // Fail quickly if gesture is vertical, letting parent ScrollView scroll
      .onStart(() => {
        cancelAnimation(translateX)
        startX.value = translateX.value
      })
      .onUpdate((event) => {
        if (count <= 1) return // Single card never translates

        const dx = invertedGesture ? -event.translationX : event.translationX
        const rawX = startX.value + dx

        if (rawX < 0) {
          // Soft resistance when pulling past Card 0
          translateX.value = rawX * 0.25
        } else if (rawX > maxTranslateX) {
          // Soft resistance when pulling past the last card
          const over = rawX - maxTranslateX
          translateX.value = maxTranslateX + over * 0.25
        } else {
          translateX.value = rawX
        }
      })
      .onEnd((event) => {
        if (count <= 1) {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
          return
        }

        const vx = invertedGesture ? -event.velocityX : event.velocityX
        const rawIndex = translateX.value / step
        let targetIndex = Math.round(rawIndex)

        // Velocity flick recognition (> 400 px/s)
        const velocityThreshold = 400
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

        // Clamp to valid range [0, count - 1]
        targetIndex = Math.max(0, Math.min(count - 1, targetIndex))

        const targetX = targetIndex * step
        translateX.value = withSpring(
          targetX,
          {
            damping: 22,
            stiffness: 180,
            mass: 0.8,
          },
          (finished) => {
            if (finished) {
              currentIndex.value = targetIndex
              runOnJS(handleSnapComplete)(targetIndex)
            }
          }
        )
      })
  }, [count, step, maxTranslateX, invertedGesture, handleSnapComplete])

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  // Measure container height dynamically if cardHeight wasn't explicitly provided
  const handleCardLayout = useCallback(
    (e: any) => {
      if (cardHeight) return
      const h = e.nativeEvent.layout.height
      if (h > 0 && h !== measuredHeight) {
        setMeasuredHeight(h)
      }
    },
    [cardHeight, measuredHeight]
  )

  const finalHeight = cardHeight || measuredHeight || 260

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) {
          setContainerWidth(w)
        }
      }}
    >
      <GestureDetector gesture={panGesture}>
        <View style={[styles.gestureArea, { height: finalHeight }]}>
          <Animated.View style={[styles.track, animatedTrackStyle, trackStyle]}>
            {data.map((item, index) => {
              const key = keyExtractor ? keyExtractor(item, index) : (item as any)?.id || `card-${index}`
              // Physical Right-to-Left position calculation:
              // Index 0 is at right: paddingEnd
              // Index 1 is at right: paddingEnd + 1 * (cardWidth + gap)
              // This guarantees Card 0 is on the physical right regardless of I18nManager
              const rightOffset = paddingEnd + index * step

              return (
                <View
                  key={key}
                  onLayout={index === 0 ? handleCardLayout : undefined}
                  style={[
                    styles.cardWrapper,
                    {
                      width: cardWidth,
                      right: rightOffset,
                    },
                  ]}
                >
                  {renderItem({ item, index })}
                </View>
              )
            })}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Optional Pagination Dots */}
      {showDots && count > 1 && (
        <View style={styles.dotsContainer}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gestureArea: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    ...StyleSheet.absoluteFill,
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  dotsContainer: {
    flexDirection: 'row-reverse', // Dot 0 physically on the right to match Card 0
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.space3,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    width: 16,
    backgroundColor: Colors.primary,
  },
})

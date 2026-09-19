import React, { useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, Dimensions, StyleProp, ViewStyle } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import {
  physicalRightStyle,
  physicalRowDirection,
} from '../../utils/physicalDirection'
import { useGestureSwiper } from '../../hooks/useGestureSwiper'
import { SeeAllHorizontalCard } from './SeeAllHorizontalCard'

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
   * Optional manual override for gesture direction inversion.
   * When omitted (default), direction is automatically computed via getGestureDirectionMultiplier().
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
  /** Callback fired when tapping the See All card at the end of the list */
  onSeeAll?: () => void
  /** Main title text displayed on the See All card (default: 'عرض الكل') */
  seeAllTitle?: string
  /** Subtitle text displayed on the See All card (default: 'تصفح جميع الإعلانات') */
  seeAllSubtitle?: string
  /** Optional custom action text inside the See All card pill */
  seeAllActionText?: string
  /** Optional custom render function for the See All card */
  renderSeeAllCard?: () => React.ReactNode
  /** Whether to strictly enforce paging by 1 item at a time (default: false) */
  paging?: boolean
  /** Momentum projection factor in seconds (default: 0.22) */
  momentumFactor?: number
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
 * - Displays a unified See All card as the final item when onSeeAll or renderSeeAllCard is provided.
 */
export function HorizontalScrollCard<T>({
  data,
  renderItem,
  cardWidth,
  cardHeight,
  gap = Spacing.space3,
  paddingEnd = Spacing.space5,
  showDots = false,
  invertedGesture,
  onActiveIndexChange,
  keyExtractor,
  containerStyle,
  trackStyle,
  onSeeAll,
  seeAllTitle,
  seeAllSubtitle,
  seeAllActionText,
  renderSeeAllCard,
  paging = false,
  momentumFactor = 0.22,
}: HorizontalScrollCardProps<T>) {
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH)
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(cardHeight)

  const showSeeAll = Boolean((onSeeAll || renderSeeAllCard) && data.length > 0)
  const count = data.length + (showSeeAll ? 1 : 0)
  const step = cardWidth + gap

  const {
    panGesture,
    animatedTrackStyle,
    activeIndex,
  } = useGestureSwiper({
    count,
    step,
    invertedGesture,
    onActiveIndexChange,
    paging,
    momentumFactor,
  })


  // Measure container height dynamically if cardHeight wasn't explicitly provided
  const handleCardLayout = useCallback(
    (e: any) => {
      if (cardHeight) return
      const h = e.nativeEvent.layout.height
      if (h > 0) {
        const total = Math.ceil(h + 8)
        if (total !== measuredHeight) {
          setMeasuredHeight(total)
        }
      }
    },
    [cardHeight, measuredHeight]
  )

  const finalHeight = cardHeight ? cardHeight + 8 : (measuredHeight || 270)

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
                      ...physicalRightStyle(rightOffset),
                    },
                    cardHeight ? { height: cardHeight } : undefined,
                  ]}
                >
                  {renderItem({ item, index })}
                </View>
              )
            })}

            {/* See All Card as the final item in the track */}
            {showSeeAll && (
              <View
                key="see-all-card"
                style={[
                  styles.cardWrapper,
                  {
                    width: cardWidth,
                    ...physicalRightStyle(paddingEnd + data.length * step),
                    height: cardHeight || (measuredHeight ? measuredHeight - 8 : undefined),
                  },
                ]}
              >
                {renderSeeAllCard ? (
                  renderSeeAllCard()
                ) : onSeeAll ? (
                  <SeeAllHorizontalCard
                    onPress={onSeeAll}
                    title={seeAllTitle}
                    subTitle={seeAllSubtitle}
                    actionText={seeAllActionText}
                    cardWidth={cardWidth}
                    height={cardHeight || (measuredHeight ? measuredHeight - 8 : undefined)}
                  />
                ) : null}
              </View>
            )}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Optional Pagination Dots */}
      {showDots && count > 1 && (
        <View style={[styles.dotsContainer, { flexDirection: physicalRowDirection() }]}>
          {Array.from({ length: count }).map((_, i) => (
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
    top: 4,
  },
  dotsContainer: {
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

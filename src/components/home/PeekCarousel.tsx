import React, { useState, useCallback, memo } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import { SeeAllHorizontalCard } from '../ui/SeeAllHorizontalCard'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const CARS_PEEK_WIDTH_RATIO = 0.80
export const CARS_PEEK_GAP = 10
export const SIDE_SCALE = 0.88
export const SIDE_TRANSLATE_Y = 14
export const SIDE_OPACITY = 0.85
export const SNAP_DURATION = 350

export const getPeekCardWidth = (screenWidth: number = SCREEN_WIDTH): number =>
  Math.round(screenWidth * CARS_PEEK_WIDTH_RATIO)

export const getPeekSideInset = (screenWidth: number = SCREEN_WIDTH): number =>
  Math.round((screenWidth - getPeekCardWidth(screenWidth)) / 2)

export interface CardDepthStyle {
  scale: number
  translateY: number
  opacity: number
}

/**
 * Pure interpolation helper calculating depth transformations
 * (scale, translateY, opacity) based on distance from viewport center.
 */
export function computeCardDepth(
  distanceFromCenter: number,
  reducedMotion: boolean = false
): CardDepthStyle {
  'worklet'
  if (reducedMotion) {
    return { scale: 1, translateY: 0, opacity: 1 }
  }
  const clampedDist = Math.min(1, Math.max(0, Math.abs(distanceFromCenter)))
  const scale = 1 - clampedDist * (1 - SIDE_SCALE)
  const translateY = clampedDist * SIDE_TRANSLATE_Y
  const opacity = 1 - clampedDist * (1 - SIDE_OPACITY)
  return { scale, translateY, opacity }
}

export interface PeekCarouselProps<T> {
  data: T[]
  renderItem: (info: { item: T; index: number }) => React.ReactNode
  cardWidth?: number
  cardHeight?: number
  gap?: number
  paddingEnd?: number
  showDots?: boolean
  onActiveIndexChange?: (index: number) => void
  keyExtractor?: (item: T, index: number) => string
  containerStyle?: StyleProp<ViewStyle>
  onSeeAll?: () => void
  seeAllTitle?: string
  seeAllSubtitle?: string
  seeAllActionText?: string
  renderSeeAllCard?: () => React.ReactNode
  reducedMotion?: boolean
  testID?: string
}

interface PeekCardItemProps {
  index: number
  step: number
  cardWidth: number
  cardHeight?: number
  gap: number
  isLast: boolean
  scrollX: SharedValue<number>
  reducedMotion: boolean
  children: React.ReactNode
}

const PeekCardItem = memo(function PeekCardItem({
  index,
  step,
  cardWidth,
  cardHeight,
  gap,
  isLast,
  scrollX,
  reducedMotion,
  children,
}: PeekCardItemProps) {
  const animatedDepthStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return {
        transform: [{ scale: 1 }, { translateY: 0 }],
        opacity: 1,
      }
    }

    const distance = Math.abs(Math.abs(scrollX.value) - index * step) / step
    const { scale, translateY, opacity } = computeCardDepth(distance, false)

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    }
  })

  return (
    <View
      testID={`peek-card-slot-${index}`}
      style={[
        styles.cardSlot,
        {
          width: cardWidth,
          marginEnd: isLast ? 0 : gap,
        },
        cardHeight ? { height: cardHeight } : undefined,
      ]}
    >
      <Animated.View
        testID={`peek-card-depth-${index}`}
        style={[styles.depthWrapper, animatedDepthStyle]}
      >
        {children}
      </Animated.View>
    </View>
  )
})

export function PeekCarousel<T>({
  data,
  renderItem,
  cardWidth: cardWidthProp,
  cardHeight,
  gap = CARS_PEEK_GAP,
  paddingEnd,
  showDots = true,
  onActiveIndexChange,
  keyExtractor,
  containerStyle,
  onSeeAll,
  seeAllTitle,
  seeAllSubtitle,
  renderSeeAllCard,
  reducedMotion: reducedMotionProp,
  testID = 'peek-carousel',
}: PeekCarouselProps<T>) {
  const hookReducedMotion = useAppReducedMotion()
  const reducedMotion = reducedMotionProp !== undefined ? reducedMotionProp : hookReducedMotion

  const cardWidth = cardWidthProp || getPeekCardWidth(SCREEN_WIDTH)
  const sideInset = paddingEnd !== undefined ? paddingEnd : getPeekSideInset(SCREEN_WIDTH)
  const step = cardWidth + gap

  const showSeeAll = Boolean((onSeeAll || renderSeeAllCard) && data.length > 0)
  const count = data.length + (showSeeAll ? 1 : 0)

  const [activeIndex, setActiveIndex] = useState(0)
  const scrollX = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = Math.abs(e.nativeEvent.contentOffset.x)
      const newIndex = Math.max(0, Math.min(count - 1, Math.round(x / step)))
      setActiveIndex(newIndex)
      onActiveIndexChange?.(newIndex)
    },
    [count, step, onActiveIndexChange]
  )

  return (
    <View testID={testID} style={[styles.container, containerStyle]}>
      <Animated.ScrollView
        testID={`${testID}-scroll`}
        horizontal
        pagingEnabled={false}
        snapToInterval={step}
        snapToAlignment="center"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: sideInset,
          },
        ]}
      >
        {data.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : (item as any)?.id || `peek-${index}`
          const isLast = !showSeeAll && index === data.length - 1

          return (
            <PeekCardItem
              key={key}
              index={index}
              step={step}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              gap={gap}
              isLast={isLast}
              scrollX={scrollX}
              reducedMotion={reducedMotion}
            >
              {renderItem({ item, index })}
            </PeekCardItem>
          )
        })}

        {showSeeAll && (
          <PeekCardItem
            key="see-all-card"
            index={data.length}
            step={step}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            gap={gap}
            isLast={true}
            scrollX={scrollX}
            reducedMotion={reducedMotion}
          >
            {renderSeeAllCard ? (
              renderSeeAllCard()
            ) : onSeeAll ? (
              <SeeAllHorizontalCard
                onPress={onSeeAll}
                title={seeAllTitle}
                subTitle={seeAllSubtitle}
              />
            ) : null}
          </PeekCardItem>
        )}
      </Animated.ScrollView>

      {showDots && count > 1 && (
        <View testID={`${testID}-dots`} style={styles.dotsContainer}>
          {Array.from({ length: count }).map((_, i) => (
            <View
              key={`dot-${i}`}
              testID={`${testID}-dot-${i}`}
              style={[
                styles.dot,
                i === activeIndex ? styles.activeDot : styles.inactiveDot,
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
    paddingVertical: 4,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cardSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  depthWrapper: {
    width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.space3,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
})

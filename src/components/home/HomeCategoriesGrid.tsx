import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  AppState,
  LayoutChangeEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import type { MaterialCommunityIcons } from '@expo/vector-icons'

import { CATEGORY_ICONS } from '../../constants/categoryIcons'
export { CATEGORY_ICONS } from '../../constants/categoryIcons'

/**
 * Optical size balance config:
 * Defines per-icon scale factor so wide icons (cars, buses) and square icons
 * maintain balanced visual weight across the grid.
 */
export const CATEGORY_ICON_SCALES: Record<string, number> = {
  cars: 1.10,
  services: 1.0,
  parts: 1.0,
  equipment: 1.05,
  buses: 1.10,
  browse: 1.0,
} as const

export interface HomeCategoryItem {
  id: string
  label: string
  route: string
  image: any
  icon?: keyof typeof MaterialCommunityIcons.glyphMap
  isAction?: boolean
}

export const HOME_CATEGORIES: HomeCategoryItem[] = [
  { id: 'cars',      label: 'سيارات',    route: '/cars',          image: CATEGORY_ICONS.cars,      icon: 'car-sports' },
  { id: 'services',  label: 'خدمات',     route: '/services',      image: CATEGORY_ICONS.services,  icon: 'car-wrench' },
  { id: 'parts',     label: 'قطع غيار',  route: '/parts',         image: CATEGORY_ICONS.parts,     icon: 'car-cog' },
  { id: 'equipment', label: 'معدات',     route: '/equipment',     image: CATEGORY_ICONS.equipment, icon: 'excavator' },
  { id: 'buses',     label: 'حافلات',    route: '/buses',         image: CATEGORY_ICONS.buses,     icon: 'bus-side' },
  { id: 'browse',    label: 'تصفح الكل', route: '/(tabs)/browse', image: CATEGORY_ICONS.browse,    icon: 'grid-large', isAction: true },
]

const { width: SCREEN_WIDTH } = Dimensions.get('window')
export const CATEGORY_ITEM_SIZE = 78
export const CATEGORY_ITEM_WIDTH = 78
export const CATEGORY_ITEM_HEIGHT = 90
export const CATEGORY_GRID_COLUMNS = 6
export const CATEGORY_GRID_GAP = 12
export const CATEGORY_GRID_PADDING_H = 16

/**
 * Marquee speed in pixels per second.
 * Constant linear speed across screen sizes (recommended 25-30 px/s).
 */
export const MARQUEE_SPEED_PX_PER_SEC = 28

/**
 * Backward-compatible helper functions for category items and gaps.
 * In D-163h/g, tiles are 78x90 portrait floating without an outer container card.
 */
export function calculateCategoryGridGap(_screenWidth: number = SCREEN_WIDTH): number {
  return CATEGORY_GRID_GAP
}

export function calculateCategoryItemWidth(_screenWidth: number = SCREEN_WIDTH): number {
  return CATEGORY_ITEM_WIDTH
}

interface CategoryTileProps {
  item: HomeCategoryItem
  itemWidth: number
  reducedMotion: boolean
  onPress: (route: string) => void
  isDuplicate?: boolean
}

const CategoryTile = memo(function CategoryTile({
  item,
  itemWidth,
  reducedMotion,
  onPress,
  isDuplicate = false,
}: CategoryTileProps) {
  const pressed = useSharedValue(0)
  const scaleFactor = CATEGORY_ICON_SCALES[item.id] ?? 1.0

  const handlePressIn = useCallback(() => {
    pressed.value = 1
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }, [pressed])

  const handlePressOut = useCallback(() => {
    pressed.value = 0
  }, [pressed])

  const handlePress = useCallback(() => {
    onPress(item.route)
  }, [onPress, item.route])

  const animatedCardStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {}
    return {
      transform: [
        {
          scale: withSpring(pressed.value ? 0.96 : 1, {
            damping: 15,
            stiffness: 220,
          }),
        },
      ],
    }
  })

  const animatedIconStyle = useAnimatedStyle(() => {
    if (reducedMotion) return {}
    return {
      transform: [
        {
          translateY: withSpring(pressed.value ? -2 : 0, {
            damping: 15,
            stiffness: 220,
          }),
        },
      ],
    }
  })

  return (
    <View style={[s.itemWrap, { width: itemWidth }]}>
      <Pressable
        testID={isDuplicate ? `category-tile-${item.id}-dup` : `category-tile-${item.id}`}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessible={!isDuplicate}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Animated.View style={[s.card, item.isAction && s.actionCard, animatedCardStyle]}>
          <LinearGradient
            testID="tile-gradient"
            colors={[Colors.surface, Colors.surfaceAlt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.gradient}
            pointerEvents="none"
          />
          <View testID={`icon-container-${item.id}`} style={s.iconContainer}>
            <Animated.View style={[s.iconBox, animatedIconStyle]}>
              <Image
                testID="category-tile-image"
                source={item.image}
                style={[
                  s.iconImage,
                  {
                    transform: [{ scale: scaleFactor }],
                  },
                ]}
                contentFit="contain"
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
            </Animated.View>
          </View>
          <Text
            style={[s.label, item.isAction && s.actionLabel]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.label}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  )
})

export function HomeCategoriesGrid({
  reducedMotion: reducedMotionProp,
}: {
  reducedMotion?: boolean
} = {}) {
  const hookReducedMotion = useAppReducedMotion()
  const reducedMotion = reducedMotionProp !== undefined ? reducedMotionProp : hookReducedMotion
  const [measuredWidth, setMeasuredWidth] = useState<number>(0)
  const singleSetWidth = measuredWidth > 0
    ? measuredWidth
    : HOME_CATEGORIES.length * (CATEGORY_ITEM_WIDTH + CATEGORY_GRID_GAP)

  const translateX = useSharedValue(0)
  const isPaused = useRef(false)
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleNavigate = useCallback((route: string) => {
    router.push(route as any)
  }, [])

  const startMarquee = useCallback(() => {
    if (reducedMotion || singleSetWidth <= 0) return
    isPaused.current = false
    const duration = (singleSetWidth / MARQUEE_SPEED_PX_PER_SEC) * 1000

    translateX.value = withRepeat(
      withTiming(-singleSetWidth, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    )
  }, [reducedMotion, singleSetWidth, translateX])

  const pauseMarquee = useCallback(() => {
    isPaused.current = true
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
    cancelAnimation(translateX)
  }, [translateX])

  const handleTouchStart = useCallback(() => {
    pauseMarquee()
  }, [pauseMarquee])

  const handleTouchEnd = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
    }
    resumeTimerRef.current = setTimeout(() => {
      startMarquee()
    }, 1500)
  }, [startMarquee])

  useEffect(() => {
    if (!reducedMotion) {
      startMarquee()
    }
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current)
      }
      cancelAnimation(translateX)
    }
  }, [reducedMotion, singleSetWidth, startMarquee, translateX])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (!isPaused.current && !reducedMotion) {
          startMarquee()
        }
      } else {
        cancelAnimation(translateX)
      }
    })
    return () => {
      sub.remove()
    }
  }, [reducedMotion, startMarquee, translateX])

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  const onSetALayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    if (w > 0 && Math.abs(w + CATEGORY_GRID_GAP - measuredWidth) > 1) {
      setMeasuredWidth(w + CATEGORY_GRID_GAP)
    }
  }, [measuredWidth])

  if (reducedMotion) {
    return (
      <View style={s.container}>
        <ScrollView
          testID="home-categories-scroll"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {HOME_CATEGORIES.map((cat) => (
            <CategoryTile
              key={cat.id}
              item={cat}
              itemWidth={CATEGORY_ITEM_WIDTH}
              reducedMotion={true}
              onPress={handleNavigate}
            />
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View
        testID="home-categories-marquee-container"
        style={s.marqueeContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <Animated.View
          testID="home-categories-marquee-track"
          style={[s.marqueeTrack, animatedTrackStyle]}
        >
          {/* Set A: Main accessible items */}
          <View onLayout={onSetALayout} style={s.row}>
            {HOME_CATEGORIES.map((cat) => (
              <CategoryTile
                key={`a-${cat.id}`}
                item={cat}
                itemWidth={CATEGORY_ITEM_WIDTH}
                reducedMotion={false}
                onPress={handleNavigate}
              />
            ))}
          </View>

          {/* Set B: Seamless clone hidden from screen readers */}
          <View
            testID="home-categories-set-b"
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
            style={s.row}
          >
            {HOME_CATEGORIES.map((cat) => (
              <CategoryTile
                key={`b-${cat.id}`}
                item={cat}
                itemWidth={CATEGORY_ITEM_WIDTH}
                reducedMotion={false}
                onPress={handleNavigate}
                isDuplicate={true}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space4,
    width: '100%',
  },
  marqueeContainer: {
    overflow: 'hidden',
    width: '100%',
    paddingVertical: 4,
  },
  marqueeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CATEGORY_GRID_GAP,
    marginRight: CATEGORY_GRID_GAP,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: CATEGORY_GRID_GAP,
  },
  itemWrap: {
    width: CATEGORY_ITEM_WIDTH,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 2,
    width: CATEGORY_ITEM_WIDTH,
    height: CATEGORY_ITEM_HEIGHT,
    minHeight: CATEGORY_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginBottom: 2,
  },
  iconBox: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 52,
    height: 52,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actionLabel: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
})

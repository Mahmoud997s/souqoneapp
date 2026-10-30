import React, { memo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { CATEGORY_TINTS } from '../../constants/categoryTints'
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
export const CATEGORY_ITEM_SIZE = 88
export const CATEGORY_ITEM_WIDTH = 88
export const CATEGORY_ITEM_HEIGHT = 100
export const CATEGORY_GRID_COLUMNS = 6
export const CATEGORY_GRID_GAP = 12
export const CATEGORY_GRID_PADDING_H = 12

/**
 * Backward-compatible helper functions for category items and gaps.
 * In D-163f, tiles are 88x100 portrait in a single horizontal scroll row with 12px gap.
 */
export function calculateCategoryGridGap(_screenWidth: number = SCREEN_WIDTH): number {
  return CATEGORY_GRID_GAP
}

export function calculateCategoryItemWidth(_screenWidth: number = SCREEN_WIDTH): number {
  return CATEGORY_ITEM_WIDTH
}

interface CategoryTileProps {
  item: HomeCategoryItem
  index: number
  itemWidth: number
  reducedMotion: boolean
  onPress: (route: string) => void
}

const CategoryTile = memo(function CategoryTile({
  item,
  index,
  itemWidth,
  reducedMotion,
  onPress,
}: CategoryTileProps) {
  const pressed = useSharedValue(0)
  const scaleFactor = CATEGORY_ICON_SCALES[item.id] ?? 1.0
  const tint = CATEGORY_TINTS[item.id] || Colors.surfaceAlt

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

  const enteringAnimation = reducedMotion
    ? undefined
    : FadeInDown.delay(index * 30).springify().damping(18).stiffness(180)

  return (
    <Animated.View
      entering={enteringAnimation}
      style={[s.itemWrap, { width: itemWidth }]}
    >
      <Pressable
        testID={`category-tile-${item.id}`}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Animated.View style={[s.card, item.isAction && s.actionCard, animatedCardStyle]}>
          <LinearGradient
            testID="tile-gradient"
            colors={[Colors.surface, tint]}
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
            <View testID="category-tile-shadow" style={s.iconShadow} pointerEvents="none" />
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
    </Animated.View>
  )
})

export function HomeCategoriesGrid() {
  const reducedMotion = useAppReducedMotion()

  const handleNavigate = useCallback((route: string) => {
    router.push(route as any)
  }, [])

  return (
    <View style={s.container}>
      <View style={s.cardContainer}>
        <ScrollView
          testID="home-categories-scroll"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {HOME_CATEGORIES.map((cat, index) => (
            <CategoryTile
              key={cat.id}
              item={cat}
              index={index}
              itemWidth={CATEGORY_ITEM_WIDTH}
              reducedMotion={reducedMotion}
              onPress={handleNavigate}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: Spacing.space5,
    width: '100%',
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: CATEGORY_GRID_GAP,
  },
  itemWrap: {
    width: CATEGORY_ITEM_WIDTH,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    width: CATEGORY_ITEM_WIDTH,
    height: CATEGORY_ITEM_HEIGHT,
    minHeight: CATEGORY_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    height: 56,
    marginBottom: 4,
  },
  iconBox: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 54,
    height: 54,
  },
  iconShadow: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryDark,
    opacity: 0.12,
    marginTop: -4,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actionLabel: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
})

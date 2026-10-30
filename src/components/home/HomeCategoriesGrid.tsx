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
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
 * Backward-compatible helper functions for category items and gaps.
 * In D-163h, tiles are 78x90 portrait floating without an outer container card.
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
}

const CategoryTile = memo(function CategoryTile({
  item,
  itemWidth,
  reducedMotion,
  onPress,
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

export function HomeCategoriesGrid() {
  const reducedMotion = useAppReducedMotion()

  const handleNavigate = useCallback((route: string) => {
    router.push(route as any)
  }, [])

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
            reducedMotion={reducedMotion}
            onPress={handleNavigate}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space4,
    width: '100%',
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

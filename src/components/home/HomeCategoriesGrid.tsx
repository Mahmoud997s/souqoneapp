import React, { memo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  type ImageSourcePropType,
} from 'react-native'
import { Image } from 'expo-image'
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
import { GlassSurface, useGlassSupport, type GlassSupport } from '../navigation/glassSupport'
import type { MaterialCommunityIcons } from '@expo/vector-icons'

import { CATEGORY_ICONS } from '../../constants/categoryIcons'
export { CATEGORY_ICONS } from '../../constants/categoryIcons'

export interface HomeCategoryItem {
  id: string
  label: string
  route: string
  image: ImageSourcePropType
  icon?: keyof typeof MaterialCommunityIcons.glyphMap
  isAction?: boolean
}

export const HOME_CATEGORIES: HomeCategoryItem[] = [
  { id: 'cars',      label: 'سيارات',    route: '/cars',                     image: CATEGORY_ICONS.cars,      icon: 'car-sports' },
  { id: 'services',  label: 'خدمات',     route: '/services',                 image: CATEGORY_ICONS.services,  icon: 'car-wrench' },
  { id: 'parts',     label: 'قطع غيار',  route: '/parts',                    image: CATEGORY_ICONS.parts,     icon: 'car-cog' },
  { id: 'equipment', label: 'معدات',     route: '/equipment',                image: CATEGORY_ICONS.equipment, icon: 'excavator' },
  { id: 'buses',     label: 'حافلات',    route: '/buses',                    image: CATEGORY_ICONS.buses,     icon: 'bus-side' },
  { id: 'operators', label: 'المشغلين',  route: '/equipment/operators/browse', image: CATEGORY_ICONS.operators, icon: 'account-hard-hat' },
  { id: 'browse',    label: 'تصفح الكل', route: '/(tabs)/search',            image: CATEGORY_ICONS.browse,    icon: 'grid-large', isAction: true },
]

const { width: SCREEN_WIDTH } = Dimensions.get('window')
export const CATEGORY_GRID_COLUMNS = 4
export const CATEGORY_GRID_GAP = 6
export const CATEGORY_GRID_PADDING_H = 16
export const CATEGORY_ICON_SIZE = 38

/**
 * Calculates item width so that 4 tiles with gaps and padding fit on any screen width.
 */
export function calculateCategoryItemWidth(screenWidth: number = SCREEN_WIDTH): number {
  const available = screenWidth - (CATEGORY_GRID_PADDING_H * 2) - (CATEGORY_GRID_GAP * (CATEGORY_GRID_COLUMNS - 1))
  return Math.floor(available / CATEGORY_GRID_COLUMNS)
}

/**
 * Calculates item height so every tile is strictly square (width == height).
 */
export function calculateCategoryItemHeight(screenWidth: number = SCREEN_WIDTH): number {
  return calculateCategoryItemWidth(screenWidth)
}

export function calculateCategoryGridGap(_screenWidth: number = SCREEN_WIDTH): number {
  return CATEGORY_GRID_GAP
}

export const CATEGORY_ITEM_WIDTH = calculateCategoryItemWidth(SCREEN_WIDTH)
export const CATEGORY_ITEM_HEIGHT = CATEGORY_ITEM_WIDTH
export const CATEGORY_ITEM_SIZE = CATEGORY_ITEM_WIDTH

interface CategoryTileProps {
  item: HomeCategoryItem
  reducedMotion: boolean
  onPress: (route: string) => void
  support?: GlassSupport
}

const CategoryTile = memo(function CategoryTile({
  item,
  reducedMotion,
  onPress,
  support,
}: CategoryTileProps) {
  const pressed = useSharedValue(0)

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
    <View style={s.itemWrap}>
      <Pressable
        testID={`category-tile-${item.id}`}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
        style={s.pressable}
      >
        <Animated.View style={[s.card, item.isAction && s.actionCard, animatedCardStyle]}>
          <GlassSurface
            testID={`category-tile-${item.id}`}
            borderRadius={14}
            noBorder={true}
            support={support}
          />
          <View testID={`icon-container-${item.id}`} style={s.iconContainer}>
            <Animated.View style={[s.iconBox, animatedIconStyle]}>
              <Image
                testID="category-tile-image"
                source={item.image}
                style={s.iconImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
            </Animated.View>
          </View>
          <View testID="category-tile-label-box" style={s.labelBox}>
            <Text
              style={[s.label, item.isAction && s.actionLabel]}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {item.label}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  )
})

export function HomeCategoriesGrid({
  reducedMotion: reducedMotionProp,
  support: supportProp,
}: {
  reducedMotion?: boolean
  support?: GlassSupport
} = {}) {
  const hookReducedMotion = useAppReducedMotion()
  const reducedMotion = reducedMotionProp !== undefined ? reducedMotionProp : hookReducedMotion
  const hookGlass = useGlassSupport()
  const glass = supportProp ?? hookGlass

  const handleNavigate = useCallback((route: string) => {
    router.push(route as any)
  }, [])

  const topRowItems = HOME_CATEGORIES.slice(0, 4)
  const bottomRowItems = HOME_CATEGORIES.slice(4)

  return (
    <View testID="home-categories-container" style={s.container}>
      <View testID="home-categories-row-top" style={s.row}>
        {topRowItems.map((cat) => (
          <CategoryTile
            key={cat.id}
            item={cat}
            reducedMotion={reducedMotion}
            onPress={handleNavigate}
            support={glass}
          />
        ))}
      </View>
      <View testID="home-categories-row-bottom" style={[s.row, s.bottomRow]}>
        {bottomRowItems.map((cat) => (
          <CategoryTile
            key={cat.id}
            item={cat}
            reducedMotion={reducedMotion}
            onPress={handleNavigate}
            support={glass}
          />
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space4,
    width: '100%',
    paddingHorizontal: CATEGORY_GRID_PADDING_H,
    gap: CATEGORY_GRID_GAP,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CATEGORY_GRID_GAP,
    width: '100%',
  },
  bottomRow: {
    justifyContent: 'flex-start',
  },
  itemWrap: {
    width: CATEGORY_ITEM_WIDTH,
    height: CATEGORY_ITEM_HEIGHT,
  },
  pressable: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 2,
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
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionCard: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CATEGORY_ICON_SIZE,
    marginBottom: 4,
  },
  iconBox: {
    width: CATEGORY_ICON_SIZE,
    height: CATEGORY_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: CATEGORY_ICON_SIZE,
    height: CATEGORY_ICON_SIZE,
  },
  labelBox: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    width: '100%',
  },
  actionLabel: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
})

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

export interface HomeCategoryItem {
  id: string
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  route: string
  isAction?: boolean
}

export const HOME_CATEGORIES: HomeCategoryItem[] = [
  { id: 'cars',      label: 'سيارات',    icon: 'car-sports',           route: '/cars' },
  { id: 'jobs',      label: 'وظائف',     icon: 'account-tie',          route: '/jobs' },
  { id: 'services',  label: 'خدمات',     icon: 'car-wrench',           route: '/services' },
  { id: 'parts',     label: 'قطع غيار',  icon: 'car-cog',              route: '/parts' },
  { id: 'equipment', label: 'معدات',     icon: 'excavator',            route: '/equipment' },
  { id: 'buses',     label: 'حافلات',    icon: 'bus-side',             route: '/buses' },
  { id: 'transport', label: 'نقل وشحن',  icon: 'truck-fast',           route: '/transport' },
  { id: 'browse',    label: 'تصفح الكل', icon: 'grid-large',           route: '/(tabs)/browse', isAction: true },
]

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const GAP = 8
const PADDING_H = Spacing.space4 * 2 // 16 * 2 = 32
const ITEM_WIDTH = Math.floor((SCREEN_WIDTH - PADDING_H - (GAP * 3)) / 4)

export function HomeCategoriesGrid() {
  return (
    <View style={s.container}>
      <View style={s.grid}>
        {HOME_CATEGORIES.map((cat, index) => {
          const isAction = cat.isAction
          return (
            <Animated.View
              key={cat.id}
              entering={FadeInDown.delay(index * 30).springify()}
              style={[s.itemWrap, { width: ITEM_WIDTH }]}
            >
              <TouchableOpacity
                style={[s.card, isAction && s.actionCard]}
                onPress={() => router.push(cat.route as any)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={cat.label}
              >
                <View style={[s.iconBox, isAction && s.actionIconBox]}>
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={21}
                    color={Colors.primary}
                  />
                </View>
                <Text
                  style={[s.label, isAction && s.actionLabel]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    justifyContent: 'space-between',
  },
  itemWrap: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionCard: {
    backgroundColor: Colors.paleMint,
    borderColor: Colors.primary,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionIconBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0, 156, 181, 0.25)',
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingTop: 1,
  },
  actionLabel: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
})

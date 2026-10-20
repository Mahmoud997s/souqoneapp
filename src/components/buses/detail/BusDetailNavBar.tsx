import React from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'

export interface BusDetailNavBarProps {
  onBack: () => void
  isFavorite: boolean
  favoriteBusy: boolean
  canFavorite: boolean
  onToggleFavorite: () => void
  searchValue: string
  onSearchChange: (v: string) => void
  onSearchSubmit: (v: string) => void
  scrollY: SharedValue<number>
  placeholder?: string
  paddingTop: number
}

/**
 * BusDetailNavBar
 * Glassmorphic navigation bar specifically for bus detail page.
 * Strictly adheres to design decision:
 * - Back and favorite buttons visible
 * - Section search bar fades in on scroll
 * - NO share button
 * - Zero hex color codes
 */
export function BusDetailNavBar({
  onBack,
  isFavorite,
  favoriteBusy,
  canFavorite,
  onToggleFavorite,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  scrollY,
  placeholder = 'ابحث في تفاصيل الحافلة...',
  paddingTop,
}: BusDetailNavBarProps) {
  const solidBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [40, 100], [0, 1], Extrapolation.CLAMP)
    return { opacity }
  })

  const searchBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [60, 110], [0, 1], Extrapolation.CLAMP)
    return {
      opacity,
    }
  })

  return (
    <View style={[s.container, { paddingTop }]} pointerEvents="box-none">
      {/* Animated Glassmorphism Background */}
      <Animated.View
        style={[StyleSheet.absoluteFill, solidBgStyle]}
        pointerEvents="none"
      >
        <BlurView
          intensity={65}
          tint="light"
          blurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, s.glassBackground]}
        />
      </Animated.View>

      <View style={s.contentRow}>
        {/* Back Button */}
        <TouchableOpacity
          style={s.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          testID="btn-detail-back"
          accessibilityLabel="رجوع"
        >
          <Ionicons name="arrow-forward-outline" size={20} color={Colors.text} />
        </TouchableOpacity>

        {/* Search Bar (Centered / Animated) */}
        <Animated.View style={[s.searchContainer, searchBarStyle]}>
          <Ionicons name="search-outline" size={17} color={Colors.placeholder} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            value={searchValue}
            onChangeText={onSearchChange}
            onSubmitEditing={() => onSearchSubmit(searchValue)}
            placeholder={placeholder}
            placeholderTextColor={Colors.placeholder}
            returnKeyType="search"
            textAlign="right"
          />
          {searchValue ? (
            <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.placeholder} />
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {/* Action Button: Favorite ONLY (No share button) */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.iconButton, !canFavorite && s.disabledButton]}
            onPress={onToggleFavorite}
            disabled={favoriteBusy || !canFavorite}
            activeOpacity={0.7}
            testID="btn-detail-favorite"
            accessibilityLabel="المفضلة"
          >
            {favoriteBusy ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? Colors.error : Colors.text}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  glassBackground: {
    backgroundColor: Colors.surface,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space2,
    gap: Spacing.space2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.space3,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  searchIcon: {
    marginRight: Spacing.space1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    paddingVertical: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
})

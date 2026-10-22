import React, { useState } from 'react'
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
  useAnimatedReaction,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { lineHeightFor } from '../../../constants/typography'

export interface EquipmentDetailNavBarProps {
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
 * EquipmentDetailNavBar
 * Glassmorphic navigation bar specifically for equipment detail page.
 * Strictly adheres to equipment design decision:
 * - Back button and favorite button (when eligible) visible
 * - Section search bar fades in on scroll (becomes interactive at 85px scroll)
 * - Zero share button and zero extra header buttons
 * - Zero hex color codes
 */
export function EquipmentDetailNavBar({
  onBack,
  isFavorite,
  favoriteBusy,
  canFavorite,
  onToggleFavorite,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  scrollY,
  placeholder = 'ابحث في تفاصيل المعدة...',
  paddingTop,
}: EquipmentDetailNavBarProps) {
  const [searchInteractive, setSearchInteractive] = useState(false)

  useAnimatedReaction(
    () => scrollY.value >= 85,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setSearchInteractive)(current)
      }
    },
    [scrollY]
  )

  const bgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 85], [0, 0.95], Extrapolation.CLAMP)
    const borderOpacity = interpolate(scrollY.value, [0, 85], [0, 1], Extrapolation.CLAMP)
    return {
      opacity,
      borderBottomWidth: borderOpacity > 0 ? 1 : 0,
    }
  })

  const searchStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [40, 85], [0, 1], Extrapolation.CLAMP)
    const translateY = interpolate(scrollY.value, [40, 85], [-8, 0], Extrapolation.CLAMP)
    return {
      opacity,
      transform: [{ translateY }],
    }
  })

  return (
    <View style={[s.navWrapper, { paddingTop }]} pointerEvents="box-none" testID="equipment-detail-navbar">
      {/* Dynamic Glassmorphic Background */}
      <Animated.View style={[StyleSheet.absoluteFill, s.blurContainer, bgStyle]} pointerEvents="none">
        <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={s.contentRow} pointerEvents="box-none">
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          style={s.actionButton}
          activeOpacity={0.7}
          testID="nav-back-button"
          accessibilityRole="button"
          accessibilityLabel="الرجوع"
        >
          <Ionicons name="arrow-forward" size={20} color={Colors.text} />
        </TouchableOpacity>

        {/* Search Bar (Fades in when scrolled) */}
        <Animated.View
          style={[s.searchContainer, searchStyle]}
          pointerEvents={searchInteractive ? 'auto' : 'none'}
          testID="nav-search-container"
        >
          <Ionicons name="search" size={16} color={Colors.textMuted} style={s.searchIcon} />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            onSubmitEditing={() => onSearchSubmit(searchValue)}
            placeholder={placeholder}
            placeholderTextColor={Colors.placeholder}
            style={s.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
            testID="nav-search-input"
          />
        </Animated.View>

        {/* Favorite Button (or spacer) */}
        {canFavorite ? (
          <TouchableOpacity
            onPress={onToggleFavorite}
            style={s.actionButton}
            activeOpacity={0.7}
            disabled={favoriteBusy}
            testID="nav-favorite-button"
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
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
        ) : (
          <View style={s.buttonSpacer} />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space2,
  },
  blurContainer: {
    backgroundColor: Colors.white,
    borderBottomColor: Colors.border,
    ...Shadows.card,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    minHeight: Spacing.touch,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  buttonSpacer: {
    width: 40,
    height: 40,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginEnd: Spacing.space2,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    paddingVertical: 0,
  },
})

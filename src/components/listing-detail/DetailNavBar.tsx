import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'

export interface DetailNavBarProps {
  onBack: () => void
  isFavorite: boolean
  favoriteBusy: boolean
  canFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
  searchValue: string
  onSearchChange: (v: string) => void
  onSearchSubmit: (v: string) => void
  scrollY: SharedValue<number>
  placeholder: string
  paddingTop: number
}

/**
 * DetailNavBar
 * D-31 compliant navigation bar for detail page.
 * - Back, favorite, and share buttons remain fixed & visible at all times.
 * - Crossfades background from transparent to solid white based on scrollY (~80px).
 * - Search bar smoothly fades in when scrolled into solid state.
 */
export function DetailNavBar({
  onBack,
  isFavorite,
  favoriteBusy,
  canFavorite,
  onToggleFavorite,
  onShare,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  scrollY,
  placeholder,
  paddingTop,
}: DetailNavBarProps) {
  const solidBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [40, 100], [0, 1], Extrapolation.CLAMP)
    return { opacity }
  })

  const searchBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [60, 110], [0, 1], Extrapolation.CLAMP)
    return {
      opacity,
      pointerEvents: scrollY.value > 80 ? 'auto' : 'none',
    }
  })

  return (
    <View style={[s.container, { paddingTop }]} pointerEvents="box-none">
      {/* Animated Solid White Background */}
      <Animated.View style={[StyleSheet.absoluteFill, s.solidBackground, solidBgStyle]} />

      <View style={s.contentRow}>
        {/* Back Button */}
        <TouchableOpacity
          style={s.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          testID="btn-detail-back"
          accessibilityLabel="رجوع"
        >
          <Ionicons name="arrow-forward-outline" size={22} color={Colors.text} />
        </TouchableOpacity>

        {/* Search Bar (Centered / Animated) */}
        <Animated.View style={[s.searchContainer, searchBarStyle]}>
          <Ionicons name="search-outline" size={18} color={Colors.placeholder} style={s.searchIcon} />
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

        {/* Action Buttons (Share & Favorite) */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.iconButton}
            onPress={onShare}
            activeOpacity={0.7}
            testID="btn-detail-share"
            accessibilityLabel="مشاركة"
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.text} />
          </TouchableOpacity>

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
                size={22}
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
    zIndex: 100,
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space2,
  },
  solidBackground: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.nav,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    gap: Spacing.space2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.space3,
    marginHorizontal: Spacing.space1,
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
    lineHeight: 18,
    color: Colors.text,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    textAlign: 'right',
  },
})

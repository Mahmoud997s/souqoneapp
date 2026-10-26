import React from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { lineHeightFor } from '../../constants/typography'

interface BaseDetailTopBarProps {
  onBack: () => void
  onShare?: () => void
  isFavorite?: boolean
  favoriteBusy?: boolean
  canFavorite?: boolean
  onToggleFavorite?: () => void
  paddingTop?: number
  testID?: string
}

interface DetailTopBarWithoutSearchProps extends BaseDetailTopBarProps {
  searchValue?: never
  onSearchChange?: never
  onSearchSubmit?: never
  placeholder?: never
}

interface DetailTopBarWithSearchProps extends BaseDetailTopBarProps {
  searchValue: string
  onSearchChange: (v: string) => void
  onSearchSubmit?: (v: string) => void
  placeholder?: string
}

export type DetailTopBarProps =
  | DetailTopBarWithoutSearchProps
  | DetailTopBarWithSearchProps

/**
 * DetailTopBar
 * Shared fixed navigation bar for detail screens (cars, buses, equipment, operators).
 * - Placed in normal layout flow at top of root container (NOT position: absolute).
 * - Safe area top padding derived directly from useSafeAreaInsets().top.
 * - Solid surface background with subtle hairline bottom border.
 * - In-page search bar is always visible and immediately interactive when search props provided.
 * - Minimum 44x44 touch targets for all interactive controls (Spacing.touch).
 * - Zero raw hex or rgba color codes (100% Colors design tokens).
 */
export function DetailTopBar(props: DetailTopBarProps) {
  const insets = useSafeAreaInsets()
  const {
    onBack,
    onShare,
    isFavorite = false,
    favoriteBusy = false,
    canFavorite = false,
    onToggleFavorite,
    paddingTop,
    testID = 'detail-top-bar',
  } = props

  const resolvedPaddingTop = paddingTop !== undefined ? paddingTop : insets.top

  const hasSearch =
    typeof props.onSearchChange === 'function' && typeof props.searchValue === 'string'
  const searchValue = hasSearch ? props.searchValue : ''
  const onSearchChange = hasSearch ? props.onSearchChange : undefined
  const onSearchSubmit = hasSearch ? props.onSearchSubmit : undefined
  const placeholder = hasSearch ? (props.placeholder ?? 'ابحث في التفاصيل...') : undefined

  const hasShare = typeof onShare === 'function'
  const showFavorite = Boolean(canFavorite && onToggleFavorite)

  return (
    <View
      style={[s.container, { paddingTop: resolvedPaddingTop }]}
      testID={testID}
      pointerEvents="box-none"
    >
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

        {/* Search Bar (always visible & interactive) or flexible spacer if search omitted */}
        {hasSearch ? (
          <View style={s.searchContainer} testID="nav-search-container">
            <Ionicons name="search" size={16} color={Colors.textMuted} style={s.searchIcon} />
            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              onSubmitEditing={() => onSearchSubmit?.(searchValue)}
              placeholder={placeholder}
              placeholderTextColor={Colors.placeholder}
              style={s.searchInput}
              returnKeyType="search"
              textAlign="right"
              autoCorrect={false}
              autoCapitalize="none"
              testID="nav-search-input"
              maxFontSizeMultiplier={1.3}
            />
            {searchValue ? (
              <TouchableOpacity
                onPress={() => onSearchChange?.('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={s.clearButton}
                testID="nav-search-clear"
                accessibilityRole="button"
                accessibilityLabel="مسح البحث"
              >
                <Ionicons name="close-circle" size={16} color={Colors.placeholder} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={s.flexibleSpacer} />
        )}

        {/* Action Buttons (Share & Favorite) */}
        {hasShare || showFavorite ? (
          <View style={s.actionsRow} pointerEvents="box-none">
            {hasShare ? (
              <TouchableOpacity
                onPress={onShare}
                style={s.actionButton}
                activeOpacity={0.7}
                testID="btn-detail-share"
                accessibilityRole="button"
                accessibilityLabel="مشاركة"
              >
                <Ionicons name="share-social-outline" size={19} color={Colors.text} />
              </TouchableOpacity>
            ) : null}

            {showFavorite ? (
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
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space2,
    zIndex: 10,
    ...Shadows.card,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Spacing.touch,
    gap: Spacing.space2,
  },
  actionButton: {
    width: Spacing.touch,
    height: Spacing.touch,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  flexibleSpacer: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    height: Spacing.touch,
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
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
  },
  clearButton: {
    padding: Spacing.space1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

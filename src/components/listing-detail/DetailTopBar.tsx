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
import { BlurView } from 'expo-blur'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { Colors } from '../../constants/colors'
import { TopBarTokens } from '../../constants/topBarTokens'

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
 * Shared fixed navigation bar for detail screens (cars, buses, equipment, operators, parts, services).
 * - Placed in normal layout flow at top of root container (NOT position: absolute).
 * - Safe area top padding derived directly from useSafeAreaInsets().top.
 * - Visual styling matches the compact state of AnimatedHeroHeader on the home page (D-160):
 *   * Glassmorphic background: BlurView (intensity 65, tint light) + white wash (0.78) + tint overlay (3%) + 5% architectural green grid pattern
 *   * Circular buttons: 38x38 with radius 19, white 0.85, 1px border, soft shadow, Colors.primary icons (19px)
 *   * Minimum 44x44 touch target preserved via hitSlop 3 on 38px circular controls
 *   * Compact search bar: height 38, radius pill, background rgba(238,242,245,0.95), 12/16 Almarai typography
 * - Zero raw hex codes in component (100% design tokens from Colors & TopBarTokens).
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
      {/* ── GLASSMORPHISM BLUR BACKGROUND (Matches Home Compact Bar) ── */}
      <BlurView
        intensity={TopBarTokens.blurIntensity}
        tint={TopBarTokens.blurTint}
        blurMethod={TopBarTokens.blurMethod}
        style={StyleSheet.absoluteFill}
        testID="detail-top-bar-blur"
      />
      <View style={s.whiteWash} pointerEvents="none" testID="detail-top-bar-whitewash" />
      <View style={s.tintOverlay} pointerEvents="none" testID="detail-top-bar-tint" />

      {/* ── ARCHITECTURAL GREEN GRID PATTERN OVERLAY (5% Opacity) ── */}
      <View style={[StyleSheet.absoluteFill, s.gridContainer]} pointerEvents="none" testID="detail-top-bar-grid">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="detailTopBarGrid"
              width={TopBarTokens.gridPatternSize}
              height={TopBarTokens.gridPatternSize}
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke={TopBarTokens.gridStrokeColor}
                strokeWidth={TopBarTokens.gridStrokeWidth}
                strokeOpacity={TopBarTokens.gridStrokeOpacity}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#detailTopBarGrid)" />
        </Svg>
      </View>

      <View style={s.contentRow} pointerEvents="box-none">
        {/* Back Button (Circular 38x38, hitSlop 3 for 44px min touch target) */}
        <TouchableOpacity
          onPress={onBack}
          style={s.actionButton}
          activeOpacity={0.7}
          hitSlop={TopBarTokens.buttonHitSlop}
          testID="nav-back-button"
          accessibilityRole="button"
          accessibilityLabel="الرجوع"
        >
          <Ionicons
            name="arrow-forward-outline"
            size={TopBarTokens.buttonIconSize}
            color={TopBarTokens.buttonIconColor}
          />
        </TouchableOpacity>

        {/* Search Bar or Flexible Spacer */}
        {hasSearch ? (
          <View style={s.searchContainer} testID="nav-search-container">
            <Ionicons
              name="search"
              size={TopBarTokens.searchIconSize}
              color={TopBarTokens.searchIconColor}
              style={s.searchIcon}
            />
            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              onSubmitEditing={() => onSearchSubmit?.(searchValue)}
              placeholder={placeholder}
              placeholderTextColor={TopBarTokens.searchPlaceholderColor}
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
                <Ionicons
                  name="close-circle"
                  size={TopBarTokens.clearIconSize}
                  color={TopBarTokens.clearIconColor}
                />
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
                hitSlop={TopBarTokens.buttonHitSlop}
                testID="btn-detail-share"
                accessibilityRole="button"
                accessibilityLabel="مشاركة"
              >
                <Ionicons
                  name="share-social-outline"
                  size={TopBarTokens.buttonIconSize}
                  color={TopBarTokens.buttonIconColor}
                />
              </TouchableOpacity>
            ) : null}

            {showFavorite ? (
              <TouchableOpacity
                onPress={onToggleFavorite}
                style={s.actionButton}
                activeOpacity={0.7}
                disabled={favoriteBusy}
                hitSlop={TopBarTokens.buttonHitSlop}
                testID="nav-favorite-button"
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              >
                {favoriteBusy ? (
                  <ActivityIndicator size="small" color={TopBarTokens.buttonIconColor} />
                ) : (
                  <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={TopBarTokens.buttonIconSize}
                    color={isFavorite ? Colors.error : TopBarTokens.buttonIconColor}
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
    borderBottomWidth: TopBarTokens.borderBottomWidth,
    borderBottomColor: TopBarTokens.borderBottomColor,
    paddingHorizontal: TopBarTokens.rowPaddingHorizontal,
    paddingBottom: TopBarTokens.bottomPad,
    zIndex: 10,
    overflow: 'hidden',
    ...TopBarTokens.shadow,
  },
  whiteWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TopBarTokens.whiteWashBg,
  },
  tintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TopBarTokens.tintOverlayColor,
    opacity: TopBarTokens.tintOverlayOpacity,
  },
  gridContainer: {
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TopBarTokens.rowHeight,
    gap: TopBarTokens.rowGap,
    marginTop: TopBarTokens.topPadOffset,
  },
  actionButton: {
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    backgroundColor: TopBarTokens.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    ...TopBarTokens.buttonShadow,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TopBarTokens.rowGap,
  },
  flexibleSpacer: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    height: TopBarTokens.searchHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TopBarTokens.searchBg,
    borderRadius: TopBarTokens.searchRadius,
    paddingHorizontal: TopBarTokens.searchPaddingHorizontal,
    borderWidth: TopBarTokens.searchBorderWidth,
    borderColor: TopBarTokens.searchBorderColor,
    gap: TopBarTokens.searchGap,
  },
  searchIcon: {
    opacity: TopBarTokens.searchIconOpacity,
  },
  searchInput: {
    flex: 1,
    fontFamily: TopBarTokens.searchFontFamily,
    fontSize: TopBarTokens.searchFontSize,
    lineHeight: TopBarTokens.searchLineHeight,
    color: TopBarTokens.searchTextColor,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: Platform.OS === 'ios' ? 4 : 1,
  },
  clearButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

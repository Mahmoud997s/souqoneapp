import React from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { Colors } from '../../../constants/colors'
import { TopBarTokens } from '../../../constants/topBarTokens'

interface SearchHeaderBarProps {
  query: string
  onChangeText: (text: string) => void
  onSubmit: () => void
  onClear: () => void
  activeFiltersCount: number
  onOpenFilters: () => void
}

/**
 * SearchHeaderBar
 * Specialized navigation header for SearchScreen matching the glassmorphic
 * design and TopBarTokens of the Home compact header (D-160 / D-163b).
 *
 * - Glassmorphic background layers: BlurView (65 light), white wash (0.78),
 *   tint overlay (3%), architectural grid pattern (5%), and subtle shadow.
 * - 38h pill search bar with Almarai 12/16 typography and clear button.
 * - Circular 38x38 filter button with 44px min touch target via hitSlop 3.
 * - 100% functional parity: handlers, search submit, clear, and filter badge preserved.
 */
export const SearchHeaderBar = React.memo(function SearchHeaderBar({
  query,
  onChangeText,
  onSubmit,
  onClear,
  activeFiltersCount,
  onOpenFilters,
}: SearchHeaderBarProps) {
  const insets = useSafeAreaInsets()
  const paddingTop = insets.top + TopBarTokens.topPadOffset

  return (
    <View style={[s.container, { paddingTop }]}>
      {/* ── GLASSMORPHISM BLUR BACKGROUND (Matches Home Compact Bar) ── */}
      <BlurView
        intensity={TopBarTokens.blurIntensity}
        tint={TopBarTokens.blurTint}
        blurMethod={TopBarTokens.blurMethod}
        style={StyleSheet.absoluteFill}
        testID="search-header-blur"
      />
      <View style={s.whiteWash} pointerEvents="none" testID="search-header-whitewash" />
      <View style={s.tintOverlay} pointerEvents="none" testID="search-header-tint" />

      {/* ── ARCHITECTURAL GREEN GRID PATTERN OVERLAY (5% Opacity) ── */}
      <View style={[StyleSheet.absoluteFill, s.gridContainer]} pointerEvents="none" testID="search-header-grid">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="searchHeaderGrid"
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
          <Rect width="100%" height="100%" fill="url(#searchHeaderGrid)" />
        </Svg>
      </View>

      {/* ── CONTENT ROW ── */}
      <View style={s.contentRow}>
        {/* Search Pill Input */}
        <View style={s.searchBarContainer} testID="search-bar-container">
          <Ionicons
            name="search"
            size={TopBarTokens.searchIconSize}
            color={TopBarTokens.searchIconColor}
            style={[s.searchIcon, { opacity: TopBarTokens.searchIconOpacity }]}
          />
          <TextInput
            style={s.searchInput}
            placeholder="ابحث عن سيارات، معدات، قطع غيار..."
            placeholderTextColor={TopBarTokens.searchPlaceholderColor}
            value={query}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            textAlign="right"
          />
          {query.length > 0 && (
            <TouchableOpacity
              testID="search-clear-button"
              onPress={onClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.clearBtn}
              accessibilityLabel="مسح البحث"
            >
              <Ionicons
                name="close-circle"
                size={TopBarTokens.clearIconSize}
                color={TopBarTokens.clearIconColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Circular Filter Button */}
        <TouchableOpacity
          testID="search-filter-button"
          style={s.filterBtn}
          onPress={onOpenFilters}
          activeOpacity={0.7}
          accessibilityLabel="فلاتر البحث"
          hitSlop={TopBarTokens.buttonHitSlop}
        >
          <Ionicons
            name="options-outline"
            size={TopBarTokens.buttonIconSize}
            color={TopBarTokens.buttonIconColor}
          />
          {activeFiltersCount > 0 && (
            <View style={s.filterBadge} testID="search-filter-badge">
              <Text style={s.filterBadgeText} testID="search-filter-badge-text">
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
})

const s = StyleSheet.create({
  container: {
    paddingBottom: TopBarTokens.bottomPad,
    borderBottomWidth: TopBarTokens.borderBottomWidth,
    borderBottomColor: TopBarTokens.borderBottomColor,
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
    height: TopBarTokens.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TopBarTokens.rowPaddingHorizontal,
    gap: TopBarTokens.rowGap,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TopBarTokens.searchBg,
    borderWidth: TopBarTokens.searchBorderWidth,
    borderColor: TopBarTokens.searchBorderColor,
    height: TopBarTokens.searchHeight,
    borderRadius: TopBarTokens.searchRadius,
    paddingHorizontal: TopBarTokens.searchPaddingHorizontal,
    gap: TopBarTokens.searchGap,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: TopBarTokens.searchFontFamily,
    fontSize: TopBarTokens.searchFontSize,
    lineHeight: TopBarTokens.searchLineHeight,
    color: Colors.text,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    writingDirection: 'rtl',
  },
  clearBtn: {
    padding: 2,
  },
  filterBtn: {
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    backgroundColor: TopBarTokens.buttonBg,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...TopBarTokens.buttonShadow,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  filterBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9,
    lineHeight: 12,
    color: Colors.white,
    textAlign: 'center',
  },
})

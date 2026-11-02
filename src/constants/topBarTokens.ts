import { StyleSheet, Platform } from 'react-native'
import { Colors } from './colors'
import { Spacing } from './spacing'
import { Radius } from './radius'
import { BottomBarTokens } from './bottomBarTokens'

/**
 * TopBarTokens
 * Single source of truth for the glassmorphic compact navigation bar styling,
 * shared between AnimatedHeroHeader (compact state) and DetailTopBar.
 * Extracted per task D-160 to guarantee 100% visual parity without style drift.
 */
export const TopBarTokens = {
  // Layout Dimensions
  rowHeight: 44,
  rowPaddingHorizontal: Spacing.space3, // 12
  rowGap: 6,
  topPadOffset: 6,
  bottomPad: 6,
  /**
   * Detail top bar fixed body height (excluding insets.top):
   * topPadOffset (6) + rowHeight (44) + bottomPad (6) = 56.
   * Total bar height in absolute overlay mode = insets.top + detailTopBarBodyHeight.
   */
  detailTopBarBodyHeight: 56,

  // Glass Background Layers
  blurIntensity: 65,
  blurTint: 'light' as const,
  blurMethod: 'dimezisBlurView' as const,
  whiteWashBg: BottomBarTokens.whiteWashBg,
  tintOverlayColor: Colors.primary,
  tintOverlayOpacity: 0.03,
  gridPatternSize: 30,
  gridStrokeColor: Colors.forestGreen,
  gridStrokeOpacity: 0.05,
  gridStrokeWidth: 1,
  borderBottomColor: Colors.border,
  borderBottomWidth: 1,

  // Segmented category tabs tokens (SearchCategoryTabs)
  categoryTrackBg: '#f1f5f9',
  categoryTabBg: '#ffffff',

  // Outer Elevation Shadow
  shadow: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
  }),

  // Ice Glass Unified Control Fill (D-182a2: derived from expanded Home header composite rgb(249,252,254) = #F9FCFE)
  iceGlass: '#F9FCFE',
  searchPillFill: '#F9FCFE',

  // Circular Action Buttons (38x38)
  buttonSize: 38,
  buttonRadius: 19,
  buttonBg: '#F9FCFE',
  buttonBorderColor: Colors.border,
  buttonBorderWidth: 1,
  buttonIconSize: 19,
  buttonIconColor: Colors.primary,
  buttonHitSlop: { top: 3, bottom: 3, left: 3, right: 3 }, // 38 + 6 = 44 minimum touch target
  buttonShadow: {
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  // Compact Search Bar (38h)
  searchHeight: 38,
  searchRadius: Radius.pill,
  searchBg: '#F9FCFE', // Retires #EEF2F5; unified with iceGlass (#F9FCFE)
  searchBorderColor: Colors.border,
  searchBorderWidth: 1,
  searchPaddingHorizontal: 10,
  searchGap: 6,
  searchIconSize: 16,
  searchIconColor: Colors.primary,
  searchIconOpacity: 0.8,
  searchTextColor: Colors.textMuted,
  searchPlaceholderColor: Colors.placeholder,
  searchFontFamily: 'Almarai_400Regular',
  searchFontSize: 12,
  searchLineHeight: 16,

  // Clear Button
  clearIconSize: 16,
  clearIconColor: Colors.placeholder,

  // Typography
  titleFontFamily: 'Almarai_800ExtraBold',
  titleFontSize: 16,
  titleLineHeight: 22,
  subTitleFontFamily: 'Almarai_400Regular',
  subTitleFontSize: 12,
  subTitleLineHeight: 16,
} as const

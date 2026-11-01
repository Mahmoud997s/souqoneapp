import { StyleSheet, Platform } from 'react-native'
import { Colors } from './colors'
import { Spacing } from './spacing'
import { Radius } from './radius'

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

  // Glass Background Layers
  blurIntensity: 65,
  blurTint: 'light' as const,
  blurMethod: 'dimezisBlurView' as const,
  whiteWashBg: 'rgba(255, 255, 255, 0.78)',
  tintOverlayColor: Colors.primary,
  tintOverlayOpacity: 0.03,
  gridPatternSize: 30,
  gridStrokeColor: Colors.forestGreen,
  gridStrokeOpacity: 0.05,
  gridStrokeWidth: 1,
  borderBottomColor: Colors.border,
  borderBottomWidth: 1,

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

  // Circular Action Buttons (38x38)
  buttonSize: 38,
  buttonRadius: 19,
  buttonBg: 'rgba(255, 255, 255, 0.85)',
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
  searchBg: 'rgba(238, 242, 245, 0.95)',
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

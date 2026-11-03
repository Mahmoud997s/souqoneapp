import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Spacing } from './spacing';
import { Radius } from './radius';
import { TopBarTokens } from './topBarTokens';

/**
 * FilterGlassTokens
 * Single source of truth for liquid ice-glass filter component styling
 * across browse & search screens, matching the compact navigation bar (TopBarTokens).
 * Implements task D-189 visual requirements without geometric or layout drift.
 */
export const FilterGlassTokens = {
  // Shared glass recipe tokens
  iceGlassBg: TopBarTokens.iceGlass, // '#F9FCFE'
  borderColor: TopBarTokens.buttonBorderColor, // Colors.border ('#E5E7EB')
  borderWidth: TopBarTokens.buttonBorderWidth, // 1
  shadow: TopBarTokens.buttonShadow,
  blurIntensity: TopBarTokens.blurIntensity, // 65
  blurTint: TopBarTokens.blurTint, // 'light'
  washColor: TopBarTokens.iceGlass,

  // QuickFilters chips tokens
  chip: {
    bg: TopBarTokens.iceGlass,
    borderColor: TopBarTokens.buttonBorderColor,
    borderWidth: 1,
    borderRadius: 20,
    shadow: TopBarTokens.buttonShadow,
    textColor: Colors.text,
    iconColor: Colors.textMuted,
    activeBg: Colors.primary,
    activeBorderColor: Colors.primary,
    activeTextColor: Colors.white,
    activeIconColor: Colors.white,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15.5,
  },

  // ListingTabs & VisualFilters segmented tabs tokens
  tab: {
    trackBg: TopBarTokens.iceGlass,
    trackBorderColor: TopBarTokens.buttonBorderColor,
    trackBorderWidth: 1,
    trackRadius: 8,
    inactiveBg: 'transparent',
    inactiveTextColor: Colors.textMuted,
    inactiveFontFamily: 'Almarai_700Bold',
    activeBg: Colors.white,
    activeBorderColor: TopBarTokens.buttonBorderColor,
    activeTextColor: Colors.primary,
    activeFontFamily: 'Almarai_800ExtraBold',
    activeShadow: TopBarTokens.buttonShadow,
    fontSize: 11.5,
    lineHeight: 15.5,
  },

  // Visual filter items and cards tokens
  card: {
    bg: TopBarTokens.iceGlass,
    borderColor: TopBarTokens.buttonBorderColor,
    borderWidth: 1,
    borderRadius: 8,
    shadow: TopBarTokens.buttonShadow,
    textColor: Colors.text,
    selectedBg: Colors.paleMint,
    selectedBorderColor: Colors.primary,
    selectedTextColor: Colors.primary,
    viewAllBg: Colors.surfaceAlt,
    viewAllIconBg: Colors.paleMint,
    viewAllTextColor: Colors.primary,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
  },

  // Results bar count chip & clear button tokens
  resultsBar: {
    countBg: TopBarTokens.iceGlass,
    countBorderColor: TopBarTokens.buttonBorderColor,
    countBorderWidth: 1,
    countRadius: 6,
    countShadow: TopBarTokens.buttonShadow,
    countTextColor: Colors.textMuted,
    countIconColor: Colors.textMuted,
    clearBg: TopBarTokens.iceGlass,
    clearBorderColor: TopBarTokens.buttonBorderColor,
    clearBorderWidth: 1,
    clearRadius: 6,
    clearShadow: TopBarTokens.buttonShadow,
    clearTextColor: Colors.error,
    clearIconColor: Colors.error,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
  },

  // QuickFilterModal sheet tokens
  sheet: {
    overlayBg: 'rgba(15, 23, 42, 0.45)',
    cardBg: TopBarTokens.iceGlass,
    cardBorderColor: TopBarTokens.buttonBorderColor,
    cardBorderWidth: 1,
    cardRadius: 16,
    cardShadow: TopBarTokens.shadow,
    dividerColor: Colors.border,
    dividerWidth: StyleSheet.hairlineWidth,
    titleColor: Colors.text,
    closeIconColor: Colors.textMuted,
    optionTextColor: Colors.text2,
    optionActiveTextColor: Colors.primary,
    optionCheckmarkColor: Colors.primary,
    titleFontFamily: 'Almarai_800ExtraBold',
    titleFontSize: 16,
    titleLineHeight: 22,
    optionFontFamily: 'Almarai_700Bold',
    optionFontSize: 15,
    optionLineHeight: 21,
  },
} as const;

import { StyleSheet, Platform } from 'react-native';
import { Colors } from './colors';
import { TopBarTokens } from './topBarTokens';

/**
 * Master modal backdrop overlay color ('rgba(0,0,0,0.5)').
 * Preserved per M-033/M-034 to prevent modal backdrop color drift.
 */
export const MODAL_BACKDROP_OVERLAY = 'rgba(0,0,0,0.5)' as const;

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
    fontSize: 11, // Restored to master 7353e69 value per M-034 (was 11.5)
    lineHeight: 15, // Restored to master 7353e69 value per M-034 (was 15.5)
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
    activeTextColor: Colors.primary,
    activeFontFamily: 'Almarai_800ExtraBold',
    activeShadow: Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
    }),
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
    iconTileBg: '#F0F5FF',
    emptyErrorIconBg: '#FEF2F2',
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
    overlayBg: MODAL_BACKDROP_OVERLAY,
    cardBg: TopBarTokens.iceGlass,
    cardBorderColor: TopBarTokens.buttonBorderColor,
    cardBorderWidth: 1,
    cardRadius: 16,
    cardShadow: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
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

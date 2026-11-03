import { Platform } from 'react-native';
import { Colors } from './colors';
import { TopBarTokens } from './topBarTokens';

/**
 * Master modal backdrop overlay color ('rgba(0,0,0,0.5)').
 * Preserved verbatim from master 7353e69 QuickFilterModal.tsx:68 per M-033/M-034/M-036.
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
    // #F0F5FF moved verbatim from master 7353e69 CarsVisualFilters.tsx:43, BusesVisualFilters.tsx:47, EquipmentVisualFilters.tsx:49
    iconTileBg: '#F0F5FF',
    // #FEF2F2 moved verbatim from master 7353e69 app/cars/browse.tsx:125, app/parts/browse.tsx:142
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
    // master 7353e69 QuickFilterModal.tsx modalContent has no border (borderWidth: 0) to avoid 1pt inner layout shift per M-036
    cardBorderColor: 'transparent',
    cardBorderWidth: 0,
    cardRadius: 16,
    // master 7353e69 QuickFilterModal.tsx:75 modalContent shadow (offset 0/10, opacity 0.2, radius 20, elevation 10) per M-036
    cardShadow: Platform.select({
      ios: {
        // #000 moved verbatim from master 7353e69 QuickFilterModal.tsx:75
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
    }),
    dividerColor: Colors.border,
    dividerWidth: 1, // master 7353e69 QuickFilterModal.tsx:88 borderBottomWidth: 1 per M-036
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

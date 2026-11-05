import { Platform } from 'react-native'
import { Colors } from './colors'

/**
 * Switch controlling whether card pills render native GlassSurface views (`true`)
 * or the lightweight non-native layered wash (`false`, default).
 * Flip this single constant to `true` to restore per-pill native GlassSurface.
 */
export const CARD_PILL_NATIVE_GLASS = false

export const CardSystem = {
  // Dimensions
  aspectRatioHeight: 140, 
  fullWidthHeight: 180,

  // Border Radius System
  radius: {
    outer: 16,
    inner: 6,
    badge: 100,
  },

  // Liquid Glass Tokens for Cards & Capsules
  glass: {
    capsuleRadius: 6, // Restored to match original CardSystem.radius.inner (6)
    cardTint: 'rgba(255, 255, 255, 0.81)',
    cardBorderColor: Colors.border,
    capsuleTint: 'rgba(238, 242, 245, 0.55)',
    capsuleBlurWashBg: 'rgba(238, 242, 245, 0.82)',
    capsuleBorderColor: 'rgba(229, 231, 235, 0.90)',
    negotiableTint: 'rgba(0, 156, 181, 0.12)',
    negotiableBorderColor: 'rgba(0, 156, 181, 0.30)',
    dividerColor: 'rgba(17, 35, 46, 0.06)',
    actionBtnBg: 'rgba(255, 255, 255, 0.88)',
    actionBtnBorderColor: 'rgba(255, 255, 255, 0.95)',
    verifiedBadgeDarkBorderColor: 'rgba(0, 156, 181, 0.35)',
  },

  // Paddings and Gaps
  padding: {
    dense: 12,
  },
  gap: {
    primary: 8,
    secondary: 6,
  },

  // Shadow and Borders
  styles: {
    border: {
      borderWidth: 1,
      borderColor: Colors.border,
    },
    softShadow: Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
    badgeShadow: {
      shadowColor: Colors.primaryDark,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    // Semantic Backgrounds for Pills (Neutral Specs, Pale Mint for Negotiable Price)
    pillNeutral: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    pillBlue:    { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    pillAmber:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    pillGreen:   { backgroundColor: Colors.paleMint, borderWidth: 1, borderColor: Colors.border },
    pillRed:     { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    pillOrange:  { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  },

  // Common Typography configurations
  typography: {
    title: {
      fontFamily: 'Almarai_800ExtraBold',
      fontSize: 14,
      lineHeight: 20,
    },
    subtitle: {
      fontFamily: 'Almarai_400Regular',
      fontSize: 11,
      lineHeight: 15,
    },
    pillText: {
      fontFamily: 'Almarai_700Bold',
      fontSize: 11,
      lineHeight: 16,
    },
    badgeText: {
      fontFamily: 'Almarai_800ExtraBold',
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 0.2,
    }
  }
}

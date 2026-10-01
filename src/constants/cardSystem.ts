import { Platform } from 'react-native'
import { Colors } from './colors'

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
      fontSize: 10,
      lineHeight: 14,
    },
    badgeText: {
      fontFamily: 'Almarai_800ExtraBold',
      fontSize: 9.5,
      lineHeight: 13.5,
      letterSpacing: 0.2,
    }
  }
}

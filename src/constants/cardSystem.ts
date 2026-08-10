import { Platform } from 'react-native'

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
      borderColor: 'rgba(0,0,0,0.04)',
    },
    softShadow: Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
    badgeShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    // Semantic Backgrounds for Pills
    pillNeutral: { backgroundColor: '#f8fafc' },
    pillBlue: { backgroundColor: '#eff6ff' },
    pillAmber: { backgroundColor: '#fffbeb' },
    pillGreen: { backgroundColor: '#ecfdf5' },
    pillRed: { backgroundColor: '#fef2f2' },
    pillOrange: { backgroundColor: '#fff7ed' },
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
      fontSize: 10.5,
      lineHeight: 14.5,
    },
    badgeText: {
      fontFamily: 'Almarai_800ExtraBold',
      fontSize: 9.5,
      lineHeight: 13.5,
      letterSpacing: 0.2,
    }
  }
}

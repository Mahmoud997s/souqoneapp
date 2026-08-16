import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Gradients } from '../../constants/gradients'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'

export function ProfilePremiumBanner() {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/profile/subscription' as any)}
      style={s.premiumOuter}
    >
      <LinearGradient
        colors={Gradients.hero as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.premiumBanner}
      >
        {/* SVG Grid Overlay */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="premiumGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                <Path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#premiumGrid)" />
          </Svg>
        </View>

        <View style={s.premiumGlow} />
        
        <View style={s.premiumRight}>
          <View style={s.premiumIconBox}>
            <Ionicons name="sparkles" size={17} color="#FBBF24" />
          </View>
          <View style={s.premiumTextWrap}>
            <Text style={s.premiumTitle}>عضوية سوق ون الذهبية</Text>
            <Text style={s.premiumSub} numberOfLines={1}>
              تمييز الإعلانات والظهور في صدارة البحث ⚡
            </Text>
          </View>
        </View>

        <View style={s.premiumActionBtn}>
          <Text style={s.premiumActionText}>ترقية</Text>
          <Ionicons name="chevron-back" size={13} color="#FBBF24" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  /* Premium Banner Glassmorphism */
  premiumOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2447',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumGlow: {
    position: 'absolute',
    top: -24,
    end: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  premiumRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  premiumIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  premiumTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  premiumSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#CBD5E1',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  premiumActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  premiumActionText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#FBBF24',
    writingDirection: 'rtl',
  },
})

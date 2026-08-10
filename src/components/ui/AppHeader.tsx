import { ReactNode } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { LinearGradient } from 'expo-linear-gradient'
import { Typography } from '../../constants/typography'
import { Gradients } from '../../constants/gradients'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'

interface AppHeaderProps {
  title?: string
  leftIcon?: string
  rightIcon?: string
  onLeftPress?: () => void
  onRightPress?: () => void
  leftSlot?: ReactNode
  centerSlot?: ReactNode
  rightSlot?: ReactNode
  showBack?: boolean
  variant?: 'default' | 'jobs'
  theme?: 'dark' | 'light'
}

export function AppHeader({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  leftSlot,
  centerSlot,
  rightSlot,
  showBack,
  variant = 'default',
  theme = 'dark',
}: AppHeaderProps) {
  const insets = useSafeAreaInsets()
  const isLight = theme === 'light'

  return (
    <View
      style={[
        s.header, 
        { paddingTop: insets.top },
        isLight && { 
          backgroundColor: Colors.white, 
          paddingBottom: 0, // Remove asymmetrical padding to perfectly center items
          ...Platform.select({ ios: { shadowOpacity: 0.03, shadowRadius: 3 }, android: { elevation: 1 } }) 
        }
      ]}
    >
      {isLight && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: '#0B2447' }} />
      )}
      {!isLight && (
        <>
          <LinearGradient
            colors={['#0B2447', '#1a3a6b', '#0d3060']}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
          />
          {/* Grid Overlay */}
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grid)" />
            </Svg>
          </View>
        </>
      )}
      <View style={[s.row, isLight && { height: 42 }]}>
        {/* Left slot (physical RIGHT on screen due to forceRTL) */}
        {leftSlot ? (
          leftSlot
        ) : showBack ? (
          <TouchableOpacity
            style={[s.iconBtn, isLight && s.iconBtnLight]}
            onPress={onLeftPress || (() => router.back())}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-outline" size={18} color={isLight ? Colors.text : Colors.white} />
          </TouchableOpacity>
        ) : leftIcon ? (
          <TouchableOpacity
            style={[s.iconBtn, isLight && s.iconBtnLight]}
            onPress={onLeftPress}
            activeOpacity={0.7}
          >
            <Ionicons name={leftIcon as any} size={18} color={isLight ? Colors.text : Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={s.spacer} />
        )}

        {/* Center */}
        {centerSlot ? (
          centerSlot
        ) : title ? (
          <Text style={[s.title, isLight && s.titleLight]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Right slot (physical LEFT on screen due to forceRTL) */}
        {rightSlot ? (
          rightSlot
        ) : rightIcon ? (
          <TouchableOpacity
            style={[s.iconBtn, isLight && s.iconBtnLight]}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightIcon as any} size={18} color={isLight ? Colors.text : Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={s.spacer} />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    paddingBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  row: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',  
    fontSize: 16,
    lineHeight: 21,
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: Platform.OS === 'android' ? 1 : 0,
  },
  titleLight: {
    color: Colors.text,
  },
  iconBtnLight: {
    backgroundColor: '#F1F5F9',
  },
  spacer: { width: 32 },
})

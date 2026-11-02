import type { ComponentProps, ReactNode } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native'
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
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { TopBarTokens } from '../../constants/topBarTokens'

interface AppHeaderProps {
  title?: string
  leftIcon?: ComponentProps<typeof Ionicons>['name']
  rightIcon?: ComponentProps<typeof Ionicons>['name']
  onLeftPress?: () => void
  onRightPress?: () => void
  leftSlot?: ReactNode
  centerSlot?: ReactNode
  rightSlot?: ReactNode
  showBack?: boolean
  variant?: 'default' | 'jobs'
  theme?: 'dark' | 'light'
  glassBackground?: boolean
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
  glassBackground = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets()
  const isLight = theme === 'light'

  return (
    <View
      style={[
        s.header, 
        { paddingTop: insets.top },
        isLight && !glassBackground && {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
          ...Platform.select({ ios: { shadowOpacity: 0.03, shadowRadius: 3 }, android: { elevation: 1 } }) 
        }
      ]}
    >
      {glassBackground && <TopBarGlassSurface testID="browse-header" kind="background" />}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {!isLight && !glassBackground && (
        <>
          <LinearGradient
            colors={Gradients.hero as any}
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
      <View style={s.row}>
        {/* Left slot (physical RIGHT on screen due to forceRTL) */}
        {leftSlot ? (
          leftSlot
        ) : showBack ? (
          <TouchableOpacity
            testID="app-header-back"
            style={[s.iconBtn, glassBackground && s.iconBtnGlass, isLight && !glassBackground && s.iconBtnLight]}
            hitSlop={glassBackground ? TopBarTokens.buttonHitSlop : undefined}
            onPress={onLeftPress || (() => router.back())}
            activeOpacity={0.7}
          >
            {glassBackground && (
              <TopBarGlassSurface
                testID="app-header-back-glass"
                kind="ice-control"
                borderRadius={TopBarTokens.buttonRadius}
              />
            )}
            <Ionicons
              name="arrow-forward-outline"
              size={glassBackground ? TopBarTokens.buttonIconSize : 18}
              color={glassBackground ? TopBarTokens.buttonIconColor : isLight ? Colors.text : Colors.white}
            />
          </TouchableOpacity>
        ) : leftIcon ? (
          <TouchableOpacity
            style={[s.iconBtn, glassBackground && s.iconBtnGlass, isLight && !glassBackground && s.iconBtnLight]}
            hitSlop={glassBackground ? TopBarTokens.buttonHitSlop : undefined}
            onPress={onLeftPress}
            activeOpacity={0.7}
          >
            {glassBackground && (
              <TopBarGlassSurface
                testID="app-header-left-icon-glass"
                kind="ice-control"
                borderRadius={TopBarTokens.buttonRadius}
              />
            )}
            <Ionicons
              name={leftIcon}
              size={glassBackground ? TopBarTokens.buttonIconSize : 18}
              color={glassBackground ? TopBarTokens.buttonIconColor : isLight ? Colors.text : Colors.white}
            />
          </TouchableOpacity>
        ) : (
          <View style={s.spacer} />
        )}

        {/* Center */}
        {centerSlot ? (
          centerSlot
        ) : title ? (
          <Text style={[s.title, (isLight || glassBackground) && s.titleLight]} numberOfLines={1}>
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
            style={[s.iconBtn, glassBackground && s.iconBtnGlass, isLight && !glassBackground && s.iconBtnLight]}
            hitSlop={glassBackground ? TopBarTokens.buttonHitSlop : undefined}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            {glassBackground && (
              <TopBarGlassSurface
                testID="app-header-right-glass"
                kind="ice-control"
                borderRadius={TopBarTokens.buttonRadius}
              />
            )}
            <Ionicons
              name={rightIcon}
              size={glassBackground ? TopBarTokens.buttonIconSize : 18}
              color={glassBackground ? TopBarTokens.buttonIconColor : isLight ? Colors.text : Colors.white}
            />
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
    paddingBottom: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  row: {
    height: 44,
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  iconBtnGlass: {
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    backgroundColor: TopBarTokens.iceGlass,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    ...TopBarTokens.buttonShadow,
  },
  spacer: { width: 32 },
})

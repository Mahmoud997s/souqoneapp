import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { BottomBarTokens } from '../../constants/bottomBarTokens'
import { GlassSurface, type GlassSupport } from '../navigation/glassSupport'
import { TopBarGlassSurface } from './TopBarGlassSurface'
import { TopBarTokens } from '../../constants/topBarTokens'

export interface GlassNavBarAction {
  icon?: React.ComponentProps<typeof Ionicons>['name']
  onPress: () => void
  accessibilityLabel: string
  testID?: string
  loading?: boolean
  disabled?: boolean
  iconColor?: string
  customContent?: React.ReactNode
}

export interface GlassNavBarProps {
  title: string
  paddingTop: number
  onBackPress: () => void
  actions?: GlassNavBarAction[]
  hideBottomBorder?: boolean
  isTransparent?: boolean
  appearance?: 'default' | 'home'
  support?: GlassSupport
  testID?: string
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

export function GlassNavBar({
  title,
  paddingTop,
  onBackPress,
  actions = [],
  hideBottomBorder = false,
  isTransparent = false,
  appearance = 'default',
  support,
  testID = 'glass-nav-bar',
}: GlassNavBarProps) {
  const isHomeAppearance = appearance === 'home'
  const content = (
    <>
      {!isTransparent && (
        isHomeAppearance ? (
          <TopBarGlassSurface testID={`${testID}-background`} kind="background" />
        ) : (
          <>
            <GlassSurface
              testID="glass-nav-bar-surface"
              variant="surface"
              intensity={60}
              washColor={Colors.white}
              washOpacity={BottomBarTokens.lightWashOpacity}
              noBorder
              support={support}
            />
            <View style={s.tintOverlay} pointerEvents="none" testID="glass-nav-bar-tint" />
          </>
        )
      )}

      <View style={s.navBarRow}>
        {/* Back Button (Right in RTL) */}
        <TouchableOpacity
          style={[s.navBtn, isHomeAppearance && s.navBtnHome]}
          hitSlop={isHomeAppearance ? TopBarTokens.buttonHitSlop : undefined}
          activeOpacity={0.75}
          onPress={onBackPress}
          accessibilityLabel="رجوع"
        >
          {isHomeAppearance && (
            <TopBarGlassSurface
              testID={`${testID}-back-glass`}
              kind="ice-control"
              borderRadius={TopBarTokens.buttonRadius}
            />
          )}
          <Ionicons
            name="arrow-forward-outline"
            size={isHomeAppearance ? TopBarTokens.buttonIconSize : 18}
            color={isHomeAppearance ? TopBarTokens.buttonIconColor : TopBarTokens.legacyNavIconColor}
          />
        </TouchableOpacity>

        {/* Title Badge (flex:1) */}
        <View style={s.navTitleBadge}>
          <Text style={s.navTitle} numberOfLines={1}>{title}</Text>
        </View>

        {/* Action Buttons (Left in RTL), or a placeholder to keep the title centered */}
        {actions.length > 0 ? (
          <View style={s.navActions}>
            {actions.map((action, idx) => {
              const isDisabled = action.disabled || action.loading
              const actionContent = action.loading ? (
                <ActivityIndicator size="small" color={action.iconColor || Colors.primary} />
              ) : action.customContent ? (
                action.customContent
              ) : action.icon ? (
                <Ionicons
                  name={action.icon}
                  size={isHomeAppearance ? TopBarTokens.buttonIconSize : 17}
                  color={
                    action.iconColor ||
                    (isHomeAppearance ? TopBarTokens.buttonIconColor : TopBarTokens.legacyNavIconColor)
                  }
                />
              ) : null

              return (
                <TouchableOpacity
                  key={idx}
                  testID={action.testID}
                  style={[
                    s.navBtn,
                    isHomeAppearance && s.navBtnHome,
                    isDisabled && !isHomeAppearance && s.navBtnDisabled,
                  ]}
                  hitSlop={isHomeAppearance ? TopBarTokens.buttonHitSlop : undefined}
                  activeOpacity={0.75}
                  onPress={action.onPress}
                  disabled={isDisabled}
                  accessibilityLabel={action.accessibilityLabel}
                >
                  {isHomeAppearance && (
                    <TopBarGlassSurface
                      testID={`${testID}-action-${idx}-glass`}
                      kind="ice-control"
                      borderRadius={TopBarTokens.buttonRadius}
                    />
                  )}
                  {isDisabled && isHomeAppearance ? (
                    <View style={s.disabledHomeContent}>{actionContent}</View>
                  ) : actionContent}
                </TouchableOpacity>
              )
            })}
          </View>
        ) : (
          <View style={s.navBtnPlaceholder} />
        )}
      </View>
    </>
  )

  return (
    <View
      style={[
        s.navBarFixed,
        { paddingTop },
        hideBottomBorder && s.noBorder,
        isTransparent && { backgroundColor: 'transparent' },
      ]}
      testID={testID}
    >
      {content}
    </View>
  )
}

const s = StyleSheet.create({
  /* Fixed Top Navigation Bar */
  navBarFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  noBorder: {
    borderBottomWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },

  /* Top Navigation Bar Row */
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
    height: 44,
    gap: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navBtnHome: {
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    backgroundColor: TopBarTokens.iceGlass,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    ...TopBarTokens.buttonShadow,
  },
  navBtnPlaceholder: {
    width: 38,
    height: 38,
  },
  navTitleBadge: {
    flex: 1,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtnDisabled: {
    opacity: 0.6,
  },
  disabledHomeContent: {
    opacity: 0.6,
  },
})

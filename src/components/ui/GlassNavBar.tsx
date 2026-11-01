import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { GlassSurface, type GlassSupport } from '../navigation/glassSupport'

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
  support,
  testID = 'glass-nav-bar',
}: GlassNavBarProps) {
  const content = (
    <>
      {!isTransparent && (
        <>
          <GlassSurface
            testID="glass-nav-bar-surface"
            variant="surface"
            intensity={60}
            noBorder
            support={support}
          />
          <View style={s.tintOverlay} pointerEvents="none" testID="glass-nav-bar-tint" />
        </>
      )}

      <View style={s.navBarRow}>
        {/* Back Button (Right in RTL) */}
        <TouchableOpacity
          style={s.navBtn}
          activeOpacity={0.75}
          onPress={onBackPress}
          accessibilityLabel="رجوع"
        >
          <Ionicons name="arrow-forward-outline" size={18} color="#1E293B" />
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
              return (
                <TouchableOpacity
                  key={idx}
                  testID={action.testID}
                  style={[s.navBtn, isDisabled && s.navBtnDisabled]}
                  activeOpacity={0.75}
                  onPress={action.onPress}
                  disabled={isDisabled}
                  accessibilityLabel={action.accessibilityLabel}
                >
                  {action.loading ? (
                    <ActivityIndicator size="small" color={action.iconColor || Colors.primary} />
                  ) : action.customContent ? (
                    action.customContent
                  ) : action.icon ? (
                    <Ionicons name={action.icon} size={17} color={action.iconColor || '#1E293B'} />
                  ) : null}
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
})

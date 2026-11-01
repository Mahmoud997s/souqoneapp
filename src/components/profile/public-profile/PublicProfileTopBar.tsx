import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GlassSurface, type GlassSupport } from '../../navigation/glassSupport'
import { BottomBarTokens } from '../../../constants/bottomBarTokens'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { PublicProfileTokens } from '../../../constants/publicProfileTokens'

export interface PublicProfileTopBarProps {
  topInset: number
  onBack: () => void
  support?: GlassSupport
}

export function PublicProfileTopBar({ topInset, onBack, support }: PublicProfileTopBarProps) {
  return (
    <View testID="public-profile-top-bar" style={[s.bar, { top: topInset + PublicProfileTokens.topBarTopOffset }]}>
      <GlassSurface
        testID="public-profile-top-bar-surface"
        variant="surface"
        borderRadius={PublicProfileTokens.topBarRadius}
        noBorder
        washColor={Colors.white}
        washOpacity={PublicProfileTokens.topBarWashOpacity}
        support={support}
      />
      <Pressable
        testID="public-profile-back"
        style={s.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="رجوع"
        hitSlop={0}
      >
        <Ionicons name="arrow-forward-outline" size={20} color={Colors.text} />
      </Pressable>
      <Text style={s.title} numberOfLines={1}>ملف البائع</Text>
      <View style={s.spacer} testID="public-profile-top-bar-spacer" />
    </View>
  )
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    start: Spacing.space4,
    end: Spacing.space4,
    height: PublicProfileTokens.topBarSize,
    borderRadius: PublicProfileTokens.topBarRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    ...BottomBarTokens.shadow,
  },
  backButton: {
    width: PublicProfileTokens.topBarSize - Spacing.space2,
    height: PublicProfileTokens.topBarSize - Spacing.space2,
    borderRadius: PublicProfileTokens.topBarRadius,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    position: 'absolute',
    start: 0,
    end: 0,
    textAlign: 'center',
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  spacer: {
    width: PublicProfileTokens.topBarSize - Spacing.space2,
    height: PublicProfileTokens.topBarSize - Spacing.space2,
  },
})

import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GlassSurface, type GlassSupport } from '../../navigation/glassSupport'
import { BottomBarTokens } from '../../../constants/bottomBarTokens'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { PublicProfileTokens } from '../../../constants/publicProfileTokens'

const BUTTON_SIZE = 42
const BUTTON_RADIUS = 21

export interface OperatorFloatingTopBarProps {
  topInset: number
  onBack: () => void
  onShare: () => void
  isOwner: boolean
  isFavorite?: boolean
  favoriteBusy?: boolean
  onToggleFavorite?: () => void
  support?: GlassSupport
}

export function OperatorFloatingTopBar({
  topInset,
  onBack,
  onShare,
  isOwner,
  isFavorite = false,
  favoriteBusy = false,
  onToggleFavorite,
  support,
}: OperatorFloatingTopBarProps) {
  return (
    <View
      testID="operator-floating-top-bar"
      pointerEvents="box-none"
      style={[s.container, { top: topInset + Spacing.space2 }]}
    >
      <Pressable
        testID="operator-top-back-btn"
        style={s.circleButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="رجوع"
      >
        <GlassSurface
          variant="surface"
          borderRadius={BUTTON_RADIUS}
          noBorder
          washColor={Colors.white}
          washOpacity={PublicProfileTokens.topBarWashOpacity}
          support={support}
        />
        <Ionicons name="arrow-forward-outline" size={20} color={Colors.text} />
      </Pressable>

      <View pointerEvents="box-none" style={s.actionsGroup}>
        <Pressable
          testID="operator-top-share-btn"
          style={s.circleButton}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="مشاركة"
        >
          <GlassSurface
            variant="surface"
            borderRadius={BUTTON_RADIUS}
            noBorder
            washColor={Colors.white}
            washOpacity={PublicProfileTokens.topBarWashOpacity}
            support={support}
          />
          <Ionicons name="share-outline" size={20} color={Colors.text} />
        </Pressable>

        {!isOwner && onToggleFavorite && (
          <Pressable
            testID="operator-top-favorite-btn"
            style={s.circleButton}
            onPress={onToggleFavorite}
            disabled={favoriteBusy}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <GlassSurface
              variant="surface"
              borderRadius={BUTTON_RADIUS}
              noBorder
              washColor={Colors.white}
              washOpacity={PublicProfileTokens.topBarWashOpacity}
              support={support}
            />
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? Colors.error : Colors.text}
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    start: Spacing.space4,
    end: Spacing.space4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  circleButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...BottomBarTokens.shadow,
  },
})

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { CardSystem } from '../../constants/cardSystem'

export interface SeeAllHorizontalCardProps {
  /** Callback fired when tapping the card */
  onPress: () => void
  /** Main title displayed on the card (default: 'عرض الكل') */
  title?: string
  /** Subtitle/descriptive text displayed below title (default: 'تصفح جميع الإعلانات') */
  subTitle?: string
  /** Optional custom action text inside the bottom pill (default: 'تصفح المزيد') */
  actionText?: string
  /** Width of the card container */
  cardWidth?: number
  /** Height of the card container */
  height?: number
  /** Optional custom style overrides */
  style?: StyleProp<ViewStyle>
}

/**
 * SeeAllHorizontalCard
 *
 * A modern, premium card placed at the physical end of horizontal card carousels.
 * Features:
 * - Direct tap to invoke section onSeeAll callback
 * - Harmonic border radius & subtle shadows matching CardSystem
 * - Distinct circular icon with soft primary glow
 * - Full Arabic typography protection (no letter clipping)
 */
export function SeeAllHorizontalCard({
  onPress,
  title = 'عرض الكل',
  subTitle = 'تصفح جميع الإعلانات',
  actionText = 'تصفح المزيد',
  cardWidth,
  height,
  style,
}: SeeAllHorizontalCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subTitle}
      style={[
        styles.card,
        cardWidth ? { width: cardWidth } : undefined,
        height ? { height } : undefined,
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Circle Icon Badge with soft blue glow */}
        <View style={styles.iconCircle}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Subtitle */}
        {Boolean(subTitle) && (
          <Text style={styles.subTitle} numberOfLines={2}>
            {subTitle}
          </Text>
        )}

        {/* Action Button Badge */}
        <View style={styles.actionPill}>
          <Text style={styles.actionTxt}>{actionText}</Text>
          <Ionicons name="chevron-back" size={13} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    minHeight: 220,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space5,
    ...CardSystem.styles.softShadow,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 23,
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  subTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    writingDirection: 'rtl',
    paddingHorizontal: Spacing.space2,
    marginBottom: Spacing.space3,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 2,
  },
  actionTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 16,
    writingDirection: 'rtl',
    paddingTop: 1,
  },
})

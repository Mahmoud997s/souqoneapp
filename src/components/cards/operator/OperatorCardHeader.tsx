import React from 'react'
import {
  View,
  Text,
  StyleSheet,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { lineHeightFor } from '../../../constants/typography'

export interface OperatorCardHeaderProps {
  name: string
  avatarUrl?: string | null
  isVerified: boolean
  locationDisplay: string
  isOwnerMode: boolean
  displayPrice: string
  actionMenu?: React.ReactNode
}

/**
 * OperatorCardHeader
 * Top row of OperatorCard rendering circular avatar with fallback, verified badge,
 * name, location, and owner action menu or rate badge.
 */
export function OperatorCardHeader({
  name,
  avatarUrl,
  isVerified,
  locationDisplay,
  isOwnerMode,
  displayPrice,
  actionMenu,
}: OperatorCardHeaderProps) {
  return (
    <View style={s.topRow}>
      <View style={s.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={s.avatar}
            contentFit="cover"
            testID="operator-avatar"
          />
        ) : (
          <View style={s.avatarFallback} testID="operator-avatar-fallback">
            <Ionicons name="person" size={22} color={Colors.textMuted} />
          </View>
        )}

        {isVerified && (
          <View
            style={s.verifiedBadge}
            testID="operator-verified-badge"
            accessible
            accessibilityLabel="حساب موثق"
          >
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          </View>
        )}
      </View>

      <View style={s.nameCol}>
        <Text style={s.nameText} numberOfLines={1}>
          {name}
        </Text>
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
          <Text style={s.locationText} numberOfLines={1}>
            {locationDisplay}
          </Text>
        </View>
      </View>

      {isOwnerMode ? (
        <View style={s.actionMenuContainer}>{actionMenu}</View>
      ) : (
        <View style={s.priceBadge}>
          <Text style={s.priceText} numberOfLines={1}>
            {displayPrice}
          </Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    padding: 1,
  },
  nameCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    marginTop: 2,
  },
  locationText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceBadge: {
    backgroundColor: Colors.paleMint,
    paddingHorizontal: Spacing.space2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.sm,
    maxWidth: '45%',
    alignSelf: 'center',
  },
  priceText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primaryDark,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  actionMenuContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
})

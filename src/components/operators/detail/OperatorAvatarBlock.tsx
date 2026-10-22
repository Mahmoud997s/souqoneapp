import React from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'

export interface OperatorAvatarBlockProps {
  avatarUrl?: string | null
  isVerified?: boolean
}

/**
 * OperatorAvatarBlock
 * Displays operator circular profile avatar with fallback icon and verified badge.
 */
export function OperatorAvatarBlock({
  avatarUrl,
  isVerified,
}: OperatorAvatarBlockProps) {
  return (
    <View style={s.avatarContainer}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={s.avatarImage}
          resizeMode="cover"
          testID="operator-avatar-image"
          accessibilityRole="image"
          accessibilityLabel="صورة المشغل"
        />
      ) : (
        <View style={s.avatarFallback} testID="operator-avatar-fallback">
          <Ionicons name="person" size={44} color={Colors.primary} />
        </View>
      )}

      {isVerified && (
        <View
          style={s.verifiedBadge}
          testID="operator-verified-badge"
          accessible
          accessibilityLabel="حساب موثق"
        >
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.space3,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    padding: 2,
  },
})

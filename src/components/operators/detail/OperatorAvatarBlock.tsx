import React from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { PublicProfileTokens } from '../../../constants/publicProfileTokens'
import { VerifiedBadge } from '../../ui/VerifiedBadge'

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
      <LinearGradient
        testID="operator-avatar-ring"
        colors={PublicProfileTokens.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.avatarRing}
      >
        <View style={s.avatarInner}>
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
              <Ionicons name="person" size={40} color={Colors.primary} />
            </View>
          )}
        </View>
      </LinearGradient>

      {isVerified && (
        <View
          style={s.verifiedBadge}
          testID="operator-verified-badge"
          accessible
          accessibilityLabel="حساب موثق"
        >
          <VerifiedBadge size={26} />
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
  avatarRing: {
    padding: PublicProfileTokens.avatarRingWidth,
    borderRadius: Radius.pill,
  },
  avatarInner: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    padding: 2,
  },
  avatarImage: {
    width: PublicProfileTokens.avatarSize,
    height: PublicProfileTokens.avatarSize,
    borderRadius: Radius.pill,
  },
  avatarFallback: {
    width: PublicProfileTokens.avatarSize,
    height: PublicProfileTokens.avatarSize,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
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

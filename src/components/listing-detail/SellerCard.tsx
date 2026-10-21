import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import type { SellerView } from '../../types/carDetailViewModel.types'
import { lineHeightFor } from '../../constants/typography'

export interface SellerCardProps {
  seller: SellerView
  onPressProfile: (sellerId: string) => void
}

/**
 * SellerCard
 * Glassmorphic seller preview card on listing detail.
 * Same layout as the original — avatar, name, verified badge,
 * membership label, account type badge, and chevron.
 */
export function SellerCard({ seller, onPressProfile }: SellerCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPressProfile(seller.id)}
      activeOpacity={0.75}
      testID="seller-card-touchable"
      style={s.wrapper}
    >
      <BlurView
        intensity={70}
        tint="light"
        blurMethod="dimezisBlurView"
        style={s.card}
      >
        <View style={s.row}>
          {/* Avatar */}
          <View style={s.avatarContainer}>
            {seller.avatarUrl ? (
              <Image
                source={{ uri: seller.avatarUrl }}
                style={s.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={s.avatarFallback}>
                <Ionicons name="person" size={24} color={Colors.primaryLight} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={s.infoColumn}>
            <View style={s.nameRow}>
              <Text style={s.nameText}>{seller.name}</Text>
              {seller.isVerified ? (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.primary}
                  style={s.verifiedIcon}
                />
              ) : null}
            </View>

            <Text style={s.membershipText}>{seller.memberSinceLabel}</Text>

            {seller.accountType ? (
              <View style={s.accountBadge}>
                <Text style={s.accountBadgeText}>{seller.accountType}</Text>
              </View>
            ) : null}
          </View>

          {/* Chevron */}
          <View style={s.chevronWrapper}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  infoColumn: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
  },
  nameText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  verifiedIcon: {
    marginTop: 1,
  },
  membershipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  accountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: Spacing.space2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  accountBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  chevronWrapper: {
    paddingStart: Spacing.space2,
  },
})

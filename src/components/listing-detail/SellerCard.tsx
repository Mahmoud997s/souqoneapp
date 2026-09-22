import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import type { SellerView } from '../../types/carDetailViewModel.types'

export interface SellerCardProps {
  seller: SellerView
  onPressProfile: (sellerId: string) => void
}

/**
 * SellerCard
 * Presentational seller preview card on listing detail.
 * Displays avatar, seller name, verified badge, membership longevity, and account type.
 */
export function SellerCard({ seller, onPressProfile }: SellerCardProps) {
  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => onPressProfile(seller.id)}
      activeOpacity={0.75}
      testID="seller-card-touchable"
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
                color={Colors.primaryLight}
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

        {/* Arrow chevron */}
        <View style={s.chevronWrapper}>
          <Ionicons name="chevron-back" size={20} color={Colors.placeholder} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  infoColumn: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  membershipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
  accountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginTop: 3,
  },
  accountBadgeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.text2,
  },
  chevronWrapper: {
    paddingStart: Spacing.space2,
  },
})

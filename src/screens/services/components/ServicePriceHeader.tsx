import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import type { ServicePriceViewModel } from '../../../types/serviceDetailViewModel.types'

export interface ServicePriceHeaderProps {
  title: string
  price: ServicePriceViewModel
  serviceTypeLabel: string
  providerTypeLabel?: string
  providerName?: string
  isHomeService?: boolean
  postedAtLabel: string
  viewCount: number
}

/**
 * ServicePriceHeader
 * Specialized header adapter for car services rendering title, service/provider badges,
 * provider attribution, price range or starting price, and listing meta.
 */
export function ServicePriceHeader({
  title,
  price,
  serviceTypeLabel,
  providerTypeLabel,
  providerName,
  isHomeService,
  postedAtLabel,
  viewCount,
}: ServicePriceHeaderProps) {
  return (
    <View style={s.container} testID="service-price-header">
      {/* Badges Row */}
      <View style={s.badgesRow}>
        <View style={s.badgePrimary}>
          <Ionicons name="build-outline" size={13} color={Colors.primary} />
          <Text style={s.badgePrimaryText}>{serviceTypeLabel}</Text>
        </View>

        {Boolean(providerTypeLabel) && (
          <View style={s.badgeNeutral}>
            <Ionicons name="business-outline" size={13} color={Colors.textMuted} />
            <Text style={s.badgeNeutralText}>{providerTypeLabel}</Text>
          </View>
        )}

        {Boolean(isHomeService) && (
          <View style={s.badgeHome}>
            <Ionicons name="home-outline" size={13} color={Colors.success} />
            <Text style={s.badgeHomeText}>خدمة متنقلة</Text>
          </View>
        )}
      </View>

      {/* Main Title */}
      <Text style={s.title}>{title}</Text>

      {/* Provider Name Box */}
      {Boolean(providerName) && (
        <View style={s.providerBox}>
          <Ionicons name="ribbon-outline" size={15} color={Colors.primary} />
          <Text style={s.providerLabel}>مقدم الخدمة:</Text>
          <Text style={s.providerName}>{providerName}</Text>
        </View>
      )}

      {/* Price Box */}
      <View style={s.priceBox}>
        {Boolean(price.typeLabel) && (
          <Text style={s.priceTypeLabel}>{price.typeLabel}</Text>
        )}
        <Text style={s.priceAmount}>{price.amountLabel}</Text>
      </View>

      {/* Meta Row: Posted at & Views */}
      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={s.metaText}>{postedAtLabel}</Text>
        </View>

        <View style={s.metaDivider} />

        <View style={s.metaItem}>
          <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
          <Text style={s.metaText}>{viewCount.toLocaleString('en-US')} مشاهدة</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.space3,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  badgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.paleMint,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgePrimaryText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badgeNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeNeutralText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badgeHome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeHomeText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.success,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  providerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
  },
  providerLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  providerName: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceBox: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space3,
    borderRadius: Radius.md,
    gap: 2,
  },
  priceTypeLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceAmount: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
})

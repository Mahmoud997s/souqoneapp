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
  locationLabel?: string
}

/**
 * Extracts "من" and "إلى" labels for range prices, supporting both structured
 * fromLabel/toLabel fields and legacy formattedRange strings like "15 - 45 ر.ع.".
 */
function resolveRangeParts(
  price: ServicePriceViewModel,
): { fromLabel: string; toLabel: string } | null {
  if (!price.isRange) return null
  if (price.fromLabel && price.toLabel) {
    return { fromLabel: price.fromLabel, toLabel: price.toLabel }
  }
  const raw = (price.formattedRange ?? price.amountLabel ?? '').trim()
  const parts = raw.split(/\s*-\s*/)
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null

  const left = parts[0].trim()
  const right = parts[1].trim()
  const unitMatch = right.match(/[\d,.]+\s+(.+)$/)
  const unit = unitMatch?.[1]?.trim()
  const fromLabel = unit && !left.includes(unit) ? `${left} ${unit}` : left

  return { fromLabel, toLabel: right }
}

/**
 * ServicePriceHeader
 * Specialized header adapter for car services rendering title, service/provider badges,
 * provider attribution, Cars-style dual price badges ("من / إلى") or single badge, and listing meta.
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
  locationLabel,
}: ServicePriceHeaderProps) {
  const showProviderTypeBadge =
    Boolean(providerTypeLabel) &&
    !(Boolean(isHomeService) && providerTypeLabel?.trim() === 'خدمة متنقلة')
  const rangeParts = resolveRangeParts(price)
  return (
    <View style={s.container} testID="service-price-header">
      {/* Badges Row */}
      <View style={s.badgesRow}>
        <View style={s.badgePrimary}>
          <Ionicons name="build-outline" size={13} color={Colors.primary} />
          <Text style={s.badgePrimaryText}>{serviceTypeLabel}</Text>
        </View>

        {showProviderTypeBadge && (
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
        <View style={s.providerBox} testID="service-provider-box">
          <Ionicons name="ribbon-outline" size={15} color={Colors.primary} />
          <Text style={s.providerLabel}>مقدم الخدمة:</Text>
          <Text style={s.providerName}>{providerName}</Text>
        </View>
      )}

      {/* Price Box (Cars-style dual "من / إلى" or unified single badge) */}
      <View style={s.priceBox} testID="service-price-box">
        {rangeParts ? (
          <>
            {Boolean(price.typeLabel) && (
              <Text style={s.priceTypeLabel}>{price.typeLabel}</Text>
            )}
            <View style={s.rangeBadgesRow}>
              <View style={s.priceBadgeChip} testID="service-price-from-badge">
                <Text style={s.priceBadgeLabel}>من</Text>
                <Text style={s.priceBadgeValue}>{rangeParts.fromLabel}</Text>
              </View>
              <View style={s.priceBadgeChip} testID="service-price-to-badge">
                <Text style={s.priceBadgeLabel}>إلى</Text>
                <Text style={s.priceBadgeValue}>{rangeParts.toLabel}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={s.priceBadgeChip} testID="service-price-single-badge">
            {Boolean(price.typeLabel) && (
              <Text style={s.priceBadgeLabel}>{price.typeLabel}</Text>
            )}
            <Text style={s.priceBadgeValue}>{price.amountLabel}</Text>
          </View>
        )}
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

        {Boolean(locationLabel) && (
          <>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={s.metaText}>{locationLabel}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
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
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    padding: Spacing.space3,
    borderRadius: Radius.lg,
    gap: Spacing.space2,
  },
  priceTypeLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rangeBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  priceBadgeChip: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
  },
  priceBadgeLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceBadgeValue: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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

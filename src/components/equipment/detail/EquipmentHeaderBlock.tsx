import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'
import { PriceBadge } from '../../ui/PriceBadge'
import { EquipmentOperatorBadge } from './EquipmentOperatorBadge'
import type { PriceView } from '../../../types/listingDetail.types'
import type { EquipmentOperatorBadge as EquipmentOperatorBadgeType } from '../../../types/equipmentDetailViewModel.types'

export interface EquipmentHeaderBlockProps {
  title: string
  kindLabel: string
  conditionLabel?: string
  price: PriceView
  isWanted: boolean
  isRental: boolean
  operatorBadge: EquipmentOperatorBadgeType | null
  locationText: string
  postedAtLabel: string
  statusBadge?: {
    label: string
    tone: 'success' | 'warning' | 'danger' | 'neutral'
  }
}

/**
 * EquipmentHeaderBlock
 * Main presentation header for equipment detail page.
 * - Displays title, badges, price, and location/timestamp metadata.
 * - WANTED: strictly omits price block (never shows 0 ر.ع).
 * - RENT: displays rates and renders EquipmentOperatorBadge directly under the price.
 * - SALE: displays primary price badge.
 * - Zero hex codes (uses Colors tokens only).
 */
export function EquipmentHeaderBlock({
  title,
  kindLabel,
  conditionLabel,
  price,
  isWanted,
  isRental,
  operatorBadge,
  locationText,
  postedAtLabel,
  statusBadge,
}: EquipmentHeaderBlockProps) {
  const hasRates = Boolean(price.dailyRate || price.monthlyRate)

  return (
    <View style={s.container} testID="equipment-header-block">
      {/* ── Top Badges Row ──────────────────────────────────────── */}
      <View style={s.badgesRow}>
        {/* Kind Badge */}
        <View style={s.kindBadge}>
          <Text style={s.kindBadgeText} maxFontSizeMultiplier={1.3}>
            {kindLabel}
          </Text>
        </View>

        {/* Condition Badge */}
        {conditionLabel ? (
          <View style={s.conditionBadge}>
            <Text style={s.conditionBadgeText} maxFontSizeMultiplier={1.3}>
              {conditionLabel}
            </Text>
          </View>
        ) : null}

        {/* Status Badge */}
        {statusBadge ? (
          <View
            style={[
              s.statusBadge,
              statusBadge.tone === 'danger' && s.statusDanger,
              statusBadge.tone === 'warning' && s.statusWarning,
              statusBadge.tone === 'neutral' && s.statusNeutral,
            ]}
          >
            <Text
              style={[
                s.statusBadgeText,
                statusBadge.tone === 'danger' && s.statusTextDanger,
                statusBadge.tone === 'warning' && s.statusTextWarning,
                statusBadge.tone === 'neutral' && s.statusTextNeutral,
              ]}
              maxFontSizeMultiplier={1.3}
            >
              {statusBadge.label}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Main Title ──────────────────────────────────────────── */}
      <Text style={s.title} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>

      {/* ── Price Section (Strictly hidden for WANTED) ──────────── */}
      {!isWanted && (
        <View style={s.priceSection} testID="equipment-price-section">
          {!hasRates ? (
            <View style={s.priceRow}>
              {price.isNegotiable && price.amount > 0 ? (
                <View style={s.negotiableBadge}>
                  <Text style={s.negotiableText} maxFontSizeMultiplier={1.3}>
                    قابل للتفاوض
                  </Text>
                </View>
              ) : null}
              {price.amount > 0 ? (
                <PriceBadge price={price.formattedAmount} currency={price.currency} size="lg" />
              ) : (
                <Text style={s.contactPriceText} maxFontSizeMultiplier={1.3}>
                  {price.fullPriceLabel || 'السعر عند التواصل'}
                </Text>
              )}
            </View>
          ) : (
            <View style={s.ratesRow}>
              {price.dailyRate ? (
                <View style={s.rateChip}>
                  <Ionicons name="sunny-outline" size={14} color={Colors.primary} />
                  <Text style={s.rateValue} numberOfLines={1} adjustsFontSizeToFit>
                    {price.dailyRate.label}
                  </Text>
                </View>
              ) : null}
              {price.monthlyRate ? (
                <View style={s.rateChip}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                  <Text style={s.rateValue} numberOfLines={1} adjustsFontSizeToFit>
                    {price.monthlyRate.label}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Operator badge directly under price for RENT */}
          {isRental && operatorBadge ? (
            <View style={s.operatorBadgeWrap}>
              <EquipmentOperatorBadge badge={operatorBadge} />
            </View>
          ) : null}
        </View>
      )}

      {/* ── Metadata Row: Location & Date ───────────────────────── */}
      <View style={s.metadataRow}>
        <View style={s.metaItem}>
          <View style={s.metaIconWrap}>
            <Ionicons name="location" size={13} color={Colors.primary} />
          </View>
          <Text style={s.metaText} maxFontSizeMultiplier={1.3}>
            {locationText}
          </Text>
        </View>

        <View style={s.metaDot} />

        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={s.metaTextMuted} maxFontSizeMultiplier={1.3}>
            {postedAtLabel}
          </Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space4,
    paddingBottom: Spacing.space4,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  kindBadge: {
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
  },
  kindBadgeText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
  },
  conditionBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
  },
  conditionBadgeText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.text2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
  },
  statusDanger: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.error,
  },
  statusWarning: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.warning,
  },
  statusNeutral: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
  },
  statusBadgeText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
  },
  statusTextDanger: {
    color: Colors.error,
  },
  statusTextWarning: {
    color: Colors.warning,
  },
  statusTextNeutral: {
    color: Colors.textMuted,
  },
  title: {
    ...RTLText,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    lineHeight: lineHeightFor(20),
    color: Colors.text,
    textAlign: 'left',
    marginBottom: Spacing.space3,
  },
  priceSection: {
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    marginBottom: Spacing.space3,
    gap: Spacing.space2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  negotiableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: Spacing.space2 + 2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
  },
  negotiableText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primary,
  },
  contactPriceText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    lineHeight: lineHeightFor(18),
    color: Colors.primary,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
    alignItems: 'stretch',
  },
  rateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    paddingHorizontal: Spacing.space2,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
  },
  rateValue: {
    ...RTLText,
    flexShrink: 1,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: lineHeightFor(15),
    color: Colors.primary,
  },
  operatorBadgeWrap: {
    marginTop: Spacing.space2,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIconWrap: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.text2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.borderStrong,
  },
  metaTextMuted: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.text2,
  },
})

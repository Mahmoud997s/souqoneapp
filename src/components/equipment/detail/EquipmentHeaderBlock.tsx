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
 * - WANTED: strictly omits price block (never shows 0 OMR).
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
                  <Text style={s.rateValue} maxFontSizeMultiplier={1.3}>
                    {price.dailyRate.label}
                  </Text>
                </View>
              ) : null}
              {price.monthlyRate ? (
                <View style={s.rateChip}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                  <Text style={s.rateValue} maxFontSizeMultiplier={1.3}>
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
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  kindBadge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
  },
  kindBadgeText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.white,
  },
  conditionBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionBadgeText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    borderWidth: 1,
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
    fontSize: 12,
    lineHeight: lineHeightFor(12),
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 20,
    lineHeight: lineHeightFor(20),
    color: Colors.text,
    textAlign: 'left',
    marginBottom: Spacing.space3,
  },
  priceSection: {
    marginBottom: Spacing.space3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  negotiableBadge: {
    backgroundColor: Colors.paleMint,
    paddingHorizontal: Spacing.space2,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  negotiableText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.primaryDeep,
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  rateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.paleMint,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  rateValue: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primaryDeep,
  },
  operatorBadgeWrap: {
    marginTop: Spacing.space2,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIconWrap: {
    width: 18,
    height: 18,
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
    color: Colors.text,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
  },
  metaTextMuted: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
  },
})

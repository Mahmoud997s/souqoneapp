import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { PriceBadge } from '../ui/PriceBadge'
import type { PriceView } from '../../types/carDetailViewModel.types'
import { RTLText } from '../../constants/rtl'
import { lineHeightFor } from '../../constants/typography'

export interface ListingHeaderBlockProps {
  title: string
  kindLabel: string
  conditionLabel?: string
  price: PriceView
  locationText: string
  postedAtLabel: string
  statusBadge?: {
    label: string
    tone: 'success' | 'warning' | 'danger' | 'neutral'
  }
}

const TONE_COLORS = {
  success: { bg: 'rgba(22, 163, 74, 0.10)', border: 'rgba(22, 163, 74, 0.25)', text: Colors.success },
  warning: { bg: 'rgba(217, 119, 6, 0.10)', border: 'rgba(217, 119, 6, 0.25)', text: Colors.warning },
  danger:  { bg: 'rgba(220, 38, 38, 0.10)',  border: 'rgba(220, 38, 38, 0.25)',  text: Colors.error   },
  neutral: { bg: Colors.surface,             border: Colors.border,              text: Colors.text2   },
}

/**
 * ListingHeaderBlock
 * Main presentation header for car detail page.
 * Displays title, badges, price (sale/rental/negotiable), and metadata (location & timestamp).
 * Redesigned for premium visual hierarchy and Arabic-first typography.
 */
export function ListingHeaderBlock({
  title,
  kindLabel,
  conditionLabel,
  price,
  locationText,
  postedAtLabel,
  statusBadge,
}: ListingHeaderBlockProps) {
  const toneStyle = statusBadge ? TONE_COLORS[statusBadge.tone] : null
  const hasRates = !!(price.dailyRate || price.monthlyRate)

  return (
    <View style={s.container}>

      {/* ── Top Badges Row ──────────────────────────────────────── */}
      <View style={s.badgesRow}>
        {/* Kind Badge */}
        <View style={s.kindBadge}>
          <Text style={s.kindBadgeText}>{kindLabel}</Text>
        </View>

        {/* Condition Badge */}
        {conditionLabel ? (
          <View style={s.conditionBadge}>
            <Text style={s.conditionBadgeText}>{conditionLabel}</Text>
          </View>
        ) : null}

        {/* Status Badge (sold / archived / active…) */}
        {statusBadge && toneStyle ? (
          <View
            style={[
              s.statusBadge,
              { backgroundColor: toneStyle.bg, borderColor: toneStyle.border },
            ]}
          >
            <Text style={[s.statusBadgeText, { color: toneStyle.text }]}>
              {statusBadge.label}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Main Title ──────────────────────────────────────────── */}
      <Text style={s.title}>{title}</Text>

      {/* ── Price Section ───────────────────────────────────────── */}
      <View style={s.priceSection}>
        {/* Primary price row — hidden for rental listings (rates row covers it) */}
        {!hasRates ? (
          <View style={s.priceRow}>
            {price.isNegotiable ? (
              <View style={s.negotiableBadge}>
                <Text style={s.negotiableText}>قابل للتفاوض</Text>
              </View>
            ) : null}

            <PriceBadge price={price.formattedAmount} currency={price.currency} size="lg" />
          </View>
        ) : null}

        {/* Rental daily / monthly rates */}
        {hasRates ? (
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
        ) : null}
      </View>

      {/* ── Metadata Row: Location & Date ───────────────────────── */}
      <View style={s.metadataRow}>
        {/* Location */}
        <View style={s.metaItem}>
          <View style={s.metaIconWrap}>
            <Ionicons name="location" size={13} color={Colors.primary} />
          </View>
          <Text style={s.metaText}>{locationText}</Text>
        </View>

        {/* Dot divider */}
        <View style={s.metaDot} />

        {/* Posted time */}
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={s.metaTextMuted}>{postedAtLabel}</Text>
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

  // ── Badges ──────────────────────────────────────────────────────────────────
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
  statusBadgeText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
  },

  // ── Title ────────────────────────────────────────────────────────────────────
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    lineHeight: lineHeightFor(20),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },

  // ── Price ────────────────────────────────────────────────────────────────────
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

  // ── Metadata ─────────────────────────────────────────────────────────────────
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.text2,
  },
  metaTextMuted: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
  },
})

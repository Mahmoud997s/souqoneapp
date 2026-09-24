import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { PriceBadge } from '../ui/PriceBadge'
import type { PriceView } from '../../types/carDetailViewModel.types'

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
    paddingBottom: Spacing.space3,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  kindBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.primary,
  },
  conditionBadge: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  conditionBadgeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.text2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 16,
  },

  // ── Title ────────────────────────────────────────────────────────────────────
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },

  // ── Price ────────────────────────────────────────────────────────────────────
  priceSection: {
    backgroundColor: Colors.primary + '07',
    borderWidth: 1,
    borderColor: Colors.primary + '18',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2 + 2,
    marginBottom: Spacing.space3,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  negotiableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  negotiableText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.text2,
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
    backgroundColor: Colors.primary + '08',
    borderWidth: 1,
    borderColor: Colors.primary + '22',
    paddingHorizontal: Spacing.space2,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  rateValue: {
    flexShrink: 1,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.primary,
  },

  // ── Metadata ─────────────────────────────────────────────────────────────────
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text2,
  },
  metaTextMuted: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
})

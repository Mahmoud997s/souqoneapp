import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Typography } from '../../constants/typography'
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
  success: { bg: 'rgba(22, 163, 74, 0.1)', text: Colors.success },
  warning: { bg: 'rgba(217, 119, 6, 0.1)', text: Colors.warning },
  danger:  { bg: 'rgba(220, 38, 38, 0.1)', text: Colors.error },
  neutral: { bg: Colors.surface,          text: Colors.text2 },
}

/**
 * ListingHeaderBlock
 * Main presentation header for car detail page.
 * Displays title, badges, price (sale/rental/negotiable), and metadata (location & timestamp).
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

  return (
    <View style={s.container}>
      {/* Top Badges Row */}
      <View style={s.badgesRow}>
        <View style={s.kindBadge}>
          <Text style={s.kindBadgeText}>{kindLabel}</Text>
        </View>

        {conditionLabel ? (
          <View style={s.conditionBadge}>
            <Text style={s.conditionBadgeText}>{conditionLabel}</Text>
          </View>
        ) : null}

        {statusBadge && toneStyle ? (
          <View style={[s.statusBadge, { backgroundColor: toneStyle.bg }]}>
            <Text style={[s.statusBadgeText, { color: toneStyle.text }]}>
              {statusBadge.label}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Main Title */}
      <Text style={s.title}>{title}</Text>

      {/* Price Row */}
      <View style={s.priceRow}>
        <PriceBadge price={price.formattedAmount} currency={price.currency} size="lg" />
        {price.isNegotiable ? (
          <View style={s.negotiableBadge}>
            <Text style={s.negotiableText}>قابل للتفاوض</Text>
          </View>
        ) : null}
      </View>

      {/* Rental Rates (if applicable) */}
      {price.dailyRate || price.monthlyRate ? (
        <View style={s.ratesRow}>
          {price.dailyRate ? (
            <Text style={s.rateItem}>
              {price.dailyRate.label}: {price.dailyRate.formatted} {price.currency}
            </Text>
          ) : null}
          {price.monthlyRate ? (
            <Text style={s.rateItem}>
              {price.monthlyRate.label}: {price.monthlyRate.formatted} {price.currency}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Metadata Row: Location & Date */}
      <View style={s.metadataRow}>
        <View style={s.metaItem}>
          <Ionicons name="location-outline" size={15} color={Colors.text2} />
          <Text style={s.metaText}>{locationText}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  kindBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  kindBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
  },
  conditionBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  conditionBadgeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    fontFamily: Typography.headlineSm.fontFamily,
    fontSize: Typography.headlineSm.fontSize,
    lineHeight: Typography.headlineSm.lineHeight,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  negotiableBadge: {
    backgroundColor: 'rgba(232, 120, 30, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  negotiableText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.accent,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  rateItem: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.text2,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
  },
  metaTextMuted: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
  },
})

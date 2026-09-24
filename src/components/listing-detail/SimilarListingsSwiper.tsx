import React, { ReactElement } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { SkeletonCard } from '../ui/SkeletonCard'
import { lineHeightFor } from '../../constants/typography'

export interface SimilarListingsSwiperProps<TItem> {
  items: TItem[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  renderItem: (item: TItem, index: number) => ReactElement
  /** Width of each card in px. Defaults to 160 */
  cardWidth?: number
}

/**
 * SimilarListingsSwiper
 * Single-row horizontal scroll swiper for similar listings.
 * Replaces the paginated grid with a smooth swipeable row.
 * Cards peek from the edge to hint at scroll affordance.
 */
export function SimilarListingsSwiper<TItem>({
  items,
  isLoading,
  isError,
  onRetry,
  renderItem,
  cardWidth = 160,
}: SimilarListingsSwiperProps<TItem>) {
  return (
    <View style={s.container}>
      {/* Section header */}
      <Text style={s.title}>إعلانات مشابهة</Text>

      {/* Loading */}
      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          scrollEnabled={false}
        >
          {[0, 1, 2].map((i) => (
            <SkeletonCard
              key={i}
              style={StyleSheet.flatten([s.card, { width: cardWidth }])}
            />
          ))}
        </ScrollView>
      ) : isError ? (
        /* Error state */
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={22} color={Colors.error} />
          <Text style={s.errorText}>تعذر تحميل الإعلانات المشابهة</Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Text style={s.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : !items || items.length === 0 ? null : (
        /* Items swiper */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          decelerationRate="fast"
          snapToInterval={cardWidth + 12}
          snapToAlignment="start"
        >
          {items.map((item, index) => (
            <View key={index} style={[s.card, { width: cardWidth }]}>
              {renderItem(item, index)}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginVertical: Spacing.space2,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
    marginHorizontal: Spacing.space4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    // width is set dynamically via cardWidth prop
    overflow: 'hidden',
  },
  errorBox: {
    marginHorizontal: Spacing.space4,
    backgroundColor: Colors.white,
    padding: Spacing.space3,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.error,
  },
  retryButton: {
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    backgroundColor: Colors.primary + '15',
    borderRadius: Radius.md,
  },
  retryText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.primary,
  },
})

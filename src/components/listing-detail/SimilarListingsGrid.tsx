import React, { ReactElement } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { RTLText } from '../../constants/rtl'
import { SkeletonCard } from '../ui/SkeletonCard'
import { lineHeightFor } from '../../constants/typography'
import { formatNumberWestern } from '../../utils/numberFormat'

export interface SimilarListingCardProps {
  title: string
  imageUri?: string
  /** Real total photo count ONLY when known from `_count.images`; omit/undefined to hide badge. */
  knownImageCount?: number
  priceLabel?: string
  metaLabel?: string
  placeholderIcon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  testID?: string
}

/**
 * SimilarListingCard
 * Reusable card matching Cars/Buses/Equipment similar-section styling 1-to-1.
 * Shows the photo count badge ONLY when `knownImageCount >= 1` is explicitly known.
 */
export function SimilarListingCard({
  title,
  imageUri,
  knownImageCount,
  priceLabel,
  metaLabel,
  placeholderIcon,
  onPress,
  testID = 'similar-item-card',
}: SimilarListingCardProps) {
  const showPhotoBadge =
    typeof knownImageCount === 'number' &&
    Number.isFinite(knownImageCount) &&
    knownImageCount >= 1

  return (
    <TouchableOpacity
      style={s.similarCard}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
    >
      <View style={s.similarCardImagePlaceholder}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <Ionicons
            name={placeholderIcon}
            size={28}
            color={Colors.primary}
          />
        )}
        {showPhotoBadge && (
          <View style={s.similarPhotoBadge} testID="similar-card-image-count-badge">
            <Ionicons name="images-outline" size={10} color={Colors.white} />
            <Text style={s.similarPhotoBadgeText}>
              {formatNumberWestern(knownImageCount)}
            </Text>
          </View>
        )}
      </View>
      <Text style={s.similarCardTitle} numberOfLines={2}>
        {title}
      </Text>
      {priceLabel ? (
        <Text style={s.similarCardPrice} numberOfLines={1}>
          {priceLabel}
        </Text>
      ) : null}
      {metaLabel ? (
        <Text style={s.similarCardMeta} numberOfLines={1}>
          {metaLabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  )
}

export interface SimilarListingsGridProps<TItem> {
  items: TItem[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  renderItem: (item: TItem) => ReactElement
  page: number
  pageCount: number
  onPageChange: (p: number) => void
  columns?: 2 | 3
}

/**
 * SimilarListingsGrid
 * Paginated vertical grid of similar listings.
 * Strictly adheres to the project's RTL rule: vertical grid with pagination, NOT a horizontal scroll.
 */
export function SimilarListingsGrid<TItem>({
  items,
  isLoading,
  isError,
  onRetry,
  renderItem,
  page,
  pageCount,
  onPageChange,
  columns = 2,
}: SimilarListingsGridProps<TItem>) {
  if (isLoading) {
    return (
      <View style={s.container}>
        <Text style={s.title}>إعلانات مشابهة</Text>
        <View style={s.gridRow}>
          <SkeletonCard style={columns === 3 ? s.col3 : s.col2} />
          <SkeletonCard style={columns === 3 ? s.col3 : s.col2} />
          <SkeletonCard style={columns === 3 ? s.col3 : s.col2} />
          <SkeletonCard style={columns === 3 ? s.col3 : s.col2} />
        </View>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={s.container}>
        <Text style={s.title}>إعلانات مشابهة</Text>
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
          <Text style={s.errorText}>تعذر تحميل الإعلانات المشابهة</Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={onRetry}
            activeOpacity={0.7}
            testID="btn-similar-retry"
          >
            <Text style={s.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!items || items.length === 0) {
    return null
  }

  const itemStyle = columns === 3 ? s.col3 : s.col2

  return (
    <View style={s.container}>
      <Text style={s.title}>إعلانات مشابهة</Text>

      <View style={s.gridRow}>
        {items.map((item, index) => (
          <View key={index} style={itemStyle}>
            {renderItem(item)}
          </View>
        ))}
      </View>

      {/* Pagination Controls */}
      {pageCount > 1 ? (
        <View style={s.paginationRow}>
          <TouchableOpacity
            style={[s.pageButton, page >= pageCount && s.disabledPageButton]}
            disabled={page >= pageCount}
            onPress={() => onPageChange(page + 1)}
            activeOpacity={0.7}
            testID="btn-similar-next"
          >
            <Text style={s.pageButtonText}>التالي</Text>
            <Ionicons name="chevron-back" size={16} color={Colors.text2} />
          </TouchableOpacity>

          <Text style={s.pageIndicator}>
            صفحة {page} من {pageCount}
          </Text>

          <TouchableOpacity
            style={[s.pageButton, page <= 1 && s.disabledPageButton]}
            disabled={page <= 1}
            onPress={() => onPageChange(page - 1)}
            activeOpacity={0.7}
            testID="btn-similar-prev"
          >
            <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
            <Text style={s.pageButtonText}>السابق</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  col2: {
    width: '48.5%',
  },
  col3: {
    width: '31%',
  },
  similarCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  similarCardImagePlaceholder: {
    height: 88,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
    overflow: 'hidden',
    position: 'relative',
  },
  similarPhotoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: Colors.scrimDark65,
    borderRadius: Radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  similarPhotoBadgeText: {
    color: Colors.white,
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: lineHeightFor(10),
  },
  similarCardTitle: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    textAlign: 'left',
    marginBottom: Spacing.space1,
  },
  similarCardPrice: {
    ...RTLText,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.primary,
    textAlign: 'left',
  },
  similarCardMeta: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'left',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.error,
  },
  retryButton: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    minHeight: Spacing.touch,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.paleMint,
    borderRadius: Radius.md,
    marginTop: Spacing.space1,
    borderWidth: 1,
    borderColor: Colors.primaryHex30,
  },
  retryText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primary,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.space3,
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    minHeight: Spacing.touch,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.space1,
  },
  disabledPageButton: {
    opacity: 0.4,
  },
  pageButtonText: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.text2,
  },
  pageIndicator: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
  },
})

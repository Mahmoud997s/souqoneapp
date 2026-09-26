import React, { ReactElement } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { SkeletonCard } from '../ui/SkeletonCard'
import { lineHeightFor } from '../../constants/typography'

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
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
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
  errorBox: {
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
    marginTop: Spacing.space1,
  },
  retryText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
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
    paddingHorizontal: Spacing.space3,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  disabledPageButton: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.text2,
  },
  pageIndicator: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
  },
})

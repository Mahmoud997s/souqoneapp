import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { SkeletonCard } from './SkeletonCard'
import { EmptyState } from './EmptyState'
import { getListErrorProps } from '../../utils/getListErrorProps'

export const RESET_FILTERS_LABEL = 'إعادة تعيين الفلاتر'
export const RESET_SEARCH_LABEL = 'مسح البحث'
export const REFRESH_LIST_LABEL = 'تحديث الصفحة'

export interface BrowseEmptyStateProps {
  isLoading: boolean
  isError: boolean
  error?: unknown
  errorTitle?: string
  errorTestID?: string
  emptyTestID?: string
  activeFiltersCount?: number
  hasActiveSearch?: boolean
  onRetry: () => void
  onClearAll?: () => void
  onResetFilters?: () => void
  onResetSearch?: () => void
  iconName?: string
  iconType?: 'ionicons' | 'material-community' | 'feather'
  iconSize?: number
  iconColor?: string
  emptyTitle?: string
  emptySubtitle?: string
  emptyFilteredSubtitle?: string
  errorText?: string
  renderSkeleton?: () => React.ReactNode
}

export function BrowseEmptyState({
  isLoading,
  isError,
  error,
  errorTitle,
  errorTestID = 'browse-error-state',
  emptyTestID = 'browse-empty-state',
  activeFiltersCount = 0,
  hasActiveSearch = false,
  onRetry,
  onClearAll,
  onResetFilters,
  onResetSearch,
  iconName = 'car-outline',
  iconType = 'ionicons',
  iconSize = 40,
  iconColor = Colors.primary,
  emptyTitle = 'لا توجد نتائج مطابقة',
  emptySubtitle = 'جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى',
  emptyFilteredSubtitle,
  errorText = 'حدث خطأ أثناء تحميل البيانات',
  renderSkeleton,
}: BrowseEmptyStateProps) {
  if (isLoading) {
    if (renderSkeleton) {
      return <>{renderSkeleton()}</>
    }
    return (
      <View style={styles.skeletonGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.fullCard}>
            <SkeletonCard />
          </View>
        ))}
      </View>
    )
  }

  if (isError) {
    if (error !== undefined) {
      const errorProps = getListErrorProps(error, errorTitle ?? errorText)
      return (
        <EmptyState
          testID={errorTestID}
          icon={errorProps.icon}
          iconType="ionicons"
          iconColor={errorProps.iconColor}
          title={errorProps.title}
          subtitle={errorProps.subtitle}
          actionLabel={errorProps.actionLabel}
          actionIcon="refresh-outline"
          onAction={onRetry}
        />
      )
    }

    return (
      <View style={styles.center}>
        <Text style={styles.errorTxt}>{errorText}</Text>
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryTxt}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const hasFilters = activeFiltersCount > 0
  const hasFiltersOrSearch = hasFilters || hasActiveSearch
  const resolvedSubtitle =
    hasFiltersOrSearch && emptyFilteredSubtitle ? emptyFilteredSubtitle : emptySubtitle

  let actionLabel: string | undefined
  let actionIcon: string | undefined
  let onAction: (() => void) | undefined
  let secondaryActionLabel: string | undefined
  let onSecondaryAction: (() => void) | undefined

  if (hasFilters && (onResetFilters || onClearAll)) {
    actionLabel = RESET_FILTERS_LABEL
    actionIcon = 'close-circle-outline'
    onAction = onResetFilters ?? onClearAll
    if (hasActiveSearch && onResetSearch) {
      secondaryActionLabel = RESET_SEARCH_LABEL
      onSecondaryAction = onResetSearch
    }
  } else if (hasActiveSearch && (onResetSearch || onClearAll)) {
    actionLabel = RESET_SEARCH_LABEL
    actionIcon = 'close-circle-outline'
    onAction = onResetSearch ?? onClearAll
  } else {
    actionLabel = REFRESH_LIST_LABEL
    actionIcon = 'refresh-outline'
    onAction = onRetry
  }

  return (
    <EmptyState
      testID={emptyTestID}
      icon={iconName}
      iconType={iconType}
      iconSize={iconSize}
      iconColor={iconColor}
      title={emptyTitle}
      subtitle={resolvedSubtitle}
      actionLabel={actionLabel}
      actionIcon={actionIcon}
      onAction={onAction}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={onSecondaryAction}
    />
  )
}

const styles = StyleSheet.create({
  skeletonGrid: {
    paddingTop: Spacing.space2,
  },
  fullCard: {
    width: '100%',
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.error,
    marginBottom: Spacing.space4,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space3,
    borderRadius: Radius.lg,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.white,
  },
})

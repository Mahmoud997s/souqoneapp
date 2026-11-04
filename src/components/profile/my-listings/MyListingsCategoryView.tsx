import React from 'react'
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { router } from 'expo-router'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { BROWSE_LIST_VIRTUALIZATION_PROPS } from '../../../constants/listVirtualization'
import { SkeletonCard } from '../../ui/SkeletonCard'
import { EmptyState } from '../../ui/EmptyState'
import { getListErrorProps } from '../../../utils/getListErrorProps'
import { MyListingItem, MyListingEntityType } from '../../../types/my-listings.types'
import { MyListingCardDispatcher } from './MyListingCardDispatcher'
import { useGlassSupport } from '../../navigation/glassSupport'

export interface MyListingsCategoryViewProps {
  data: MyListingItem[]
  isLoading: boolean
  isError?: boolean
  error?: unknown
  isRefreshing: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  onRefresh: () => void
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  onCancelDeletionRequest?: (item: MyListingItem) => void
  isEditSupported: (entityType: MyListingEntityType) => boolean
  bottomInset: number
  topInset: number
  onScroll?: any
  header?: React.ReactElement | null;
}

export function MyListingsCategoryView({
  data,
  isLoading,
  isError,
  error,
  isRefreshing,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onRefresh,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onCancelDeletionRequest,
  isEditSupported,
  bottomInset,
  topInset,
  onScroll,
  header,
}: MyListingsCategoryViewProps) {
  const glassSupport = useGlassSupport()
  if (isLoading) {
    return (
      <View style={[s.list, { paddingTop: topInset + Spacing.space4 }]} testID="my-listings-category-loading">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    )
  }

  const errorProps = isError ? getListErrorProps(error, 'تعذر تحميل الإعلانات') : null

  return (
    <Animated.FlatList
      testID="my-listings-category-flat-list"
      {...BROWSE_LIST_VIRTUALIZATION_PROPS}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListHeaderComponent={header}
      data={data}
      keyExtractor={(item) => `${item.entityType}-${item.id}`}
      contentContainerStyle={[s.list, { paddingTop: topInset, paddingBottom: bottomInset + 80 }]}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={s.footerLoader}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isError && errorProps ? (
          <EmptyState
            testID="my-listings-category-error-state"
            icon={errorProps.icon}
            iconType="ionicons"
            iconColor={errorProps.iconColor}
            title={errorProps.title}
            subtitle={errorProps.subtitle}
            actionLabel={errorProps.actionLabel}
            onAction={onRefresh}
          />
        ) : (
          <EmptyState
            testID="my-listings-category-empty-state"
            icon="document-text-outline"
            title="لا توجد إعلانات"
            subtitle="لم يتم العثور على أي إعلانات مطابقة للتصنيف أو الفلتر المختار."
            actionLabel="أضف إعلانك الأول"
            actionIcon="add"
            onAction={() => router.push('/post' as any)}
          />
        )
      }
      renderItem={({ item }) => (
        <View style={s.cardWrapper}>
          <MyListingCardDispatcher
            item={item}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onCancelDeletionRequest={onCancelDeletionRequest}
            isEditSupported={isEditSupported(item.entityType)}
            fullWidth={true}
            glassSupport={glassSupport}
          />
        </View>
      )}
    />
  )
}

const s = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space4,
  },
  cardWrapper: {
    marginBottom: Spacing.space2,
  },
  footerLoader: {
    paddingVertical: Spacing.space4,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

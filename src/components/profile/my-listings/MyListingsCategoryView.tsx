import React from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { SkeletonCard } from '../../ui/SkeletonCard'
import { EmptyState } from '../../ui/EmptyState'
import { MyListingItem, MyListingEntityType } from '../../../types/my-listings.types'
import { MyListingCardDispatcher } from './MyListingCardDispatcher'

export interface MyListingsCategoryViewProps {
  data: MyListingItem[]
  isLoading: boolean
  isRefreshing: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  onRefresh: () => void
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  isEditSupported: (entityType: MyListingEntityType) => boolean
  bottomInset: number
}

export function MyListingsCategoryView({
  data,
  isLoading,
  isRefreshing,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onRefresh,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isEditSupported,
  bottomInset,
}: MyListingsCategoryViewProps) {
  if (isLoading) {
    return (
      <View style={s.list}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => `${item.entityType}-${item.id}`}
      contentContainerStyle={[s.list, { paddingBottom: bottomInset + 80 }]}
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
        <EmptyState
          icon="document-text-outline"
          title="لا توجد إعلانات"
          subtitle="لم يتم العثور على أي إعلانات مطابقة للتصنيف أو الفلتر المختار."
          actionLabel="أضف إعلانك الأول"
          actionIcon="add"
          onAction={() => router.push('/post' as any)}
        />
      }
      renderItem={({ item }) => (
        <View style={s.cardWrapper}>
          <MyListingCardDispatcher
            item={item}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            isEditSupported={isEditSupported(item.entityType)}
            fullWidth={true}
          />
        </View>
      )}
    />
  )
}

const s = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space4,
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

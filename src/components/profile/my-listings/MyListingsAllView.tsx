import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { SkeletonCard } from '../../ui/SkeletonCard'
import { EmptyState } from '../../ui/EmptyState'
import { MyListingItem, MyListingEntityType } from '../../../types/my-listings.types'
import { ListingSectionConfig } from './sections.config'
import { MyListingSectionSlider } from './MyListingSectionSlider'

export interface GroupedSectionData {
  config: ListingSectionConfig
  items: MyListingItem[]
}

export interface MyListingsAllViewProps {
  groupedSections: GroupedSectionData[]
  isLoading: boolean
  isRefreshing: boolean
  onRefresh: () => void
  onSelectCategory: (categoryId: string) => void
  onView: (item: MyListingItem) => void
  onEdit: (item: MyListingItem) => void
  onDelete: (item: MyListingItem) => void
  onStatusChange?: (item: MyListingItem) => void
  isEditSupported: (entityType: MyListingEntityType) => boolean
  bottomInset: number
}

export function MyListingsAllView({
  groupedSections,
  isLoading,
  isRefreshing,
  onRefresh,
  onSelectCategory,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isEditSupported,
  bottomInset,
}: MyListingsAllViewProps) {
  if (isLoading) {
    return (
      <View style={s.loaderContainer}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    )
  }

  const hasAnyItems = groupedSections.some((sec) => sec.items.length > 0)

  if (!hasAnyItems) {
    return (
      <ScrollView
        contentContainerStyle={[s.emptyScroll, { paddingBottom: bottomInset + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <EmptyState
          icon="document-text-outline"
          title="لا توجد إعلانات"
          subtitle="لم يتم العثور على أي إعلانات مطابقة للتصنيف أو الفلتر المختار."
          actionLabel="أضف إعلانك الأول"
          actionIcon="add"
          onAction={() => router.push('/post' as any)}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[s.contentContainer, { paddingBottom: bottomInset + 80 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {groupedSections.map((section) => (
        <MyListingSectionSlider
          key={section.config.entityType}
          config={section.config}
          items={section.items}
          onSelectCategory={onSelectCategory}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          isEditSupported={isEditSupported}
        />
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  contentContainer: {
    paddingTop: Spacing.space4,
  },
  loaderContainer: {
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space4,
    gap: Spacing.space4,
  },
  emptyScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space4,
    justifyContent: 'center',
  },
})

import React from 'react'
import {
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import Animated from 'react-native-reanimated'
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
  topInset: number
  onScroll?: any
  header?: React.ReactElement | null;
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
  topInset,
  onScroll,
  header,
}: MyListingsAllViewProps) {
  if (isLoading) {
    return (
      <View style={[s.loaderContainer, { paddingTop: topInset + Spacing.space4 }]}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    )
  }

  const hasAnyItems = groupedSections.some((sec) => sec.items.length > 0)

  if (!hasAnyItems) {
    return (
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[s.emptyScroll, { paddingTop: topInset + Spacing.space4, paddingBottom: bottomInset + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {header}
        <EmptyState
          icon="document-text-outline"
          title="لا توجد إعلانات"
          subtitle="لم يتم العثور على أي إعلانات مطابقة للتصنيف أو الفلتر المختار."
          actionLabel="أضف إعلانك الأول"
          actionIcon="add"
          onAction={() => router.push('/post' as any)}
        />
      </Animated.ScrollView>
    )
  }

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[s.contentContainer, { paddingTop: topInset + Spacing.space4, paddingBottom: bottomInset + 80 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {header}
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
    </Animated.ScrollView>
  )
}

const s = StyleSheet.create({
  contentContainer: {},
  loaderContainer: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space4,
  },
  emptyScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.space5,
    justifyContent: 'center',
  },
})

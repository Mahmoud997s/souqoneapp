import React, { ReactNode } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { UnifiedCardItem } from '../../../types/unified-card.types'
import { SkeletonCard } from '../../ui/SkeletonCard'
import { ListingCardByType } from '../ListingCardByType'
import { PublicProfileListingVertical } from '../../../hooks/public-profile/publicProfileKeys'

const EMPTY_LABELS: Record<PublicProfileListingVertical, string> = {
  car: 'لا توجد سيارات حالياً',
  bus: 'لا توجد حافلات حالياً',
  equipment: 'لا توجد معدات حالياً',
  part: 'لا توجد قطع غيار حالياً',
  service: 'لا توجد خدمات حالياً',
}

export interface PublicProfileSectionListProps {
  contentContainerStyle?: StyleProp<ViewStyle>
  vertical: PublicProfileListingVertical
  header?: ReactNode
  items: UnifiedCardItem[]
  isLoading: boolean
  isError: boolean
  isRefreshing: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onRefresh: () => void
  onRetry: () => void
  onLoadMore: () => void
  onPressItem: (item: UnifiedCardItem) => void
}

export function PublicProfileSectionList({
  vertical, header, items, isLoading, isError, isRefreshing, isFetchingNextPage, hasNextPage, contentContainerStyle,
  onRefresh, onRetry, onLoadMore, onPressItem,
}: PublicProfileSectionListProps) {
  return (
    <ScrollView
      contentContainerStyle={[s.content, contentContainerStyle]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {header}
      {isLoading
        ? <View style={s.list} accessibilityRole="progressbar" accessibilityLabel="جارٍ تحميل الإعلانات"><SkeletonCard fullWidth /><SkeletonCard fullWidth /></View>
        : isError && items.length === 0
          ? <View style={s.state}>
              <Text style={s.stateText} accessibilityRole="alert">تعذر تحميل الإعلانات</Text>
              <TouchableOpacity style={s.action} onPress={onRetry} accessibilityRole="button" accessibilityLabel="إعادة تحميل الإعلانات">
                <Text style={s.actionText}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          : items.length === 0
            ? <View style={s.state}><Text style={s.stateText}>{EMPTY_LABELS[vertical]}</Text></View>
            : items.map((item) => <ListingCardByType key={`${vertical}-${item.id}`} vertical={vertical} item={item} onPress={() => onPressItem(item)} />)}
      {!isLoading && isError && items.length > 0 && (
        <TouchableOpacity style={s.action} onPress={onRetry} accessibilityRole="button" accessibilityLabel="إعادة تحميل الإعلانات">
          <Text style={s.actionText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      )}
      {!isLoading && !isError && hasNextPage && (
        <TouchableOpacity style={s.action} onPress={onLoadMore} disabled={isFetchingNextPage} accessibilityRole="button" accessibilityLabel="تحميل المزيد من الإعلانات">
          {isFetchingNextPage ? <ActivityIndicator color={Colors.white} /> : <Text style={s.actionText}>تحميل المزيد</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  content: { gap: Spacing.space4, paddingBottom: Spacing.space6 },
  list: { gap: Spacing.space4 },
  state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: Spacing.space3 },
  stateText: { fontFamily: 'Almarai_700Bold', fontSize: 15, lineHeight: 24, color: Colors.textMuted, textAlign: 'center' },
  action: { minHeight: Spacing.touch, alignSelf: 'center', minWidth: 150, paddingHorizontal: Spacing.space4, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.pill, backgroundColor: Colors.primary },
  actionText: { fontFamily: 'Almarai_700Bold', fontSize: 14, lineHeight: 20, color: Colors.white },
})

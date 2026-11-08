import React, { memo, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { PartCard } from './PartCard'
import { SkeletonCard } from '../ui/SkeletonCard'
import { HorizontalScrollCard } from '../ui/HorizontalScrollCard'
import { EmptyState } from '../ui/EmptyState'
import { CardSystem } from '../../constants/cardSystem'
import { type GlassSupport } from '../navigation/glassSupport'
import { getListErrorProps } from '../../utils/getListErrorProps'
import { StaleDataBanner } from '../listing-detail/StaleDataBanner'
import {
  CARS_PEEK_GAP,
  CARS_PEEK_IMAGE_HEIGHT,
  getPeekCardWidth,
  getPeekLeadingInset,
} from '../../constants/peekCarousel'

const CARD_WIDTH = getPeekCardWidth()

export interface PartHorizontalListProps {
  title: string
  subTitle?: string
  data: any[]
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  isRefetchError?: boolean
  isRefetching?: boolean
  emptyText: string
  onSeeAll: () => void
  onPressItem: (item: any) => void
  glassSupport?: GlassSupport
}

export const PartHorizontalList = memo(function PartHorizontalList({ 
  title, 
  subTitle, 
  data, 
  isLoading, 
  isError,
  error,
  onRetry,
  isRefetchError,
  isRefetching,
  emptyText, 
  onSeeAll, 
  onPressItem,
  glassSupport,
}: PartHorizontalListProps) {
  const errorProps = isError ? getListErrorProps(error, 'تعذر تحميل قطع الغيار') : null
  const renderLoadedItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={{ width: CARD_WIDTH }}>
        <PartCard
          item={item}
          onPress={() => onPressItem(item)}
          fullWidth={true}
          imageHeight={CARS_PEEK_IMAGE_HEIGHT}
          compactBody={true}
          maxChips={4}
          disableImageSwipe={true}
          titleNumberOfLines={1}
          glassSupport={glassSupport}
        />
      </View>
    ),
    [onPressItem, glassSupport]
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          {subTitle && <Text style={s.subTitle}>{subTitle}</Text>}
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          <HorizontalScrollCard
            key="loading-skeleton"
            data={[1, 2, 3]}
            cardWidth={CARD_WIDTH}
            gap={CARS_PEEK_GAP}
            paddingEnd={getPeekLeadingInset()}
            trackPendingIndex
            paging
            depthEffect
            keyExtractor={(item) => String(item)}
            renderItem={() => (
              <SkeletonCard
                fullWidth
                imageHeight={CARS_PEEK_IMAGE_HEIGHT}
                compactBody
                style={{ width: CARD_WIDTH }}
              />
            )}
          />
        </View>
      ) : data.length > 0 ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          {isRefetchError && (
            <View style={{ marginHorizontal: Spacing.space5, marginBottom: Spacing.space2 }}>
              <StaleDataBanner
                onRetry={onRetry}
                isRefetching={isRefetching}
              />
            </View>
          )}
          <HorizontalScrollCard
            key="loaded-cards"
            data={data}
            cardWidth={CARD_WIDTH}
            gap={CARS_PEEK_GAP}
            paddingEnd={getPeekLeadingInset()}
            trackPendingIndex
            paging
            showDots
            depthEffect
            keyExtractor={(item, idx) => item.id ?? String(idx)}
            onSeeAll={onSeeAll}
            seeAllTitle="عرض الكل"
            seeAllSubtitle={`تصفح جميع ${title}`}
            renderItem={renderLoadedItem}
          />
        </View>
      ) : isError ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginHorizontal: -Spacing.space5 }}
          contentContainerStyle={s.scrollContent}
        >
          <View style={s.emptyCard}>
            <EmptyState 
              testID="parts-horizontal-error-state"
              icon={errorProps?.icon ?? 'alert-circle-outline'}
              iconColor={errorProps?.iconColor ?? Colors.error}
              title={errorProps?.title ?? 'تعذر تحميل قطع الغيار'}
              subtitle={errorProps?.subtitle ?? 'حدث خطأ أثناء تحميل البيانات، يرجى المحاولة مرة أخرى.'}
              actionLabel={onRetry ? (errorProps?.actionLabel ?? 'إعادة المحاولة') : undefined}
              onAction={onRetry}
              compact 
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginHorizontal: -Spacing.space5 }}
          contentContainerStyle={s.scrollContent}
        >
          <View style={s.emptyCard}>
            <EmptyState 
              testID="parts-horizontal-empty-state"
              title={emptyText} 
              icon="construct-outline"
              compact 
            />
          </View>
        </ScrollView>
      )}
    </View>
  )
})

const s = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, 
    color: Colors.text, 
    textAlign: 'left',
    lineHeight: 23,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  subTitle: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, 
    color: Colors.textMuted, 
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  seeAllBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: Colors.paleMint, 
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: Radius.pill,
  },
  seeAllTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 12, 
    color: Colors.primary,
    lineHeight: 16,
    paddingTop: 1,
  },
  loaderWrap: {
    height: 220, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  scrollView: {
    marginHorizontal: -Spacing.space5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5, 
    gap: Spacing.space3,
    paddingVertical: 4,
  },
  emptyCard: {
    width: Dimensions.get('window').width * 0.6,
    height: 250,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    justifyContent: 'center',
    alignItems: 'center',
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
})

import React, { memo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { EquipCard } from '../../cards/EquipCard'
import { SkeletonCard } from '../../ui/SkeletonCard'
import { HorizontalScrollCard } from '../../ui/HorizontalScrollCard'
import { EmptyState } from '../../ui/EmptyState'
import { CardSystem } from '../../../constants/cardSystem'
import { type GlassSupport } from '../../navigation/glassSupport'
import { getListErrorProps } from '../../../utils/getListErrorProps'
import { StaleDataBanner } from '../../listing-detail/StaleDataBanner'
import { Listing } from '../../../types/listing.types'
import { EquipmentListing } from '../../../types/equipment.types'
import { UnifiedCardItem } from '../../../types/unified-card.types'
import {
  CARS_PEEK_GAP,
  CARS_PEEK_IMAGE_HEIGHT,
  getPeekCardWidth,
  getPeekLeadingInset,
} from '../../../constants/peekCarousel'

const CARD_WIDTH = getPeekCardWidth()

export type EquipmentHorizontalListItem =
  | UnifiedCardItem
  | Listing
  | EquipmentListing
  | { id: string; title: string; [key: string]: unknown }

interface Props {
  title: string
  subTitle?: string
  data: EquipmentHorizontalListItem[]
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  isRefetchError?: boolean
  isRefetching?: boolean
  emptyText: string
  onSeeAll: () => void
  onPressItem: (item: EquipmentHorizontalListItem) => void
  glassSupport?: GlassSupport
}

export const EquipmentHorizontalList = memo(function EquipmentHorizontalList({
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
}: Props) {
  const safeData = data ?? []
  const errorProps = isError ? getListErrorProps(error, 'تعذر تحميل المعدات') : null
  const renderLoadedItem = useCallback(
    ({ item }: { item: EquipmentHorizontalListItem }) => (
      <View style={{ width: CARD_WIDTH }}>
        <EquipCard
          item={item as unknown as Listing}
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
      <View style={s.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleHeader}>{title}</Text>
          {subTitle && <Text style={s.sectionSubHeader}>{subTitle}</Text>}
        </View>
        <TouchableOpacity onPress={onSeeAll} style={s.seeAllBtn} activeOpacity={0.7}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && safeData.length === 0 ? (
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
      ) : safeData.length > 0 ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          {(isError || isRefetchError) && (
            <View style={{ marginHorizontal: Spacing.space5, marginBottom: Spacing.space2 }}>
              <StaleDataBanner
                onRetry={onRetry}
                isRefetching={isRefetching}
              />
            </View>
          )}
          <HorizontalScrollCard
            key="loaded-cards"
            data={safeData}
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
              testID="equipment-horizontal-error-state"
              icon={errorProps?.icon ?? 'alert-circle-outline'}
              iconColor={errorProps?.iconColor ?? Colors.error}
              title={errorProps?.title ?? 'تعذر تحميل المعدات'}
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
              testID="equipment-horizontal-empty-state"
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 23,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  sectionSubHeader: {
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
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3,
    paddingVertical: 4,
    alignItems: 'flex-start',
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

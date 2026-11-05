import React, { memo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { OperatorCard } from '../../cards/OperatorCard'
import { SkeletonCard } from '../../ui/SkeletonCard'
import { HorizontalScrollCard } from '../../ui/HorizontalScrollCard'
import { EmptyState } from '../../ui/EmptyState'
import { CardSystem } from '../../../constants/cardSystem'
import { type GlassSupport } from '../../navigation/glassSupport'
import { getListErrorProps } from '../../../utils/getListErrorProps'

export const OPERATOR_SWIPER_WIDTH_RATIO = 0.65

interface Props {
  title: string
  subTitle?: string
  data: any[]
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
  emptyText: string
  onSeeAll: () => void
  onPressItem: (item: any) => void
  glassSupport?: GlassSupport
}

export const OperatorHorizontalList = memo(function OperatorHorizontalList({
  title,
  subTitle,
  data,
  isLoading,
  isError,
  error,
  onRetry,
  emptyText,
  onSeeAll,
  onPressItem,
  glassSupport,
}: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const cardWidth = Math.round(windowWidth * OPERATOR_SWIPER_WIDTH_RATIO)
  const errorProps = isError ? getListErrorProps(error, 'تعذر تحميل المشغلين') : null

  const renderLoadedItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={{ width: cardWidth }} testID="operator-swiper-item-wrapper">
        <OperatorCard
          item={item}
          onPress={() => onPressItem(item)}
        />
      </View>
    ),
    [cardWidth, onPressItem]
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

      {isLoading ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          <HorizontalScrollCard
            key="loading-skeleton"
            data={[1, 2, 3]}
            trackPendingIndex
            cardWidth={cardWidth}
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item) => String(item)}
            renderItem={() => (
              <SkeletonCard style={{ width: cardWidth }} />
            )}
          />
        </View>
      ) : data.length > 0 ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          <HorizontalScrollCard
            key="loaded-operators"
            data={data}
            trackPendingIndex
            cardWidth={cardWidth}
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item) => item.id}
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
          <View style={[s.emptyCard, { width: cardWidth }]}>
            <EmptyState
              testID="operator-list-error-state"
              icon={errorProps?.icon ?? 'alert-circle-outline'}
              iconColor={errorProps?.iconColor ?? Colors.error}
              title={errorProps?.title ?? 'تعذر تحميل المشغلين'}
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
          <View style={[s.emptyCard, { width: cardWidth }]}>
            <EmptyState
              testID="operator-list-empty-state"
              title={emptyText}
              icon="people-outline"
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
    height: 250,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    justifyContent: 'center',
    alignItems: 'center',
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
})

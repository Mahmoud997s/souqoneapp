import React from 'react'
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
import { OperatorCard } from '../../cards/OperatorCard'
import { SkeletonCard } from '../../ui/SkeletonCard'
import { HorizontalScrollCard } from '../../ui/HorizontalScrollCard'
import { EmptyState } from '../../ui/EmptyState'
import { CardSystem } from '../../../constants/cardSystem'

const CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.68)

interface Props {
  title: string
  subTitle?: string
  data: any[]
  isLoading: boolean
  emptyText: string
  onSeeAll: () => void
  onPressItem: (item: any) => void
}

export function OperatorHorizontalList({
  title,
  subTitle,
  data,
  isLoading,
  emptyText,
  onSeeAll,
  onPressItem,
}: Props) {
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
            cardWidth={CARD_WIDTH}
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item) => String(item)}
            renderItem={() => (
              <SkeletonCard style={{ width: CARD_WIDTH }} />
            )}
          />
        </View>
      ) : data.length > 0 ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          <HorizontalScrollCard
            key="loaded-operators"
            data={data}
            cardWidth={CARD_WIDTH}
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item) => item.id}
            onSeeAll={onSeeAll}
            seeAllTitle="عرض الكل"
            seeAllSubtitle={`تصفح جميع ${title}`}
            renderItem={({ item }) => (
              <View style={{ width: CARD_WIDTH }}>
                <OperatorCard
                  item={item}
                  onPress={() => onPressItem(item)}
                />
              </View>
            )}
          />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -Spacing.space5 }}
          contentContainerStyle={s.scrollContent}
        >
          <View style={s.emptyCard}>
            <EmptyState
              title={emptyText}
              icon="people-outline"
              compact
            />
          </View>
        </ScrollView>
      )}
    </View>
  )
}

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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
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
    width: CARD_WIDTH,
    height: 250,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    justifyContent: 'center',
    alignItems: 'center',
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
})

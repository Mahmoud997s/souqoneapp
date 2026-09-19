import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { PartCard } from './PartCard'
import { PartSkeletonCard } from './PartSkeletonCard'
import { HorizontalScrollCard } from '../ui/HorizontalScrollCard'
import { EmptyState } from '../ui/EmptyState'
import { CardSystem } from '../../constants/cardSystem'

const CARD_WIDTH = Dimensions.get('window').width * 0.6

export const PartHorizontalList = ({ 
  title, 
  subTitle, 
  data, 
  isLoading, 
  emptyText, 
  onSeeAll, 
  onPressItem 
}: { 
  title: string, 
  subTitle?: string, 
  data: any[], 
  isLoading: boolean, 
  emptyText: string, 
  onSeeAll: () => void, 
  onPressItem: (item: any) => void 
}) => {
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
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item) => String(item)}
            renderItem={() => (
              <PartSkeletonCard style={{ width: CARD_WIDTH, marginBottom: 0 }} />
            )}
          />
        </View>
      ) : data.length > 0 ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          <HorizontalScrollCard
            key="loaded-cards"
            data={data}
            cardWidth={CARD_WIDTH}
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item, idx) => item.id ?? String(idx)}
            onSeeAll={onSeeAll}
            seeAllTitle="عرض الكل"
            seeAllSubtitle={`تصفح جميع ${title}`}
            renderItem={({ item }) => (
              <PartCard 
                item={item} 
                onPress={() => onPressItem(item)} 
                disableImageSwipe={true}
              />
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
              icon="construct-outline"
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

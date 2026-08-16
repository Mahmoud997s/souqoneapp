import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Listing } from '../../types/listing.types'
import { SkeletonCard } from '../ui/SkeletonCard'
import { CarCard } from './CarCard'
import { EmptyState } from '../ui/EmptyState'
import { CardSystem } from '../../constants/cardSystem'

interface CarHorizontalListProps {
  title: string
  subTitle: string
  data: Listing[]
  isLoading: boolean
  emptyText: string
  onSeeAll: () => void
  onPressItem: (item: Listing) => void
}

export const CarHorizontalList = ({
  title,
  subTitle,
  data,
  isLoading,
  emptyText,
  onSeeAll,
  onPressItem,
}: CarHorizontalListProps) => {
  return (
    <View style={s.container}>
      <View style={s.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleHeader}>{title}</Text>
          <Text style={s.sectionSubHeader}>{subTitle}</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll} style={s.seeAllBtn}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -Spacing.space5 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.space5, gap: Spacing.space3, paddingVertical: 4, alignItems: 'flex-start' }}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} style={{ width: Dimensions.get('window').width * 0.6 }} />)
        ) : data.length > 0 ? (
          data.map(item => <CarCard key={item.id} item={item} onPress={() => onPressItem(item)} maxChips={3} />)
        ) : (
          <View style={s.emptyCard}>
            <EmptyState 
              title={emptyText} 
              icon="car-sport-outline"
              compact 
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
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
  emptyListTxt: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.space3, width: '100%'
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

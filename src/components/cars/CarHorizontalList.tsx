import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Listing } from '../../types/listing.types'
import { SkeletonCard } from '../ui/SkeletonCard'
import { CarCard } from './CarCard'

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
    <>
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
        contentContainerStyle={{ paddingHorizontal: Spacing.space5, gap: Spacing.space3, paddingBottom: Spacing.space6 }}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : data.length > 0 ? (
          data.map(item => <CarCard key={item.id} item={item} onPress={() => onPressItem(item)} />)
        ) : (
          <Text style={s.emptyListTxt}>{emptyText}</Text>
        )}
      </ScrollView>
    </>
  )
}

const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3, marginTop: Spacing.space2,
  },
  sectionTitleHeader: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, textAlign: 'left' },
  sectionSubHeader: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted, textAlign: 'left' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.primary },
  emptyListTxt: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.space3, width: '100%'
  },
})

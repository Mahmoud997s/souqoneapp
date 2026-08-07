import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { PartCard } from './PartCard'
import { PartSkeletonCard } from './PartSkeletonCard'

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
  if (!isLoading && data.length === 0) {
    return null;
  }

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

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <PartSkeletonCard key={i} />
          ))
        ) : (
          data.map((item, idx) => (
            <PartCard 
              key={item.id ?? idx} 
              item={item} 
              onPress={() => onPressItem(item)} 
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 18, 
    color: Colors.text, 
    textAlign: 'left',
    lineHeight: 26,
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
})

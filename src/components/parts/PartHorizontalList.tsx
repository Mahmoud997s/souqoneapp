import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { PartCard } from './PartCard'

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
    return null; // or optionally show the emptyState if desired
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          {subTitle && <Text style={s.subTitle}>{subTitle}</Text>}
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={s.scrollContent}
        >
          {data.map((item, idx) => (
            <PartCard 
              key={item.id ?? idx} 
              item={item} 
              onPress={() => onPressItem(item)} 
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    marginBottom: Spacing.space6,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 18, color: Colors.text, textAlign: 'left',
  },
  subTitle: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 12, color: Colors.textMuted, textAlign: 'left',
  },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  seeAllTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 12, color: Colors.primary,
  },
  loaderWrap: {
    height: 220, alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: {
    paddingRight: Spacing.space4, gap: Spacing.space3,
  },
})

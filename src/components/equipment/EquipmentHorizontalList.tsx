import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Colors } from '../../constants/colors'
import { UnifiedCardItem } from '../cards/UnifiedCard'
// We will import UnifiedCard later once we verify its props
// import { UnifiedCard } from '../cards/UnifiedCard'

interface Props {
  title: string
  items: UnifiedCardItem[]
  onPressItem: (item: UnifiedCardItem) => void
  onPressSeeAll?: () => void
}

export function EquipmentHorizontalList({ title, items, onPressItem, onPressSeeAll }: Props) {
  if (!items || items.length === 0) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onPressSeeAll && (
          <TouchableOpacity onPress={onPressSeeAll}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {/* Placeholder for now until we integrate UnifiedCard properly */}
        {items.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.cardPlaceholder}
            onPress={() => onPressItem(item)}
          >
            <Text style={styles.cardText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Tajawal-Bold',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Tajawal-Medium',
    color: Colors.equipmentPrimary,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  cardPlaceholder: {
    width: 160,
    height: 180,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardText: {
    fontFamily: 'Tajawal-Medium',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  }
})

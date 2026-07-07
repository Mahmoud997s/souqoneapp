import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { EquipmentCategoryIcon } from './EquipmentCategoryIcon'
import { EquipmentType } from '../../types/equipment.types'
import { EQUIPMENT_TYPES } from '../../utils/equipment-mappers'

interface Props {
  selectedCategory?: EquipmentType | null
  onSelectCategory?: (type: EquipmentType) => void
  horizontal?: boolean
}

export function EquipmentCategoriesGrid({ selectedCategory, onSelectCategory, horizontal = false }: Props) {
  const categories = Object.keys(EQUIPMENT_TYPES) as EquipmentType[]

  if (horizontal) {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalContainer}
      >
        {categories.map((type) => (
          <View key={type} style={styles.horizontalItem}>
            <EquipmentCategoryIcon
              type={type}
              selected={selectedCategory === type}
              onPress={onSelectCategory}
            />
          </View>
        ))}
      </ScrollView>
    )
  }

  return (
    <View style={styles.gridContainer}>
      {categories.map((type) => (
        <View key={type} style={styles.gridItem}>
          <EquipmentCategoryIcon
            type={type}
            selected={selectedCategory === type}
            onPress={onSelectCategory}
          />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  horizontalItem: {
    marginRight: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: '33.33%',
    padding: 8,
  },
})

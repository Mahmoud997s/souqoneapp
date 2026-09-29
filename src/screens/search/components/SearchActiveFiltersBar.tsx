import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'

interface SearchActiveFiltersBarProps {
  minPrice?: number
  maxPrice?: number
  condition?: string
  onRemoveFilter: (key: 'minPrice' | 'maxPrice' | 'condition') => void
  onClearAll: () => void
}

export const SearchActiveFiltersBar = React.memo(function SearchActiveFiltersBar({
  minPrice,
  maxPrice,
  condition,
  onRemoveFilter,
  onClearAll,
}: SearchActiveFiltersBarProps) {
  const hasFilters = Boolean(minPrice !== undefined || maxPrice !== undefined || (condition && condition !== 'ALL'))
  if (!hasFilters) return null

  const conditionLabels: Record<string, string> = {
    NEW: 'جديد',
    USED: 'مستعمل',
  }

  return (
    <View style={s.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.container}
      >
        {minPrice !== undefined && (
          <View style={s.pill}>
            <Text style={s.pillText}>من {minPrice} ر.ع</Text>
            <TouchableOpacity onPress={() => onRemoveFilter('minPrice')} hitSlop={8} style={s.removeBtn}>
              <Ionicons name="close" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {maxPrice !== undefined && (
          <View style={s.pill}>
            <Text style={s.pillText}>إلى {maxPrice} ر.ع</Text>
            <TouchableOpacity onPress={() => onRemoveFilter('maxPrice')} hitSlop={8} style={s.removeBtn}>
              <Ionicons name="close" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {condition && condition !== 'ALL' && (
          <View style={s.pill}>
            <Text style={s.pillText}>الحالة: {conditionLabels[condition] || condition}</Text>
            <TouchableOpacity onPress={() => onRemoveFilter('condition')} hitSlop={8} style={s.removeBtn}>
              <Ionicons name="close" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={onClearAll} style={s.clearAllBtn}>
          <Text style={s.clearAllText}>مسح الكل</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
})

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  container: {
    paddingHorizontal: Spacing.space4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 6,
  },
  pillText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
  },
  removeBtn: {
    padding: 2,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
  },
})

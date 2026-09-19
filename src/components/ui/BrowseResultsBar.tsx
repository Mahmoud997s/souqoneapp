import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

export interface BrowseResultsBarProps {
  resultsCount: number
  entityName: string
  iconName?: string
  activeFiltersCount: number
  onClearAll: () => void
  containerStyle?: ViewStyle
}

export function BrowseResultsBar({
  resultsCount,
  entityName,
  iconName = 'car-sport-outline',
  activeFiltersCount,
  onClearAll,
  containerStyle,
}: BrowseResultsBarProps) {
  return (
    <View style={[s.container, containerStyle]}>
      {activeFiltersCount > 0 ? (
        <TouchableOpacity
          style={s.clearBtn}
          onPress={onClearAll}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={12.5} color={Colors.error} />
          <Text style={s.clearTxt}>مسح الفلاتر</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}

      <View style={s.countBadge}>
        <Ionicons name={iconName as any} size={14} color="#64748b" />
        <Text style={s.countTxt}>
          {resultsCount} {entityName} متاحة
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.space4,
    marginTop: Spacing.space2,
    marginBottom: Spacing.space1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  clearTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  countBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  countTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#64748b',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})

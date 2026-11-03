import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { FilterGlassTokens } from '../../constants/filterGlassTokens'

export interface BrowseResultsBarProps {
  resultsCount: number
  entityName: string
  iconName?: keyof typeof Ionicons.glyphMap
  customIcon?: React.ReactNode
  activeFiltersCount: number
  onClearAll: () => void
  containerStyle?: ViewStyle
}

export function BrowseResultsBar({
  resultsCount,
  entityName,
  iconName = 'car-sport-outline',
  customIcon,
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
          accessibilityRole="button"
          accessibilityLabel="مسح الفلاتر"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="trash-outline"
            size={12.5}
            color={FilterGlassTokens.resultsBar.clearIconColor}
          />
          <Text style={s.clearTxt}>مسح الفلاتر</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}

      <View style={s.countBadge}>
        {customIcon ? (
          customIcon
        ) : (
          <Ionicons
            name={iconName}
            size={14}
            color={FilterGlassTokens.resultsBar.countIconColor}
          />
        )}
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
    paddingVertical: 4.5,
    paddingHorizontal: 9,
    minHeight: 28,
    borderRadius: FilterGlassTokens.resultsBar.clearRadius,
    backgroundColor: FilterGlassTokens.resultsBar.clearBg,
    borderWidth: FilterGlassTokens.resultsBar.clearBorderWidth,
    borderColor: FilterGlassTokens.resultsBar.clearBorderColor,
    ...FilterGlassTokens.resultsBar.clearShadow,
  },
  clearTxt: {
    fontFamily: FilterGlassTokens.resultsBar.fontFamily,
    fontSize: FilterGlassTokens.resultsBar.fontSize,
    lineHeight: FilterGlassTokens.resultsBar.lineHeight,
    color: FilterGlassTokens.resultsBar.clearTextColor,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    minHeight: 28,
    borderRadius: FilterGlassTokens.resultsBar.countRadius,
    backgroundColor: FilterGlassTokens.resultsBar.countBg,
    borderWidth: FilterGlassTokens.resultsBar.countBorderWidth,
    borderColor: FilterGlassTokens.resultsBar.countBorderColor,
    ...FilterGlassTokens.resultsBar.countShadow,
  },
  countTxt: {
    fontFamily: FilterGlassTokens.resultsBar.fontFamily,
    fontSize: FilterGlassTokens.resultsBar.fontSize,
    lineHeight: FilterGlassTokens.resultsBar.lineHeight,
    color: FilterGlassTokens.resultsBar.countTextColor,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})

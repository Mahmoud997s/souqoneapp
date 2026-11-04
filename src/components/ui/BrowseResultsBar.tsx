import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Spacing } from '../../constants/spacing'
import { FilterGlassTokens } from '../../constants/filterGlassTokens'
import { FilterGlassSurface } from './FilterGlassSurface'
import { ResetFilterButton } from './ResetFilterButton'
import { type GlassSupport } from '../navigation/glassSupport'

export interface BrowseResultsBarProps {
  resultsCount: number
  entityName: string
  iconName?: keyof typeof Ionicons.glyphMap
  customIcon?: React.ReactNode
  activeFiltersCount: number
  onClearAll: () => void
  containerStyle?: ViewStyle
  availabilitySuffix?: string
  glassSupport?: GlassSupport
}

export function BrowseResultsBar({
  resultsCount,
  entityName,
  iconName = 'car-sport-outline',
  customIcon,
  activeFiltersCount,
  onClearAll,
  containerStyle,
  availabilitySuffix = 'متاحة',
  glassSupport,
}: BrowseResultsBarProps) {
  return (
    <View style={[s.container, containerStyle]}>
      {activeFiltersCount > 0 ? (
        <ResetFilterButton
          onPress={onClearAll}
          testID="browse-results-clear"
          glassSupport={glassSupport}
        />
      ) : (
        <View />
      )}

      <View style={s.countBadge}>
        <FilterGlassSurface
          testID="browse-results-count-glass"
          borderRadius={FilterGlassTokens.resultsBar.countRadius}
          support={glassSupport}
        />
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
          {resultsCount} {entityName} {availabilitySuffix}
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

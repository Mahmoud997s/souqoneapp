import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterGlassTokens } from '../../constants/filterGlassTokens';
import { FilterGlassSurface } from './FilterGlassSurface';
import { type GlassSupport } from '../navigation/glassSupport';

export interface ResetFilterButtonProps {
  onPress: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  glassSupport?: GlassSupport;
}

export function ResetFilterButton({ 
  onPress, 
  label = 'مسح الفلاتر', 
  style, 
  textStyle,
  testID = 'reset-filter-button',
  glassSupport,
}: ResetFilterButtonProps) {
  return (
    <View style={style ? [s.btnContainer, style] : s.btnContainer} testID={testID}>
      <FilterGlassSurface
        testID={`${testID}-glass`}
        borderRadius={FilterGlassTokens.resultsBar.clearRadius}
        support={glassSupport}
      />
      <TouchableOpacity 
        style={s.btnInner}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="trash-outline"
          size={12.5}
          color={FilterGlassTokens.resultsBar.clearIconColor}
        />
        <Text style={textStyle ? [s.text, textStyle] : s.text}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  btnContainer: {
    minHeight: 28,
    borderRadius: FilterGlassTokens.resultsBar.clearRadius,
    backgroundColor: FilterGlassTokens.resultsBar.clearBg,
    borderWidth: FilterGlassTokens.resultsBar.clearBorderWidth,
    borderColor: FilterGlassTokens.resultsBar.clearBorderColor,
    ...FilterGlassTokens.resultsBar.clearShadow,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
  },
  text: {
    fontFamily: FilterGlassTokens.resultsBar.fontFamily, 
    fontSize: FilterGlassTokens.resultsBar.fontSize, 
    lineHeight: FilterGlassTokens.resultsBar.lineHeight, 
    color: FilterGlassTokens.resultsBar.clearTextColor, 
    textAlign: 'left', 
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});

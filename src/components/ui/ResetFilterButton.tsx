import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterGlassTokens } from '../../constants/filterGlassTokens';

interface ResetFilterButtonProps {
  onPress: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ResetFilterButton({ 
  onPress, 
  label = 'مسح الفلاتر', 
  style, 
  textStyle 
}: ResetFilterButtonProps) {
  return (
    <View style={[s.btnContainer, style]}>
      <TouchableOpacity 
        style={s.btnInner}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="trash-outline"
          size={12.5}
          color={FilterGlassTokens.resultsBar.clearIconColor}
        />
        <Text style={[s.text, textStyle]}>
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
    overflow: 'hidden',
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

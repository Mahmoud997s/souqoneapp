import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

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
    <TouchableOpacity 
      style={[s.btn, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="trash-outline" size={12.5} color={Colors.error} />
      <Text style={[s.text, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  text: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11, 
    lineHeight: 16, 
    color: Colors.error, 
    textAlign: 'left', 
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});

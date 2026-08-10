import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function FilterChip({ label, isActive, onPress, style, textStyle }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[s.chip, isActive && s.chipActive, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isActive && (
        <Ionicons name="checkmark" size={14} color={Colors.white} style={s.icon} />
      )}
      <Text style={[s.chipTxt, isActive && s.chipTxtActive, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#475569',
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  chipTxtActive: {
    color: Colors.white,
  },
  icon: {
    marginEnd: 4,
  },
});

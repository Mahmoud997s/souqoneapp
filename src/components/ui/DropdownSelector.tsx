import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface DropdownSelectorProps {
  value?: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}

export function DropdownSelector({ value, placeholder, onPress, disabled = false }: DropdownSelectorProps) {
  return (
    <TouchableOpacity
      style={[
        s.dropdownSelector,
        value && s.dropdownSelectorActive,
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[s.selectorText, !value && s.placeholderText]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-back-outline" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  dropdownSelectorActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  selectorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontFamily: 'Almarai_400Regular',
  },
});

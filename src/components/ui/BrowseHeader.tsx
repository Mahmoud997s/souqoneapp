import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from './AppHeader';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export interface BrowseHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  activeFiltersCount: number;
  onFilterPress: () => void;
  onSubmitSearch?: () => void;
}

export function BrowseHeader({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'ابحث...',
  activeFiltersCount,
  onFilterPress,
  onSubmitSearch
}: BrowseHeaderProps) {
  return (
    <AppHeader
      showBack
      centerSlot={
        <View style={s.compactSearch}>
          <Ionicons name="search" size={15} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.compactInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      }
      rightSlot={
        <TouchableOpacity style={s.iconBtn} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={18} color={Colors.white} />
          {activeFiltersCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      }
    />
  );
}

const s = StyleSheet.create({
  compactSearch: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    backgroundColor: 'rgba(255,255,255,0.15)', height: 36, borderRadius: 18,
    paddingHorizontal: Spacing.space3, marginHorizontal: Spacing.space2
  },
  compactInput: {
    flex: 1, 
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, 
    lineHeight: 16,
    color: Colors.white, 
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', 
    alignItems: 'center', justifyContent: 'center'
  },
  filterBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.accent || '#e67e22', 
    alignItems: 'center', justifyContent: 'center'
  },
  filterBadgeText: {
    fontFamily: 'Almarai_700Bold', fontSize: 9, lineHeight: 12, color: Colors.white, textAlign: 'center',
  }
});

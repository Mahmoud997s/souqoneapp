import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from './AppHeader';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

export interface BrowseHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  activeFiltersCount: number;
  onFilterPress: () => void;
  onSubmitSearch?: () => void;
  theme?: 'dark' | 'light';
}

export function BrowseHeader({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'ابحث...',
  activeFiltersCount,
  onFilterPress,
  onSubmitSearch,
  theme = 'light',
}: BrowseHeaderProps) {
  const isLight = theme === 'light';

  return (
    <AppHeader
      theme={theme}
      showBack
      centerSlot={
        <View style={[s.compactSearch, isLight && s.compactSearchLight]}>
          <Ionicons
            name="search"
            size={16}
            color={isLight ? Colors.placeholder : 'rgba(255,255,255,0.7)'}
          />
          <TextInput
            style={[s.compactInput, isLight && s.compactInputLight]}
            placeholder={searchPlaceholder}
            placeholderTextColor={isLight ? Colors.placeholder : 'rgba(255,255,255,0.7)'}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={isLight ? Colors.placeholder : 'rgba(255,255,255,0.7)'}
              />
            </TouchableOpacity>
          )}
        </View>
      }
      rightSlot={
        <TouchableOpacity
          style={[s.iconBtn, isLight && s.iconBtnLight]}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={isLight ? Colors.text : Colors.white}
          />
          {activeFiltersCount > 0 && (
            <View style={[s.filterBadge, isLight && s.filterBadgeLight]}>
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 36,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.space3,
    marginHorizontal: Spacing.space2,
  },
  compactSearchLight: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
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
  compactInputLight: {
    color: Colors.text,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnLight: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: Colors.accent || '#e67e22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeLight: {
    backgroundColor: Colors.primary,
  },
  filterBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9,
    lineHeight: 12,
    color: Colors.white,
    textAlign: 'center',
  },
});

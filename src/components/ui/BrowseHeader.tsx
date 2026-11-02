import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader } from './AppHeader';
import { TopBarTokens } from '../../constants/topBarTokens';
import { RTLTextInput } from '../../constants/rtl';
import { TopBarGlassSurface } from './TopBarGlassSurface';

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
  return (
    <AppHeader
      theme={theme}
      glassBackground
      leftSlot={
        <TouchableOpacity
          testID="browse-header-back"
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={s.iconBtn}
          onPress={() => router.back()}
          hitSlop={TopBarTokens.buttonHitSlop}
          activeOpacity={0.7}
        >
          <TopBarGlassSurface testID="browse-header-back" kind="ice-control" borderRadius={TopBarTokens.buttonRadius} />
          <Ionicons name="arrow-forward-outline" size={TopBarTokens.buttonIconSize} color={TopBarTokens.buttonIconColor} />
        </TouchableOpacity>
      }
      centerSlot={
        <View testID="browse-header-search" style={s.compactSearch}>
          <TopBarGlassSurface testID="browse-header-search" kind="ice-control" borderRadius={TopBarTokens.searchRadius} />
          <Ionicons
            name="search"
            size={TopBarTokens.searchIconSize}
            color={TopBarTokens.searchIconColor}
          />
          <TextInput
            testID="browse-header-search-input"
            accessibilityLabel={searchPlaceholder}
            style={[s.compactInput, RTLTextInput]}
            placeholder={searchPlaceholder}
            placeholderTextColor={TopBarTokens.searchPlaceholderColor}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            {...RTLTextInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              testID="browse-header-search-clear"
              accessibilityRole="button"
              accessibilityLabel="مسح البحث"
              onPress={() => onSearchChange('')}
              hitSlop={TopBarTokens.buttonHitSlop}
            >
              <Ionicons
                name="close-circle"
                size={TopBarTokens.clearIconSize}
                color={TopBarTokens.clearIconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      }
      rightSlot={
        <TouchableOpacity
          testID="browse-header-filter"
          accessibilityRole="button"
          accessibilityLabel="تصفية النتائج"
          style={s.iconBtn}
          onPress={onFilterPress}
          activeOpacity={0.7}
          hitSlop={TopBarTokens.buttonHitSlop}
        >
          <TopBarGlassSurface testID="browse-header-filter" kind="ice-control" borderRadius={TopBarTokens.buttonRadius} />
          <Ionicons
            name="options-outline"
            size={TopBarTokens.buttonIconSize}
            color={TopBarTokens.buttonIconColor}
          />
          {activeFiltersCount > 0 && (
            <View testID="browse-header-filter-badge" style={s.filterBadge}>
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
    position: 'relative',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: TopBarTokens.searchGap,
    height: TopBarTokens.searchHeight,
    borderRadius: TopBarTokens.searchRadius,
    paddingHorizontal: TopBarTokens.searchPaddingHorizontal,
    marginHorizontal: TopBarTokens.rowGap,
    overflow: 'hidden',
  },
  compactInput: {
    flex: 1,
    fontFamily: TopBarTokens.searchFontFamily,
    fontSize: TopBarTokens.searchFontSize,
    lineHeight: TopBarTokens.searchLineHeight,
    color: TopBarTokens.searchTextColor,
  },
  iconBtn: {
    position: 'relative',
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: TopBarTokens.buttonIconColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: TopBarTokens.titleFontFamily,
    fontSize: 9,
    lineHeight: 12,
    color: TopBarTokens.iceGlass,
    textAlign: 'center',
  },
});

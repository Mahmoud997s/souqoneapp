import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

export interface SelectOption {
  id: string;
  label: string;
  image?: any;
  [key: string]: any;
}

interface NestedSearchableListProps {
  data: SelectOption[];
  selectedValue?: string;
  onSelect: (option: SelectOption | null) => void;
  placeholder?: string;
  hideSearch?: boolean;
}

export function NestedSearchableList({
  data,
  selectedValue,
  onSelect,
  placeholder = 'ابحث هنا...',
  hideSearch = false,
}: NestedSearchableListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const renderItem = ({ item }: { item: SelectOption }) => {
    const isSelected = item.id === selectedValue;
    return (
      <TouchableOpacity
        style={[s.itemRow, isSelected && s.itemRowSelected]}
        onPress={() => {
          onSelect(item);
        }}
        activeOpacity={0.7}
      >
        {item.image && (
          <Image source={item.image} style={s.itemImage} resizeMode="contain" />
        )}
        <Text style={[s.itemText, isSelected && s.itemTextSelected, { flex: 1 }]}>
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Search Bar */}
      {!hideSearch && (
        <View style={s.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearSearchBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={Colors.border} />
            <Text style={s.emptyText}>لم يتم العثور على نتائج</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.space4,
    paddingHorizontal: Spacing.space3,
    height: 48,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  searchIcon: {
    marginRight: Spacing.space2,
    color: '#94A3B8',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    height: '100%',
    includeFontPadding: false,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  clearSearchBtn: {
    padding: Spacing.space1,
    marginLeft: Spacing.space2,
  },
  listContent: {
    paddingBottom: Spacing.space6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.space4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemRowSelected: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: -Spacing.space4,
    paddingHorizontal: Spacing.space4,
  },
  itemImage: {
    width: 32,
    height: 32,
    marginLeft: Spacing.space3,
  },
  itemText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  itemTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.space8,
    gap: Spacing.space3,
  },
  emptyText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
});

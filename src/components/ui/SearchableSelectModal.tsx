import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { ResetFilterButton } from './ResetFilterButton';
import { AppButton } from './AppButton';

export interface SelectOption {
  id: string;
  label: string;
  image?: any; // Image source
  [key: string]: any; // Allow extra payload
}

interface SearchableSelectModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: SelectOption[];
  selectedValue?: string;
  onSelect: (option: SelectOption | null) => void;
  placeholder?: string;
}

export function SearchableSelectModal({
  visible,
  onClose,
  title,
  data,
  selectedValue,
  onSelect,
  placeholder = 'ابحث هنا...',
}: SearchableSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedValue, setLocalSelectedValue] = useState<string | undefined>(selectedValue);

  useEffect(() => {
    if (visible) {
      setLocalSelectedValue(selectedValue);
      setSearchQuery('');
    }
  }, [visible, selectedValue]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleConfirm = () => {
    const selectedItem = data.find(i => i.id === localSelectedValue) || null;
    onSelect(selectedItem);
    handleClose();
  };

  const renderItem = ({ item }: { item: SelectOption }) => {
    const isSelected = item.id === localSelectedValue;
    return (
      <TouchableOpacity
        style={[s.itemRow, isSelected && s.itemRowSelected]}
        onPress={() => setLocalSelectedValue(item.id)}
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        
        <View style={s.sheet}>
          <View style={s.dragHandle} />

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={s.title}>{title}</Text>
            {localSelectedValue ? (
              <ResetFilterButton
                label="مسح"
                onPress={() => setLocalSelectedValue(undefined)}
              />
            ) : (
              <View style={{ width: 80 }} />
            )}
          </View>

          {/* Search Bar */}
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
              <TouchableOpacity onPress={() => setSearchQuery('')} style={s.clearSearchBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => item.id || String(index)}
            renderItem={renderItem}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={s.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={Colors.border} />
                <Text style={s.emptyText}>لم يتم العثور على نتائج</Text>
              </View>
            }
          />

          {/* Footer Action */}
          <View style={s.footer}>
            <AppButton
              title="تأكيد الاختيار"
              onPress={handleConfirm}
              disabled={!localSelectedValue && !selectedValue} // If nothing is selected, button disabled (unless it's just meant to clear)
              icon="checkmark-circle-outline"
              size="sm"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '67%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: Spacing.space2,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    marginBottom: Spacing.space2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    padding: Spacing.space2,
    marginLeft: -Spacing.space2,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    margin: Spacing.space4,
    paddingHorizontal: Spacing.space3,
    height: 50,
    borderRadius: Radius.lg,
  },
  searchIcon: {
    marginRight: Spacing.space2,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    height: '100%',
    includeFontPadding: false,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  clearSearchBtn: {
    padding: Spacing.space1,
  },
  listContent: {
    paddingHorizontal: Spacing.space4,
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
    backgroundColor: '#F0F9FF', // subtle primary tint
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
  footer: {
    paddingHorizontal: Spacing.space4,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    paddingBottom: Platform.OS === 'ios' ? 19 : 11,
  },
});

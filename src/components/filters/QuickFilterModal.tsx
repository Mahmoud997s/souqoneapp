import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { locationsApi } from '../../api/locations';
import { GovernorateRef } from '../../types/location.types';
import { PRICE_RANGES, SORT_OPTIONS, YEARS, CAR_TYPES } from '../../constants/browseFilters';

interface QuickFilterModalProps {
  visible: boolean;
  activeDropdown: 'make' | 'city' | 'year' | 'price' | 'type' | 'sort' | null;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  brands: any[];
}

export function QuickFilterModal({
  visible,
  activeDropdown,
  onClose,
  filters,
  setFilters,
  brands
}: QuickFilterModalProps) {
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);

  useEffect(() => {
    if (visible && activeDropdown === 'city') {
      locationsApi.getGovernorates().then(setGovernorates).catch(console.warn);
    }
  }, [visible, activeDropdown]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeDropdown === 'make' ? 'اختر الماركة' :
               activeDropdown === 'city' ? 'اختر المحافظة' :
               activeDropdown === 'year' ? 'سنة الصنع' : 
               activeDropdown === 'type' ? 'الهيكل' : 
               activeDropdown === 'sort' ? 'الترتيب' : 'نطاق السعر'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {activeDropdown === 'make' && (
            <FlatList
              data={brands || []}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setFilters({ ...filters, makeId: item.id, make: item.name });
                    onClose();
                  }}
                >
                  <Text style={[styles.modalOptionTxt, filters.makeId === item.id && styles.modalOptionTxtActive]}>
                    {item.nameAr || item.name}
                  </Text>
                  {filters.makeId === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'city' && (
            <FlatList
              data={governorates}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setFilters({
                      ...filters,
                      governorateId: item.id,
                      governorate: item.nameAr,
                      city: item.nameAr,
                      wilayaId: undefined,
                    });
                    onClose();
                  }}
                >
                  <Text style={[styles.modalOptionTxt, filters.governorateId === item.id && styles.modalOptionTxtActive]}>
                    {item.nameAr}
                  </Text>
                  {filters.governorateId === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'year' && (
            <FlatList
              data={YEARS}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setFilters({ ...filters, yearMin: item.toString(), yearMax: item.toString() });
                    onClose();
                  }}
                >
                  <Text style={[styles.modalOptionTxt, filters.yearMin === item.toString() && styles.modalOptionTxtActive]}>
                    {item}
                  </Text>
                  {filters.yearMin === item.toString() && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'price' && (
            <FlatList
              data={PRICE_RANGES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setFilters({ ...filters, priceMin: item.min.toString(), priceMax: item.max ? item.max.toString() : '9999999' });
                    onClose();
                  }}
                >
                  <Text style={[styles.modalOptionTxt, filters.priceMax === (item.max ? item.max.toString() : '9999999') && styles.modalOptionTxtActive]}>
                    {item.label}
                  </Text>
                  {filters.priceMax === (item.max ? item.max.toString() : '9999999') && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'type' && (
            <FlatList
              data={CAR_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    setFilters({ ...filters, bodyType: item.id });
                    onClose();
                  }}
                >
                  <Text style={[styles.modalOptionTxt, filters.bodyType === item.id && styles.modalOptionTxtActive]}>
                    {item.name}
                  </Text>
                  {filters.bodyType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'sort' && (
            <FlatList
              data={SORT_OPTIONS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = filters.sortBy === item.sortBy && filters.sortOrder === item.sortOrder;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, sortBy: item.sortBy, sortOrder: item.sortOrder });
                      onClose();
                    }}
                  >
                    <Text style={[styles.modalOptionTxt, isSelected && styles.modalOptionTxtActive]}>
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.space4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 16, color: Colors.text,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  modalOptionTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, color: Colors.text2,
    textAlign: 'left', writingDirection: 'rtl',
  },
  modalOptionTxtActive: {
    color: Colors.primary,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { locationsApi } from '../../api/locations';
import { GovernorateRef } from '../../types/location.types';
import { PRICE_RANGES, SORT_OPTIONS, YEARS, CAR_TYPES } from '../../constants/browseFilters';
import { BUS_TYPES } from '../../constants/buses';
import { SERVICE_TYPES, PROVIDER_TYPES, COMMON_SPECIALIZATIONS } from '../../constants/services';

const BUS_CAPACITIES = [
  { id: '10', value: 10, label: '+ 10 مقاعد' },
  { id: '15', value: 15, label: '+ 15 مقعد' },
  { id: '25', value: 25, label: '+ 25 مقعد' },
  { id: '30', value: 30, label: '+ 30 مقعد' },
  { id: '45', value: 45, label: '+ 45 مقعد' },
  { id: '50', value: 50, label: '+ 50 مقعد' },
];

const BUS_SORT_OPTIONS = [
  { id: 'newest', label: 'الأحدث أولاً' },
  { id: 'popular', label: 'الأكثر شيوعاً' },
  { id: 'price_asc', label: 'السعر: الأقل للأعلى' },
  { id: 'price_desc', label: 'السعر: الأعلى للأقل' },
];

const SERVICE_SORT_OPTIONS = [
  { id: 'newest', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'popular', label: 'الأكثر طلباً', sortBy: 'views', sortOrder: 'desc' },
  { id: 'rating', label: 'الأعلى تقييماً', sortBy: 'rating', sortOrder: 'desc' },
];

const SERVICE_SPECIALIZATIONS_LIST = Array.from(
  new Set(Object.values(COMMON_SPECIALIZATIONS).flat())
).map((spec) => ({ id: spec, label: spec }));

export interface QuickFilterModalProps {
  visible: boolean;
  activeDropdown:
    | 'make'
    | 'city'
    | 'governorate'
    | 'year'
    | 'price'
    | 'type'
    | 'busType'
    | 'capacity'
    | 'sort'
    | 'serviceType'
    | 'specialization'
    | 'providerType'
    | string
    | null;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  brands?: any[];
  isBus?: boolean;
  isService?: boolean;
}

export function QuickFilterModal({
  visible,
  activeDropdown,
  onClose,
  filters,
  setFilters,
  brands = [],
  isBus = false,
  isService = false,
}: QuickFilterModalProps) {
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);

  useEffect(() => {
    if (visible && (activeDropdown === 'city' || activeDropdown === 'governorate')) {
      locationsApi.getGovernorates().then(setGovernorates).catch(console.warn);
    }
  }, [visible, activeDropdown]);

  if (!visible) return null;

  const getTitle = () => {
    switch (activeDropdown) {
      case 'make':
        return 'اختر الماركة';
      case 'city':
      case 'governorate':
        return 'اختر المحافظة';
      case 'year':
        return 'سنة الصنع';
      case 'type':
        return 'الهيكل';
      case 'busType':
        return 'فئة الحافلة';
      case 'capacity':
        return 'سعة الحافلة';
      case 'serviceType':
        return 'نوع الخدمة';
      case 'specialization':
        return 'التخصص';
      case 'providerType':
        return 'نوع المزود';
      case 'sort':
        return 'الترتيب';
      case 'price':
        return 'نطاق السعر';
      default:
        return 'تصفية';
    }
  };

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
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {activeDropdown === 'make' && (
            <FlatList
              data={brands || []}
              keyExtractor={(item) => String(item.id || item.name)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  filters.makeId === item.id ||
                  filters.make === item.name ||
                  filters.make === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      setFilters({
                        ...filters,
                        makeId: item.id,
                        make: item.name || item.id,
                      });
                      onClose();
                    }}
                  >
                    <Text style={[styles.modalOptionTxt, isSelected && styles.modalOptionTxtActive]}>
                      {item.nameAr || item.label || item.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {(activeDropdown === 'city' || activeDropdown === 'governorate') && (
            <FlatList
              data={governorates}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  filters.governorateId === item.id || filters.city === item.nameAr;
                return (
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
                    <Text style={[styles.modalOptionTxt, isSelected && styles.modalOptionTxtActive]}>
                      {item.nameAr}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {activeDropdown === 'serviceType' && (
            <FlatList
              data={SERVICE_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = filters.serviceType === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, serviceType: item.id });
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

          {activeDropdown === 'specialization' && (
            <FlatList
              data={SERVICE_SPECIALIZATIONS_LIST}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = filters.specializations?.includes(item.id);
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      setFilters({
                        ...filters,
                        specializations: isSelected ? [] : [item.id],
                      });
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

          {activeDropdown === 'providerType' && (
            <FlatList
              data={PROVIDER_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = filters.providerType === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, providerType: item.id });
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

          {activeDropdown === 'busType' && (
            <FlatList
              data={BUS_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = filters.busType === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, busType: item.id });
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

          {activeDropdown === 'capacity' && (
            <FlatList
              data={BUS_CAPACITIES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = filters.capacityMin === item.value;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      setFilters({ ...filters, capacityMin: item.value });
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
              data={isBus ? BUS_SORT_OPTIONS : isService ? SERVICE_SORT_OPTIONS : SORT_OPTIONS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = isBus
                  ? filters.sort === item.id || (!filters.sort && item.id === 'newest')
                  : filters.sortBy === (item as any).sortBy && filters.sortOrder === (item as any).sortOrder;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (isBus) {
                        setFilters({ ...filters, sort: item.id });
                      } else {
                        setFilters({ ...filters, sortBy: (item as any).sortBy, sortOrder: (item as any).sortOrder });
                      }
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

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
import { applyCarsQuickFilter, CarsFilterState } from '../../utils/browse-filters/carsBrowseFilters';

const BUS_CAPACITIES = [
  { id: '10', value: 10, label: '+ 10 مقاعد' },
  { id: '15', value: 15, label: '+ 15 مقعد' },
  { id: '25', value: 25, label: '+ 25 مقعد' },
  { id: '30', value: 30, label: '+ 30 مقعد' },
  { id: '45', value: 45, label: '+ 45 مقعد' },
  { id: '50', value: 50, label: '+ 50 مقعد' },
];

const BUS_SORT_OPTIONS: SortOptionItem[] = [
  { id: 'newest', label: 'الأحدث أولاً' },
  { id: 'popular', label: 'الأكثر شيوعاً' },
  { id: 'price_asc', label: 'السعر: الأقل للأعلى' },
  { id: 'price_desc', label: 'السعر: الأعلى للأقل' },
];

interface SortOptionItem {
  id: string;
  label: string;
  sortBy?: string;
  sortOrder?: string;
}

const SERVICE_SORT_OPTIONS: SortOptionItem[] = [
  { id: 'newest', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'popular', label: 'الأكثر طلباً', sortBy: 'views', sortOrder: 'desc' },
  { id: 'rating', label: 'الأعلى تقييماً', sortBy: 'rating', sortOrder: 'desc' },
];

const SERVICE_SPECIALIZATIONS_LIST = Array.from(
  new Set(Object.values(COMMON_SPECIALIZATIONS).flat())
).map((spec) => ({ id: spec, label: spec }));

export interface LegacyFilterBrandItem {
  id?: string | number;
  name?: string;
  nameAr?: string | null;
  label?: string;
}

export type LegacyFilterValue = string | number | boolean | undefined | null | string[];

export interface LegacyFiltersRecord extends CarsFilterState {
  specializations?: string[];
  [key: string]: LegacyFilterValue;
}

export interface LegacyQuickFilterModalProps<TFilters extends object = { [key: string]: LegacyFilterValue }> {
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
  filters: TFilters;
  setFilters: React.Dispatch<React.SetStateAction<TFilters>> | ((filters: TFilters) => void);
  brands?: LegacyFilterBrandItem[];
  isBus?: boolean;
  isService?: boolean;
}

export function LegacyQuickFilterModal<TFilters extends object = { [key: string]: LegacyFilterValue }>({
  visible,
  activeDropdown,
  onClose,
  filters,
  setFilters,
  brands = [],
  isBus = false,
  isService = false,
}: LegacyQuickFilterModalProps<TFilters>) {
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);

  useEffect(() => {
    if (visible && (activeDropdown === 'city' || activeDropdown === 'governorate')) {
      locationsApi.getGovernorates().then(setGovernorates).catch(() => {});
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

  const currentFilters = (filters || {}) as TFilters & LegacyFiltersRecord;

  const applyFilters = (next: TFilters | CarsFilterState) => {
    if (typeof setFilters === 'function') {
      setFilters(next as TFilters);
    }
    onClose();
  };

  const applyUpdate = (patch: Partial<CarsFilterState> | Partial<LegacyFiltersRecord>) => {
    const next: TFilters = Object.assign({}, currentFilters, patch);
    applyFilters(next);
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
              keyExtractor={(item) => String(item.id || item.name || item.label)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  (currentFilters.makeId != null && item.id != null && String(currentFilters.makeId) === String(item.id)) ||
                  currentFilters.make === item.name ||
                  (item.id != null && currentFilters.make === String(item.id));
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (!isBus && !isService) {
                        const isSameMake = String(item.id) === String(currentFilters.makeId);
                        if (isSameMake) {
                          applyUpdate({
                            makeId: item.id ? String(item.id) : undefined,
                            make: item.name || (item.id ? String(item.id) : undefined),
                          });
                        } else {
                          const brandName = item.name || (item.id ? String(item.id) : undefined);
                          const updated = applyCarsQuickFilter(
                            currentFilters,
                            'make',
                            String(item.id),
                            brandName
                          );
                          applyFilters(updated);
                        }
                      } else {
                        applyUpdate({
                          makeId: item.id ? String(item.id) : undefined,
                          make: item.name || (item.id ? String(item.id) : undefined),
                        });
                      }
                    }}
                  >
                    <Text style={[styles.modalOptionTxt, isSelected && styles.modalOptionTxtActive]}>
                      {item.nameAr || item.name || item.label || String(item.id)}
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
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = currentFilters.governorateId === item.id || currentFilters.city === item.nameAr;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applyUpdate({
                        governorateId: item.id,
                        governorate: item.nameAr,
                        city: item.nameAr,
                        wilayaId: undefined,
                      });
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

          {activeDropdown === 'year' && (
            <FlatList
              data={YEARS}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    applyUpdate({ yearMin: item.toString(), yearMax: item.toString() });
                  }}
                >
                  <Text style={[styles.modalOptionTxt, currentFilters.yearMin === item.toString() && styles.modalOptionTxtActive]}>
                    {item}
                  </Text>
                  {currentFilters.yearMin === item.toString() && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
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
                    applyUpdate({ priceMin: item.min.toString(), priceMax: item.max ? item.max.toString() : '9999999' });
                  }}
                >
                  <Text style={[styles.modalOptionTxt, currentFilters.priceMax === (item.max ? item.max.toString() : '9999999') && styles.modalOptionTxtActive]}>
                    {item.label}
                  </Text>
                  {currentFilters.priceMax === (item.max ? item.max.toString() : '9999999') && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'type' && (
            <FlatList
              data={CAR_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const upperId = item.id.toUpperCase();
                const currentUpper = typeof currentFilters.bodyType === 'string' ? currentFilters.bodyType.toUpperCase() : undefined;
                const isSelected = currentUpper === upperId;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applyUpdate({ bodyType: upperId });
                    }}
                  >
                    <Text style={[styles.modalOptionTxt, isSelected && styles.modalOptionTxtActive]}>
                      {item.name}
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    applyUpdate({ busType: item.id });
                  }}
                >
                  <Text style={[styles.modalOptionTxt, currentFilters.busType === item.id && styles.modalOptionTxtActive]}>
                    {item.label}
                  </Text>
                  {currentFilters.busType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'capacity' && (
            <FlatList
              data={BUS_CAPACITIES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  currentFilters.capacity === item.value ||
                  currentFilters.minCapacity === item.value ||
                  currentFilters.capacityMin === item.value;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applyUpdate({
                        capacity: item.value,
                        minCapacity: item.value,
                        capacityMin: item.value,
                      });
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

          {activeDropdown === 'serviceType' && (
            <FlatList
              data={SERVICE_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    applyUpdate({ serviceType: item.id });
                  }}
                >
                  <Text style={[styles.modalOptionTxt, currentFilters.serviceType === item.id && styles.modalOptionTxtActive]}>
                    {item.label}
                  </Text>
                  {currentFilters.serviceType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'specialization' && (
            <FlatList
              data={SERVICE_SPECIALIZATIONS_LIST}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const currentSpecs = Array.isArray(currentFilters.specializations)
                  ? currentFilters.specializations
                  : [];
                const isSelected =
                  currentFilters.specialization === item.id ||
                  currentSpecs.includes(item.id);
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applyUpdate({
                        specialization: item.id,
                        specializations: [item.id],
                      });
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  onPress={() => {
                    applyUpdate({ providerType: item.id });
                  }}
                >
                  <Text style={[styles.modalOptionTxt, currentFilters.providerType === item.id && styles.modalOptionTxtActive]}>
                    {item.label}
                  </Text>
                  {currentFilters.providerType === item.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          )}

          {activeDropdown === 'sort' && (
            <FlatList<SortOptionItem>
              data={isBus ? BUS_SORT_OPTIONS : isService ? SERVICE_SORT_OPTIONS : SORT_OPTIONS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = isBus
                  ? currentFilters.sort === item.id || (!currentFilters.sort && item.id === 'newest')
                  : currentFilters.sortBy === item.sortBy && currentFilters.sortOrder === item.sortOrder;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (isBus) {
                        applyUpdate({ sort: item.id });
                      } else {
                        applyUpdate({ sortBy: item.sortBy, sortOrder: item.sortOrder });
                      }
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

export const QuickFilterModal = LegacyQuickFilterModal;

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
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
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
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  modalOptionTxtActive: {
    color: Colors.primary,
  },
});

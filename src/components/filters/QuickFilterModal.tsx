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
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  POPULAR_PART_MAKES,
  PARTS_PRICE_RANGES,
  PARTS_SORT_OPTIONS,
} from '../../constants/parts';
import { EQUIPMENT_TYPES } from '../../utils/equipment-mappers';
import { EQUIPMENT_CONDITIONS } from '../../constants/equipment';

export interface QuickFilterOptionItem {
  id: string | number;
  label?: string | null;
  labelAr?: string | null;
  name?: string | null;
  nameAr?: string | null;
  key?: string | null;
  value?: unknown;
  min?: number | string | null;
  max?: number | string | null;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | string | null;
  icon?: string | null;
}

const BUS_CAPACITIES: QuickFilterOptionItem[] = [
  { id: '10', value: 10, label: '+ 10 مقاعد' },
  { id: '15', value: 15, label: '+ 15 مقعد' },
  { id: '25', value: 25, label: '+ 25 مقعد' },
  { id: '30', value: 30, label: '+ 30 مقعد' },
  { id: '45', value: 45, label: '+ 45 مقعد' },
  { id: '50', value: 50, label: '+ 50 مقعد' },
];

const BUS_SORT_OPTIONS: QuickFilterOptionItem[] = [
  { id: 'newest', label: 'الأحدث أولاً' },
  { id: 'popular', label: 'الأكثر شيوعاً' },
  { id: 'price_asc', label: 'السعر: الأقل للأعلى' },
  { id: 'price_desc', label: 'السعر: الأعلى للأقل' },
];

const SERVICE_SORT_OPTIONS: QuickFilterOptionItem[] = [
  { id: 'newest', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'popular', label: 'الأكثر طلباً', sortBy: 'views', sortOrder: 'desc' },
  { id: 'rating', label: 'الأعلى تقييماً', sortBy: 'rating', sortOrder: 'desc' },
];

const SERVICE_SPECIALIZATIONS_LIST: QuickFilterOptionItem[] = Array.from(
  new Set(Object.values(COMMON_SPECIALIZATIONS).flat())
).map((spec) => ({ id: spec, label: spec }));

const EQUIPMENT_CATEGORIES_ARRAY: QuickFilterOptionItem[] = Object.entries(EQUIPMENT_TYPES).map(
  ([key, value]) => ({
    id: key,
    name: value.label,
    label: value.label,
  })
);

const EQUIPMENT_CONDITIONS_ARRAY: QuickFilterOptionItem[] = EQUIPMENT_CONDITIONS.map((c) => ({
  id: c.id,
  name: c.label,
  label: c.label,
}));

const EQUIPMENT_PRICE_RANGES: QuickFilterOptionItem[] = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'p1', label: 'أقل من 50 ر.ع', min: '0', max: '50' },
  { id: 'p2', label: '50 - 100 ر.ع', min: '50', max: '100' },
  { id: 'p3', label: '100 - 500 ر.ع', min: '100', max: '500' },
  { id: 'p4', label: '500 - 1,000 ر.ع', min: '500', max: '1000' },
  { id: 'p5', label: '1,000 - 5,000 ر.ع', min: '1000', max: '5000' },
  { id: 'p6', label: '5,000 - 10,000 ر.ع', min: '5000', max: '10000' },
  { id: 'p7', label: 'أكثر من 10,000 ر.ع', min: '10000', max: '9999999' },
];

const EQUIPMENT_YEAR_RANGES: QuickFilterOptionItem[] = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'y1', label: '2022 - 2024', min: '2022', max: '2024' },
  { id: 'y2', label: '2019 - 2021', min: '2019', max: '2021' },
  { id: 'y3', label: '2015 - 2018', min: '2015', max: '2018' },
  { id: 'y4', label: 'أقدم من 2015', min: '1900', max: '2014' },
];

const EQUIPMENT_HOURS_RANGES: QuickFilterOptionItem[] = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'h1', label: 'أقل من 1,000 ساعة', min: '0', max: '1000' },
  { id: 'h2', label: '1,000 - 3,000 ساعة', min: '1000', max: '3000' },
  { id: 'h3', label: '3,000 - 5,000 ساعة', min: '3000', max: '5000' },
  { id: 'h4', label: 'أكثر من 5,000 ساعة', min: '5000', max: '999999' },
];

export type QuickFilterDropdownKind =
  | 'make'
  | 'city'
  | 'governorate'
  | 'year'
  | 'price'
  | 'hours'
  | 'type'
  | 'category'
  | 'condition'
  | 'busType'
  | 'capacity'
  | 'sort'
  | 'serviceType'
  | 'specialization'
  | 'providerType'
  | (string & {});

export type YearOptionItem = QuickFilterOptionItem | number;

export interface QuickFilterModalProps<TFilters = unknown> {
  visible: boolean;
  activeDropdown: QuickFilterDropdownKind | null;
  onClose: () => void;
  filters: TFilters;
  setFilters?:
    | React.Dispatch<React.SetStateAction<TFilters>>
    | ((filters: TFilters | ((prev: TFilters) => TFilters)) => void)
    | ((filters: unknown) => void);
  onSelect?: (selection: Partial<TFilters>) => void;
  title?: string;
  options?: QuickFilterOptionItem[];
  categories?: QuickFilterOptionItem[];
  conditions?: QuickFilterOptionItem[];
  priceRanges?: QuickFilterOptionItem[];
  yearRanges?: QuickFilterOptionItem[];
  hoursRanges?: QuickFilterOptionItem[];
  sortOptions?: QuickFilterOptionItem[];
  brands?: QuickFilterOptionItem[];
  governorates?: GovernorateRef[];
  isBus?: boolean;
  isService?: boolean;
  isEquipment?: boolean;
  isPart?: boolean;
  accentColor?: string;
}

export function QuickFilterModal<TFilters = unknown>({
  visible,
  activeDropdown,
  onClose,
  filters,
  setFilters,
  onSelect,
  title,
  options,
  categories,
  conditions,
  priceRanges,
  yearRanges,
  hoursRanges,
  sortOptions,
  brands = [],
  governorates: externalGovernorates,
  isBus = false,
  isService = false,
  isEquipment = false,
  isPart = false,
  accentColor,
}: QuickFilterModalProps<TFilters>) {
  const [internalGovernorates, setInternalGovernorates] = useState<GovernorateRef[]>([]);
  const [, setLocationsError] = useState<boolean>(false);
  const governorates =
    externalGovernorates && externalGovernorates.length > 0
      ? externalGovernorates
      : internalGovernorates;

  useEffect(() => {
    if (
      visible &&
      (!externalGovernorates || externalGovernorates.length === 0) &&
      (activeDropdown === 'city' || activeDropdown === 'governorate')
    ) {
      locationsApi
        .getGovernorates()
        .then((data) => {
          setInternalGovernorates(Array.isArray(data) ? data : []);
          setLocationsError(false);
        })
        .catch(() => {
          setInternalGovernorates([]);
          setLocationsError(true);
        });
    }
  }, [visible, activeDropdown, externalGovernorates]);

  if (!visible) return null;

  const activeColor = accentColor || (isEquipment ? Colors.equipmentPrimary : Colors.primary);
  const currentFilters = (filters || {}) as Record<string, unknown>;

  const applySelection = (selection: Record<string, unknown>, deletes?: string[]) => {
    if (onSelect) {
      onSelect(selection as unknown as Partial<TFilters>);
    } else if (setFilters) {
      const next = { ...currentFilters, ...selection };
      if (deletes) {
        for (const k of deletes) {
          delete next[k];
        }
      }
      (setFilters as (f: unknown) => void)(next);
    }
    onClose();
  };

  const getTitle = (): string => {
    if (title) return title;
    switch (activeDropdown) {
      case 'make':
        return isPart ? 'اختر الماركة المتوافقة' : 'اختر الماركة';
      case 'city':
      case 'governorate':
        return isEquipment ? 'المدينة' : isPart ? 'اختر المدينة' : 'اختر المحافظة';
      case 'category':
        return isEquipment ? 'نوع المعدة' : isPart ? 'اختر القسم' : 'القسم';
      case 'condition':
        return isEquipment ? 'حالة المعدة' : isPart ? 'حالة القطعة' : 'الحالة';
      case 'year':
        return 'سنة الصنع';
      case 'hours':
        return 'ساعات العمل';
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
        return isPart ? 'ترتيب النتائج' : 'الترتيب';
      case 'price':
        return isEquipment ? 'السعر' : 'نطاق السعر';
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

          {/* Generic options override */}
          {options && options.length > 0 && (
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  activeDropdown &&
                  (currentFilters[activeDropdown] === item.id ||
                    currentFilters[activeDropdown] === item.value ||
                    currentFilters[activeDropdown] === item.name);
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      const fieldKey = item.key || activeDropdown;
                      if (fieldKey) {
                        applySelection({
                          [fieldKey]: item.value !== undefined ? item.value : item.id,
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.nameAr || item.label || item.name || String(item.id)}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Make Dropdown */}
          {!options && activeDropdown === 'make' && (
            <FlatList<QuickFilterOptionItem>
              data={
                (brands.length > 0
                  ? brands
                  : isPart
                  ? POPULAR_PART_MAKES
                  : []) as unknown as QuickFilterOptionItem[]
              }
              keyExtractor={(item) => String(item.id || item.name)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const name = item.nameAr || item.name || item.label || String(item.id);
                const isSelected =
                  currentFilters.makeId === item.id ||
                  currentFilters.make === item.name ||
                  currentFilters.make === name ||
                  currentFilters.make === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({
                        makeId: item.id,
                        make: isPart ? name : item.name || item.id,
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* City / Governorate Dropdown */}
          {!options && (activeDropdown === 'city' || activeDropdown === 'governorate') && (
            <FlatList
              data={governorates}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  currentFilters.governorateId === item.id ||
                  currentFilters.governorate === item.nameAr ||
                  currentFilters.city === item.nameAr;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (isEquipment) {
                        applySelection({
                          governorateId: item.id,
                          wilayaId: undefined,
                          city: undefined,
                        });
                      } else {
                        applySelection({
                          governorateId: item.id,
                          governorate: item.nameAr,
                          city: item.nameAr,
                          wilayaId: undefined,
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.nameAr}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Category Dropdown (Equipment / Parts / Generic) */}
          {!options && activeDropdown === 'category' && (
            <FlatList<QuickFilterOptionItem>
              data={
                (categories ||
                  (isPart
                    ? PART_CATEGORIES
                    : isEquipment
                    ? EQUIPMENT_CATEGORIES_ARRAY
                    : [])) as unknown as QuickFilterOptionItem[]
              }
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  currentFilters.category === item.id ||
                  currentFilters.equipmentType === item.id ||
                  currentFilters.categoryId === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (isEquipment) {
                        applySelection({
                          equipmentType: item.id,
                          categoryId: item.id,
                        });
                      } else {
                        applySelection({
                          category: item.id,
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.nameAr || item.label || item.name || String(item.id)}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Condition Dropdown (Equipment / Parts / Generic) */}
          {!options && activeDropdown === 'condition' && (
            <FlatList<QuickFilterOptionItem>
              data={
                (conditions ||
                  (isPart
                    ? PART_CONDITIONS
                    : isEquipment
                    ? EQUIPMENT_CONDITIONS_ARRAY
                    : [])) as unknown as QuickFilterOptionItem[]
              }
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  currentFilters.condition === item.id || currentFilters.conditionId === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (isEquipment) {
                        applySelection({
                          condition: item.id,
                          conditionId: item.id,
                        });
                      } else {
                        applySelection({
                          condition: item.id,
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.nameAr || item.label || item.name || String(item.id)}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Price Dropdown */}
          {!options && activeDropdown === 'price' && (
            <FlatList<QuickFilterOptionItem>
              data={
                (priceRanges ||
                  (isEquipment
                    ? EQUIPMENT_PRICE_RANGES
                    : isPart
                    ? PARTS_PRICE_RANGES
                    : PRICE_RANGES)) as unknown as QuickFilterOptionItem[]
              }
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = isEquipment
                  ? currentFilters.priceMax === item.max || (!currentFilters.priceMax && item.id === 'all')
                  : isPart
                  ? currentFilters.priceId === item.id || currentFilters.priceMax === (item.max ? String(item.max) : '999999')
                  : currentFilters.priceMax === (item.max ? String(item.max) : '9999999');
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (isEquipment) {
                        if (item.id === 'all') {
                          applySelection({}, ['priceMin', 'priceMax', 'priceId']);
                        } else {
                          applySelection({
                            priceMin: item.min,
                            priceMax: item.max,
                            priceId: item.id,
                          });
                        }
                      } else if (isPart) {
                        applySelection({
                          priceMin: item.min !== undefined ? String(item.min) : undefined,
                          priceMax: item.max ? String(item.max) : '999999',
                          priceId: item.id,
                        });
                      } else {
                        applySelection({
                          priceMin: item.min !== undefined ? String(item.min) : undefined,
                          priceMax: item.max ? String(item.max) : '9999999',
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Year Dropdown */}
          {!options && activeDropdown === 'year' && (
            <FlatList<YearOptionItem>
              data={
                (yearRanges ||
                  (isEquipment
                    ? EQUIPMENT_YEAR_RANGES
                    : YEARS)) as unknown as YearOptionItem[]
              }
              keyExtractor={(item: YearOptionItem) =>
                typeof item === 'object' && item !== null ? String(item.id) : String(item)
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: YearOptionItem }) => {
                if (typeof item === 'object' && item !== null) {
                  const rangeItem = item;
                  const isSelected =
                    currentFilters.yearMax === rangeItem.max ||
                    (!currentFilters.yearMax && rangeItem.id === 'all');
                  return (
                    <TouchableOpacity
                      style={styles.modalOptionRow}
                      onPress={() => {
                        if (rangeItem.id === 'all') {
                          applySelection({}, ['yearMin', 'yearMax', 'yearId']);
                        } else {
                          applySelection({
                            yearMin: rangeItem.min,
                            yearMax: rangeItem.max,
                            yearId: rangeItem.id,
                          });
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionTxt,
                          isSelected ? { color: activeColor } : null,
                        ]}
                      >
                        {rangeItem.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                    </TouchableOpacity>
                  );
                }

                const yrStr = String(item);
                const isSelected = currentFilters.yearMin === yrStr;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({
                        yearMin: yrStr,
                        yearMax: yrStr,
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {yrStr}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Hours Dropdown (Equipment) */}
          {!options && activeDropdown === 'hours' && (
            <FlatList<QuickFilterOptionItem>
              data={
                (hoursRanges || EQUIPMENT_HOURS_RANGES) as unknown as QuickFilterOptionItem[]
              }
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected =
                  currentFilters.hoursMax === item.max || (!currentFilters.hoursMax && item.id === 'all');
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      if (item.id === 'all') {
                        applySelection({}, ['hoursMin', 'hoursMax', 'hoursId']);
                      } else {
                        applySelection({
                          hoursMin: item.min,
                          hoursMax: item.max,
                          hoursId: item.id,
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Car Body Type Dropdown */}
          {!options && activeDropdown === 'type' && (
            <FlatList
              data={CAR_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = currentFilters.bodyType === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({ bodyType: item.id });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Bus Type Dropdown */}
          {!options && activeDropdown === 'busType' && (
            <FlatList
              data={BUS_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = currentFilters.busType === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({ busType: item.id });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Bus Capacity Dropdown */}
          {!options && activeDropdown === 'capacity' && (
            <FlatList
              data={BUS_CAPACITIES}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = currentFilters.capacityMin === item.value;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({ capacityMin: item.value });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Service Type Dropdown */}
          {!options && activeDropdown === 'serviceType' && (
            <FlatList
              data={SERVICE_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = currentFilters.serviceType === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({ serviceType: item.id });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Service Specialization Dropdown */}
          {!options && activeDropdown === 'specialization' && (
            <FlatList
              data={SERVICE_SPECIALIZATIONS_LIST}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const specs = Array.isArray(currentFilters.specializations)
                  ? (currentFilters.specializations as string[])
                  : [];
                const isSelected = specs.includes(String(item.id));
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({
                        specializations: isSelected
                          ? specs.filter((s) => s !== item.id)
                          : [...specs, String(item.id)],
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Service Provider Type Dropdown */}
          {!options && activeDropdown === 'providerType' && (
            <FlatList
              data={PROVIDER_TYPES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = currentFilters.providerType === item.id;
                return (
                  <TouchableOpacity
                    style={styles.modalOptionRow}
                    onPress={() => {
                      applySelection({ providerType: item.id });
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Sort Dropdown */}
          {!options && activeDropdown === 'sort' && (
            <FlatList<QuickFilterOptionItem>
              data={
                (sortOptions ||
                  (isBus
                    ? BUS_SORT_OPTIONS
                    : isService
                    ? SERVICE_SORT_OPTIONS
                    : isPart
                    ? PARTS_SORT_OPTIONS
                    : SORT_OPTIONS)) as unknown as QuickFilterOptionItem[]
              }
              keyExtractor={(item) => String(item.id)}
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
                        applySelection({ sort: item.id });
                      } else if (item.sortBy !== undefined || item.sortOrder !== undefined) {
                        applySelection({
                          sortBy: item.sortBy,
                          sortOrder: item.sortOrder,
                        });
                      } else {
                        applySelection({ sort: item.id });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionTxt,
                        isSelected ? { color: activeColor } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={activeColor} />}
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
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
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
    textAlign: 'left',
    writingDirection: 'rtl',
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
});

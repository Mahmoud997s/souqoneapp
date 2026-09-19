import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getBrandLogo } from '../../constants/brandLogos';
import {
  VisualFiltersBase,
  VisualFilterTab,
  visualFiltersStyles,
} from '../ui/VisualFiltersBase';

// ─── 1. EQUIPMENT CATEGORIES DATA ───
export const EQUIPMENT_CATEGORIES_DATA = [
  { id: 'EXCAVATOR', label: 'حفار', icon: 'excavator' },
  { id: 'LOADER', label: 'شيول / لودر', icon: 'tractor' },
  { id: 'BULLDOZER', label: 'بلدوزر / جرافة', icon: 'bulldozer' },
  { id: 'CRANE', label: 'رافعة / كرين', icon: 'crane' },
  { id: 'FORKLIFT', label: 'رافعة شوكية', icon: 'forklift' },
  { id: 'CONCRETE_MIXER', label: 'خلاطة خرسانة', icon: 'truck-delivery' },
  { id: 'GENERATOR', label: 'مولد كهرباء', icon: 'lightning-bolt' },
  { id: 'COMPRESSOR', label: 'كمبروسر / ضاغط', icon: 'gauge' },
  { id: 'SCAFFOLDING', label: 'سقالات وموقع', icon: 'ladder' },
  { id: 'WELDING_MACHINE', label: 'ماكينة لحام', icon: 'flash' },
  { id: 'TRUCK', label: 'شاحنة نقل', icon: 'truck' },
  { id: 'DUMP_TRUCK', label: 'شاحنة تفريغ (قلاب)', icon: 'dump-truck' },
  { id: 'WATER_TANKER', label: 'صهريج مياه', icon: 'water-pump' },
  { id: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة', icon: 'tools' },
  { id: 'OTHER_EQUIPMENT', label: 'معدات أخرى', icon: 'cog' },
];

// ─── 2. POPULAR EQUIPMENT BRANDS IN OMAN & GCC ───
export const EQUIPMENT_POPULAR_MAKES = [
  { id: 'cat', name: 'كاتربيلر', en: 'CAT', logo: null, icon: 'excavator' },
  { id: 'komatsu', name: 'كوماتسو', en: 'Komatsu', logo: null, icon: 'bulldozer' },
  { id: 'jcb', name: 'جي سي بي', en: 'JCB', logo: null, icon: 'tractor' },
  { id: 'bobcat', name: 'بوبكات', en: 'Bobcat', logo: null, icon: 'forklift' },
  { id: 'volvo', name: 'فولفو', en: 'Volvo', logo: getBrandLogo('volvo'), icon: 'truck' },
  { id: 'hitachi', name: 'هيتاشي', en: 'Hitachi', logo: null, icon: 'crane' },
  { id: 'doosan', name: 'دوسان', en: 'Doosan', logo: null, icon: 'dump-truck' },
  { id: 'sany', name: 'ساني', en: 'SANY', logo: null, icon: 'crane' },
];

// ─── 3. TOP CITIES (8 items -> 1 row) ───
const TOP_CITIES = [
  { id: '1', extraId: 1, name: 'مسقط' },
  { id: '33', extraId: 6, name: 'صحار' },
  { id: '45', extraId: 8, name: 'صور' },
  { id: '24', extraId: 5, name: 'نزوى' },
  { id: '7', extraId: 2, name: 'صلالة' },
  { id: '57', extraId: 10, name: 'عبري' },
  { id: '21', extraId: 4, name: 'البريمي' },
  { id: '39', extraId: 7, name: 'الرستاق' },
];

// ─── 4. PRICE RANGES (7 items -> 1 row) ───
const PRICE_RANGES = [
  { id: 'p1', label: 'أقل من 50 ر.ع', min: 0, max: 50 },
  { id: 'p2', label: '50 - 100 ر.ع', min: 50, max: 100 },
  { id: 'p3', label: '100 - 500 ر.ع', min: 100, max: 500 },
  { id: 'p4', label: '500 - 1,000 ر.ع', min: 500, max: 1000 },
  { id: 'p5', label: '1,000 - 5,000 ر.ع', min: 1000, max: 5000 },
  { id: 'p6', label: '5,000 - 10,000 ر.ع', min: 5000, max: 10000 },
  { id: 'p7', label: 'أكثر من 10,000 ر.ع', min: 10000, max: undefined },
];

// ─── 5. CONDITIONS (4 items -> 1 row) ───
const CONDITIONS = [
  { id: 'NEW', name: 'جديدة (أصفار)', icon: 'sparkles-outline' },
  { id: 'LIKE_NEW', name: 'شبه جديدة', icon: 'ribbon-outline' },
  { id: 'USED', name: 'مستعملة بحالة جيدة', icon: 'construct-outline' },
  { id: 'GOOD', name: 'تحتاج صيانة بسيطة', icon: 'build-outline' },
];

export interface EquipmentVisualFiltersProps {
  onSelectFilter: (
    type: 'category' | 'make' | 'city' | 'price' | 'condition',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number,
    extraId?: number
  ) => void;
  onViewAll?: (tabId: string) => void;
  selectedCategoryId?: string;
  selectedMake?: string;
  selectedCity?: string;
  selectedPriceId?: string;
  selectedConditionId?: string;
}

export function EquipmentVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedCategoryId,
  selectedMake,
  selectedCity,
  selectedPriceId,
  selectedConditionId,
}: EquipmentVisualFiltersProps) {
  const tabs: VisualFilterTab<'categories' | 'makes' | 'cities' | 'prices' | 'conditions'>[] = useMemo(
    () => [
      {
        id: 'categories',
        label: 'أقسام المعدات',
        icon: 'construct-outline',
        items: EQUIPMENT_CATEGORIES_DATA,
        rows: 2, // 15 items >= 10 -> 2 rows
        getItemProps: (item) => {
          const isSelected = selectedCategoryId?.toUpperCase() === item.id.toUpperCase();
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View
                style={[
                  visualFiltersStyles.iconBox,
                  { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('category', '', undefined);
              } else {
                onSelectFilter('category', item.id, item.label);
              }
            },
          };
        },
      },
      {
        id: 'makes',
        label: 'أشهر الماركات',
        icon: 'ribbon-outline',
        items: EQUIPMENT_POPULAR_MAKES,
        rows: 1, // 8 items < 10 -> 1 row
        getItemProps: (item) => {
          const isSelected =
            selectedMake?.toLowerCase() === item.name.toLowerCase() ||
            selectedMake?.toLowerCase() === item.id.toLowerCase() ||
            selectedMake?.toLowerCase() === item.en.toLowerCase();
          const logoSource = item.logo;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={visualFiltersStyles.logoBox}>
                {logoSource ? (
                  <Image source={logoSource} style={visualFiltersStyles.brandLogo} resizeMode="contain" />
                ) : (
                  <View
                    style={[
                      visualFiltersStyles.iconBox,
                      { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: 'Almarai_800ExtraBold',
                        fontSize: 9.5,
                        color: isSelected ? Colors.white : Colors.primary,
                        textAlign: 'center',
                      }}
                      numberOfLines={1}
                    >
                      {item.en}
                    </Text>
                  </View>
                )}
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('make', '', undefined);
              } else {
                onSelectFilter('make', item.id, item.name);
              }
            },
          };
        },
      },
      {
        id: 'cities',
        label: 'أهم المدن',
        icon: 'location-outline',
        items: TOP_CITIES,
        rows: 1, // 8 items < 10 -> 1 row
        getItemProps: (item) => {
          const isSelected = selectedCity === item.name || selectedCity === item.id;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View
                style={[
                  visualFiltersStyles.iconBox,
                  { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' },
                ]}
              >
                <Ionicons
                  name={isSelected ? 'location' : 'location-outline'}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('city', '', undefined);
              } else {
                onSelectFilter('city', item.id, item.name, undefined, undefined, item.extraId);
              }
            },
          };
        },
      },
      {
        id: 'prices',
        label: 'الأسعار',
        icon: 'wallet-outline',
        items: PRICE_RANGES,
        rows: 1, // 7 items < 10 -> 1 row
        getItemProps: (item) => {
          const isSelected = selectedPriceId === item.id;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View
                style={[
                  visualFiltersStyles.iconBox,
                  { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' },
                ]}
              >
                <Ionicons
                  name="wallet-outline"
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('price', '', undefined);
              } else {
                onSelectFilter('price', item.id, item.label, item.min, item.max);
              }
            },
          };
        },
      },
      {
        id: 'conditions',
        label: 'الحالة',
        icon: 'shield-checkmark-outline',
        items: CONDITIONS,
        rows: 1, // 4 items < 10 -> 1 row
        getItemProps: (item) => {
          const isSelected = selectedConditionId === item.id;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View
                style={[
                  visualFiltersStyles.iconBox,
                  { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('condition', '', undefined);
              } else {
                onSelectFilter('condition', item.id, item.name);
              }
            },
          };
        },
      },
    ],
    [selectedCategoryId, selectedMake, selectedCity, selectedPriceId, selectedConditionId, onSelectFilter]
  );

  return (
    <VisualFiltersBase
      tabs={tabs}
      defaultTab="categories"
      onViewAll={onViewAll}
    />
  );
}

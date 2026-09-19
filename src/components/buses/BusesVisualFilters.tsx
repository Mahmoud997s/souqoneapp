import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBusManufacturers } from '../../hooks/useBuses';
import { getBrandLogo } from '../../constants/brandLogos';
import { Colors } from '../../constants/colors';
import { BUS_TYPES } from '../../constants/buses';
import {
  VisualFiltersBase,
  VisualFilterTab,
  visualFiltersStyles,
} from '../ui/VisualFiltersBase';

// ─── STATIC DATA ───
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

const CAPACITIES = [
  { id: '10', value: 10, label: '+ 10 مقاعد' },
  { id: '15', value: 15, label: '+ 15 مقعد' },
  { id: '25', value: 25, label: '+ 25 مقعد' },
  { id: '30', value: 30, label: '+ 30 مقعد' },
  { id: '45', value: 45, label: '+ 45 مقعد' },
  { id: '50', value: 50, label: '+ 50 مقعد' },
];

const PRICE_RANGES = [
  { id: 'p1', label: 'أقل من 3,000 ر.ع', min: 0, max: 3000 },
  { id: 'p2', label: '3,000 - 6,000 ر.ع', min: 3000, max: 6000 },
  { id: 'p3', label: '6,000 - 10,000 ر.ع', min: 6000, max: 10000 },
  { id: 'p4', label: '10,000 - 15,000 ر.ع', min: 10000, max: 15000 },
  { id: 'p5', label: '15,000 - 25,000 ر.ع', min: 15000, max: 25000 },
  { id: 'p6', label: 'أكثر من 25,000 ر.ع', min: 25000, max: null },
];

export interface BusesVisualFiltersProps {
  onSelectFilter: (
    type: 'make' | 'busType' | 'capacity' | 'city' | 'price',
    valueId: string,
    valueName?: string,
    min?: number,
    max?: number,
    extraId?: number
  ) => void;
  onViewAll: (tabId: string) => void;
  selectedBrandId?: string;
  selectedCity?: string;
  selectedTypeId?: string;
  selectedCapacity?: number;
  selectedPriceId?: string;
}

export function BusesVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedBrandId,
  selectedCity,
  selectedTypeId,
  selectedCapacity,
  selectedPriceId,
}: BusesVisualFiltersProps) {
  const { data: manufacturers, isLoading: loadingManufacturers } = useBusManufacturers();

  const tabs: VisualFilterTab<'brands' | 'types' | 'capacities' | 'cities' | 'prices'>[] = useMemo(
    () => [
      {
        id: 'brands',
        label: 'أفضل الماركات',
        icon: 'ribbon-outline',
        items: manufacturers || [],
        isLoading: loadingManufacturers,
        getItemProps: (item) => {
          const isSelected = selectedBrandId === item.name || selectedBrandId === item.id;
          const logo = getBrandLogo(item.name?.toLowerCase());
          return {
            id: item.id || item.name,
            label: item.nameAr || item.name,
            isSelected,
            icon: (
              <View style={visualFiltersStyles.logoBox}>
                {logo ? (
                  <Image source={logo} style={visualFiltersStyles.brandLogo} resizeMode="contain" />
                ) : (
                  <Ionicons name="bus-outline" size={16} color={Colors.primary} />
                )}
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('make', '', undefined);
              } else {
                onSelectFilter('make', item.name, item.nameAr || item.name);
              }
            },
          };
        },
      },
      {
        id: 'types',
        label: 'فئة الحافلة',
        icon: 'bus-outline',
        items: BUS_TYPES,
        getItemProps: (item) => {
          const isSelected = selectedTypeId?.toUpperCase() === item.id?.toUpperCase();
          return {
            id: item.id,
            label: item.label || item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name="bus-outline" size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('busType', '', undefined);
              } else {
                onSelectFilter('busType', item.id, item.label);
              }
            },
          };
        },
      },
      {
        id: 'capacities',
        label: 'سعة الركاب',
        icon: 'people-outline',
        items: CAPACITIES,
        getItemProps: (item) => {
          const isSelected = selectedCapacity === item.value;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name="people-outline" size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('capacity', '', undefined);
              } else {
                onSelectFilter('capacity', String(item.value), item.label, item.value);
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
        getItemProps: (item) => {
          const isSelected = selectedCity === item.name;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={isSelected ? 'location' : 'location-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
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
        label: 'نطاقات الأسعار',
        icon: 'wallet-outline',
        items: PRICE_RANGES,
        getItemProps: (item) => {
          const isSelected = selectedPriceId === item.id;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={isSelected ? 'wallet' : 'wallet-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('price', '', undefined);
              } else {
                onSelectFilter('price', item.id, item.label, item.min, item.max || undefined);
              }
            },
          };
        },
      },
    ],
    [
      manufacturers,
      loadingManufacturers,
      selectedBrandId,
      selectedTypeId,
      selectedCapacity,
      selectedCity,
      selectedPriceId,
      onSelectFilter,
    ]
  );

  return (
    <VisualFiltersBase
      tabs={tabs}
      defaultTab="brands"
      onViewAll={onViewAll}
    />
  );
}

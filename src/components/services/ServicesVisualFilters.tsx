import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../constants/services';
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

const FEATURED_SPECIALIZATIONS = [
  { id: 'تغيير زيت وفلاتر', name: 'تغيير زيت وفلاتر', icon: 'color-fill-outline' },
  { id: 'إصلاح تكييف', name: 'إصلاح تكييف', icon: 'snow-outline' },
  { id: 'كهرباء سيارات', name: 'كهرباء سيارات', icon: 'flash-outline' },
  { id: 'ميكانيكا عامة', name: 'ميكانيكا عامة', icon: 'build-outline' },
  { id: 'فحص كمبيوتر شامل', name: 'فحص كمبيوتر شامل', icon: 'scan-outline' },
  { id: 'نانو سيراميك', name: 'نانو سيراميك', icon: 'sparkles-outline' },
  { id: 'تظليل وعازل حراري', name: 'تظليل وعازل حراري', icon: 'shield-outline' },
  { id: 'سمكرة وتعديل صدمات', name: 'سمكرة وتعديل صدمات', icon: 'hammer-outline' },
  { id: 'رش فرن ودهان وكالة', name: 'رش فرن ودهان', icon: 'color-palette-outline' },
  { id: 'برمجة وتيربو', name: 'برمجة وتيربو', icon: 'speedometer-outline' },
  { id: 'شاشات أندرويد وCarPlay', name: 'شاشات وكاميرات', icon: 'hardware-chip-outline' },
  { id: 'سطحة هيدروليك', name: 'سطحة هيدروليك', icon: 'car-sport-outline' },
  { id: 'برمجة مفاتيح ذكية', name: 'برمجة مفاتيح', icon: 'key-outline' },
  { id: 'حماية PPF', name: 'حماية PPF', icon: 'shield-checkmark-outline' },
];

const ENHANCED_PROVIDER_TYPES = PROVIDER_TYPES.map((p) => {
  let icon = 'business-outline';
  if (p.id === 'INDIVIDUAL') icon = 'person-outline';
  if (p.id === 'MOBILE') icon = 'car-outline';
  if (p.id === 'COMPANY') icon = 'ribbon-outline';
  return { ...p, icon, name: p.label };
});

export interface ServicesVisualFiltersProps {
  onSelectFilter: (
    type: 'serviceType' | 'specialization' | 'city' | 'providerType',
    valueId: string,
    valueName?: string,
    extraId?: number
  ) => void;
  onViewAll?: (tabId: string) => void;
  selectedServiceType?: string;
  selectedSpecialization?: string;
  selectedCity?: string;
  selectedProviderType?: string;
}

export function ServicesVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedServiceType,
  selectedSpecialization,
  selectedCity,
  selectedProviderType,
}: ServicesVisualFiltersProps) {
  const tabs: VisualFilterTab<'types' | 'specializations' | 'cities' | 'providers'>[] = useMemo(
    () => [
      {
        id: 'types',
        label: 'أنواع الخدمات',
        icon: 'construct-outline',
        items: SERVICE_TYPES,
        getItemProps: (item) => {
          const isSelected = selectedServiceType === item.id;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={item.icon || 'build-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('serviceType', '', undefined);
              } else {
                onSelectFilter('serviceType', item.id, item.label);
              }
            },
          };
        },
      },
      {
        id: 'specializations',
        label: 'أشهر التخصصات',
        icon: 'sparkles-outline',
        items: FEATURED_SPECIALIZATIONS,
        getItemProps: (item) => {
          const isSelected = selectedSpecialization === item.id || selectedSpecialization === item.name;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={item.icon || 'sparkles-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('specialization', '', undefined);
              } else {
                onSelectFilter('specialization', item.id, item.name);
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
                onSelectFilter('city', item.id, item.name, item.extraId);
              }
            },
          };
        },
      },
      {
        id: 'providers',
        label: 'نوع المزود',
        icon: 'business-outline',
        items: ENHANCED_PROVIDER_TYPES,
        getItemProps: (item) => {
          const isSelected = selectedProviderType === item.id;
          return {
            id: item.id,
            label: item.name || item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : '#F0F5FF' }]}>
                <Ionicons name={item.icon || 'business-outline'} size={14} color={isSelected ? Colors.white : Colors.primary} />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('providerType', '', undefined);
              } else {
                onSelectFilter('providerType', item.id, item.label);
              }
            },
          };
        },
      },
    ],
    [selectedServiceType, selectedSpecialization, selectedCity, selectedProviderType, onSelectFilter]
  );

  return (
    <VisualFiltersBase
      tabs={tabs}
      defaultTab="types"
      onViewAll={onViewAll}
    />
  );
}

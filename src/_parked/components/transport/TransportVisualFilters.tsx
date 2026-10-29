import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  VisualFiltersBase,
  VisualFilterTab,
  visualFiltersStyles,
} from '../ui/VisualFiltersBase';

// ─── STATIC DATA ───
const SERVICE_TYPES_DATA = [
  { id: 'GOODS', label: 'بضائع عامة', icon: 'cube-send' },
  { id: 'FURNITURE', label: 'عفش وأثاث', icon: 'truck-cargo-container' },
  { id: 'VEHICLES', label: 'سيارات ومركبات', icon: 'car-multiple' },
  { id: 'HEAVY', label: 'معدات وثقيل', icon: 'excavator' },
  { id: 'CONSTRUCTION', label: 'مواد بناء', icon: 'hammer-wrench' },
  { id: 'FOOD_COLD', label: 'شحن مبرد', icon: 'snowflake' },
  { id: 'LIVESTOCK', label: 'مواشي وحيوانات', icon: 'cow' },
  { id: 'EXPRESS', label: 'شحن مستعجل', icon: 'flash' },
  { id: 'BACKLOAD', label: 'نقل راجع', icon: 'swap-horizontal' },
];

const GOVERNORATES_DATA = [
  { id: 'مسقط', name: 'مسقط' },
  { id: 'ظفار', name: 'ظفار' },
  { id: 'شمال الباطنة', name: 'شمال الباطنة' },
  { id: 'جنوب الباطنة', name: 'جنوب الباطنة' },
  { id: 'الداخلية', name: 'الداخلية' },
  { id: 'شمال الشرقية', name: 'شمال الشرقية' },
  { id: 'جنوب الشرقية', name: 'جنوب الشرقية' },
  { id: 'البريمي', name: 'البريمي' },
  { id: 'الظاهرة', name: 'الظاهرة' },
  { id: 'مسندم', name: 'مسندم' },
  { id: 'الوسطى', name: 'الوسطى' },
];

const TIMING_DATA = [
  { id: 'asap', label: 'فوري (أسرع وقت)', icon: 'timer-sand-full' },
  { id: 'scheduled', label: 'مجدول بموعد', icon: 'calendar-clock' },
  { id: 'flexible', label: 'مرن في التوقيت', icon: 'check-decagram-outline' },
];

const BUDGET_DATA = [
  { id: 'b1', label: 'أقل من 50 ر.ع', min: 0, max: 50 },
  { id: 'b2', label: '50 - 100 ر.ع', min: 50, max: 100 },
  { id: 'b3', label: '100 - 300 ر.ع', min: 100, max: 300 },
  { id: 'b4', label: '300 - 500 ر.ع', min: 300, max: 500 },
  { id: 'b5', label: 'أكثر من 500 ر.ع', min: 500, max: null },
];

const HELPER_DATA = [
  { id: 'helper_yes', label: 'يحتاج عمال تحميل', value: true, icon: 'account-multiple-plus' },
  { id: 'helper_no', label: 'بدون عمال تحميل', value: false, icon: 'account-off-outline' },
];

export interface TransportVisualFiltersProps {
  onSelectFilter: (
    type: 'serviceType' | 'governorate' | 'timingType' | 'budget' | 'requiresHelper',
    valueId: any,
    valueName?: string,
    min?: number,
    max?: number
  ) => void;
  onViewAll: (tabId: string) => void;
  selectedServiceType?: string;
  selectedGovernorate?: string;
  selectedTimingType?: string;
  selectedBudgetMin?: string | number;
  selectedBudgetMax?: string | number;
  selectedRequiresHelper?: boolean | null;
}

export function TransportVisualFilters({
  onSelectFilter,
  onViewAll,
  selectedServiceType,
  selectedGovernorate,
  selectedTimingType,
  selectedBudgetMin,
  selectedBudgetMax,
  selectedRequiresHelper,
}: TransportVisualFiltersProps) {
  const tabs: VisualFilterTab<'services' | 'governorates' | 'timing' | 'budget' | 'helper'>[] = useMemo(
    () => [
      {
        id: 'services',
        label: 'نوع الشحن',
        icon: 'cube-outline',
        items: SERVICE_TYPES_DATA,
        rows: 2,
        getItemProps: (item) => {
          const isSelected = selectedServiceType?.toUpperCase() === item.id.toUpperCase();
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : Colors.inputBg }]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
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
        id: 'governorates',
        label: 'أهم المحافظات',
        icon: 'location-outline',
        items: GOVERNORATES_DATA,
        rows: 2,
        getItemProps: (item) => {
          const isSelected = selectedGovernorate === item.name || selectedGovernorate === item.id;
          return {
            id: item.id,
            label: item.name,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : Colors.inputBg }]}>
                <Ionicons
                  name={isSelected ? 'location' : 'location-outline'}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('governorate', '', undefined);
              } else {
                onSelectFilter('governorate', item.name, item.name);
              }
            },
          };
        },
      },
      {
        id: 'timing',
        label: 'الموعد والتوقيت',
        icon: 'calendar-outline',
        items: TIMING_DATA,
        rows: 1,
        getItemProps: (item) => {
          const isSelected = selectedTimingType === item.id;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : Colors.inputBg }]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('timingType', '', undefined);
              } else {
                onSelectFilter('timingType', item.id, item.label);
              }
            },
          };
        },
      },
      {
        id: 'budget',
        label: 'نطاقات الميزانية',
        icon: 'wallet-outline',
        items: BUDGET_DATA,
        rows: 2,
        getItemProps: (item) => {
          const isSelected =
            Number(selectedBudgetMin) === item.min &&
            (item.max === null ? !selectedBudgetMax : Number(selectedBudgetMax) === item.max);
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : Colors.inputBg }]}>
                <Ionicons
                  name={isSelected ? 'wallet' : 'wallet-outline'}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('budget', '', undefined);
              } else {
                onSelectFilter('budget', item.id, item.label, item.min, item.max);
              }
            },
          };
        },
      },
      {
        id: 'helper',
        label: 'عمال التحميل',
        icon: 'people-outline',
        items: HELPER_DATA,
        rows: 1,
        getItemProps: (item) => {
          const isSelected = selectedRequiresHelper === item.value;
          return {
            id: item.id,
            label: item.label,
            isSelected,
            icon: (
              <View style={[visualFiltersStyles.iconBox, { backgroundColor: isSelected ? Colors.primary : Colors.inputBg }]}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? Colors.white : Colors.primary}
                />
              </View>
            ),
            onPress: () => {
              if (isSelected) {
                onSelectFilter('requiresHelper', null, undefined);
              } else {
                onSelectFilter('requiresHelper', item.value, item.label);
              }
            },
          };
        },
      },
    ],
    [
      selectedServiceType,
      selectedGovernorate,
      selectedTimingType,
      selectedBudgetMin,
      selectedBudgetMax,
      selectedRequiresHelper,
      onSelectFilter,
    ]
  );

  return (
    <VisualFiltersBase
      tabs={tabs}
      defaultTab="services"
      onViewAll={onViewAll}
    />
  );
}

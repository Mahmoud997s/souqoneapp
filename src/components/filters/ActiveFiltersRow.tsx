import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterState } from '../../types/filters.types';
import { useBrands, useCarModels, useCarTrims } from '../../hooks/useCars';
import { Colors } from '../../constants/colors';
import {
  GOVERNORATE_OPTIONS,
  WILAYAT_BY_GOVERNORATE,
  BODY_TYPES,
  TRANSMISSION_TYPES,
  CONDITIONS,
  FUEL_TYPES,
  LISTING_TYPES,
} from '../../constants/filters';

interface ActiveFiltersRowProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
}

export function ActiveFiltersRow({ filters, onRemoveFilter, onClearAll }: ActiveFiltersRowProps) {
  const { data: brands } = useBrands();
  const { data: models } = useCarModels(filters.makeId || '');
  const { data: trims } = useCarTrims(filters.modelId || '');

  const activeChips: { key: keyof FilterState; label: string }[] = [];

  // Helper to find label
  const getLabel = (value: any, options: { value: string; labelAr: string }[]) => {
    return options.find(o => o.value === value)?.labelAr || value;
  };

  if (filters.make) {
    const b = brands?.find(br => br.id === filters.makeId);
    activeChips.push({ key: 'make', label: b?.nameAr || b?.name || filters.make });
  }
  if (filters.model) {
    const m = models?.find(md => md.id === filters.modelId);
    activeChips.push({ key: 'model', label: m?.nameAr || m?.name || filters.model });
  }
  if (filters.trim) {
    const t = trims?.find(tr => tr.name === filters.trim);
    activeChips.push({ key: 'trim', label: t?.nameAr || t?.name || filters.trim });
  }
  
  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin || '0';
    const max = filters.priceMax || '30000+';
    activeChips.push({ key: 'priceMin', label: `السعر: ${min} - ${max} ر.ع` });
  }

  if (filters.yearMin || filters.yearMax) {
    const min = filters.yearMin || '1990';
    const max = filters.yearMax || new Date().getFullYear().toString();
    activeChips.push({ key: 'yearMin', label: `سنة: ${min} - ${max}` });
  }

  if (filters.governorate) activeChips.push({ key: 'governorate', label: getLabel(filters.governorate, GOVERNORATE_OPTIONS) });
  if (filters.city && filters.governorate) {
    const cities = WILAYAT_BY_GOVERNORATE[filters.governorate] || [];
    activeChips.push({ key: 'city', label: getLabel(filters.city, cities) });
  }

  if (filters.listingType) activeChips.push({ key: 'listingType', label: getLabel(filters.listingType, LISTING_TYPES) });
  if (filters.condition) activeChips.push({ key: 'condition', label: getLabel(filters.condition, CONDITIONS) });
  if (filters.bodyType) activeChips.push({ key: 'bodyType', label: getLabel(filters.bodyType, BODY_TYPES) });
  if (filters.transmission) activeChips.push({ key: 'transmission', label: getLabel(filters.transmission, TRANSMISSION_TYPES) });
  if (filters.fuelType) activeChips.push({ key: 'fuelType', label: getLabel(filters.fuelType, FUEL_TYPES) });

  if (activeChips.length === 0) return null;

  return (
    <View style={s.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={s.clearBtn} onPress={onClearAll} activeOpacity={0.7}>
          <Text style={s.clearTxt}>مسح الكل</Text>
        </TouchableOpacity>

        {activeChips.map((chip, index) => (
          <View key={`${chip.key}-${index}`} style={s.chip}>
            <Text style={s.chipTxt}>{chip.label}</Text>
            <TouchableOpacity 
              style={s.removeBtn} 
              onPress={() => {
                if (chip.key === 'priceMin') {
                  onRemoveFilter('priceMin');
                  onRemoveFilter('priceMax');
                } else if (chip.key === 'yearMin') {
                  onRemoveFilter('yearMin');
                  onRemoveFilter('yearMax');
                } else if (chip.key === 'make') {
                  onRemoveFilter('make');
                  onRemoveFilter('makeId');
                } else if (chip.key === 'model') {
                  onRemoveFilter('model');
                  onRemoveFilter('modelId');
                } else {
                  onRemoveFilter(chip.key);
                }
              }}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row-reverse', // RTL alignment for horizontal scroll
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  chipTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.white,
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  removeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  clearTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#64748B',
    includeFontPadding: false,
  }
});

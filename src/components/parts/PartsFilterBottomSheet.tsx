import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  GOVERNORATE_OPTIONS,
  WILAYAT_BY_GOVERNORATE,
} from '../../constants/filters';
import { 
  POPULAR_PART_MAKES, 
  PART_CONDITIONS, 
  PART_CATEGORIES,
  PART_ORIGINALITY_OPTIONS,
  PARTS_SORT_OPTIONS 
} from '../../constants/parts';
import { useBrands } from '../../hooks/useCars';
import { FilterChip } from '../ui/FilterChip';
import { FilterSection } from '../ui/FilterSection';
import { DropdownSelector } from '../ui/DropdownSelector';
import { RangeSlider } from '../ui/RangeSlider';
import { SearchableSelectModal } from '../ui/SearchableSelectModal';
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout';
import { getBrandLogo } from '../../constants/brandLogos';
import { PartsFilterState } from '../../types/filters.types';

interface PartsFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: PartsFilterState;
  onApplyFilters: (filters: PartsFilterState) => void;
}

export function PartsFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
}: PartsFilterBottomSheetProps) {
  const [filters, setFilters] = useState<PartsFilterState>({ ...initialFilters });
  const [activeSelector, setActiveSelector] = useState<'make' | 'gov' | 'city' | null>(null);

  const { data: brands } = useBrands();
  const hasActiveFilters = Object.keys(filters).length > 0;

  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters });
    }
  }, [visible, initialFilters]);

  const updateFilter = (key: keyof PartsFilterState, value: any) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'governorate') next.city = undefined;
      return next;
    });
  };
  
  const updateFilters = (updates: Partial<PartsFilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      if ('governorate' in updates) next.city = undefined;
      return next;
    });
  };

  const onClearFilters = () => {
    const cleared: PartsFilterState = {};
    setFilters(cleared);
    onApplyFilters(cleared);
    onClose();
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const selectedGov = GOVERNORATE_OPTIONS.find((g) => g.value === filters.governorate);
  const availableCities = filters.governorate 
    ? WILAYAT_BY_GOVERNORATE[filters.governorate] || [] 
    : Object.values(WILAYAT_BY_GOVERNORATE).flat();

  const makeData = (brands && brands.length > 0 ? brands : POPULAR_PART_MAKES).map((b: any) => ({
    id: b.id,
    label: b.nameAr || b.name || b.label,
    image: getBrandLogo(b.slug || b.id), // Handle both brands (has slug) and POPULAR_PART_MAKES (id is slug)
  }));
  const govData = GOVERNORATE_OPTIONS.map(g => ({ id: g.value, label: g.labelAr }));
  const cityData = availableCities.map(c => ({ id: c.value || c.labelAr, label: c.labelAr }));

  return (
    <>
      <FilterBottomSheetLayout
        visible={visible}
        onClose={onClose}
        title="تصفية القطع"
        hasActiveFilters={hasActiveFilters}
        onClear={onClearFilters}
        onApply={handleApply}
      >
        <FilterSection title="قسم القطعة">
          <View style={s.wrapRow}>
            {PART_CATEGORIES.map((cat) => {
              const isSelected = filters.category === cat.id;
              return (
                <FilterChip
                  key={cat.id}
                  label={cat.label}
                  isActive={isSelected}
                  onPress={() => updateFilter('category', isSelected ? undefined : cat.id)}
                />
              );
            })}
          </View>
        </FilterSection>

        <FilterSection title="الأصالة والنوع">
          <View style={s.wrapRow}>
            {PART_ORIGINALITY_OPTIONS.map((orig) => (
              <FilterChip
                key={String(orig.value)}
                label={orig.label}
                isActive={filters.isOriginal === orig.value}
                onPress={() => updateFilter('isOriginal', orig.value)}
              />
            ))}
          </View>
        </FilterSection>

        <FilterSection title="حالة القطعة">
          <View style={s.wrapRow}>
            {PART_CONDITIONS.map((cond) => {
              const isSelected = filters.condition === cond.id;
              return (
                <FilterChip
                  key={cond.id}
                  label={cond.label}
                  isActive={isSelected}
                  onPress={() => updateFilter('condition', isSelected ? undefined : cond.id)}
                />
              );
            })}
          </View>
        </FilterSection>
        
        <FilterSection title="ترتيب النتائج">
          <View style={s.wrapRow}>
            {PARTS_SORT_OPTIONS.map((sort) => {
              const isActive = filters.sortBy === sort.sortBy && filters.sortOrder === sort.sortOrder;
              return (
                <FilterChip
                  key={sort.id}
                  label={sort.label}
                  isActive={isActive}
                  onPress={() => updateFilters({ sortBy: sort.sortBy, sortOrder: sort.sortOrder })}
                />
              );
            })}
          </View>
        </FilterSection>

        <FilterSection title="الماركة المتوافقة">
          <DropdownSelector
            value={filters.make}
            placeholder="اختر الماركة المتوافقة"
            onPress={() => setActiveSelector('make')}
          />
        </FilterSection>

        <FilterSection title="رقم القطعة (Part Number / OEM)">
          <View style={s.inputContainer}>
            <Ionicons name="barcode-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="مثال: 90915-YZZD2"
              placeholderTextColor={Colors.textMuted}
              value={filters.partNumber || ''}
              onChangeText={(val) => updateFilter('partNumber', val || undefined)}
            />
            {filters.partNumber ? (
              <TouchableOpacity onPress={() => updateFilter('partNumber', undefined)}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </FilterSection>

        <FilterSection title="السعر (ر.ع)">
          <RangeSlider
            min={0}
            max={3000} // Parts are usually cheaper
            step={50}
            initialLow={filters.priceMin ? parseInt(filters.priceMin) : 0}
            initialHigh={filters.priceMax ? parseInt(filters.priceMax) : 3000}
            onValuesChangeFinish={(vals) => {
              updateFilter('priceMin', vals[0].toString());
              updateFilter('priceMax', vals[1].toString());
            }}
          />
        </FilterSection>

        <FilterSection title="المحافظة">
          <DropdownSelector
            value={selectedGov ? selectedGov.labelAr : undefined}
            placeholder="اختر المحافظة"
            onPress={() => setActiveSelector('gov')}
          />
        </FilterSection>

        <FilterSection title="الولاية">
          <DropdownSelector
            value={filters.city}
            placeholder="اختر الولاية"
            onPress={() => setActiveSelector('city')}
          />
        </FilterSection>

      </FilterBottomSheetLayout>

      <SearchableSelectModal
        visible={activeSelector === 'make'}
        onClose={() => setActiveSelector(null)}
        title="اختر الماركة المتوافقة"
        data={makeData}
        selectedValue={filters.makeId}
        onSelect={(option) => {
          if (option) {
            updateFilter('makeId', option.id);
            updateFilter('make', option.label);
          } else {
            updateFilter('makeId', undefined);
            updateFilter('make', undefined);
          }
        }}
        placeholder="ابحث عن ماركة..."
      />

      <SearchableSelectModal
        visible={activeSelector === 'gov'}
        onClose={() => setActiveSelector(null)}
        title="اختر المحافظة"
        data={govData}
        selectedValue={filters.governorate}
        onSelect={(option) => {
          if (option) updateFilter('governorate', option.id);
          else updateFilter('governorate', undefined);
        }}
        placeholder="ابحث عن محافظة..."
      />

      <SearchableSelectModal
        visible={activeSelector === 'city'}
        onClose={() => setActiveSelector(null)}
        title="اختر الولاية"
        data={cityData}
        selectedValue={filters.city}
        onSelect={(option) => {
          if (option) updateFilter('city', option.label);
          else updateFilter('city', undefined);
        }}
        placeholder="ابحث عن ولاية..."
      />

    </>
  );
}

const s = StyleSheet.create({
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 44,
    gap: 6,
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    height: '100%',
  },
});


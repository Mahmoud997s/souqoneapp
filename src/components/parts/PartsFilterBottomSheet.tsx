import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { FilterSection } from '../ui/FilterSection';
import { DropdownSelector } from '../ui/DropdownSelector';
import { RangeSlider } from '../ui/RangeSlider';
import { NestedSearchableList } from '../ui/NestedSearchableList';
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout';
import { getBrandLogo } from '../../constants/brandLogos';
import { PartsFilterState } from '../../types/filters.types';
import { Colors } from '../../constants/colors';

interface PartsFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: PartsFilterState;
  onApplyFilters: (filters: PartsFilterState) => void;
  resultsCount?: number;
}

export function PartsFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
  resultsCount,
}: PartsFilterBottomSheetProps) {
  const [filters, setFilters] = useState<PartsFilterState>({ ...initialFilters });
  const [activeSelector, setActiveSelector] = useState<'make' | 'gov' | 'city' | 'category' | 'condition' | 'originality' | 'sort' | null>(null);
  const [showMore, setShowMore] = useState(false);

  const { data: brands } = useBrands();
  const hasActiveFilters = Object.keys(filters).length > 0;

  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters });
      setShowMore(false);
      setActiveSelector(null);
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

  const handleApply = () => {
    const cleaned: PartsFilterState = { ...filters };
    if (cleaned.priceMin === '0') delete cleaned.priceMin;
    if (cleaned.priceMax === '3000') delete cleaned.priceMax;

    (Object.keys(cleaned) as (keyof PartsFilterState)[]).forEach((k) => {
      if (cleaned[k] === undefined || cleaned[k] === '') delete cleaned[k];
    });

    onApplyFilters(cleaned);
    onClose();
  };

  const onClearFilters = () => {
    const cleared: PartsFilterState = {};
    setFilters(cleared);
    setActiveSelector(null);
  };

  const selectedGov = GOVERNORATE_OPTIONS.find((g) => g.value === filters.governorate);
  const availableCities = filters.governorate 
    ? WILAYAT_BY_GOVERNORATE[filters.governorate] || [] 
    : Object.values(WILAYAT_BY_GOVERNORATE).flat();

  const makeData = (brands && brands.length > 0 ? brands : POPULAR_PART_MAKES).map((b: any) => ({
    id: b.id,
    label: b.nameAr || b.name || b.label,
    value: b.name || b.label,
    image: getBrandLogo(b.slug || b.id),
  }));
  const govData = GOVERNORATE_OPTIONS.map(g => ({ id: g.value, label: g.labelAr }));
  const cityData = availableCities.map(c => ({ id: c.value || c.labelAr, label: c.labelAr }));

  const categoryData = PART_CATEGORIES.map(c => ({ id: c.id, label: c.label }));
  const conditionData = PART_CONDITIONS.map(c => ({ id: c.id, label: c.label }));
  const originalityData = PART_ORIGINALITY_OPTIONS.map(o => ({ id: String(o.value), label: o.label }));
  const sortData = PARTS_SORT_OPTIONS.map(s => ({ id: s.id, label: s.label }));

  let nestedContent = null;
  let title = "تصفية القطع";

  if (activeSelector === 'make') {
    title = "اختر الماركة المتوافقة";
    nestedContent = (
      <NestedSearchableList
        data={makeData}
        selectedValue={filters.makeId}
        onSelect={(option: any) => {
          if (option) updateFilters({ makeId: option.id, make: option.label });
          else updateFilters({ makeId: undefined, make: undefined });
          setActiveSelector(null);
        }}
        placeholder="ابحث عن ماركة..."
      />
    );
  } else if (activeSelector === 'gov') {
    title = "اختر المحافظة";
    nestedContent = (
      <NestedSearchableList
        data={govData}
        selectedValue={filters.governorate}
        onSelect={(option) => {
          if (option) updateFilter('governorate', option.id);
          else updateFilter('governorate', undefined);
          setActiveSelector(null);
        }}
        placeholder="ابحث عن محافظة..."
      />
    );
  } else if (activeSelector === 'city') {
    title = "اختر الولاية";
    nestedContent = (
      <NestedSearchableList
        data={cityData}
        selectedValue={filters.city}
        onSelect={(option) => {
          if (option) updateFilter('city', option.label);
          else updateFilter('city', undefined);
          setActiveSelector(null);
        }}
        placeholder="ابحث عن ولاية..."
      />
    );
  } else if (activeSelector === 'category') {
    title = "قسم القطعة";
    nestedContent = (
      <NestedSearchableList
        data={categoryData}
        selectedValue={filters.category}
        onSelect={(opt) => { updateFilter('category', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'condition') {
    title = "حالة القطعة";
    nestedContent = (
      <NestedSearchableList
        data={conditionData}
        selectedValue={filters.condition}
        onSelect={(opt) => { updateFilter('condition', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'originality') {
    title = "الأصالة والنوع";
    nestedContent = (
      <NestedSearchableList
        data={originalityData}
        selectedValue={filters.isOriginal !== undefined ? String(filters.isOriginal) : undefined}
        onSelect={(opt) => { 
          updateFilter('isOriginal', opt ? opt.id === 'true' : undefined); 
          setActiveSelector(null); 
        }}
        hideSearch
      />
    );
  } else if (activeSelector === 'sort') {
    title = "ترتيب النتائج";
    nestedContent = (
      <NestedSearchableList
        data={sortData}
        selectedValue={filters.sortBy ? PARTS_SORT_OPTIONS.find(s => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder)?.id : undefined}
        onSelect={(opt) => {
          if (opt) {
            const selected = PARTS_SORT_OPTIONS.find(s => s.id === opt.id);
            if (selected) {
               updateFilters({ sortBy: selected.sortBy, sortOrder: selected.sortOrder });
            }
          } else {
            updateFilters({ sortBy: undefined, sortOrder: undefined });
          }
          setActiveSelector(null);
        }}
        hideSearch
      />
    );
  }

  const mainContent = (
    <>
      <FilterSection title="ترتيب النتائج">
        <DropdownSelector
          value={PARTS_SORT_OPTIONS.find(s => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder)?.label}
          placeholder="الترتيب الافتراضي"
          onPress={() => setActiveSelector('sort')}
        />
      </FilterSection>

      <FilterSection title="القطعة">
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={PART_CATEGORIES.find(c => c.id === filters.category)?.label}
              placeholder="قسم القطعة"
              onPress={() => setActiveSelector('category')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={filters.make}
              placeholder="الماركة المتوافقة"
              onPress={() => setActiveSelector('make')}
            />
          </View>
        </View>
      </FilterSection>

      <FilterSection title="الموقع">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={selectedGov ? selectedGov.labelAr : undefined}
              placeholder="المحافظة"
              onPress={() => setActiveSelector('gov')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={filters.city}
              placeholder="الولاية"
              onPress={() => setActiveSelector('city')}
            />
          </View>
        </View>
      </FilterSection>

      <FilterSection title="نطاق السعر (ر.ع)">
        <RangeSlider
          min={0}
          max={3000}
          step={50}
          initialLow={filters.priceMin ? parseInt(filters.priceMin) : 0}
          initialHigh={filters.priceMax ? parseInt(filters.priceMax) : 3000}
          onValuesChangeFinish={(vals) => {
            updateFilter('priceMin', vals[0].toString());
            updateFilter('priceMax', vals[1].toString());
          }}
          suffix="ر.ع"
        />
      </FilterSection>

      {!showMore ? (
        <TouchableOpacity style={s.moreBtn} onPress={() => setShowMore(true)} activeOpacity={0.7}>
          <Text style={s.moreBtnText}>المزيد من الفلاتر</Text>
          <Ionicons name="chevron-down-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <>
          <FilterSection title="الأصالة والنوع">
            <DropdownSelector
              value={filters.isOriginal !== undefined ? PART_ORIGINALITY_OPTIONS.find(o => o.value === filters.isOriginal)?.label : undefined}
              placeholder="الكل"
              onPress={() => setActiveSelector('originality')}
            />
          </FilterSection>

          <FilterSection title="حالة القطعة">
            <DropdownSelector
              value={PART_CONDITIONS.find(c => c.id === filters.condition)?.label}
              placeholder="الكل"
              onPress={() => setActiveSelector('condition')}
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
        </>
      )}
    </>
  );

  return (
    <FilterBottomSheetLayout
      visible={visible}
      onClose={onClose}
      title={title}
      hasActiveFilters={hasActiveFilters}
      onClear={onClearFilters}
      onApply={activeSelector ? () => setActiveSelector(null) : handleApply}
      applyLabel={
        activeSelector
          ? 'تأكيد الاختيار'
          : resultsCount !== undefined
          ? `عرض ${resultsCount} نتيجة`
          : 'تطبيق الفلتر'
      }
      isNested={!!activeSelector}
      onBack={() => setActiveSelector(null)}
    >
      {nestedContent ? nestedContent : mainContent}
    </FilterBottomSheetLayout>
  );
}

const s = StyleSheet.create({
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moreBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.primary,
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

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GOVERNORATE_OPTIONS,
  WILAYAT_BY_GOVERNORATE,
  BODY_TYPES,
  TRANSMISSION_TYPES,
  CONDITIONS,
  FUEL_TYPES,
  LISTING_TYPES,
  SORT_OPTIONS,
} from '../../constants/filters';
import { useBrands, useCarModels, useCarTrims } from '../../hooks/useCars';
import { FilterChip } from '../ui/FilterChip';
import { FilterSection } from '../ui/FilterSection';
import { DropdownSelector } from '../ui/DropdownSelector';
import { RangeSlider } from '../ui/RangeSlider';
import { NestedSearchableList } from '../ui/NestedSearchableList';
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout';
import { getBrandLogo } from '../../constants/brandLogos';
import { FilterState } from '../../types/filters.types';
import { Colors } from '../../constants/colors';
import { locationsApi } from '../../api/locations';
import { GovernorateRef, WilayaRef } from '../../types/location.types';

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  resultsCount?: number;
}

export function FilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
  resultsCount,
}: FilterBottomSheetProps) {
  const [filters, setFilters] = useState<FilterState>({ ...initialFilters });
  const [activeSelector, setActiveSelector] = useState<'make' | 'model' | 'trim' | 'gov' | 'city' | 'listingType' | 'condition' | 'transmission' | 'bodyType' | 'fuelType' | 'sort' | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);
  const [wilayas, setWilayas] = useState<WilayaRef[]>([]);

  const { data: brands } = useBrands();
  const { data: models } = useCarModels(filters.makeId || '');
  const { data: trims } = useCarTrims(filters.modelId || '');

  const hasActiveFilters = Object.keys(filters).length > 0;

  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters });
      setShowMore(false);
      setActiveSelector(null);
      locationsApi.getGovernorates().then(setGovernorates).catch(console.warn);
    }
  }, [visible, initialFilters]);

  useEffect(() => {
    if (filters.governorateId) {
      locationsApi.getWilayas(filters.governorateId).then(setWilayas).catch(console.warn);
    } else {
      setWilayas([]);
    }
  }, [filters.governorateId]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'governorateId') next.wilayaId = undefined;
      if (key === 'makeId' || key === 'make') {
        next.modelId = undefined;
        next.model = undefined;
        next.trim = undefined;
      }
      if (key === 'modelId' || key === 'model') next.trim = undefined;
      return next;
    });
  };

  const updateFilters = (updates: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      if ('governorateId' in updates) next.wilayaId = undefined;
      if ('makeId' in updates || 'make' in updates) {
        next.modelId = undefined;
        next.model = undefined;
        next.trim = undefined;
      }
      if ('modelId' in updates || 'model' in updates) next.trim = undefined;
      return next;
    });
  };

  const handleApply = () => {
    // Strip range values that are still at defaults (no real filter applied)
    const cleaned: FilterState = { ...filters };

    if (cleaned.priceMin === '0') delete cleaned.priceMin;
    if (cleaned.priceMax === '30000') delete cleaned.priceMax;
    if (cleaned.yearMin === '1990') delete cleaned.yearMin;
    if (cleaned.yearMax === String(new Date().getFullYear())) delete cleaned.yearMax;
    if (cleaned.mileageMin === '0') delete cleaned.mileageMin;
    if (cleaned.mileageMax === '500000') delete cleaned.mileageMax;

    // Remove any undefined/empty string values
    (Object.keys(cleaned) as (keyof FilterState)[]).forEach((k) => {
      if (cleaned[k] === undefined || cleaned[k] === '') delete cleaned[k];
    });

    onApplyFilters(cleaned);
    onClose();
  };

  const onClearFilters = () => {
    const cleared: FilterState = {};
    setFilters(cleared);
    setActiveSelector(null); // also exit any nested selector
  };

  const selectedGov = governorates.find((g) => g.id === filters.governorateId);
  const selectedCity = wilayas.find((w) => w.id === filters.wilayaId);

  const makeData = brands?.map(b => ({ id: b.id, label: b.nameAr || b.name, value: b.name, image: getBrandLogo(b.slug) })) || [];
  const modelData = models?.map(m => ({ id: m.id, label: m.nameAr || m.name, value: m.name })) || [];
  const trimData = trims?.map(t => ({ id: t.name, label: t.nameAr || t.name, value: t.name })) || [];
  const govData = governorates.map(g => ({ id: String(g.id), label: g.nameAr }));
  const cityData = wilayas.map(c => ({ id: String(c.id), label: c.nameAr }));
  
  const listingTypeData = LISTING_TYPES.map(t => ({ id: t.value, label: t.labelAr }));
  const conditionData = CONDITIONS.map(c => ({ id: c.value, label: c.labelAr }));
  const transmissionData = TRANSMISSION_TYPES.map(t => ({ id: t.value, label: t.labelAr }));
  const bodyTypeData = BODY_TYPES.map(b => ({ id: b.value, label: b.labelAr }));
  const fuelTypeData = FUEL_TYPES.map(f => ({ id: f.value, label: f.labelAr }));
  const sortData = SORT_OPTIONS.map(s => ({ id: s.value, label: s.labelAr }));

  let nestedContent = null;
  let title = "تصفية النتائج";

  if (activeSelector === 'make') {
    title = "اختر الماركة";
    nestedContent = (
      <NestedSearchableList
        data={makeData}
        selectedValue={filters.makeId}
        onSelect={(option: any) => {
          if (option) updateFilters({ makeId: option.id, make: option.value });
          else updateFilters({ makeId: undefined, make: undefined });
          setActiveSelector(null);
        }}
        placeholder="ابحث عن ماركة..."
      />
    );
  } else if (activeSelector === 'model') {
    title = "اختر الموديل";
    nestedContent = (
      <NestedSearchableList
        data={modelData}
        selectedValue={filters.modelId}
        onSelect={(option: any) => {
          if (option) updateFilters({ modelId: option.id, model: option.value });
          else updateFilters({ modelId: undefined, model: undefined });
          setActiveSelector(null);
        }}
        placeholder="ابحث عن موديل..."
      />
    );
  } else if (activeSelector === 'trim') {
    title = "اختر الفئة";
    nestedContent = (
      <NestedSearchableList
        data={trimData}
        selectedValue={filters.trim}
        onSelect={(option: any) => {
          if (option) updateFilters({ trim: option.value });
          else updateFilters({ trim: undefined });
          setActiveSelector(null);
        }}
        placeholder="ابحث عن فئة..."
      />
    );
  } else if (activeSelector === 'gov') {
    title = "اختر المحافظة";
    nestedContent = (
      <NestedSearchableList
        data={govData}
        selectedValue={filters.governorateId ? String(filters.governorateId) : undefined}
        onSelect={(option) => {
          if (option) {
            updateFilter('governorateId', parseInt(option.id, 10));
            updateFilter('governorate', option.label);
          } else {
            updateFilter('governorateId', undefined);
            updateFilter('governorate', undefined);
          }
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
        selectedValue={filters.wilayaId ? String(filters.wilayaId) : undefined}
        onSelect={(option) => {
          if (option) {
            updateFilter('wilayaId', parseInt(option.id, 10));
            updateFilter('city', option.label);
          } else {
            updateFilter('wilayaId', undefined);
            updateFilter('city', undefined);
          }
          setActiveSelector(null);
        }}
        placeholder="ابحث عن ولاية..."
      />
    );
  } else if (activeSelector === 'listingType') {
    title = "نوع الإعلان";
    nestedContent = (
      <NestedSearchableList
        data={listingTypeData}
        selectedValue={filters.listingType}
        onSelect={(opt) => { updateFilter('listingType', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'condition') {
    title = "حالة السيارة";
    nestedContent = (
      <NestedSearchableList
        data={conditionData}
        selectedValue={filters.condition}
        onSelect={(opt) => { updateFilter('condition', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'transmission') {
    title = "ناقل الحركة";
    nestedContent = (
      <NestedSearchableList
        data={transmissionData}
        selectedValue={filters.transmission}
        onSelect={(opt) => { updateFilter('transmission', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'bodyType') {
    title = "نوع الهيكل";
    nestedContent = (
      <NestedSearchableList
        data={bodyTypeData}
        selectedValue={filters.bodyType}
        onSelect={(opt) => { updateFilter('bodyType', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'fuelType') {
    title = "نوع الوقود";
    nestedContent = (
      <NestedSearchableList
        data={fuelTypeData}
        selectedValue={filters.fuelType}
        onSelect={(opt) => { updateFilter('fuelType', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'sort') {
    title = "ترتيب النتائج";
    nestedContent = (
      <NestedSearchableList
        data={sortData}
        selectedValue={filters.sortBy ? `${filters.sortBy}_${filters.sortOrder}` : undefined}
        onSelect={(opt) => {
          if (opt) {
            const [sBy, sOrder] = opt.id.split('_');
            updateFilters({ sortBy: sBy, sortOrder: sOrder });
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
          value={SORT_OPTIONS.find(s => s.value === `${filters.sortBy}_${filters.sortOrder}`)?.labelAr}
          placeholder="الترتيب الافتراضي"
          onPress={() => setActiveSelector('sort')}
        />
      </FilterSection>

      <FilterSection title="السيارة">
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={filters.makeId ? brands?.find(b => b.id === filters.makeId)?.nameAr || filters.make : filters.make}
              placeholder="الماركة"
              onPress={() => setActiveSelector('make')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={filters.modelId ? models?.find(m => m.id === filters.modelId)?.nameAr || filters.model : filters.model}
              placeholder="الموديل"
              onPress={() => setActiveSelector('model')}
            />
          </View>
        </View>
        <DropdownSelector
          value={filters.trim ? trims?.find(t => t.name === filters.trim)?.nameAr || filters.trim : undefined}
          placeholder={filters.modelId ? (trims && trims.length > 0 ? 'الفئة' : 'لا توجد فئات') : 'اختر الموديل أولاً'}
          onPress={() => {
            if (!filters.modelId) return;
            setActiveSelector('trim');
          }}
          disabled={!filters.modelId || !(trims && trims.length > 0)}
        />
      </FilterSection>

      <FilterSection title="الموقع">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={selectedGov ? selectedGov.nameAr : undefined}
              placeholder="المحافظة"
              onPress={() => setActiveSelector('gov')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={selectedCity ? selectedCity.nameAr : undefined}
              placeholder="الولاية"
              onPress={() => setActiveSelector('city')}
            />
          </View>
        </View>
      </FilterSection>

      <FilterSection title="نطاق السعر (ر.ع)">
        <RangeSlider
          min={0}
          max={30000}
          step={500}
          initialLow={filters.priceMin ? parseInt(filters.priceMin) : 0}
          initialHigh={filters.priceMax ? parseInt(filters.priceMax) : 30000}
          onValuesChangeFinish={(vals) => {
            updateFilter('priceMin', vals[0].toString());
            updateFilter('priceMax', vals[1].toString());
          }}
          suffix="ر.ع"
        />
      </FilterSection>

      <FilterSection title="سنة الصنع">
        <RangeSlider
          min={1990}
          max={new Date().getFullYear()}
          step={1}
          initialLow={filters.yearMin ? parseInt(filters.yearMin) : 1990}
          initialHigh={filters.yearMax ? parseInt(filters.yearMax) : new Date().getFullYear()}
          onValuesChangeFinish={(vals) => {
            updateFilter('yearMin', vals[0].toString());
            updateFilter('yearMax', vals[1].toString());
          }}
        />
      </FilterSection>

      {!showMore ? (
        <TouchableOpacity style={s.moreBtn} onPress={() => setShowMore(true)} activeOpacity={0.7}>
          <Text style={s.moreBtnText}>المزيد من الفلاتر</Text>
          <Ionicons name="chevron-down-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <>
          <FilterSection title="الممشى (كم)">
            <RangeSlider
              min={0}
              max={500000}
              step={10000}
              initialLow={filters.mileageMin ? parseInt(filters.mileageMin) : 0}
              initialHigh={filters.mileageMax ? parseInt(filters.mileageMax) : 500000}
              onValuesChangeFinish={(vals) => {
                updateFilter('mileageMin', vals[0].toString());
                updateFilter('mileageMax', vals[1].toString());
              }}
              suffix="كم"
            />
          </FilterSection>

          <FilterSection title="نوع الإعلان">
            <DropdownSelector
              value={LISTING_TYPES.find(t => t.value === filters.listingType)?.labelAr}
              placeholder="الكل"
              onPress={() => setActiveSelector('listingType')}
            />
          </FilterSection>

          <FilterSection title="حالة السيارة">
            <DropdownSelector
              value={CONDITIONS.find(c => c.value === filters.condition)?.labelAr}
              placeholder="الكل"
              onPress={() => setActiveSelector('condition')}
            />
          </FilterSection>

          <FilterSection title="ناقل الحركة">
            <DropdownSelector
              value={TRANSMISSION_TYPES.find(t => t.value === filters.transmission)?.labelAr}
              placeholder="الكل"
              onPress={() => setActiveSelector('transmission')}
            />
          </FilterSection>

          <FilterSection title="نوع الهيكل">
            <DropdownSelector
              value={BODY_TYPES.find(b => b.value === filters.bodyType)?.labelAr}
              placeholder="الكل"
              onPress={() => setActiveSelector('bodyType')}
            />
          </FilterSection>

          <FilterSection title="نوع الوقود">
            <DropdownSelector
              value={FUEL_TYPES.find(f => f.value === filters.fuelType)?.labelAr}
              placeholder="الكل"
              onPress={() => setActiveSelector('fuelType')}
            />
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
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  }
});

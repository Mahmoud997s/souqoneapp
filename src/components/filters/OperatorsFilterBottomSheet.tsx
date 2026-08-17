import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FilterChip } from '../ui/FilterChip';
import { FilterSection } from '../ui/FilterSection';
import { DropdownSelector } from '../ui/DropdownSelector';
import { RangeSlider } from '../ui/RangeSlider';
import { NestedSearchableList } from '../ui/NestedSearchableList';
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout';
import { OperatorFilterState } from '../../types/filters.types';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { locationsApi } from '../../api/locations';
import { GovernorateRef, WilayaRef } from '../../types/location.types';

interface OperatorsFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: OperatorFilterState;
  onApplyFilters: (filters: OperatorFilterState) => void;
  resultsCount?: number;
}

const ROLE_OPTIONS = [
  { id: 'all', label: 'الكل' },
  { id: 'OPERATOR', label: 'مشغلو معدات' },
  { id: 'DRIVER', label: 'سائقون' },
  { id: 'TECHNICIAN', label: 'فنيون' },
  { id: 'MAINTENANCE', label: 'صيانة' },
];

const EQUIPMENT_TYPE_OPTIONS = [
  { id: 'EXCAVATOR', label: 'حفار' },
  { id: 'CRANE', label: 'رافعة / كرين' },
  { id: 'LOADER', label: 'لودر / جرافة' },
  { id: 'BULLDOZER', label: 'بلدوزر' },
  { id: 'FORKLIFT', label: 'رافعة شوكية' },
  { id: 'CONCRETE_MIXER', label: 'خلاطة خرسانة' },
  { id: 'GENERATOR', label: 'مولد ومضخة' },
  { id: 'COMPRESSOR', label: 'ضاغط هواء' },
  { id: 'TRUCK', label: 'شاحنة ثقيلة' },
  { id: 'DUMP_TRUCK', label: 'قلاب' },
  { id: 'WATER_TANKER', label: 'صهريج مياه' },
  { id: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة' },
  { id: 'OTHER_EQUIPMENT', label: 'معدات أخرى' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'all', label: 'الكل' },
  { id: '0-2', label: 'أقل من سنتين' },
  { id: '2-5', label: '2 - 5 سنوات' },
  { id: '5-10', label: '5 - 10 سنوات' },
  { id: '10-50', label: '+10 سنوات' },
];

const SORT_OPTIONS = [
  { id: 'createdAt_desc', label: 'الأحدث أولاً' },
  { id: 'experienceYears_desc', label: 'الأعلى خبرة' },
  { id: 'dailyRate_asc', label: 'الأقل سعراً' },
  { id: 'dailyRate_desc', label: 'الأعلى سعراً' },
];

const CERTIFICATION_OPTIONS = [
  { id: 'rop_heavy', label: 'رخصة معدات ثقيلة ROP' },
  { id: 'opal_pdo', label: 'شهادة سلامة OPAL / PDO' },
  { id: 'certified_inspector', label: 'شهادة فحص معتمدة' },
];

export function OperatorsFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
  resultsCount,
}: OperatorsFilterBottomSheetProps) {
  const [filters, setFilters] = useState<OperatorFilterState>({ ...initialFilters });
  const [activeSelector, setActiveSelector] = useState<'equipmentType' | 'gov' | 'city' | 'sort' | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);
  const [wilayas, setWilayas] = useState<WilayaRef[]>([]);

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

  const updateFilter = (key: keyof OperatorFilterState, value: any) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'governorateId') {
        next.wilayaId = undefined;
        next.wilayaName = undefined;
      }
      return next;
    });
  };

  const handleApply = () => {
    const cleaned: OperatorFilterState = { ...filters };

    if (cleaned.dailyRateMin === 0) delete cleaned.dailyRateMin;
    if (cleaned.dailyRateMax === 150) delete cleaned.dailyRateMax;
    if (cleaned.operatorType === 'all') delete cleaned.operatorType;
    if (cleaned.experienceLevel === 'all') delete cleaned.experienceLevel;

    // Remove empty values
    (Object.keys(cleaned) as (keyof OperatorFilterState)[]).forEach((k) => {
      if (cleaned[k] === undefined || cleaned[k] === '') delete cleaned[k];
    });

    onApplyFilters(cleaned);
    onClose();
  };

  const onClearFilters = () => {
    setFilters({});
    setActiveSelector(null);
  };

  const selectedGov = governorates.find((g) => g.id === filters.governorateId);
  const selectedCity = wilayas.find((w) => w.id === filters.wilayaId);
  const selectedEquip = EQUIPMENT_TYPE_OPTIONS.find((e) => e.id === filters.equipmentType);
  const selectedSort = SORT_OPTIONS.find((s) => s.id === filters.sortBy);

  const govData = governorates.map((g) => ({ id: String(g.id), label: g.nameAr }));
  const cityData = wilayas.map((c) => ({ id: String(c.id), label: c.nameAr }));
  const equipData = EQUIPMENT_TYPE_OPTIONS.map((e) => ({ id: e.id, label: e.label }));
  const sortData = SORT_OPTIONS.map((s) => ({ id: s.id, label: s.label }));

  let nestedContent = null;
  let title = 'تصفية المشغلين';

  if (activeSelector === 'equipmentType') {
    title = 'اختر نوع المعدة';
    nestedContent = (
      <NestedSearchableList
        data={equipData}
        selectedValue={filters.equipmentType}
        onSelect={(opt) => {
          updateFilter('equipmentType', opt?.id);
          setActiveSelector(null);
        }}
        placeholder="ابحث عن نوع معدة..."
      />
    );
  } else if (activeSelector === 'gov') {
    title = 'اختر المحافظة';
    nestedContent = (
      <NestedSearchableList
        data={govData}
        selectedValue={filters.governorateId ? String(filters.governorateId) : undefined}
        onSelect={(option) => {
          if (option) {
            updateFilter('governorateId', parseInt(option.id, 10));
            updateFilter('governorateName', option.label);
          } else {
            updateFilter('governorateId', undefined);
            updateFilter('governorateName', undefined);
          }
          setActiveSelector(null);
        }}
        placeholder="ابحث عن محافظة..."
      />
    );
  } else if (activeSelector === 'city') {
    title = 'اختر الولاية';
    nestedContent = (
      <NestedSearchableList
        data={cityData}
        selectedValue={filters.wilayaId ? String(filters.wilayaId) : undefined}
        onSelect={(option) => {
          if (option) {
            updateFilter('wilayaId', parseInt(option.id, 10));
            updateFilter('wilayaName', option.label);
          } else {
            updateFilter('wilayaId', undefined);
            updateFilter('wilayaName', undefined);
          }
          setActiveSelector(null);
        }}
        placeholder="ابحث عن ولاية..."
      />
    );
  } else if (activeSelector === 'sort') {
    title = 'ترتيب المشغلين';
    nestedContent = (
      <NestedSearchableList
        data={sortData}
        selectedValue={filters.sortBy}
        onSelect={(opt) => {
          updateFilter('sortBy', opt?.id);
          setActiveSelector(null);
        }}
        hideSearch
      />
    );
  }

  const mainContent = (
    <>
      {/* 1. Sort Section */}
      <FilterSection title="ترتيب النتائج">
        <DropdownSelector
          value={selectedSort?.label}
          placeholder="الترتيب الافتراضي (الأحدث أولاً)"
          onPress={() => setActiveSelector('sort')}
        />
      </FilterSection>

      {/* 2. Operator Role / Type */}
      <FilterSection title="الدور والتخصص المهني">
        <View style={s.chipsWrap}>
          {ROLE_OPTIONS.map((role) => {
            const isSel = (filters.operatorType || 'all') === role.id;
            return (
              <FilterChip
                key={role.id}
                label={role.label}
                isActive={isSel}
                onPress={() => updateFilter('operatorType', role.id === 'all' ? undefined : role.id)}
              />
            );
          })}
        </View>
      </FilterSection>

      {/* 3. Location (Governorate & Wilaya) */}
      <FilterSection title="الموقع الجغرافي">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={selectedGov?.nameAr || filters.governorateName}
              placeholder="المحافظة"
              onPress={() => setActiveSelector('gov')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <DropdownSelector
              value={selectedCity?.nameAr || filters.wilayaName}
              placeholder={filters.governorateId ? 'الولاية' : 'المحافظة أولاً'}
              onPress={() => {
                if (filters.governorateId) setActiveSelector('city');
              }}
              disabled={!filters.governorateId}
            />
          </View>
        </View>
      </FilterSection>

      {/* 4. Equipment Type Selector */}
      <FilterSection title="نوع المعدة التي يشغلها">
        <DropdownSelector
          value={selectedEquip?.label}
          placeholder="اختر نوع المعدة (حفار، كرين، لودر...)"
          onPress={() => setActiveSelector('equipmentType')}
        />
      </FilterSection>

      {/* 5. Experience Level */}
      <FilterSection title="سنوات الخبرة">
        <View style={s.chipsWrap}>
          {EXPERIENCE_OPTIONS.map((exp) => {
            const isSel = (filters.experienceLevel || 'all') === exp.id;
            return (
              <FilterChip
                key={exp.id}
                label={exp.label}
                isActive={isSel}
                onPress={() => {
                  if (exp.id === 'all') {
                    updateFilter('experienceLevel', undefined);
                    updateFilter('minExperience', undefined);
                    updateFilter('maxExperience', undefined);
                  } else {
                    const [min, max] = exp.id.split('-').map(Number);
                    updateFilter('experienceLevel', exp.id);
                    updateFilter('minExperience', min);
                    updateFilter('maxExperience', max);
                  }
                }}
              />
            );
          })}
        </View>
      </FilterSection>

      {/* 6. Daily Rate Slider */}
      <FilterSection title="الأجر اليومي الاسترشادي (ر.ع)">
        <RangeSlider
          min={0}
          max={150}
          step={5}
          initialLow={filters.dailyRateMin ?? 0}
          initialHigh={filters.dailyRateMax ?? 150}
          onValuesChangeFinish={(vals) => {
            updateFilter('dailyRateMin', vals[0]);
            updateFilter('dailyRateMax', vals[1]);
          }}
          suffix="ر.ع"
        />
      </FilterSection>

      {/* 7. Show More Expandable Section */}
      {!showMore ? (
        <TouchableOpacity
          style={s.showMoreBtn}
          onPress={() => setShowMore(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down-outline" size={16} color={Colors.primary} />
          <Text style={s.showMoreTxt}>المزيد من الفلاتر والشهادات المهنية</Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Certifications & Licenses */}
          <FilterSection title="الرخص والشهادات المعتمدة">
            <View style={s.chipsWrap}>
              {CERTIFICATION_OPTIONS.map((cert) => {
                const isSel = filters.certification === cert.id;
                return (
                  <FilterChip
                    key={cert.id}
                    label={cert.label}
                    isActive={isSel}
                    onPress={() => updateFilter('certification', isSel ? undefined : cert.id)}
                  />
                );
              })}
            </View>
          </FilterSection>

          {/* Negotiable Rate Toggle */}
          <TouchableOpacity
            style={[s.toggleCard, filters.isPriceNegotiable && s.toggleCardActive]}
            onPress={() => updateFilter('isPriceNegotiable', !filters.isPriceNegotiable)}
            activeOpacity={0.8}
          >
            <View style={s.toggleInfo}>
              <Text style={s.toggleTitle}>أجر قابل للتفاوض فقط</Text>
              <Text style={s.toggleSub}>عرض المشغلين المستعدين للتفاوض على الأجر والعقود</Text>
            </View>
            <View style={[s.checkboxCircle, filters.isPriceNegotiable && s.checkboxCircleActive]}>
              {filters.isPriceNegotiable && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
          </TouchableOpacity>
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
      onApply={handleApply}
      applyLabel={
        resultsCount !== undefined
          ? `تطبيق الفلاتر (عرض ${resultsCount} مشغل)`
          : 'تطبيق الفلاتر'
      }
      isNested={activeSelector !== null}
      onBack={() => setActiveSelector(null)}
    >
      {activeSelector ? nestedContent : mainContent}
    </FilterBottomSheetLayout>
  );
}

const s = StyleSheet.create({
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    marginTop: 4,
  },
  showMoreTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.primary,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  toggleCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  toggleSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginStart: 12,
  },
  checkboxCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});

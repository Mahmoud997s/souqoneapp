import React, { useState, useEffect } from 'react'
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout'
import { FilterSection } from '../ui/FilterSection'
import { DropdownSelector } from '../ui/DropdownSelector'
import { RangeSlider } from '../ui/RangeSlider'
import { NestedSearchableList, SelectOption } from '../ui/NestedSearchableList'
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from '../../constants/equipment'
import { locationsApi } from '../../api/locations'
import { GovernorateRef, WilayaRef } from '../../types/location.types'

export interface EquipmentFilterState {
  listingType?: string
  governorateId?: number
  governorate?: string
  wilayaId?: number
  city?: string
  priceMin?: string
  priceMax?: string
  priceId?: string
  condition?: string
  conditionId?: string
  equipmentType?: string
  categoryId?: string
  make?: string
  sortBy?: string
  sortOrder?: string
  yearMin?: string
  yearMax?: string
  yearId?: string
  hoursMin?: string
  hoursMax?: string
  hoursId?: string
}

interface EquipmentFilterBottomSheetProps {
  visible: boolean
  onClose: () => void
  initialFilters: EquipmentFilterState
  onApplyFilters: (filters: EquipmentFilterState) => void
  resultsCount?: number
}

export const EQUIPMENT_SORT_OPTIONS = [
  { id: 'default', label: 'الترتيب الافتراضي', value: undefined },
  { id: 'price_asc', label: 'السعر: الأقل أولاً', value: 'price_asc' },
  { id: 'price_desc', label: 'السعر: الأعلى أولاً', value: 'price_desc' },
  { id: 'year_desc', label: 'سنة الصنع: الأحدث', value: 'year_desc' },
  { id: 'views_desc', label: 'الأكثر مشاهدة', value: 'views_desc' },
]

export const LISTING_TYPE_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  { id: 'EQUIPMENT_SALE', label: 'للبيع', value: 'EQUIPMENT_SALE' },
  { id: 'EQUIPMENT_RENT', label: 'للإيجار', value: 'EQUIPMENT_RENT' },
  { id: 'EQUIPMENT_WANTED', label: 'مطلوب', value: 'EQUIPMENT_WANTED' },
]

// Uses exact values accepted by backend Prisma ItemCondition enum:
// NEW | LIKE_NEW | USED | GOOD | FAIR | POOR
export const CONDITION_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  ...EQUIPMENT_CONDITIONS.map((c) => ({
    id: c.id,
    label: c.label,
    value: c.id,
  })),
]

// Backend supports hoursUsedMax (<= max); options provide upper-bound presets
export const HOURS_OPTIONS = [
  { id: 'all', label: 'الكل', max: '' },
  { id: 'h1', label: 'أقل من 1,000 ساعة', max: '1000' },
  { id: 'h2', label: 'أقل من 3,000 ساعة', max: '3000' },
  { id: 'h3', label: 'أقل من 5,000 ساعة', max: '5000' },
  { id: 'h4', label: 'أقل من 10,000 ساعة', max: '10000' },
]

export function EquipmentFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
  resultsCount,
}: EquipmentFilterBottomSheetProps) {
  const [filters, setFilters] = useState<EquipmentFilterState>({ ...initialFilters })
  const [activeSelector, setActiveSelector] = useState<
    'sort' | 'listingType' | 'category' | 'gov' | 'city' | 'condition' | 'hours' | null
  >(null)
  const [showMore, setShowMore] = useState(false)
  const [sliderResetKey, setSliderResetKey] = useState(0)
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([])
  const [wilayas, setWilayas] = useState<WilayaRef[]>([])

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const val = (filters as any)[key]
    return val !== undefined && val !== ''
  })

  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters })
      setActiveSelector(null)
      setShowMore(false)
      setSliderResetKey((k) => k + 1)
      locationsApi
        .getGovernorates()
        .then((res) => {
          if (Array.isArray(res)) setGovernorates(res)
        })
        .catch(console.warn)
    }
  }, [visible, initialFilters])

  useEffect(() => {
    let cancelled = false
    const govId = filters.governorateId

    setWilayas([])
    if (govId) {
      locationsApi
        .getWilayas(govId)
        .then((res) => {
          if (!cancelled && Array.isArray(res)) setWilayas(res)
        })
        .catch(console.warn)
    }

    return () => {
      cancelled = true
    }
  }, [filters.governorateId])

  const updateFilters = (updates: Partial<EquipmentFilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  const handleApply = () => {
    const cleaned: EquipmentFilterState = { ...filters }

    if (cleaned.priceMin === '0') delete cleaned.priceMin
    if (cleaned.priceMax === '100000') delete cleaned.priceMax
    if (cleaned.yearMin === '1990') delete cleaned.yearMin
    if (cleaned.yearMax === String(new Date().getFullYear())) delete cleaned.yearMax

    // Remove any undefined or empty string values
    ;(Object.keys(cleaned) as (keyof EquipmentFilterState)[]).forEach((k) => {
      if (cleaned[k] === undefined || cleaned[k] === '') {
        delete cleaned[k]
      }
    })

    onApplyFilters(cleaned)
    onClose()
  }

  const onClearFilters = () => {
    setFilters({})
    setActiveSelector(null)
    setSliderResetKey((k) => k + 1)
  }

  const selectedGov = governorates.find((g) => g.id === filters.governorateId)
  const selectedCity = wilayas.find((w) => w.id === filters.wilayaId)
  const currentCategory = (filters.equipmentType || filters.categoryId)
    ? EQUIPMENT_CATEGORIES.find(
        (c) => c.key === filters.equipmentType || c.key === filters.categoryId
      )
    : undefined
  const currentListingType = filters.listingType
    ? LISTING_TYPE_OPTIONS.find((t) => t.value === filters.listingType)
    : undefined
  const currentSort = filters.sortBy
    ? EQUIPMENT_SORT_OPTIONS.find((s) => s.value === filters.sortBy)
    : undefined
  const currentCondition = filters.condition
    ? CONDITION_OPTIONS.find((c) => c.value === filters.condition)
    : undefined
  const currentHours = filters.hoursMax
    ? HOURS_OPTIONS.find((h) => h.max === filters.hoursMax)
    : undefined

  let nestedContent: React.ReactNode = null
  let title = 'تصفية النتائج'

  if (activeSelector === 'sort') {
    title = 'ترتيب النتائج'
    const sortData: SelectOption[] = EQUIPMENT_SORT_OPTIONS.map((o) => ({
      id: o.id,
      label: o.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={sortData}
        selectedValue={currentSort?.id || 'default'}
        onSelect={(opt) => {
          const matched = EQUIPMENT_SORT_OPTIONS.find((o) => o.id === opt?.id)
          updateFilters({ sortBy: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'listingType') {
    title = 'نوع الإعلان'
    const listingTypeData: SelectOption[] = LISTING_TYPE_OPTIONS.map((t) => ({
      id: t.id,
      label: t.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={listingTypeData}
        selectedValue={currentListingType?.id || 'all'}
        onSelect={(opt) => {
          const matched = LISTING_TYPE_OPTIONS.find((t) => t.id === opt?.id)
          updateFilters({ listingType: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'category') {
    title = 'فئة المعدة'
    const categoryData: SelectOption[] = [
      { id: 'all', label: 'الكل' },
      ...EQUIPMENT_CATEGORIES.map((c) => ({ id: c.key, label: c.label })),
    ]
    nestedContent = (
      <NestedSearchableList
        data={categoryData}
        selectedValue={filters.equipmentType || filters.categoryId || 'all'}
        onSelect={(opt) => {
          if (!opt || opt.id === 'all') {
            updateFilters({ equipmentType: undefined, categoryId: undefined })
          } else {
            updateFilters({ equipmentType: opt.id, categoryId: opt.id })
          }
          setActiveSelector(null)
        }}
        placeholder="ابحث عن فئة..."
      />
    )
  } else if (activeSelector === 'gov') {
    title = 'المحافظة'
    const govData: SelectOption[] = [
      { id: 'all', label: 'كل المحافظات' },
      ...governorates.map((g) => ({ id: String(g.id), label: g.nameAr })),
    ]
    nestedContent = (
      <NestedSearchableList
        data={govData}
        selectedValue={filters.governorateId ? String(filters.governorateId) : 'all'}
        onSelect={(opt) => {
          if (!opt || opt.id === 'all') {
            updateFilters({
              governorateId: undefined,
              governorate: undefined,
              wilayaId: undefined,
              city: undefined,
            })
          } else {
            const g = governorates.find((x) => String(x.id) === opt.id)
            updateFilters({
              governorateId: Number(opt.id),
              governorate: g?.nameAr,
              wilayaId: undefined,
              city: undefined,
            })
          }
          setActiveSelector(null)
        }}
        placeholder="ابحث عن محافظة..."
      />
    )
  } else if (activeSelector === 'city') {
    title = 'الولاية'
    const cityData: SelectOption[] = [
      { id: 'all', label: 'كل الولايات' },
      ...wilayas.map((w) => ({ id: String(w.id), label: w.nameAr })),
    ]
    nestedContent = (
      <NestedSearchableList
        data={cityData}
        selectedValue={filters.wilayaId ? String(filters.wilayaId) : 'all'}
        onSelect={(opt) => {
          if (!opt || opt.id === 'all') {
            updateFilters({ wilayaId: undefined, city: undefined })
          } else {
            const w = wilayas.find((x) => String(x.id) === opt.id)
            updateFilters({ wilayaId: Number(opt.id), city: w?.nameAr })
          }
          setActiveSelector(null)
        }}
        placeholder="ابحث عن ولاية..."
      />
    )
  } else if (activeSelector === 'condition') {
    title = 'حالة المعدة'
    const conditionData: SelectOption[] = CONDITION_OPTIONS.map((c) => ({
      id: c.id,
      label: c.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={conditionData}
        selectedValue={currentCondition?.id || 'all'}
        onSelect={(opt) => {
          const matched = CONDITION_OPTIONS.find((c) => c.id === opt?.id)
          updateFilters({ condition: matched?.value, conditionId: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'hours') {
    title = 'ساعات العمل'
    const hoursData: SelectOption[] = HOURS_OPTIONS.map((h) => ({
      id: h.id,
      label: h.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={hoursData}
        selectedValue={currentHours?.id || 'all'}
        onSelect={(opt) => {
          const matched = HOURS_OPTIONS.find((h) => h.id === opt?.id)
          updateFilters({
            hoursMax: matched?.max || undefined,
            hoursId: matched && matched.id !== 'all' ? matched.id : undefined,
          })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  }

  const mainContent = (
    <>
      {/* 1. ترتيب النتائج */}
      <FilterSection title="ترتيب النتائج">
        <DropdownSelector
          value={currentSort?.label}
          placeholder="الترتيب الافتراضي"
          onPress={() => setActiveSelector('sort')}
        />
      </FilterSection>

      {/* 2. المعدة (نوع الإعلان | فئة المعدة) */}
      <FilterSection title="المعدة">
        <View style={s.row}>
          <View style={s.col}>
            <DropdownSelector
              value={currentListingType?.label}
              placeholder="نوع الإعلان"
              onPress={() => setActiveSelector('listingType')}
            />
          </View>
          <View style={s.col}>
            <DropdownSelector
              value={currentCategory?.label}
              placeholder="فئة المعدة"
              onPress={() => setActiveSelector('category')}
            />
          </View>
        </View>
      </FilterSection>

      {/* 3. الموقع (المحافظة | الولاية) */}
      <FilterSection title="الموقع">
        <View style={s.row}>
          <View style={s.col}>
            <DropdownSelector
              value={selectedGov?.nameAr || filters.governorate}
              placeholder="المحافظة"
              onPress={() => setActiveSelector('gov')}
            />
          </View>
          <View style={s.col}>
            <DropdownSelector
              value={selectedCity?.nameAr || filters.city}
              placeholder="الولاية"
              onPress={() => setActiveSelector('city')}
              disabled={!filters.governorateId}
            />
          </View>
        </View>
      </FilterSection>

      {/* 4. نطاق السعر (ر.ع) */}
      <FilterSection title="نطاق السعر (ر.ع)">
        <RangeSlider
          key={`price-${sliderResetKey}`}
          min={0}
          max={100000}
          step={500}
          initialLow={filters.priceMin ? parseInt(filters.priceMin, 10) : 0}
          initialHigh={filters.priceMax ? parseInt(filters.priceMax, 10) : 100000}
          onValuesChangeFinish={(vals) => {
            updateFilters({
              priceMin: vals[0] > 0 ? vals[0].toString() : undefined,
              priceMax: vals[1] < 100000 ? vals[1].toString() : undefined,
              priceId: undefined,
            })
          }}
          suffix="ر.ع"
        />
      </FilterSection>

      {/* 5. سنة الصنع */}
      <FilterSection title="سنة الصنع">
        <RangeSlider
          key={`year-${sliderResetKey}`}
          min={1990}
          max={new Date().getFullYear()}
          step={1}
          initialLow={filters.yearMin ? parseInt(filters.yearMin, 10) : 1990}
          initialHigh={filters.yearMax ? parseInt(filters.yearMax, 10) : new Date().getFullYear()}
          onValuesChangeFinish={(vals) => {
            const currentYear = new Date().getFullYear()
            updateFilters({
              yearMin: vals[0] > 1990 ? vals[0].toString() : undefined,
              yearMax: vals[1] < currentYear ? vals[1].toString() : undefined,
              yearId: undefined,
            })
          }}
        />
      </FilterSection>

      {/* 6. المزيد من الفلاتر */}
      {!showMore ? (
        <TouchableOpacity
          style={s.moreBtn}
          onPress={() => setShowMore(true)}
          activeOpacity={0.7}
        >
          <Text style={s.moreBtnText}>المزيد من الفلاتر</Text>
          <Ionicons name="chevron-down-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      ) : (
        <>
          <FilterSection title="حالة المعدة">
            <DropdownSelector
              value={currentCondition?.label}
              placeholder="الكل"
              onPress={() => setActiveSelector('condition')}
            />
          </FilterSection>

          <FilterSection title="ساعات العمل">
            <DropdownSelector
              value={currentHours?.label}
              placeholder="الكل"
              onPress={() => setActiveSelector('hours')}
            />
          </FilterSection>
        </>
      )}
    </>
  )

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
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
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
  },
})

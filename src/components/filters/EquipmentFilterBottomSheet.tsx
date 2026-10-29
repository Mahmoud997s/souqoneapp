import React, { useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout'
import { FilterSection } from '../ui/FilterSection'
import { FilterChip } from '../ui/FilterChip'
import { DropdownSelector } from '../ui/DropdownSelector'
import { RangeSlider } from '../ui/RangeSlider'
import { NestedSearchableList } from '../ui/NestedSearchableList'
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

const LISTING_TYPE_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  { id: 'EQUIPMENT_SALE', label: 'للبيع', value: 'EQUIPMENT_SALE' },
  { id: 'EQUIPMENT_RENT', label: 'للإيجار', value: 'EQUIPMENT_RENT' },
  { id: 'EQUIPMENT_WANTED', label: 'مطلوب', value: 'EQUIPMENT_WANTED' },
]

// Uses exact values accepted by backend Prisma ItemCondition enum:
// NEW | LIKE_NEW | USED | GOOD | FAIR | POOR
const CONDITION_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  ...EQUIPMENT_CONDITIONS.map((c) => ({
    id: c.id,
    label: c.label,
    value: c.id,
  })),
]

const YEAR_OPTIONS = [
  { id: 'all', label: 'الكل', min: '', max: '' },
  { id: 'y1', label: '2022 - 2024', min: '2022', max: '2024' },
  { id: 'y2', label: '2019 - 2021', min: '2019', max: '2021' },
  { id: 'y3', label: '2015 - 2018', min: '2015', max: '2018' },
  { id: 'y4', label: 'أقدم من 2015', min: '1900', max: '2014' },
]

// Backend supports hoursUsedMax (<= max); options provide upper-bound presets
const HOURS_OPTIONS = [
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
  const [activeSelector, setActiveSelector] = useState<'gov' | 'city' | null>(null)
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
      setSliderResetKey((k) => k + 1)
      locationsApi.getGovernorates()
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
      locationsApi.getWilayas(govId)
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
  const selectedWilaya = wilayas.find((w) => w.id === filters.wilayaId)

  const govData = governorates.map((g) => ({ id: String(g.id), label: g.nameAr }))
  const cityData = wilayas.map((w) => ({ id: String(w.id), label: w.nameAr }))

  let nestedContent = null
  let title = 'تصفية المعدات'

  if (activeSelector === 'gov') {
    title = 'اختر المحافظة'
    nestedContent = (
      <NestedSearchableList
        data={govData}
        selectedValue={filters.governorateId ? String(filters.governorateId) : undefined}
        onSelect={(option) => {
          if (option) {
            updateFilters({
              governorateId: parseInt(option.id, 10),
              governorate: option.label,
              wilayaId: undefined,
              city: undefined,
            })
          } else {
            updateFilters({
              governorateId: undefined,
              governorate: undefined,
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
    title = 'اختر الولاية'
    nestedContent = (
      <NestedSearchableList
        data={cityData}
        selectedValue={filters.wilayaId ? String(filters.wilayaId) : undefined}
        onSelect={(option) => {
          if (option) {
            updateFilters({
              wilayaId: parseInt(option.id, 10),
              city: option.label,
            })
          } else {
            updateFilters({
              wilayaId: undefined,
              city: undefined,
            })
          }
          setActiveSelector(null)
        }}
        placeholder="ابحث عن ولاية..."
      />
    )
  }

  const mainContent = (
    <>
      {/* 1. نوع الإعلان */}
      <FilterSection title="نوع الإعلان">
        <View style={s.wrapRow}>
          {LISTING_TYPE_OPTIONS.map((opt) => {
            const isSelected = opt.value ? filters.listingType === opt.value : !filters.listingType
            return (
              <FilterChip
                key={opt.id}
                label={opt.label}
                isActive={isSelected}
                onPress={() => updateFilters({ listingType: opt.value })}
              />
            )
          })}
        </View>
      </FilterSection>

      {/* 2. فئة المعدة */}
      <FilterSection title="فئة المعدة">
        <View style={s.wrapRow}>
          <FilterChip
            label="الكل"
            isActive={!filters.equipmentType}
            onPress={() => updateFilters({ equipmentType: undefined, categoryId: undefined })}
          />
          {EQUIPMENT_CATEGORIES.map((cat) => {
            const isSelected = filters.equipmentType === cat.key
            return (
              <FilterChip
                key={cat.key}
                label={cat.label}
                isActive={isSelected}
                onPress={() =>
                  updateFilters({
                    equipmentType: isSelected ? undefined : cat.key,
                    categoryId: isSelected ? undefined : cat.key,
                  })
                }
              />
            )
          })}
        </View>
      </FilterSection>

      {/* 3. الموقع */}
      <FilterSection title="الموقع">
        <View style={s.locationRow}>
          <View style={s.locationCol}>
            <DropdownSelector
              value={selectedGov ? selectedGov.nameAr : undefined}
              placeholder="المحافظة"
              onPress={() => setActiveSelector('gov')}
            />
          </View>
          <View style={s.locationCol}>
            <DropdownSelector
              value={selectedWilaya ? selectedWilaya.nameAr : undefined}
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
          key={sliderResetKey}
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

      {/* 5. حالة المعدة */}
      <FilterSection title="حالة المعدة">
        <View style={s.wrapRow}>
          <FilterChip
            label="الكل"
            isActive={!filters.condition}
            onPress={() => updateFilters({ condition: undefined, conditionId: undefined })}
          />
          {CONDITION_OPTIONS.filter((c) => c.value !== undefined).map((c) => {
            const isSelected = filters.condition === c.value
            return (
              <FilterChip
                key={c.id}
                label={c.label}
                isActive={isSelected}
                onPress={() =>
                  updateFilters({
                    condition: isSelected ? undefined : c.value,
                    conditionId: isSelected ? undefined : c.value,
                  })
                }
              />
            )
          })}
        </View>
      </FilterSection>

      {/* 6. سنة الصنع */}
      <FilterSection title="سنة الصنع">
        <View style={s.wrapRow}>
          {YEAR_OPTIONS.map((yr) => {
            const isSelected =
              yr.id === 'all'
                ? !filters.yearMin && !filters.yearMax
                : filters.yearId === yr.id ||
                  (filters.yearMin === yr.min && filters.yearMax === yr.max)
            return (
              <FilterChip
                key={yr.id}
                label={yr.label}
                isActive={isSelected}
                onPress={() => {
                  if (yr.id === 'all') {
                    updateFilters({ yearMin: undefined, yearMax: undefined, yearId: undefined })
                  } else {
                    updateFilters({
                      yearMin: isSelected ? undefined : yr.min,
                      yearMax: isSelected ? undefined : yr.max,
                      yearId: isSelected ? undefined : yr.id,
                    })
                  }
                }}
              />
            )
          })}
        </View>
      </FilterSection>

      {/* 7. ساعات العمل */}
      <FilterSection title="ساعات العمل">
        <View style={s.wrapRow}>
          {HOURS_OPTIONS.map((hr) => {
            const isSelected =
              hr.id === 'all'
                ? !filters.hoursMax
                : filters.hoursId === hr.id || filters.hoursMax === hr.max
            return (
              <FilterChip
                key={hr.id}
                label={hr.label}
                isActive={isSelected}
                onPress={() => {
                  if (hr.id === 'all') {
                    updateFilters({ hoursMax: undefined, hoursId: undefined })
                  } else {
                    updateFilters({
                      hoursMax: isSelected ? undefined : hr.max,
                      hoursId: isSelected ? undefined : hr.id,
                    })
                  }
                }}
              />
            )
          })}
        </View>
      </FilterSection>
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
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationCol: {
    flex: 1,
  },
})

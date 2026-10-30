import React, { useState, useEffect } from 'react'
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout'
import { FilterSection } from '../ui/FilterSection'
import { DropdownSelector } from '../ui/DropdownSelector'
import { RangeSlider } from '../ui/RangeSlider'
import { NestedSearchableList, SelectOption } from '../ui/NestedSearchableList'
import {
  BUS_LISTING_TYPES,
  BUS_TYPES,
  BUS_MAKES,
  BUS_CONDITIONS,
  BUS_TRANSMISSIONS,
  BUS_FUEL_TYPES,
} from '../../constants/buses'
import { locationsApi } from '../../api/locations'
import { GovernorateRef, WilayaRef } from '../../types/location.types'

export interface BusFilters {
  busListingType?: string
  busType?: string
  make?: string
  capacityMin?: number
  minCapacity?: number
  capacityMax?: number
  maxCapacity?: number
  capacityId?: string
  sort?: string
  priceMin?: string
  priceMax?: string
  minPrice?: string
  maxPrice?: string
  priceId?: string
  yearMin?: string
  yearMax?: string
  yearId?: string
  condition?: string
  conditionId?: string
  transmission?: string
  fuelType?: string
  governorate?: string
  city?: string
  governorateId?: number
  wilayaId?: number
}

export interface BusFilterBottomSheetProps {
  visible: boolean
  onClose: () => void
  currentFilters?: BusFilters
  initialFilters?: BusFilters
  onApply?: (filters: BusFilters) => void
  onApplyFilters?: (filters: BusFilters) => void
  resultsCount?: number
}

export const BUS_SORT_OPTIONS = [
  { id: 'default', label: 'الترتيب الافتراضي', value: undefined },
  { id: 'newest', label: 'الأحدث أولاً', value: 'newest' },
  { id: 'price_asc', label: 'السعر: الأقل للأعلى', value: 'price_asc' },
  { id: 'price_desc', label: 'السعر: الأعلى للأقل', value: 'price_desc' },
]

export const BUS_LISTING_TYPE_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  ...BUS_LISTING_TYPES.map((t) => ({
    id: t.id,
    label: t.label,
    value: t.id,
  })),
]

export const BUS_TYPE_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  ...BUS_TYPES.map((t) => ({
    id: t.id,
    label: t.label,
    value: t.id,
  })),
]

export const BUS_MAKE_OPTIONS = [
  { id: 'all', label: 'كل الماركات', value: undefined },
  ...BUS_MAKES.map((m) => ({
    id: m.id,
    label: m.label,
    value: m.id,
  })),
]

export const BUS_CAPACITY_OPTIONS = [
  { id: 'all', label: 'الكل', min: undefined },
  { id: 'cap_10', label: '+ 10 مقاعد', min: 10 },
  { id: 'cap_15', label: '+ 15 مقعد', min: 15 },
  { id: 'cap_30', label: '+ 30 مقعد', min: 30 },
  { id: 'cap_45', label: '+ 45 مقعد', min: 45 },
  { id: 'cap_50', label: '+ 50 مقعد', min: 50 },
]

export const BUS_CONDITION_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  ...BUS_CONDITIONS.map((c) => ({
    id: c.id,
    label: c.label,
    value: c.id,
  })),
]

export const BUS_TRANSMISSION_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  ...BUS_TRANSMISSIONS.map((t) => ({
    id: t.id,
    label: t.label,
    value: t.id,
  })),
]

export const BUS_FUEL_OPTIONS = [
  { id: 'all', label: 'الكل', value: undefined },
  ...BUS_FUEL_TYPES.map((f) => ({
    id: f.id,
    label: f.label,
    value: f.id,
  })),
]

const MIN_PRICE = 0
const MAX_PRICE = 100000
const MIN_YEAR = 1990
const MAX_YEAR = new Date().getFullYear() + 1

export function BusFilterBottomSheet({
  visible,
  onClose,
  currentFilters,
  initialFilters,
  onApply,
  onApplyFilters,
  resultsCount,
}: BusFilterBottomSheetProps) {
  const incoming = initialFilters || currentFilters || {}
  const [filters, setFilters] = useState<BusFilters>({ ...incoming })
  const [activeSelector, setActiveSelector] = useState<
    | 'sort'
    | 'listingType'
    | 'busType'
    | 'make'
    | 'capacity'
    | 'gov'
    | 'city'
    | 'condition'
    | 'transmission'
    | 'fuelType'
    | null
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
      setFilters({ ...incoming })
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
  }, [visible, currentFilters, initialFilters])

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

  const updateFilters = (updates: Partial<BusFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  const handleApply = () => {
    const cleaned: BusFilters = { ...filters }

    if (cleaned.priceMin === String(MIN_PRICE)) delete cleaned.priceMin
    if (cleaned.minPrice === String(MIN_PRICE)) delete cleaned.minPrice
    if (cleaned.priceMax === String(MAX_PRICE)) delete cleaned.priceMax
    if (cleaned.maxPrice === String(MAX_PRICE)) delete cleaned.maxPrice
    if (cleaned.yearMin === String(MIN_YEAR)) delete cleaned.yearMin
    if (cleaned.yearMax === String(MAX_YEAR)) delete cleaned.yearMax

    // Remove any undefined or empty string values
    ;(Object.keys(cleaned) as (keyof BusFilters)[]).forEach((k) => {
      if (cleaned[k] === undefined || cleaned[k] === '') {
        delete cleaned[k]
      }
    })

    if (onApplyFilters) {
      onApplyFilters(cleaned)
    }
    if (onApply) {
      onApply(cleaned)
    }
    onClose()
  }

  const onClearFilters = () => {
    setFilters({})
    setActiveSelector(null)
    setSliderResetKey((k) => k + 1)
  }

  const selectedGov = governorates.find((g) => g.id === filters.governorateId)
  const selectedCity = wilayas.find((w) => w.id === filters.wilayaId)

  const currentSort = filters.sort
    ? BUS_SORT_OPTIONS.find((s) => s.value === filters.sort)
    : undefined

  const currentListingType = filters.busListingType
    ? BUS_LISTING_TYPE_OPTIONS.find((t) => t.value === filters.busListingType)
    : undefined

  const currentBusType = filters.busType
    ? BUS_TYPE_OPTIONS.find((t) => t.value === filters.busType)
    : undefined

  const currentMake = filters.make
    ? BUS_MAKE_OPTIONS.find((m) => m.value === filters.make)
    : undefined

  const activeCapacityVal = filters.minCapacity ?? filters.capacityMin
  const currentCapacity = activeCapacityVal !== undefined
    ? BUS_CAPACITY_OPTIONS.find((c) => c.min === activeCapacityVal)
    : undefined

  const currentCondition = filters.condition
    ? BUS_CONDITION_OPTIONS.find((c) => c.value === filters.condition)
    : undefined

  const currentTransmission = filters.transmission
    ? BUS_TRANSMISSION_OPTIONS.find((t) => t.value === filters.transmission)
    : undefined

  const currentFuel = filters.fuelType
    ? BUS_FUEL_OPTIONS.find((f) => f.value === filters.fuelType)
    : undefined

  let nestedContent: React.ReactNode = null
  let title = 'تصفية النتائج'

  if (activeSelector === 'sort') {
    title = 'ترتيب النتائج'
    const sortData: SelectOption[] = BUS_SORT_OPTIONS.map((o) => ({
      id: o.id,
      label: o.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={sortData}
        selectedValue={currentSort?.id || 'default'}
        onSelect={(opt) => {
          const matched = BUS_SORT_OPTIONS.find((o) => o.id === opt?.id)
          updateFilters({ sort: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'listingType') {
    title = 'نوع الإعلان'
    const listingTypeData: SelectOption[] = BUS_LISTING_TYPE_OPTIONS.map((t) => ({
      id: t.id,
      label: t.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={listingTypeData}
        selectedValue={currentListingType?.id || 'all'}
        onSelect={(opt) => {
          const matched = BUS_LISTING_TYPE_OPTIONS.find((t) => t.id === opt?.id)
          updateFilters({ busListingType: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'busType') {
    title = 'فئة الحافلة'
    const busTypeData: SelectOption[] = BUS_TYPE_OPTIONS.map((t) => ({
      id: t.id,
      label: t.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={busTypeData}
        selectedValue={currentBusType?.id || 'all'}
        onSelect={(opt) => {
          const matched = BUS_TYPE_OPTIONS.find((t) => t.id === opt?.id)
          updateFilters({ busType: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'make') {
    title = 'ماركة الحافلة'
    const makeData: SelectOption[] = BUS_MAKE_OPTIONS.map((m) => ({
      id: m.id,
      label: m.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={makeData}
        selectedValue={currentMake?.id || 'all'}
        onSelect={(opt) => {
          const matched = BUS_MAKE_OPTIONS.find((m) => m.id === opt?.id)
          updateFilters({ make: matched?.value })
          setActiveSelector(null)
        }}
        placeholder="ابحث عن ماركة..."
      />
    )
  } else if (activeSelector === 'capacity') {
    title = 'سعة الركاب'
    const capData: SelectOption[] = BUS_CAPACITY_OPTIONS.map((c) => ({
      id: c.id,
      label: c.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={capData}
        selectedValue={currentCapacity?.id || 'all'}
        onSelect={(opt) => {
          const matched = BUS_CAPACITY_OPTIONS.find((c) => c.id === opt?.id)
          updateFilters({
            capacityMin: matched?.min,
            minCapacity: matched?.min,
            capacityId: matched && matched.id !== 'all' ? matched.id : undefined,
          })
          setActiveSelector(null)
        }}
        hideSearch
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
    title = 'حالة الحافلة'
    const conditionData: SelectOption[] = BUS_CONDITION_OPTIONS.map((c) => ({
      id: c.id,
      label: c.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={conditionData}
        selectedValue={currentCondition?.id || 'all'}
        onSelect={(opt) => {
          const matched = BUS_CONDITION_OPTIONS.find((c) => c.id === opt?.id)
          updateFilters({ condition: matched?.value, conditionId: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'transmission') {
    title = 'ناقل الحركة'
    const transmissionData: SelectOption[] = BUS_TRANSMISSION_OPTIONS.map((t) => ({
      id: t.id,
      label: t.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={transmissionData}
        selectedValue={currentTransmission?.id || 'all'}
        onSelect={(opt) => {
          const matched = BUS_TRANSMISSION_OPTIONS.find((t) => t.id === opt?.id)
          updateFilters({ transmission: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  } else if (activeSelector === 'fuelType') {
    title = 'نوع الوقود'
    const fuelData: SelectOption[] = BUS_FUEL_OPTIONS.map((f) => ({
      id: f.id,
      label: f.label,
    }))
    nestedContent = (
      <NestedSearchableList
        data={fuelData}
        selectedValue={currentFuel?.id || 'all'}
        onSelect={(opt) => {
          const matched = BUS_FUEL_OPTIONS.find((f) => f.id === opt?.id)
          updateFilters({ fuelType: matched?.value })
          setActiveSelector(null)
        }}
        hideSearch
      />
    )
  }

  const initialLowPrice = filters.priceMin
    ? parseInt(filters.priceMin, 10)
    : filters.minPrice
    ? parseInt(filters.minPrice, 10)
    : MIN_PRICE

  const initialHighPrice = filters.priceMax
    ? parseInt(filters.priceMax, 10)
    : filters.maxPrice
    ? parseInt(filters.maxPrice, 10)
    : MAX_PRICE

  const initialLowYear = filters.yearMin ? parseInt(filters.yearMin, 10) : MIN_YEAR
  const initialHighYear = filters.yearMax ? parseInt(filters.yearMax, 10) : MAX_YEAR

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

      {/* 2. الحافلة (نوع الإعلان | فئة الحافلة) */}
      <FilterSection title="الحافلة">
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
              value={currentBusType?.label}
              placeholder="فئة الحافلة"
              onPress={() => setActiveSelector('busType')}
            />
          </View>
        </View>
      </FilterSection>

      {/* 3. الماركة والسعة (الماركة | سعة الركاب) */}
      <FilterSection title="الماركة والسعة">
        <View style={s.row}>
          <View style={s.col}>
            <DropdownSelector
              value={currentMake?.label}
              placeholder="الماركة"
              onPress={() => setActiveSelector('make')}
            />
          </View>
          <View style={s.col}>
            <DropdownSelector
              value={currentCapacity?.label}
              placeholder="سعة الركاب"
              onPress={() => setActiveSelector('capacity')}
            />
          </View>
        </View>
      </FilterSection>

      {/* 4. الموقع (المحافظة | الولاية) */}
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

      {/* 5. نطاق السعر (ر.ع) */}
      <FilterSection title="نطاق السعر (ر.ع)">
        <RangeSlider
          key={`price-${sliderResetKey}`}
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={500}
          initialLow={initialLowPrice}
          initialHigh={initialHighPrice}
          onValuesChangeFinish={(vals) => {
            updateFilters({
              priceMin: vals[0] > MIN_PRICE ? vals[0].toString() : undefined,
              priceMax: vals[1] < MAX_PRICE ? vals[1].toString() : undefined,
              minPrice: vals[0] > MIN_PRICE ? vals[0].toString() : undefined,
              maxPrice: vals[1] < MAX_PRICE ? vals[1].toString() : undefined,
              priceId: undefined,
            })
          }}
          suffix="ر.ع"
        />
      </FilterSection>

      {/* 6. سنة الصنع */}
      <FilterSection title="سنة الصنع">
        <RangeSlider
          key={`year-${sliderResetKey}`}
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          initialLow={initialLowYear}
          initialHigh={initialHighYear}
          onValuesChangeFinish={(vals) => {
            updateFilters({
              yearMin: vals[0] > MIN_YEAR ? vals[0].toString() : undefined,
              yearMax: vals[1] < MAX_YEAR ? vals[1].toString() : undefined,
              yearId: undefined,
            })
          }}
        />
      </FilterSection>

      {/* 7. المزيد من الفلاتر */}
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
          <FilterSection title="حالة الحافلة">
            <DropdownSelector
              value={currentCondition?.label}
              placeholder="الكل"
              onPress={() => setActiveSelector('condition')}
            />
          </FilterSection>

          <FilterSection title="ناقل الحركة">
            <DropdownSelector
              value={currentTransmission?.label}
              placeholder="الكل"
              onPress={() => setActiveSelector('transmission')}
            />
          </FilterSection>

          <FilterSection title="نوع الوقود">
            <DropdownSelector
              value={currentFuel?.label}
              placeholder="الكل"
              onPress={() => setActiveSelector('fuelType')}
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
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moreBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.primary,
  },
})

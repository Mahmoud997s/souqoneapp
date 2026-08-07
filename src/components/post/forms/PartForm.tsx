import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Platform,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, { SlideInDown } from 'react-native-reanimated'
import { carsApi, CarBrand } from '../../../api/cars'
import { usePostStore } from '../../../store/postStore'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_ORIGINALITY_OPTIONS,
  POPULAR_PART_MAKES,
} from '../../../constants/parts'

interface BrandItem {
  id: string
  label: string
  subLabel?: string
}

export function PartForm() {
  const { title, description, price, isPriceNegotiable, details, set, setDetail } = usePostStore()
  const [focusedField, setFocusedField] = useState<string>('')
  const [brandModalVisible, setBrandModalVisible] = useState<boolean>(false)
  const [brandSearch, setBrandSearch] = useState<string>('')
  const [apiBrands, setApiBrands] = useState<CarBrand[]>([])

  const priceInputRef = useRef<TextInput>(null)

  // Year picker modal state
  const [yearPickerModal, setYearPickerModal] = useState<{
    visible: boolean
    field: 'yearFrom' | 'yearTo' | null
    title: string
  }>({
    visible: false,
    field: null,
    title: '',
  })
  const [yearSearch, setYearSearch] = useState<string>('')

  // Model picker modal state
  const [modelModalVisible, setModelModalVisible] = useState<boolean>(false)
  const [modelSearch, setModelSearch] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<
    { id: string; label: string; subLabel?: string; makeName?: string }[]
  >([])
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false)

  const {
    partCategory = 'ENGINE',
    condition = 'USED',
    isOriginal = true,
    partNumber = '',
    compatibleMakes = [],
    compatibleModels = '',
    yearFrom = '',
    yearTo = '',
    contactPhone = '',
    whatsapp = '',
  } = details || {}

  // Fetch full brand list from API
  useEffect(() => {
    let isMounted = true
    carsApi
      .getBrands()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setApiBrands(data)
        }
      })
      .catch(() => {
        // Fallback silently to POPULAR_PART_MAKES
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Initialize defaults
  useEffect(() => {
    if (!details?.partCategory) {
      setDetail('partCategory', 'ENGINE')
    }
    if (!details?.condition) {
      setDetail('condition', 'USED')
    }
    if (details?.isOriginal === undefined) {
      setDetail('isOriginal', true)
    }
  }, [])

  // Unified brand list for the modal
  const allBrandsList = useMemo<BrandItem[]>(() => {
    const list: BrandItem[] = [
      { id: 'all', label: 'متوافق مع جميع السيارات', subLabel: 'Universal Fit' },
    ]

    if (apiBrands.length > 0) {
      apiBrands.forEach((b) => {
        list.push({
          id: b.id || b.name,
          label: b.nameAr || b.name,
          subLabel: b.nameAr ? b.name : undefined,
        })
      })
    } else {
      POPULAR_PART_MAKES.forEach((m) => {
        if (m.id !== 'all') {
          list.push({ id: m.id, label: m.label })
        }
      })
    }

    return list
  }, [apiBrands])

  // Filtered list based on search query
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return allBrandsList
    const q = brandSearch.trim().toLowerCase()
    return allBrandsList.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        (b.subLabel && b.subLabel.toLowerCase().includes(q))
    )
  }, [allBrandsList, brandSearch])

  // Year options for modal
  const CURRENT_YEAR = new Date().getFullYear() + 1
  const YEARS_OPTIONS = useMemo(() => {
    return Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => String(CURRENT_YEAR - i))
  }, [CURRENT_YEAR])

  const filteredYearOptions = useMemo(() => {
    if (!yearSearch) return YEARS_OPTIONS
    return YEARS_OPTIONS.filter((y) => y.includes(yearSearch))
  }, [yearSearch, YEARS_OPTIONS])

  // Convert compatibleModels to array of strings
  const selectedModelsList = useMemo<string[]>(() => {
    if (!compatibleModels) return []
    if (Array.isArray(compatibleModels)) return compatibleModels
    if (typeof compatibleModels === 'string') {
      return compatibleModels
        .split(/[,،]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return []
  }, [compatibleModels])

  const selectedModelsCount = selectedModelsList.length

  // Stable keys to avoid infinite loops from array reference changes
  const compatibleMakesKey = useMemo(
    () => JSON.stringify(Array.isArray(compatibleMakes) ? [...compatibleMakes].sort() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(compatibleMakes)]
  )
  const apiBrandsKey = apiBrands.length

  // Fetch models for selected brands
  useEffect(() => {
    let isMounted = true
    const selectedMakeIds: string[] = []

    if (Array.isArray(compatibleMakes)) {
      compatibleMakes.forEach((makeIdOrLabel: string) => {
        if (makeIdOrLabel !== 'all' && makeIdOrLabel !== 'متوافق مع جميع السيارات') {
          const found = apiBrands.find(
            (b) => b.id === makeIdOrLabel || b.name === makeIdOrLabel || b.nameAr === makeIdOrLabel
          )
          if (found) {
            selectedMakeIds.push(found.id)
          } else {
            selectedMakeIds.push(makeIdOrLabel)
          }
        }
      })
    }

    if (selectedMakeIds.length === 0) {
      setAvailableModels([
        { id: 'all', label: 'متوافق مع جميع الموديلات', subLabel: 'Universal Models' },
      ])
      return
    }

    setIsLoadingModels(true)
    Promise.allSettled(
      selectedMakeIds.map((id) =>
        carsApi.getModels(id).then((models) => ({
          brandId: id,
          brandName:
            apiBrands.find((b) => b.id === id)?.nameAr ||
            apiBrands.find((b) => b.id === id)?.name ||
            id,
          models,
        }))
      )
    )
      .then((results) => {
        if (!isMounted) return
        const list: { id: string; label: string; subLabel?: string; makeName?: string }[] = [
          { id: 'all', label: 'متوافق مع جميع الموديلات', subLabel: 'Universal Models' },
        ]

        results.forEach((res) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value.models)) {
            res.value.models.forEach((m) => {
              const label = m.nameAr || m.name
              if (!list.some((existing) => existing.label.toLowerCase() === label.toLowerCase())) {
                list.push({
                  id: m.id || m.name,
                  label,
                  subLabel: m.nameAr ? m.name : undefined,
                  makeName: res.value.brandName,
                })
              }
            })
          }
        })
        setAvailableModels(list)
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingModels(false)
      })

    return () => {
      isMounted = false
    }
  }, [compatibleMakesKey, apiBrandsKey])

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return availableModels
    const q = modelSearch.trim().toLowerCase()
    return availableModels.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        (m.subLabel && m.subLabel.toLowerCase().includes(q)) ||
        (m.makeName && m.makeName.toLowerCase().includes(q))
    )
  }, [availableModels, modelSearch])

  const canAddCustomModel = useMemo(() => {
    if (!modelSearch.trim()) return false
    const q = modelSearch.trim().toLowerCase()
    const alreadyExists = availableModels.some((m) => m.label.toLowerCase() === q)
    const alreadySelected = selectedModelsList.some((m) => m.toLowerCase() === q)
    return !alreadyExists && !alreadySelected
  }, [modelSearch, availableModels, selectedModelsList])

  const addCustomModel = () => {
    const trimmed = modelSearch.trim()
    if (!trimmed) return
    Haptics.selectionAsync().catch(() => {})
    const cleanList = selectedModelsList.filter(
      (m) => m !== 'all' && m !== 'جميع الموديلات' && m !== 'متوافق مع جميع الموديلات'
    )
    setDetail('compatibleModels', [...cleanList, trimmed])
    setModelSearch('')
  }

  const toggleModel = useCallback(
    (modelNameOrId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      let list = [...selectedModelsList]

      if (
        modelNameOrId === 'all' ||
        modelNameOrId === 'جميع الموديلات' ||
        modelNameOrId === 'متوافق مع جميع الموديلات'
      ) {
        if (
          list.includes('all') ||
          list.includes('جميع الموديلات') ||
          list.includes('متوافق مع جميع الموديلات')
        ) {
          list = []
        } else {
          list = ['متوافق مع جميع الموديلات']
        }
      } else {
        list = list.filter(
          (m) => m !== 'all' && m !== 'جميع الموديلات' && m !== 'متوافق مع جميع الموديلات'
        )
        const idx = list.indexOf(modelNameOrId)
        if (idx > -1) {
          list.splice(idx, 1)
        } else {
          list.push(modelNameOrId)
        }
      }
      setDetail('compatibleModels', list)
    },
    [selectedModelsList, setDetail]
  )

  const removeModel = useCallback(
    (modelItem: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      const list = selectedModelsList.filter((m) => m !== modelItem)
      setDetail('compatibleModels', list)
    },
    [selectedModelsList, setDetail]
  )

  const openYearPicker = (field: 'yearFrom' | 'yearTo') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setYearSearch('')
    setYearPickerModal({
      visible: true,
      field,
      title: field === 'yearFrom' ? 'سنة البداية (من سنة)' : 'سنة النهاية (إلى سنة)',
    })
  }

  const selectYearValue = (yearVal: string) => {
    Haptics.selectionAsync().catch(() => {})
    if (yearPickerModal.field) {
      setDetail(yearPickerModal.field, yearVal)
    }
    setYearPickerModal({ visible: false, field: null, title: '' })
  }

  // Toggle make selection
  const toggleMake = useCallback(
    (makeIdOrLabel: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      let list = Array.isArray(compatibleMakes) ? [...compatibleMakes] : []

      if (makeIdOrLabel === 'all' || makeIdOrLabel === 'متوافق مع جميع السيارات') {
        if (list.includes('all') || list.includes('متوافق مع جميع السيارات')) {
          list = []
        } else {
          list = ['all']
        }
      } else {
        list = list.filter((m) => m !== 'all' && m !== 'متوافق مع جميع السيارات')
        const idx = list.indexOf(makeIdOrLabel)
        if (idx > -1) {
          list.splice(idx, 1)
        } else {
          list.push(makeIdOrLabel)
        }
      }
      setDetail('compatibleMakes', list)
    },
    [compatibleMakes, setDetail]
  )

  // Remove make chip
  const removeMake = useCallback(
    (makeItem: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      const list = Array.isArray(compatibleMakes)
        ? compatibleMakes.filter((m: string) => m !== makeItem)
        : []
      setDetail('compatibleMakes', list)
    },
    [compatibleMakes, setDetail]
  )

  // Get brand display label
  const getBrandLabel = (makeKey: string): string => {
    if (makeKey === 'all' || makeKey === 'متوافق مع جميع السيارات') {
      return 'متوافق مع الجميع'
    }
    const found = allBrandsList.find((b) => b.id === makeKey || b.label === makeKey)
    return found ? found.label : makeKey
  }

  // Render chip options
  const renderChips = (
    field: string,
    options: { id?: string; value?: any; label: string; icon?: string }[],
    currentValue: any
  ) => (
    <View style={s.chipRow}>
      {options.map((opt) => {
        const optKey = opt.id !== undefined ? opt.id : opt.value
        const active = currentValue === optKey
        return (
          <TouchableOpacity
            key={String(optKey)}
            style={[s.chip, active && s.chipActive]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {})
              setDetail(field, optKey)
            }}
            activeOpacity={0.7}
          >
            {opt.icon && (
              <Ionicons
                name={opt.icon as any}
                size={16}
                color={active ? Colors.primary : Colors.textMuted}
                style={{ marginEnd: Spacing.space2 }}
              />
            )}
            <Text style={[s.chipTxt, active && s.chipTxtActive]}>{opt.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  const selectedMakesCount = Array.isArray(compatibleMakes) ? compatibleMakes.length : 0

  // True only if user picked at least one specific brand (not 'all')
  const hasSpecificBrands = useMemo(
    () =>
      Array.isArray(compatibleMakes) &&
      compatibleMakes.some(
        (m: string) => m !== 'all' && m !== 'متوافق مع جميع السيارات'
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compatibleMakesKey]
  )

  return (
    <Animated.View entering={SlideInDown.duration(400).springify()} style={s.container}>
      {/* ── 1. قسم قطعة الغيار ── */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <MaterialCommunityIcons name="cogs" size={18} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>قسم قطعة الغيار</Text>
        </View>

        <View style={s.categoriesGrid}>
          {PART_CATEGORIES.map((cat) => {
            const active = partCategory === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.categoryCard, active && s.categoryCardActive]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {})
                  setDetail('partCategory', cat.id)
                }}
                activeOpacity={0.7}
              >
                <View style={[s.categoryIconBox, active && s.categoryIconBoxActive]}>
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={20}
                    color={active ? Colors.primary : Colors.textMuted}
                  />
                </View>
                <Text style={[s.categoryLabel, active && s.categoryLabelActive]} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* ── 2. المعلومات الأساسية ── */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <MaterialCommunityIcons name="information-variant" size={18} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>المعلومات الأساسية</Text>
        </View>

        <Text style={s.label}>عنوان الإعلان *</Text>
        <TextInput
          style={[s.textInput, focusedField === 'title' && s.textInputFocused]}
          placeholder="مثال: كمبريسور مكيف وكالة أصلي لكزس ES350"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={(v) => set({ title: v })}
          onFocus={() => setFocusedField('title')}
          onBlur={() => setFocusedField('')}
        />

        <Text style={s.label}>الوصف *</Text>
        <TextInput
          style={[s.textInput, s.textArea, focusedField === 'desc' && s.textInputFocused]}
          placeholder="اكتب تفاصيل إضافية مثل: حالة القطعة، فترة الضمان إن وجدت، موقع الاستلام..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={(v) => set({ description: v })}
          multiline
          textAlignVertical="top"
          onFocus={() => setFocusedField('desc')}
          onBlur={() => setFocusedField('')}
        />

        <Text style={s.label}>حالة القطعة *</Text>
        {renderChips('condition', PART_CONDITIONS, condition)}

        <Text style={s.label}>الأصالة *</Text>
        {renderChips('isOriginal', PART_ORIGINALITY_OPTIONS, isOriginal)}

        <Text style={s.label}>رقم القطعة / Part Number (اختياري)</Text>
        <TextInput
          style={[s.textInput, focusedField === 'partNumber' && s.textInputFocused]}
          placeholder="مثال: OEM-90919-02244"
          placeholderTextColor={Colors.textMuted}
          value={partNumber}
          onChangeText={(t) => setDetail('partNumber', t)}
          autoCapitalize="characters"
          onFocus={() => setFocusedField('partNumber')}
          onBlur={() => setFocusedField('')}
        />
      </View>

      {/* ── 2. التوافق مع السيارات ── */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <MaterialCommunityIcons name="car-multiple" size={18} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>التوافق مع السيارات</Text>
        </View>

        <Text style={s.label}>الماركات المتوافقة</Text>
        <TouchableOpacity
          style={[s.selectorButton, selectedMakesCount > 0 && s.selectorButtonActive]}
          activeOpacity={0.7}
          onPress={() => setBrandModalVisible(true)}
        >
          <View style={s.selectorIconWrap}>
            <Ionicons
              name="car-sport-outline"
              size={20}
              color={selectedMakesCount > 0 ? Colors.primary : Colors.textMuted}
            />
          </View>
          <View style={s.selectorContent}>
            <Text style={[s.selectorText, selectedMakesCount === 0 && s.placeholder]}>
              {selectedMakesCount === 0
                ? 'اختر الماركات المتوافقة'
                : selectedMakesCount === 1 && (compatibleMakes[0] === 'all' || compatibleMakes[0] === 'متوافق مع جميع السيارات')
                ? 'متوافق مع جميع السيارات'
                : `تم اختيار (${selectedMakesCount}) ماركات`}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={selectedMakesCount > 0 ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>

        {/* Selected Makes Chips */}
        {selectedMakesCount > 0 && (
          <View style={s.selectedMakesWrap}>
            {compatibleMakes.map((makeItem: string) => (
              <View key={makeItem} style={s.makeChip}>
                <Text style={s.makeChipText}>{getBrandLabel(makeItem)}</Text>
                <TouchableOpacity
                  style={s.makeChipRemove}
                  onPress={() => removeMake(makeItem)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={s.label}>الموديلات المتوافقة</Text>

        {/* Hint: select brand first */}
        {!hasSpecificBrands && (
          <View style={s.brandHintBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={s.brandHintText}>حدد ماركة أولاً لعرض الموديلات المتوفرة</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            s.selectorButton,
            selectedModelsCount > 0 && s.selectorButtonActive,
            !hasSpecificBrands && s.selectorButtonDisabled,
          ]}
          activeOpacity={hasSpecificBrands ? 0.7 : 1}
          onPress={() => {
            if (!hasSpecificBrands) return
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
            setModelModalVisible(true)
          }}
        >
          <View style={s.selectorIconWrap}>
            <Ionicons
              name="layers-outline"
              size={20}
              color={
                !hasSpecificBrands
                  ? Colors.textMuted
                  : selectedModelsCount > 0
                  ? Colors.primary
                  : Colors.textMuted
              }
            />
          </View>
          <View style={s.selectorContent}>
            <Text
              style={[
                s.selectorText,
                (selectedModelsCount === 0 || !hasSpecificBrands) && s.placeholder,
              ]}
            >
              {!hasSpecificBrands
                ? 'اختر الماركة أولاً…'
                : selectedModelsCount === 0
                ? 'اختر الموديلات المتوافقة'
                : selectedModelsCount === 1 &&
                  (selectedModelsList[0] === 'all' ||
                    selectedModelsList[0] === 'جميع الموديلات' ||
                    selectedModelsList[0] === 'متوافق مع جميع الموديلات')
                ? 'متوافق مع جميع الموديلات'
                : `تم اختيار (${selectedModelsCount}) موديلات`}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={
              !hasSpecificBrands
                ? Colors.textMuted
                : selectedModelsCount > 0
                ? Colors.primary
                : Colors.textMuted
            }
          />
        </TouchableOpacity>

        {/* Selected Models Chips */}
        {selectedModelsCount > 0 && (
          <View style={s.selectedMakesWrap}>
            {selectedModelsList.map((modelItem: string) => (
              <View key={modelItem} style={s.makeChip}>
                <Text style={s.makeChipText}>{modelItem}</Text>
                <TouchableOpacity
                  style={s.makeChipRemove}
                  onPress={() => removeModel(modelItem)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>من سنة</Text>
            <TouchableOpacity
              style={[s.selectorButton, !!yearFrom && s.selectorButtonActive]}
              onPress={() => openYearPicker('yearFrom')}
              activeOpacity={0.7}
            >
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !yearFrom && s.placeholder]}>
                  {yearFrom ? String(yearFrom) : 'اختر السنة'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={yearFrom ? Colors.primary : Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>إلى سنة</Text>
            <TouchableOpacity
              style={[s.selectorButton, !!yearTo && s.selectorButtonActive]}
              onPress={() => openYearPicker('yearTo')}
              activeOpacity={0.7}
            >
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !yearTo && s.placeholder]}>
                  {yearTo ? String(yearTo) : 'اختر السنة'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={yearTo ? Colors.primary : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 3. السعر والتفاصيل المالية ── */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <MaterialCommunityIcons name="cash-multiple" size={18} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>السعر والتفاصيل المالية</Text>
        </View>

        <Text style={s.label}>السعر (ر.ع) *</Text>
        <Pressable
          style={[s.priceWrap, focusedField === 'price' && s.priceWrapFocused]}
          onPress={() => priceInputRef.current?.focus()}
        >
          <TextInput
            ref={priceInputRef}
            style={s.priceInput}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={price != null ? String(price) : ''}
            onChangeText={(t) => set({ price: t })}
            onFocus={() => setFocusedField('price')}
            onBlur={() => setFocusedField('')}
          />
          <View style={s.currencyBadge} pointerEvents="none">
            <Text style={s.currencyTxt}>ر.ع</Text>
          </View>
        </Pressable>

        <TouchableOpacity
          style={s.negotiableRow}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {})
            set({ isPriceNegotiable: !isPriceNegotiable })
          }}
          activeOpacity={0.7}
        >
          <View style={[s.checkbox, isPriceNegotiable && s.checkboxActive]}>
            {isPriceNegotiable && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={s.negotiableTxt}>السعر قابل للتفاوض</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4. أرقام التواصل ── */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <Ionicons name="call-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>أرقام التواصل (اختياري)</Text>
        </View>

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>رقم الاتصال</Text>
            <TextInput
              style={[s.textInput, focusedField === 'contactPhone' && s.textInputFocused]}
              placeholder="مثال: 91234567"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={(t) => setDetail('contactPhone', t)}
              onFocus={() => setFocusedField('contactPhone')}
              onBlur={() => setFocusedField('')}
            />
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>رقم الواتساب</Text>
            <TextInput
              style={[s.textInput, focusedField === 'whatsapp' && s.textInputFocused]}
              placeholder="مثال: 91234567"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={whatsapp}
              onChangeText={(t) => setDetail('whatsapp', t)}
              onFocus={() => setFocusedField('whatsapp')}
              onBlur={() => setFocusedField('')}
            />
          </View>
        </View>
      </View>

      {/* ── Bottom Sheet Modal: اختيار الماركات المتوافقة ── */}
      <Modal
        visible={brandModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBrandModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalSheet}>
            {/* Handle bar */}
            <View style={s.handleBar} />

            {/* Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>الماركات المتوافقة</Text>
                <Text style={s.modalSubtitle}>يمكنك اختيار أكثر من ماركة أو اختيار الجميع</Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setBrandModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={s.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginEnd: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="ابحث عن اسم الماركة..."
                placeholderTextColor={Colors.textMuted}
                value={brandSearch}
                onChangeText={setBrandSearch}
                autoCorrect={false}
              />
              {brandSearch.length > 0 && (
                <TouchableOpacity onPress={() => setBrandSearch('')}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Brands List */}
            <FlatList
              data={filteredBrands}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => {
                const isSelected =
                  Array.isArray(compatibleMakes) &&
                  (compatibleMakes.includes(item.id) ||
                    compatibleMakes.includes(item.label) ||
                    (item.id === 'all' && compatibleMakes.includes('all')))

                return (
                  <TouchableOpacity
                    style={[s.modalListItem, isSelected && s.modalListItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => toggleMake(item.id)}
                  >
                    <View style={s.modalItemLeft}>
                      <View style={[s.checkboxRound, isSelected && s.checkboxRoundSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                      </View>
                    </View>

                    <View style={s.modalItemContent}>
                      <Text style={[s.modalItemTitle, isSelected && s.modalItemTitleSelected]}>
                        {item.label}
                      </Text>
                      {item.subLabel ? (
                        <Text style={s.modalItemSub}>{item.subLabel}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )
              }}
            />

            {/* Done Button */}
            <View style={s.modalFooter}>
              <TouchableOpacity
                style={s.doneButton}
                activeOpacity={0.9}
                onPress={() => setBrandModalVisible(false)}
              >
                <Text style={s.doneButtonText}>
                  {selectedMakesCount > 0
                    ? `تأكيد الاختيار (${selectedMakesCount})`
                    : 'إغلاق'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Bottom Sheet Modal: اختيار الموديلات المتوافقة ── */}
      <Modal
        visible={modelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModelModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalSheet}>
            {/* Handle bar */}
            <View style={s.handleBar} />

            {/* Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>الموديلات المتوافقة</Text>
                <Text style={s.modalSubtitle}>يمكنك اختيار أكثر من موديل أو كتابة موديل مخصص</Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setModelModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={s.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginEnd: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="ابحث عن موديل أو اكتب موديل جديد..."
                placeholderTextColor={Colors.textMuted}
                value={modelSearch}
                onChangeText={setModelSearch}
                autoCorrect={false}
              />
              {modelSearch.length > 0 && (
                <TouchableOpacity onPress={() => setModelSearch('')}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Add custom model button */}
            {canAddCustomModel && (
              <TouchableOpacity
                style={s.addCustomModelBtn}
                activeOpacity={0.8}
                onPress={addCustomModel}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={s.addCustomModelText}>
                  إضافة موديل "{modelSearch.trim()}"
                </Text>
              </TouchableOpacity>
            )}

            {/* Models List */}
            {isLoadingModels ? (
              <View style={{ padding: Spacing.space6, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text
                  style={{
                    fontFamily: 'Almarai_400Regular',
                    color: Colors.textMuted,
                    marginTop: 8,
                    fontSize: 13,
                  }}
                >
                  جارٍ تحميل الموديلات...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredModels}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.listContent}
                renderItem={({ item }) => {
                  const isSelected =
                    selectedModelsList.includes(item.label) ||
                    selectedModelsList.includes(item.id) ||
                    (item.id === 'all' &&
                      (selectedModelsList.includes('all') ||
                        selectedModelsList.includes('متوافق مع جميع الموديلات') ||
                        selectedModelsList.includes('جميع الموديلات')))

                  return (
                    <TouchableOpacity
                      style={[s.modalListItem, isSelected && s.modalListItemSelected]}
                      activeOpacity={0.7}
                      onPress={() => toggleModel(item.id === 'all' ? 'all' : item.label)}
                    >
                      <View style={s.modalItemLeft}>
                        <View style={[s.checkboxRound, isSelected && s.checkboxRoundSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </View>
                      </View>

                      <View style={s.modalItemContent}>
                        <Text style={[s.modalItemTitle, isSelected && s.modalItemTitleSelected]}>
                          {item.label}
                        </Text>
                        {item.makeName ? (
                          <Text style={s.modalItemSub}>{item.makeName}</Text>
                        ) : item.subLabel ? (
                          <Text style={s.modalItemSub}>{item.subLabel}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  )
                }}
                ListEmptyComponent={() => (
                  <View style={{ padding: Spacing.space6, alignItems: 'center' }}>
                    <Text
                      style={{
                        fontFamily: 'Almarai_400Regular',
                        color: Colors.textMuted,
                        fontSize: 14,
                      }}
                    >
                      لا توجد موديلات مطابقة
                    </Text>
                  </View>
                )}
              />
            )}

            {/* Done Button */}
            <View style={s.modalFooter}>
              <TouchableOpacity
                style={s.doneButton}
                activeOpacity={0.9}
                onPress={() => setModelModalVisible(false)}
              >
                <Text style={s.doneButtonText}>
                  {selectedModelsCount > 0
                    ? `تأكيد الاختيار (${selectedModelsCount})`
                    : 'إغلاق'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Bottom Sheet Modal: اختيار السنة ── */}
      <Modal
        visible={yearPickerModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setYearPickerModal({ visible: false, field: null, title: '' })}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalSheet}>
            {/* Handle bar */}
            <View style={s.handleBar} />

            {/* Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>{yearPickerModal.title}</Text>
                <Text style={s.modalSubtitle}>اختر سنة الصنع المتوافقة مع القطعة</Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setYearPickerModal({ visible: false, field: null, title: '' })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={s.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginEnd: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="ابحث عن السنة (مثال: 2020)..."
                placeholderTextColor={Colors.textMuted}
                value={yearSearch}
                onChangeText={setYearSearch}
                keyboardType="number-pad"
              />
              {yearSearch.length > 0 && (
                <TouchableOpacity onPress={() => setYearSearch('')}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Option to clear/reset selection */}
            <TouchableOpacity
              style={s.modalClearItem}
              activeOpacity={0.7}
              onPress={() => selectYearValue('')}
            >
              <Ionicons name="close-outline" size={20} color="#EF4444" />
              <Text style={s.modalClearText}>مسح التحديد</Text>
            </TouchableOpacity>

            {/* Years List */}
            <FlatList
              data={filteredYearOptions}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => {
                const currentVal = yearPickerModal.field ? String(details[yearPickerModal.field] || '') : ''
                const isSelected = currentVal === item

                return (
                  <TouchableOpacity
                    style={[s.modalListItem, isSelected && s.modalListItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => selectYearValue(item)}
                  >
                    <View style={s.modalItemLeft}>
                      <View style={[s.checkboxRound, isSelected && s.checkboxRoundSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                      </View>
                    </View>

                    <View style={s.modalItemContent}>
                      <Text style={[s.modalItemTitle, isSelected && s.modalItemTitleSelected]}>
                        {item}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingBottom: Spacing.space4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
  },
  cardIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15.5,
    lineHeight: 22,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 6,
    marginTop: Spacing.space2,
  },
  textInput: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    textAlign: 'right',
    writingDirection: 'rtl',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  textInputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.space3,
    paddingBottom: Spacing.space3,
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.space2,
    marginTop: Spacing.space2,
  },
  flex1: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.space2,
    marginBottom: Spacing.space2,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
    flexDirection: 'row',
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  chipTxtActive: {
    color: Colors.primary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.space1,
    marginBottom: 2,
  },
  categoryCard: {
    width: '23.3%',
    minHeight: 74,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  categoryIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryIconBoxActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  categoryLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9.5,
    lineHeight: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  categoryLabelActive: {
    color: Colors.primary,
  },
  selectorButton: {
    height: 48,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space3,
    gap: Spacing.space2,
  },
  selectorButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FAFCFF',
  },
  selectorButtonDisabled: {
    opacity: 0.45,
    backgroundColor: '#F8FAFC',
  },
  brandHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.space3,
    paddingVertical: 8,
    marginBottom: Spacing.space2,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  brandHintText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  selectorIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorContent: {
    flex: 1,
    justifyContent: 'center',
  },
  selectorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    color: Colors.textMuted,
    fontFamily: 'Almarai_400Regular',
  },
  selectedMakesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
    marginTop: Spacing.space2,
  },
  makeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingStart: 10,
    paddingEnd: 6,
    paddingVertical: 6,
    minHeight: 34,
    gap: 6,
  },
  makeChipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  makeChipRemove: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space3,
    marginBottom: Spacing.space2,
  },
  priceWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  priceInput: {
    flex: 1,
    height: '100%',
    minHeight: 48,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'center',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  currencyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginStart: Spacing.space2,
  },
  currencyTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  negotiableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  negotiableTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    writingDirection: 'rtl',
  },

  /* ── Bottom Sheet Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopStartRadius: Radius.xl,
    borderTopEndRadius: Radius.xl,
    maxHeight: '85%',
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBox: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space3,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  listContent: {
    paddingBottom: Spacing.space4,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalListItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalItemLeft: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemContent: {
    flex: 1,
    marginStart: Spacing.space2,
  },
  modalItemTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 15.5,
    lineHeight: 22,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalItemTitleSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  modalItemSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
    writingDirection: 'ltr',
    textAlign: 'left',
    marginTop: 2,
  },
  checkboxRound: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxRoundSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalFooter: {
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: Colors.white,
  },
  modalClearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space5,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FEF2F2',
    marginHorizontal: Spacing.space4,
    marginBottom: Spacing.space2,
    borderRadius: Radius.md,
  },
  modalClearText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#EF4444',
    writingDirection: 'rtl',
  },
  addCustomModelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space5,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#EFF6FF',
    marginHorizontal: Spacing.space4,
    marginBottom: Spacing.space2,
    borderRadius: Radius.md,
  },
  addCustomModelText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  doneButton: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  doneButtonText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15.5,
    lineHeight: 22,
    color: Colors.white,
    writingDirection: 'rtl',
  },
})

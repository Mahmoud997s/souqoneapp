import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Modal, FlatList, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, { SlideInDown } from 'react-native-reanimated'
import { carsApi, CarBrand, CarModelItem, CarTrimItem } from '../../../api/cars'
import { usePostStore } from '../../../store/postStore'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { CAR_LISTING_TYPES, CONDITION_TYPES, TRANSMISSION_TYPES, FUEL_TYPES, CAR_FEATURE_KEYS, BODY_TYPES, DRIVE_TYPES, CANCELLATION_POLICIES, CAR_COLORS } from '../../../constants/cars'

export function CarForm() {
  const { title, description, price, isPriceNegotiable, details, set, setDetail } = usePostStore()

  const priceInputRef = useRef<TextInput>(null)
  const dailyPriceInputRef = useRef<TextInput>(null)
  const monthlyPriceInputRef = useRef<TextInput>(null)
  const depositAmountInputRef = useRef<TextInput>(null)

  // Details extraction
  const {
    listingType = 'SALE',
    condition = 'USED',
    mileage = '',
    transmission = 'AUTOMATIC',
    exteriorColor = 'white',
    fuelType = '',
    bodyType = '',
    features = [],
    make = '',
    model = '',
    trim = '',
    brandId: storeBrandId = '',
    carModelId: storeModelId = '',
    carTrimId: storeTrimId = '',
    year = '',
    dailyPrice = '',
    monthlyPrice = '',
    driveType = '',
    interior = '',
    engineSize = '',
    horsepower = '',
    doors = '',
    minRentalDays = '',
    kmLimitPerDay = '',
    cancellationPolicy = '',
    withDriver = false,
    deliveryAvailable = false,
    insuranceIncluded = false,
    depositAmount = '',
  } = details

  const [brands, setBrands] = useState<CarBrand[]>([])
  const [models, setModels] = useState<CarModelItem[]>([])
  const [trims, setTrims] = useState<CarTrimItem[]>([])
  const [brandId, setBrandId] = useState(storeBrandId)
  const [modelId, setModelId] = useState(storeModelId)

  const [selectModal, setSelectModal] = useState<{
    visible: boolean;
    title: string;
    items: { label: string; value: string; data?: any }[];
    onSelect: (val: string, data?: any) => void;
  }>({ visible: false, title: '', items: [], onSelect: () => {} })

  const [modalSearch, setModalSearch] = useState('')
  const [focusedField, setFocusedField] = useState('')
  
  const filteredModalItems = useMemo(() => {
    if (!modalSearch) return selectModal.items
    return selectModal.items.filter(i => i.label.toLowerCase().includes(modalSearch.toLowerCase()))
  }, [modalSearch, selectModal.items])

  useEffect(() => {
    if (!selectModal.visible) setModalSearch('')
  }, [selectModal.visible])

  useEffect(() => {
    carsApi.getBrands().then(setBrands).catch(console.error)
  }, [])

  useEffect(() => {
    if (brandId) carsApi.getModels(brandId).then(setModels).catch(console.error)
    else setModels([])
  }, [brandId])

  useEffect(() => {
    if (modelId) carsApi.getTrims(modelId).then(setTrims).catch(console.error)
    else setTrims([])
  }, [modelId])

  useEffect(() => {
    if (!brandId) {
      if (storeBrandId) {
        setBrandId(storeBrandId)
      } else if (make && brands.length) {
        const match = brands.find(b => b.name === make || b.nameAr === make)
        if (match) {
          setBrandId(match.id)
          setDetail('brandId', match.id)
        }
      }
    }
  }, [make, brands, storeBrandId, brandId])

  useEffect(() => {
    if (!modelId) {
      if (storeModelId) {
        setModelId(storeModelId)
      } else if (model && models.length) {
        const match = models.find(m => m.name === model || m.nameAr === model)
        if (match) {
          setModelId(match.id)
          setDetail('carModelId', match.id)
        }
      }
    }
  }, [model, models, storeModelId, modelId])

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = 2026; y >= 1990; y--) years.push({ label: String(y), value: String(y) })
    return years
  }, [])

  const openBrandModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر الماركة',
      items: brands.map(b => ({ label: (b as any).nameAr || b.name, value: b.id, data: b })),
      onSelect: async (val, data) => {
        setBrandId(val)
        setModelId('')
        setDetail('brandId', val)
        setDetail('carModelId', '')
        setDetail('carTrimId', '')
        setDetail('make', data.name)
        setDetail('model', '')
        setDetail('trim', '')
        setDetail('year', '')
        
        try {
          const fetchedModels = await carsApi.getModels(val)
          setModels(fetchedModels)
          if (fetchedModels.length > 0) {
            openModelModal(fetchedModels)
          }
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  const openModelModal = (overrideModels?: CarModelItem[] | any) => {
    const list = Array.isArray(overrideModels) ? overrideModels : models
    if (!list.length) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر الموديل',
      items: list.map(m => ({ label: m.name, value: m.id, data: m })),
      onSelect: async (val, data) => {
        setModelId(val)
        setDetail('carModelId', val)
        setDetail('carTrimId', '')
        setDetail('model', data.name)
        setDetail('trim', '')
        setDetail('year', '')
        
        try {
          const fetchedTrims = await carsApi.getTrims(val)
          setTrims(fetchedTrims)
          if (fetchedTrims.length > 0) {
            openTrimModal(fetchedTrims)
          } else {
            openYearModal()
          }
        } catch (err) {
          console.error(err)
        }
      }
    })
  }

  const openTrimModal = (overrideTrims?: CarTrimItem[] | any) => {
    const list = Array.isArray(overrideTrims) ? overrideTrims : trims
    if (!list.length) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر الفئة',
      items: list.map(t => ({ label: t.name, value: t.id, data: t })),
      onSelect: (val, data) => {
        setDetail('carTrimId', val)
        setDetail('trim', data.name)
        openYearModal()
      }
    })
  }

  const openYearModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'سنة الصنع',
      items: yearOptions,
      onSelect: (val) => setDetail('year', val)
    })
  }

  const toggleFeature = (id: string) => {
    if (features.includes(id)) {
      setDetail('features', features.filter((f: string) => f !== id))
    } else {
      setDetail('features', [...features, id])
    }
  }

  const renderChipsWithMore = (
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (val: string) => void,
    title: string
  ) => {
    let visibleOptions = options.slice(0, 3)
    const isSelectedInMore = selectedValue && !visibleOptions.find(o => o.value === selectedValue)
    
    if (isSelectedInMore) {
      const selectedOpt = options.find(o => o.value === selectedValue)
      if (selectedOpt) {
        visibleOptions = [options[0], options[1], selectedOpt]
      }
    }

    return (
      <View style={s.chipRow}>
        {visibleOptions.map(opt => (
          <TouchableOpacity key={opt.value} style={[s.chip, selectedValue === opt.value && s.chipActive, { flex: 0, paddingHorizontal: 16 }]} onPress={() => onSelect(opt.value)}>
            <Text style={[s.chipTxt, selectedValue === opt.value && s.chipTxtActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        {options.length > 3 && (
          <TouchableOpacity style={[s.chip, { flex: 0, paddingHorizontal: 16, backgroundColor: Colors.inputBg }]} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setSelectModal({
              visible: true,
              title,
              items: options.map(o => ({ label: o.label, value: o.value })),
              onSelect: (val) => onSelect(val)
            })
          }}>
            <Text style={[s.chipTxt, { color: Colors.textMuted }]}>المزيد +</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }



  return (
    <View style={s.container}>
      {/* Basic Info */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <Ionicons name="car" size={16} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>المعلومات الأساسية</Text>
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>نوع الإعلان *</Text>
          <View style={s.chipRow}>
            {CAR_LISTING_TYPES.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.chip, listingType === opt.value && s.chipActive]}
                onPress={() => setDetail('listingType', opt.value)}
              >
                <Text style={[s.chipTxt, listingType === opt.value && s.chipTxtActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>عنوان الإعلان</Text>
          <TextInput
            style={[s.textInput, focusedField === 'title' && s.textInputFocused]}
            placeholder="مثال: تويوتا لاندكروزر 2023 نظيف جداً"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={(v) => set({ title: v })}
            textAlign="right"
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField('')}
          />
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>الوصف</Text>
          <TextInput
            style={[s.textInput, s.textArea, focusedField === 'desc' && s.textInputFocused]}
            placeholder="اكتب تفاصيل إضافية عن حالة السيارة، وتاريخ الصيانة..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={(v) => set({ description: v })}
            textAlign="right"
            multiline
            textAlignVertical="top"
            onFocus={() => setFocusedField('desc')}
            onBlur={() => setFocusedField('')}
          />
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>الحالة *</Text>
          <View style={s.chipRow}>
            {CONDITION_TYPES.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.chip, condition === opt.value && s.chipActive]}
                onPress={() => setDetail('condition', opt.value)}
              >
                <Text style={[s.chipTxt, condition === opt.value && s.chipTxtActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>الماركة *</Text>
            <Pressable style={s.selectorButton} onPress={openBrandModal}>
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !make && s.placeholder]} numberOfLines={1}>{make || 'اختر الماركة'}</Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>الموديل *</Text>
            <Pressable style={[s.selectorButton, !brandId && s.selectorButtonDisabled]} onPress={openModelModal} disabled={!brandId}>
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !model && s.placeholder]} numberOfLines={1}>{model || 'اختر الموديل'}</Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={s.rowFields}>
          {trims.length > 0 && (
            <View style={s.flex1}>
              <Text style={s.label}>الفئة</Text>
              <Pressable style={s.selectorButton} onPress={openTrimModal}>
                <View style={s.selectorContent}>
                  <Text style={[s.selectorText, !trim && s.placeholder]} numberOfLines={1}>{trim || 'اختر الفئة'}</Text>
                </View>
                <View style={s.selectorIconWrap}>
                  <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                </View>
              </Pressable>
            </View>
          )}
          <View style={s.flex1}>
            <Text style={s.label}>سنة الصنع *</Text>
            <Pressable style={[s.selectorButton, !modelId && s.selectorButtonDisabled]} onPress={openYearModal} disabled={!modelId}>
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !year && s.placeholder]}>{year || 'اختر السنة'}</Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>الممشى (كم) *</Text>
          <TextInput style={[s.textInput, focusedField === 'mileage' && s.textInputFocused]} placeholder="مثال: 120,000" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={mileage != null ? String(mileage) : ''} onChangeText={v => setDetail('mileage', v)} onFocus={() => setFocusedField('mileage')} onBlur={() => setFocusedField('')} />
        </View>
      </View>

      {/* Specs */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <Ionicons name="options" size={16} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>المواصفات الفنية</Text>
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>نوع الوقود</Text>
          {renderChipsWithMore(FUEL_TYPES, fuelType, (v) => setDetail('fuelType', v), 'نوع الوقود')}
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>شكل السيارة</Text>
          {renderChipsWithMore(BODY_TYPES, bodyType, (v) => setDetail('bodyType', v), 'شكل السيارة')}
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>نظام الدفع</Text>
          {renderChipsWithMore(DRIVE_TYPES, driveType, (v) => setDetail('driveType', v), 'نظام الدفع')}
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>ناقل الحركة</Text>
          <View style={s.chipRow}>
            {TRANSMISSION_TYPES.map(opt => (
              <TouchableOpacity key={opt.value} style={[s.chip, transmission === opt.value && s.chipActive]} onPress={() => setDetail('transmission', opt.value)}>
                <Text style={[s.chipTxt, transmission === opt.value && s.chipTxtActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>اللون الخارجي</Text>
            <Pressable style={s.selectorButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setSelectModal({
                visible: true,
                title: 'اللون الخارجي',
                items: CAR_COLORS.map(o => ({ label: o.label, value: o.value, data: o })),
                onSelect: (val) => setDetail('exteriorColor', val)
              })
            }}>
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !exteriorColor && s.placeholder]} numberOfLines={1}>
                  {CAR_COLORS.find(c => c.value === exteriorColor)?.label || 'اختر اللون'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                {exteriorColor ? (
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: CAR_COLORS.find(c => c.value === exteriorColor)?.hex, borderWidth: 1, borderColor: Colors.border }} />
                ) : (
                  <Ionicons name="color-palette-outline" size={18} color={Colors.textMuted} />
                )}
              </View>
            </Pressable>
          </View>

          <View style={s.flex1}>
            <Text style={s.label}>اللون الداخلي</Text>
            <Pressable style={s.selectorButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setSelectModal({
                visible: true,
                title: 'اللون الداخلي',
                items: CAR_COLORS.map(o => ({ label: o.label, value: o.value, data: o })),
                onSelect: (val) => setDetail('interior', val)
              })
            }}>
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !interior && s.placeholder]} numberOfLines={1}>
                  {CAR_COLORS.find(c => c.value === interior)?.label || 'اختر اللون'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                {interior ? (
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: CAR_COLORS.find(c => c.value === interior)?.hex, borderWidth: 1, borderColor: Colors.border }} />
                ) : (
                  <Ionicons name="color-palette-outline" size={18} color={Colors.textMuted} />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>سعة المحرك</Text>
            <TextInput style={[s.textInput, focusedField === 'engineSize' && s.textInputFocused]} placeholder="مثال: 3500 (CC)" placeholderTextColor={Colors.textMuted} value={engineSize != null ? String(engineSize) : ''} onChangeText={v => setDetail('engineSize', v)} onFocus={() => setFocusedField('engineSize')} onBlur={() => setFocusedField('')} />
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>الأحصنة</Text>
            <TextInput style={[s.textInput, focusedField === 'horsepower' && s.textInputFocused]} placeholder="مثال: 350" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={horsepower != null ? String(horsepower) : ''} onChangeText={v => setDetail('horsepower', v)} onFocus={() => setFocusedField('horsepower')} onBlur={() => setFocusedField('')} />
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>الأبواب</Text>
            <TextInput style={[s.textInput, focusedField === 'doors' && s.textInputFocused]} placeholder="مثال: 4" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={doors != null ? String(doors) : ''} onChangeText={v => setDetail('doors', v)} onFocus={() => setFocusedField('doors')} onBlur={() => setFocusedField('')} />
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>المميزات والإضافات</Text>
        </View>
        <View style={s.featuresGrid}>
          {CAR_FEATURE_KEYS.map(feat => {
            const isActive = features.includes(feat.id)
            return (
              <TouchableOpacity
                key={feat.id}
                style={[s.featureItem, isActive && s.featureItemActive]}
                onPress={() => toggleFeature(feat.id)}
              >
                <Ionicons name={feat.icon as any} size={16} color={isActive ? Colors.primary : Colors.textMuted} />
                <Text style={[s.featureTxt, isActive && s.featureTxtActive]} numberOfLines={1} adjustsFontSizeToFit>{feat.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Price */}
      <View style={s.card}>
        <View style={s.cardHeaderRow}>
          <View style={s.cardIconBadge}>
            <Ionicons name="pricetag" size={16} color={Colors.primary} />
          </View>
          <Text style={s.cardTitle}>السعر</Text>
        </View>

        {listingType === 'SALE' || listingType === 'WANTED' ? (
          <View style={s.inputWrapper}>
            <Text style={s.label}>السعر المطلوب (ر.ع)</Text>
            <Pressable
              style={[s.priceWrap, focusedField === 'price' && s.priceWrapFocused]}
              onPress={() => priceInputRef.current?.focus()}
            >
              <TextInput
                ref={priceInputRef}
                style={s.priceInput}
                placeholder="مثال: 5500"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                textAlign="right"
                value={price != null ? String(price) : ''}
                onChangeText={(v) => set({ price: v })}
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
        ) : (
          <>
            <View style={s.rowFields}>
              <View style={s.flex1}>
                <Text style={s.label}>الإيجار اليومي</Text>
                <Pressable
                  style={[s.priceWrap, focusedField === 'dailyPrice' && s.priceWrapFocused]}
                  onPress={() => dailyPriceInputRef.current?.focus()}
                >
                  <TextInput
                    ref={dailyPriceInputRef}
                    style={s.priceInput}
                    placeholder="مثال: 15"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={dailyPrice != null ? String(dailyPrice) : ''}
                    onChangeText={v => setDetail('dailyPrice', v)}
                    textAlign="right"
                    onFocus={() => setFocusedField('dailyPrice')}
                    onBlur={() => setFocusedField('')}
                  />
                  <View style={s.currencyBadge} pointerEvents="none">
                    <Text style={s.currencyTxt}>ر.ع</Text>
                  </View>
                </Pressable>
              </View>
              <View style={s.flex1}>
                <Text style={s.label}>الإيجار الشهري</Text>
                <Pressable
                  style={[s.priceWrap, focusedField === 'monthlyPrice' && s.priceWrapFocused]}
                  onPress={() => monthlyPriceInputRef.current?.focus()}
                >
                  <TextInput
                    ref={monthlyPriceInputRef}
                    style={s.priceInput}
                    placeholder="مثال: 350"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={monthlyPrice != null ? String(monthlyPrice) : ''}
                    onChangeText={v => setDetail('monthlyPrice', v)}
                    textAlign="right"
                    onFocus={() => setFocusedField('monthlyPrice')}
                    onBlur={() => setFocusedField('')}
                  />
                  <View style={s.currencyBadge} pointerEvents="none">
                    <Text style={s.currencyTxt}>ر.ع</Text>
                  </View>
                </Pressable>
              </View>
            </View>
            <View style={s.rowFields}>
              <View style={s.flex1}>
                <Text style={s.label}>مبلغ التأمين (اختياري)</Text>
                <Pressable
                  style={[s.priceWrap, focusedField === 'depositAmount' && s.priceWrapFocused]}
                  onPress={() => depositAmountInputRef.current?.focus()}
                >
                  <TextInput
                    ref={depositAmountInputRef}
                    style={s.priceInput}
                    placeholder="مثال: 100"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={depositAmount != null ? String(depositAmount) : ''}
                    onChangeText={v => setDetail('depositAmount', v)}
                    textAlign="right"
                    onFocus={() => setFocusedField('depositAmount')}
                    onBlur={() => setFocusedField('')}
                  />
                  <View style={s.currencyBadge} pointerEvents="none">
                    <Text style={s.currencyTxt}>ر.ع</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>

      {listingType === 'RENTAL' && (
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.cardIconBadge}>
              <Ionicons name="calendar" size={16} color={Colors.primary} />
            </View>
            <Text style={s.cardTitle}>تفاصيل الإيجار</Text>
          </View>
          <View style={s.rowFields}>
            <View style={s.flex1}>
              <Text style={s.label}>أقل عدد أيام</Text>
              <TextInput style={[s.textInput, focusedField === 'minRentalDays' && s.textInputFocused]} placeholder="مثال: 3" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={minRentalDays != null ? String(minRentalDays) : ''} onChangeText={v => setDetail('minRentalDays', v)} textAlign="right" onFocus={() => setFocusedField('minRentalDays')} onBlur={() => setFocusedField('')} />
            </View>
            <View style={s.flex1}>
              <Text style={s.label}>الحد اليومي (كم)</Text>
              <TextInput style={[s.textInput, focusedField === 'kmLimitPerDay' && s.textInputFocused]} placeholder="مثال: 250" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={kmLimitPerDay != null ? String(kmLimitPerDay) : ''} onChangeText={v => setDetail('kmLimitPerDay', v)} textAlign="right" onFocus={() => setFocusedField('kmLimitPerDay')} onBlur={() => setFocusedField('')} />
            </View>
          </View>
          
          <View style={s.inputWrapper}>
            <Text style={s.label}>سياسة الإلغاء</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
              {CANCELLATION_POLICIES.map(opt => (
                <TouchableOpacity key={opt.value} style={[s.chip, cancellationPolicy === opt.value && s.chipActive, { flex: 0 }]} onPress={() => setDetail('cancellationPolicy', opt.value)}>
                  <Text style={[s.chipTxt, cancellationPolicy === opt.value && s.chipTxtActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ marginTop: Spacing.space4, gap: Spacing.space3 }}>
            <TouchableOpacity style={s.negotiableRow} onPress={() => setDetail('withDriver', !withDriver)}>
              <View style={[s.checkbox, withDriver && s.checkboxActive]}>
                {withDriver && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <Text style={s.negotiableTxt}>مع سائق</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.negotiableRow} onPress={() => setDetail('deliveryAvailable', !deliveryAvailable)}>
              <View style={[s.checkbox, deliveryAvailable && s.checkboxActive]}>
                {deliveryAvailable && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <Text style={s.negotiableTxt}>متوفر التوصيل للعميل</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.negotiableRow} onPress={() => setDetail('insuranceIncluded', !insuranceIncluded)}>
              <View style={[s.checkbox, insuranceIncluded && s.checkboxActive]}>
                {insuranceIncluded && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <Text style={s.negotiableTxt}>شامل التأمين</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Select Modal */}
      <Modal visible={selectModal.visible} transparent animationType="slide" onRequestClose={() => setSelectModal({ ...selectModal, visible: false })}>
        <View style={s.modalOverlay}>
          {/* Use Pressable to close when tapping outside */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectModal({ ...selectModal, visible: false })} />
          <SafeAreaView style={s.modalSheet}>
            {/* Handle bar */}
            <View style={s.handleBar} />
            
            {/* Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>{selectModal.title}</Text>
                <Text style={s.modalSubtitle}>اختر الخيار المناسب من القائمة</Text>
              </View>
              <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setSelectModal({ ...selectModal, visible: false })
              }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={s.modalCloseBtn}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            {selectModal.items.length > 10 && (
              <View style={s.searchBox}>
                <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginEnd: 8 }} />
                <TextInput 
                  style={s.searchInput} 
                  placeholder="ابحث هنا..." 
                  placeholderTextColor={Colors.textMuted} 
                  value={modalSearch} 
                  onChangeText={setModalSearch} 
                  autoCorrect={false}
                />
                {modalSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setModalSearch('')}>
                    <Ionicons name="close" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* List */}
            <FlatList
              data={filteredModalItems}
              keyExtractor={(item) => item.value}
              contentContainerStyle={s.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                // Determine if this item is selected based on the detail
                let isSelected = false;
                if (selectModal.title === 'اختر الماركة') isSelected = brandId === item.value;
                else if (selectModal.title === 'اختر الموديل') isSelected = modelId === item.value;
                else if (selectModal.title === 'اختر الفئة') isSelected = trim === item.label;
                else if (selectModal.title === 'سنة الصنع') isSelected = year === item.value;
                else if (selectModal.title === 'نوع الوقود') isSelected = fuelType === item.value;
                else if (selectModal.title === 'شكل السيارة') isSelected = bodyType === item.value;
                else if (selectModal.title === 'نظام الدفع') isSelected = driveType === item.value;
                else if (selectModal.title === 'اللون الخارجي') isSelected = exteriorColor === item.value;
                else if (selectModal.title === 'اللون الداخلي') isSelected = interior === item.value;

                return (
                  <TouchableOpacity
                    style={[s.modalListItem, isSelected && s.modalListItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      selectModal.onSelect(item.value, item.data)
                      setSelectModal({ ...selectModal, visible: false })
                    }}
                  >
                    <View style={s.modalItemLeft}>
                      {/* Show Checkbox for standard selections */}
                      {(!item.data?.hex && selectModal.title !== 'اختر الماركة') ? (
                        <View style={[s.checkboxRound, isSelected && s.checkboxRoundSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </View>
                      ) : (item as any).data?.hex ? (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: (item as any).data.hex, borderWidth: 1, borderColor: '#E5E7EB' }} />
                      ) : selectModal.title === 'اختر الماركة' ? (
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F4FC', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontFamily: 'Almarai_700Bold',  color: Colors.primary, fontSize: 14 }}>{item.label.charAt(0)}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={s.modalItemContent}>
                      <Text style={[s.modalItemTitle, isSelected && s.modalItemTitleSelected]}>{item.label}</Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={() => (
                <View style={{ padding: Spacing.space6, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Almarai_400Regular', color: Colors.textMuted, fontSize: 14 }}>لا توجد نتائج مطابقة</Text>
                </View>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    paddingBottom: Spacing.space4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  inputWrapper: {
    marginTop: 4,
    marginBottom: 6,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginBottom: 4,
    marginTop: 4,
  },
  textInput: {
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
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
      android: {},
    }),
  },
  textArea: {
    minHeight: 85,
    paddingTop: 8,
    paddingBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  flex1: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
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
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  chipTxtActive: {
    color: Colors.primary,
  },
  selectorButton: {
    height: 44,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  selectorButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FAFCFF',
  },
  selectorButtonDisabled: {
    opacity: 0.45,
    backgroundColor: '#F8FAFC',
  },
  selectorIconWrap: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorContent: {
    flex: 1,
    justifyContent: 'center',
  },
  selectorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    color: Colors.textMuted,
    fontFamily: 'Almarai_400Regular',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  priceWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: {},
    }),
  },
  priceInput: {
    flex: 1,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  currencyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginStart: 6,
  },
  currencyTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.primary,
    writingDirection: 'rtl',
  },
  negotiableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
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
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  colorActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    width: '31.8%',
  },
  featureItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  featureTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'center',
    flexShrink: 1,
  },
  featureTxtActive: {
    color: Colors.primary,
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
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15.5,
    lineHeight: 22,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBox: {
    marginHorizontal: Spacing.space3,
    marginVertical: 8,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
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
    paddingHorizontal: Spacing.space4,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalListItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalItemLeft: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemContent: {
    flex: 1,
    marginStart: 8,
  },
  modalItemTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalItemTitleSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  checkboxRound: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
})
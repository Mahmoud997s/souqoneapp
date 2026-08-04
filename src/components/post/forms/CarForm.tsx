import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Modal, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
  const [brandId, setBrandId] = useState('')
  const [modelId, setModelId] = useState('')

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
    if (make && brands.length && !brandId) {
      const match = brands.find(b => b.name === make || b.nameAr === make)
      if (match) setBrandId(match.id)
    }
  }, [make, brands])

  useEffect(() => {
    if (model && models.length && !modelId) {
      const match = models.find(m => m.name === model || m.nameAr === model)
      if (match) setModelId(match.id)
    }
  }, [model, models])

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
          <TouchableOpacity key={opt.value} style={[s.chipRound, selectedValue === opt.value && s.chipRoundActive, { flex: 0, paddingHorizontal: 16 }]} onPress={() => onSelect(opt.value)}>
            <Text style={[s.chipTxt, selectedValue === opt.value && s.chipTxtActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        {options.length > 3 && (
          <TouchableOpacity style={[s.chipRound, { flex: 0, paddingHorizontal: 16, backgroundColor: Colors.text, borderColor: Colors.text }]} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setSelectModal({
              visible: true,
              title,
              items: options.map(o => ({ label: o.label, value: o.value })),
              onSelect: (val) => onSelect(val)
            })
          }}>
            <Text style={[s.chipTxt, { color: Colors.white }]}>المزيد +</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const renderColorChipsWithMore = (
    options: { label: string; value: string; hex: string }[],
    selectedValue: string,
    onSelect: (val: string) => void,
    title: string
  ) => {
    let visibleOptions = options.slice(0, 5)
    const isSelectedInMore = selectedValue && !visibleOptions.find(o => o.value === selectedValue)
    
    if (isSelectedInMore) {
      const selectedOpt = options.find(o => o.value === selectedValue)
      if (selectedOpt) {
        visibleOptions = [...options.slice(0,4), selectedOpt]
      }
    }

    return (
      <View style={s.chipRow}>
        {visibleOptions.map(opt => (
          <TouchableOpacity key={opt.value} style={[s.colorCircle, selectedValue === opt.value && s.colorActive, { backgroundColor: opt.hex }]} onPress={() => onSelect(opt.value)} />
        ))}
        {options.length > 5 && (
          <TouchableOpacity style={[s.colorCircle, { backgroundColor: Colors.text, borderColor: Colors.text }]} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setSelectModal({
              visible: true,
              title,
              items: options.map(o => ({ label: o.label, value: o.value, data: o })),
              onSelect: (val) => onSelect(val)
            })
          }}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={s.container}>
      {/* Basic */}
      <View style={s.card}>
        <Text style={s.cardTitle}>المعلومات الأساسية</Text>

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

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>الماركة *</Text>
            <TouchableOpacity style={s.selectWrap} onPress={openBrandModal}>
              <Text style={[s.selectText, !make && s.placeholder]} numberOfLines={1}>{make || 'اختر الماركة'}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>الموديل *</Text>
            <TouchableOpacity style={s.selectWrap} onPress={openModelModal} disabled={!brandId}>
              <Text style={[s.selectText, !model && s.placeholder]} numberOfLines={1}>{model || 'اختر الموديل'}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.rowFields}>
          {trims.length > 0 && (
            <View style={s.flex1}>
              <Text style={s.label}>الفئة</Text>
              <TouchableOpacity style={s.selectWrap} onPress={openTrimModal}>
                <Text style={[s.selectText, !trim && s.placeholder]} numberOfLines={1}>{trim || 'اختر الفئة'}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
          <View style={s.flex1}>
            <Text style={s.label}>سنة الصنع *</Text>
            <TouchableOpacity style={s.selectWrap} onPress={openYearModal} disabled={!modelId}>
              <Text style={[s.selectText, !year && s.placeholder]}>{year || 'اختر السنة'}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.label}>الممشى (كم) *</Text>
        <TextInput style={[s.textInput, focusedField === 'mileage' && s.textInputFocused]} placeholder="مثال: 120,000" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={mileage != null ? String(mileage) : ''} onChangeText={v => setDetail('mileage', v)} textAlign="right" onFocus={() => setFocusedField('mileage')} onBlur={() => setFocusedField('')} />
      </View>



      {/* Specs */}
      <View style={s.card}>
        <Text style={s.cardTitle}>المواصفات الفنية</Text>

        <Text style={s.label}>نوع الوقود</Text>
        {renderChipsWithMore(FUEL_TYPES, fuelType, (v) => setDetail('fuelType', v), 'نوع الوقود')}

        <Text style={s.label}>شكل السيارة</Text>
        {renderChipsWithMore(BODY_TYPES, bodyType, (v) => setDetail('bodyType', v), 'شكل السيارة')}

        <Text style={s.label}>نظام الدفع</Text>
        {renderChipsWithMore(DRIVE_TYPES, driveType, (v) => setDetail('driveType', v), 'نظام الدفع')}

        <Text style={s.label}>ناقل الحركة</Text>
        <View style={s.chipRow}>
          {TRANSMISSION_TYPES.map(opt => (
            <TouchableOpacity key={opt.value} style={[s.chip, transmission === opt.value && s.chipActive]} onPress={() => setDetail('transmission', opt.value)}>
              <Text style={[s.chipTxt, transmission === opt.value && s.chipTxtActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>اللون الخارجي</Text>
        {renderColorChipsWithMore(CAR_COLORS, exteriorColor, (v) => setDetail('exteriorColor', v), 'اللون الخارجي')}

        <Text style={s.label}>اللون الداخلي</Text>
        {renderColorChipsWithMore(CAR_COLORS, interior, (v) => setDetail('interior', v), 'اللون الداخلي')}

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>سعة المحرك</Text>
            <TextInput style={[s.textInput, focusedField === 'engineSize' && s.textInputFocused]} placeholder="مثال: 3500 (CC)" placeholderTextColor={Colors.textMuted} value={engineSize != null ? String(engineSize) : ''} onChangeText={v => setDetail('engineSize', v)} textAlign="right" onFocus={() => setFocusedField('engineSize')} onBlur={() => setFocusedField('')} />
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>الأحصنة</Text>
            <TextInput style={[s.textInput, focusedField === 'horsepower' && s.textInputFocused]} placeholder="مثال: 350" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={horsepower != null ? String(horsepower) : ''} onChangeText={v => setDetail('horsepower', v)} textAlign="right" onFocus={() => setFocusedField('horsepower')} onBlur={() => setFocusedField('')} />
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>الأبواب</Text>
            <TextInput style={[s.textInput, focusedField === 'doors' && s.textInputFocused]} placeholder="مثال: 4" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={doors != null ? String(doors) : ''} onChangeText={v => setDetail('doors', v)} textAlign="right" onFocus={() => setFocusedField('doors')} onBlur={() => setFocusedField('')} />
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={s.card}>
        <Text style={s.cardTitle}>المميزات والإضافات</Text>
        <View style={s.featuresGrid}>
          {CAR_FEATURE_KEYS.map(feat => {
            const isActive = features.includes(feat.id)
            return (
              <TouchableOpacity
                key={feat.id}
                style={[s.featureItem, isActive && s.featureItemActive]}
                onPress={() => toggleFeature(feat.id)}
              >
                <Ionicons name={feat.icon as any} size={20} color={isActive ? Colors.primary : Colors.textMuted} />
                <Text style={[s.featureTxt, isActive && s.featureTxtActive]}>{feat.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Price */}
      <View style={s.card}>
        <Text style={s.cardTitle}>السعر</Text>

        {listingType === 'SALE' || listingType === 'WANTED' ? (
          <>
            <Text style={s.label}>السعر المطلوب (ر.ع)</Text>
            <View style={[s.priceWrap, focusedField === 'price' && s.textInputFocused]}>
              <TextInput style={s.priceInput} placeholder="مثال: 5500" placeholderTextColor={Colors.textMuted} keyboardType="numeric" textAlign="right" value={price} onChangeText={(v) => set({ price: v })} onFocus={() => setFocusedField('price')} onBlur={() => setFocusedField('')} />
              <Text style={s.currencyTxt}>ر.ع</Text>
            </View>
            <TouchableOpacity style={s.negotiableRow} onPress={() => set({ isPriceNegotiable: !isPriceNegotiable })}>
              <View style={[s.checkbox, isPriceNegotiable && s.checkboxActive]}>
                {isPriceNegotiable && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <Text style={s.negotiableTxt}>السعر قابل للتفاوض</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={s.rowFields}>
              <View style={s.flex1}>
                <Text style={s.label}>الإيجار اليومي</Text>
                <TextInput style={[s.textInput, focusedField === 'dailyPrice' && s.textInputFocused]} placeholder="مثال: 15" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={dailyPrice != null ? String(dailyPrice) : ''} onChangeText={v => setDetail('dailyPrice', v)} textAlign="right" onFocus={() => setFocusedField('dailyPrice')} onBlur={() => setFocusedField('')} />
              </View>
              <View style={s.flex1}>
                <Text style={s.label}>الإيجار الشهري</Text>
                <TextInput style={[s.textInput, focusedField === 'monthlyPrice' && s.textInputFocused]} placeholder="مثال: 350" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={monthlyPrice != null ? String(monthlyPrice) : ''} onChangeText={v => setDetail('monthlyPrice', v)} textAlign="right" onFocus={() => setFocusedField('monthlyPrice')} onBlur={() => setFocusedField('')} />
              </View>
            </View>
            <View style={s.rowFields}>
              <View style={s.flex1}>
                <Text style={s.label}>مبلغ التأمين (اختياري)</Text>
                <TextInput style={[s.textInput, focusedField === 'depositAmount' && s.textInputFocused]} placeholder="مثال: 100" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={depositAmount != null ? String(depositAmount) : ''} onChangeText={v => setDetail('depositAmount', v)} textAlign="right" onFocus={() => setFocusedField('depositAmount')} onBlur={() => setFocusedField('')} />
              </View>
            </View>
          </>
        )}
      </View>

      {listingType === 'RENTAL' && (
        <View style={s.card}>
          <Text style={s.cardTitle}>تفاصيل الإيجار</Text>
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
          
          <Text style={s.label}>سياسة الإلغاء</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollChips}>
            {CANCELLATION_POLICIES.map(opt => (
              <TouchableOpacity key={opt.value} style={[s.chipRound, cancellationPolicy === opt.value && s.chipRoundActive]} onPress={() => setDetail('cancellationPolicy', opt.value)}>
                <Text style={[s.chipTxt, cancellationPolicy === opt.value && s.chipTxtActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
      <Modal visible={selectModal.visible} animationType="slide" transparent onRequestClose={() => setSelectModal({ ...selectModal, visible: false })}>
        <View style={s.modalOverlay}>
          {selectModal.visible && (
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{selectModal.title}</Text>
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setSelectModal({ ...selectModal, visible: false })
                }}>
                  <Ionicons name="close-circle" size={28} color={'#E5E7EB'} />
                </TouchableOpacity>
              </View>
            
            {selectModal.items.length > 10 && (
              <View style={s.modalSearchWrap}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
                <TextInput 
                  style={s.modalSearchInput} 
                  placeholder="ابحث هنا..." 
                  placeholderTextColor={Colors.textMuted} 
                  value={modalSearch} 
                  onChangeText={setModalSearch} 
                  textAlign="right" 
                />
              </View>
            )}

            <FlatList
              data={filteredModalItems}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingBottom: Spacing.space6 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.selectItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    selectModal.onSelect(item.value, item.data)
                    setSelectModal({ ...selectModal, visible: false })
                  }}
                >
                  {(item as any).data?.hex ? (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: (item as any).data.hex, borderWidth: 1, borderColor: '#E5E7EB', marginLeft: 12 }} />
                  ) : selectModal.title === 'اختر الماركة' ? (
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F4FC', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
                      <Text style={{ fontFamily: 'Almarai_700Bold',  color: Colors.primary, fontSize: 14 }}>{item.label.charAt(0)}</Text>
                    </View>
                  ) : null}
                  <Text style={s.selectItemTxt}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={{ padding: Spacing.space6, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Almarai_400Regular',  color: Colors.textMuted }}>لا توجد نتائج مطابقة</Text>
                </View>
              )}
            />
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { paddingBottom: Spacing.space8 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.space6,
    marginBottom: Spacing.space6,
    borderWidth: 1, borderColor: '#F3F4F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  cardTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 17, color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space4 },
  label: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space2, marginTop: Spacing.space4 },
  textInput: { height: 52, borderRadius: 14, paddingHorizontal: Spacing.space4, fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.text, backgroundColor: '#F8F9FA', textAlign: 'right', borderWidth: 1.5, borderColor: '#E5E7EB' },
  textInputFocused: { borderColor: Colors.primary, backgroundColor: '#FFFFFF', ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: {width:0, height:2}, shadowOpacity:0.1, shadowRadius:4}, android: {elevation: 2} }) },
  textArea: { height: 110, paddingTop: Spacing.space4 },
  rowFields: { flexDirection: 'row', gap: Spacing.space4, marginTop: Spacing.space2 },
  flex1: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: Spacing.space3, marginBottom: Spacing.space3, flexWrap: 'wrap' },
  scrollChips: { gap: Spacing.space3, paddingBottom: Spacing.space2 },
  chip: { paddingHorizontal: 16, minWidth: 80, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  chipTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.text2 },
  chipTxtActive: { color: Colors.primary },
  chipRound: { paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  chipRoundActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  colorScroll: { gap: Spacing.space3, paddingBottom: Spacing.space2 },
  colorCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  colorActive: { borderWidth: 1.5, borderColor: Colors.primary },
  priceWrap: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: Spacing.space4, marginBottom: Spacing.space4 },
  priceInput: { flex: 1, height: '100%', fontFamily: 'Almarai_800ExtraBold',  fontSize: 20, color: Colors.primary, textAlign: 'right' },
  currencyTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.textMuted, marginStart: Spacing.space2 },
  negotiableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, alignSelf: 'flex-start' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  negotiableTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.space3 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, paddingHorizontal: Spacing.space3, paddingVertical: Spacing.space3, borderRadius: 12, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E5E7EB', width: '48%' },
  featureItemActive: { backgroundColor: '#EFF6FF', borderColor: Colors.primary },
  featureTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text2 },
  featureTxtActive: { color: Colors.primary },
  selectWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, borderRadius: 14, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: Spacing.space4, marginBottom: Spacing.space2 },
  selectText: { fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.text, flex: 1, writingDirection: 'rtl' },
  placeholder: { color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { width: '100%', backgroundColor: Colors.white, borderTopStartRadius: 28, borderTopEndRadius: 28, paddingHorizontal: Spacing.space5, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 44, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginTop: Spacing.space3, marginBottom: Spacing.space3 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.space3, borderBottomWidth: 1, borderBottomColor: '#F1F3F5', marginBottom: Spacing.space4 },
  modalTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text },
  modalSearchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: Spacing.space4, height: 56, marginBottom: Spacing.space4, borderWidth: 1.5, borderColor: '#E5E7EB' },
  modalSearchInput: { flex: 1, height: '100%', fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text, paddingHorizontal: Spacing.space2 },
  selectItem: { paddingVertical: Spacing.space4, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  selectItemTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text, writingDirection: 'rtl' },
})
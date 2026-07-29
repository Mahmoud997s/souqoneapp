import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Platform, TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Keyboard, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MultiSlider from '@ptomasroos/react-native-multi-slider'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { BUS_LISTING_TYPES, BUS_TYPES, BUS_MAKES } from '../../../app/post/_constants/bus'
import { AppSelect } from '../ui/AppSelect'
import { getWilayatsForGovernorate } from '../../constants/locations'
import { CONDITIONS, TRANSMISSION_TYPES, FUEL_TYPES } from '../../constants/filters'

const GOVERNORATES = [
  'مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية',
  'شمال الباطنة', 'جنوب الباطنة', 'شمال الشرقية', 'جنوب الشرقية',
  'الظاهرة', 'الوسطى'
];

const screenWidth = Dimensions.get('window').width;
const MIN_PRICE = 0;
const MAX_PRICE = 100000;
const MIN_YEAR = 1990;
const MAX_YEAR = new Date().getFullYear() + 1;

export interface BusFilters {
  busListingType?: string
  busType?: string
  make?: string
  capacityMin?: number
  sort?: string
  priceMin?: string
  priceMax?: string
  yearMin?: string
  yearMax?: string
  condition?: string
  transmission?: string
  fuelType?: string
  governorate?: string
  city?: string
}

interface BusFilterBottomSheetProps {
  visible: boolean
  onClose: () => void
  currentFilters: BusFilters
  onApply: (filters: BusFilters) => void
}

export function BusFilterBottomSheet({ visible, onClose, currentFilters, onApply }: BusFilterBottomSheetProps) {
  const [localFilters, setLocalFilters] = useState<BusFilters>(currentFilters)

  useEffect(() => {
    setLocalFilters(currentFilters)
  }, [currentFilters, visible])

  const toggleFilter = (key: keyof BusFilters, val: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key] === val ? undefined : val
    }))
  }

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters(prev => ({
      sort: prev.sort
    }))
  }

  const handlePriceChange = (values: number[]) => {
    setLocalFilters(p => ({
      ...p,
      priceMin: values[0].toString(),
      priceMax: values[1] === MAX_PRICE ? '' : values[1].toString()
    }));
  };

  const currentMinPrice = parseInt(localFilters.priceMin || '0', 10) || MIN_PRICE;
  const currentMaxPrice = parseInt(localFilters.priceMax || MAX_PRICE.toString(), 10) || MAX_PRICE;

  let priceRangeDisplay = '';
  if (currentMinPrice === MIN_PRICE && currentMaxPrice === MAX_PRICE) {
    priceRangeDisplay = 'جميع الأسعار';
  } else if (currentMinPrice === currentMaxPrice) {
    priceRangeDisplay = `${currentMinPrice.toLocaleString()} ر.ع فقط`;
  } else {
    const minText = currentMinPrice === MIN_PRICE ? 'صفر' : currentMinPrice.toLocaleString();
    const maxText = currentMaxPrice === MAX_PRICE ? 'أكثر من ' + MAX_PRICE.toLocaleString() : currentMaxPrice.toLocaleString();
    priceRangeDisplay = `من ${minText} إلى ${maxText} ر.ع`;
  }

  const handleYearChange = (values: number[]) => {
    setLocalFilters(p => ({
      ...p,
      yearMin: values[0] === MIN_YEAR ? '' : values[0].toString(),
      yearMax: values[1] === MAX_YEAR ? '' : values[1].toString()
    }));
  };

  const currentMinYear = parseInt(localFilters.yearMin || MIN_YEAR.toString(), 10) || MIN_YEAR;
  const currentMaxYear = parseInt(localFilters.yearMax || MAX_YEAR.toString(), 10) || MAX_YEAR;

  let yearRangeDisplay = '';
  if (currentMinYear === MIN_YEAR && currentMaxYear === MAX_YEAR) {
    yearRangeDisplay = 'جميع الموديلات';
  } else if (currentMinYear === currentMaxYear) {
    yearRangeDisplay = `موديل ${currentMinYear} فقط`;
  } else {
    const minText = currentMinYear === MIN_YEAR ? 'أقدم' : currentMinYear;
    const maxText = currentMaxYear === MAX_YEAR ? 'أحدث' : currentMaxYear;
    yearRangeDisplay = `من ${minText} إلى ${maxText}`;
  }

  const governorateItems = GOVERNORATES.map(g => ({ label: g, value: g }));
  const cityItems = localFilters.governorate ? getWilayatsForGovernorate(localFilters.governorate).map(w => ({ label: w.label, value: w.label })) : [];
  const makeItems = BUS_MAKES.map(m => ({ label: m.label, value: m.id }));

  const renderChips = (title: string, data: { id: string, label: string }[], fieldKey: keyof BusFilters) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={[s.chipsWrap, { paddingHorizontal: 24 }]}>
        {data.map(item => {
          const active = localFilters[fieldKey] === item.id
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.chip, active && s.chipActive]}
              onPress={() => toggleFilter(fieldKey, item.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{item.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={s.contentWrap}
          >
            <View style={s.content}>
              {/* Header */}
              <View style={s.header}>
                <Text style={s.title}>تصفية الحافلات</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={s.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Spacing.space8 }}
                keyboardShouldPersistTaps="handled"
              >
                {renderChips('نوع الإعلان', BUS_LISTING_TYPES, 'busListingType')}
                {renderChips('فئة الحافلة', BUS_TYPES, 'busType')}

                <View style={s.section}>
                  <Text style={s.sectionTitle}>الماركة</Text>
                  <View style={{ paddingHorizontal: 24 }}>
                    <AppSelect
                      label="ماركة الحافلة"
                      placeholder="الكل"
                      value={localFilters.make || ''}
                      onValueChange={(val) => setLocalFilters(p => ({ ...p, make: val }))}
                      items={[{ label: 'الكل', value: '' }, ...makeItems]}
                      iconRight="car-outline"
                    />
                  </View>
                </View>

                <View style={s.section}>
                  <Text style={s.sectionTitle}>الحد الأدنى لعدد المقاعد</Text>
                  <View style={[s.chipsWrap, { paddingHorizontal: 24 }]}>
                    {[10, 15, 30, 45, 50].map(cap => {
                      const active = localFilters.capacityMin === cap
                      return (
                        <TouchableOpacity
                          key={cap}
                          style={[s.chip, active && s.chipActive]}
                          onPress={() => toggleFilter('capacityMin', cap)}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.chipTxt, active && s.chipTxtActive]}>+ {cap} مقعد</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>

                <View style={s.section}>
                  <Text style={s.sectionTitle}>حالة الحافلة</Text>
                  <View style={{ paddingHorizontal: 24 }}>
                    <AppSelect
                      label="الحالة"
                      placeholder="الكل"
                      value={localFilters.condition || ''}
                      onValueChange={(val) => setLocalFilters(p => ({ ...p, condition: val }))}
                      items={[{ label: 'الكل', value: '' }, ...CONDITIONS.map(c => ({ label: c.labelAr, value: c.value }))]}
                      iconRight="shield-checkmark-outline"
                    />
                  </View>
                </View>

                {renderChips('ناقل الحركة', TRANSMISSION_TYPES.map(c => ({ id: c.value, label: c.labelAr })), 'transmission')}
                {renderChips('نوع الوقود', FUEL_TYPES.map(c => ({ id: c.value, label: c.labelAr })), 'fuelType')}

                {/* Location */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>الموقع</Text>
                  <View style={[s.row, { paddingHorizontal: 24 }]}>
                    <View style={s.inputWrap}>
                      <AppSelect
                        label="المحافظة"
                        placeholder="الكل"
                        value={localFilters.governorate || ''}
                        onValueChange={(val) => setLocalFilters(p => ({ ...p, governorate: val, city: '' }))}
                        items={[{ label: 'الكل', value: '' }, ...governorateItems]}
                        iconRight="location-outline"
                      />
                    </View>
                    <View style={s.inputWrap}>
                      <AppSelect
                        label="الولاية"
                        placeholder="الكل"
                        value={localFilters.city || ''}
                        onValueChange={(val) => setLocalFilters(p => ({ ...p, city: val }))}
                        items={[{ label: 'الكل', value: '' }, ...cityItems]}
                        iconRight="map-outline"
                        disabled={!localFilters.governorate}
                      />
                    </View>
                  </View>
                </View>

                {/* Price */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>نطاق السعر (ر.ع)</Text>
                  <View style={{ paddingHorizontal: 24, alignItems: 'center' }}>
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                      <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md }}>
                        <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.primary }}>
                          {priceRangeDisplay}
                        </Text>
                      </View>
                    </View>
                    <MultiSlider
                      values={[currentMinPrice, currentMaxPrice]}
                      sliderLength={screenWidth - 48}
                      onValuesChange={handlePriceChange}
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      step={100}
                      allowOverlap={false}
                      snapped
                      selectedStyle={{ backgroundColor: Colors.primary }}
                      unselectedStyle={{ backgroundColor: '#e2e8f0' }}
                      markerStyle={{ backgroundColor: Colors.primary, height: 20, width: 20, borderRadius: 10 }}
                    />
                  </View>
                </View>

                {/* Year */}
                <View style={[s.section, { borderBottomWidth: 0 }]}>
                  <Text style={s.sectionTitle}>نطاق سنة الصنع</Text>
                  <View style={{ paddingHorizontal: 24, alignItems: 'center' }}>
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                      <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md }}>
                        <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.primary }}>
                          {yearRangeDisplay}
                        </Text>
                      </View>
                    </View>
                    <MultiSlider
                      values={[currentMinYear, currentMaxYear]}
                      sliderLength={screenWidth - 48}
                      onValuesChange={handleYearChange}
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      step={1}
                      allowOverlap={true}
                      snapped
                      selectedStyle={{ backgroundColor: Colors.primary }}
                      unselectedStyle={{ backgroundColor: '#e2e8f0' }}
                      markerStyle={{ backgroundColor: Colors.primary, height: 20, width: 20, borderRadius: 10 }}
                    />
                  </View>
                </View>

              </ScrollView>

              <View style={s.footer}>
                <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.8}>
                  <Text style={s.resetTxt}>إعادة ضبط</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.applyBtn} onPress={handleApply} activeOpacity={0.8}>
                  <Text style={s.applyTxt}>تطبيق الفرز</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  contentWrap: {
    width: '100%',
    maxHeight: '90%',
  },
  content: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
    paddingTop: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 20 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: 20, color: '#0f172a', lineHeight: 28 },
  closeBtn: { 
    padding: 4, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 16 
  },
  
  scroll: { },
  section: {
    marginBottom: 24,
  },
  sectionTitle: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, 
    color: '#334155', 
    marginBottom: 12, 
    textAlign: 'left',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    gap: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: Colors.primary,
  },
  chipTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#64748b', lineHeight: 18 },
  chipTxtActive: { color: Colors.primary },

  row: { flexDirection: 'row', gap: 16 },
  inputWrap: { flex: 1 },
  inputLabel: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#64748b', marginBottom: 8, textAlign: 'left', lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: Radius.lg,
    height: 48,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_700Bold', 
    fontSize: 16, 
    color: '#0f172a',
    textAlign: 'left',
    paddingVertical: 8,
  },
  currency: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 14, 
    color: '#94a3b8',
    marginLeft: 8,
    lineHeight: 20,
  },
  sliderLabel: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 14, 
    color: '#334155',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    gap: 16,
  },
  resetBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: '#f1f5f9',
  },
  resetTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: '#64748b', lineHeight: 22 },
  applyBtn: {
    flex: 2,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  applyTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 15, color: '#fff', lineHeight: 22 },
});

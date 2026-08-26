import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { CardSystem } from '../../../constants/cardSystem'
import { AppInput } from '../../ui/AppInput'
import { SearchableSelectModal, SelectOption } from '../../ui/SearchableSelectModal'
import { CarStep3Props } from '../../../types/carForm.types'
import {
  CONDITION_TYPES,
  TRANSMISSION_TYPES,
  FUEL_TYPES,
  BODY_TYPES,
  DRIVE_TYPES,
  CAR_COLORS,
  CAR_FEATURE_KEYS,
} from '../../../constants/cars'
import { carsApi, CarBrand, CarModelItem, CarTrimItem } from '../../../api/cars'

export function CarStep3Details({
  formData,
  errors,
  customFeatureInput,
  onChangeCustomFeatureInput,
  onToggleFeature,
  onAddCustomFeature,
  onRemoveFeature,
  onUpdateField,
}: CarStep3Props) {
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [models, setModels] = useState<CarModelItem[]>([])
  const [trims, setTrims] = useState<CarTrimItem[]>([])

  const [selectModal, setSelectModal] = useState<{
    visible: boolean
    title: string
    data: SelectOption[]
    selectedValue?: string
    onSelect: (opt: SelectOption | null) => void
  }>({ visible: false, title: '', data: [], selectedValue: undefined, onSelect: () => {} })

  useEffect(() => {
    carsApi.getBrands().then(setBrands).catch(console.error)
  }, [])

  useEffect(() => {
    if (formData.brandId) {
      carsApi.getModels(formData.brandId).then(setModels).catch(console.error)
    } else {
      setModels([])
    }
  }, [formData.brandId])

  useEffect(() => {
    if (formData.carModelId) {
      carsApi.getTrims(formData.carModelId).then(setTrims).catch(console.error)
    } else {
      setTrims([])
    }
  }, [formData.carModelId])

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
      data: brands.map((b) => ({ id: b.id, label: (b as any).nameAr || b.name, payload: b })),
      selectedValue: formData.brandId,
      onSelect: async (opt) => {
        if (!opt) return
        const val = opt.id
        const data = opt.payload
        onUpdateField('brandId', val)
        onUpdateField('make', data.nameAr || data.name)
        onUpdateField('carModelId', '')
        onUpdateField('model', '')
        onUpdateField('carTrimId', '')
        onUpdateField('trim', '')
      },
    })
  }

  const openModelModal = () => {
    if (!models.length) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر الموديل',
      data: models.map((m) => ({ id: m.id, label: (m as any).nameAr || m.name, payload: m })),
      selectedValue: formData.carModelId,
      onSelect: async (opt) => {
        if (!opt) return
        const val = opt.id
        const data = opt.payload
        onUpdateField('carModelId', val)
        onUpdateField('model', data.name)
        onUpdateField('carTrimId', '')
        onUpdateField('trim', '')
      },
    })
  }

  const openTrimModal = () => {
    if (!trims.length) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر الفئة',
      data: trims.map((t) => ({ id: t.id, label: (t as any).nameAr || t.name, payload: t })),
      selectedValue: formData.carTrimId,
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('carTrimId', opt.id)
        onUpdateField('trim', opt.payload.name)
      },
    })
  }

  const openYearModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'سنة الصنع',
      data: yearOptions.map(y => ({ id: y.value, label: y.label })),
      selectedValue: formData.year,
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('year', opt.id)
      },
    })
  }

  const openColorModal = (field: 'exteriorColor' | 'interior') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: field === 'exteriorColor' ? 'اللون الخارجي' : 'اللون الداخلي',
      data: CAR_COLORS.map((o) => ({ id: o.value, label: o.label })),
      selectedValue: formData[field],
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField(field, opt.id)
      },
    })
  }

  const openFuelModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'نوع الوقود',
      data: FUEL_TYPES.map(o => ({ id: o.value, label: o.label })),
      selectedValue: formData.fuelType,
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('fuelType', opt.id)
      },
    })
  }

  const openBodyModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'شكل السيارة',
      data: BODY_TYPES.map(o => ({ id: o.value, label: o.label })),
      selectedValue: formData.bodyType,
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('bodyType', opt.id)
      },
    })
  }

  const openDriveModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'نظام الدفع',
      data: DRIVE_TYPES.map(o => ({ id: o.value, label: o.label })),
      selectedValue: formData.driveType,
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('driveType', opt.id)
      },
    })
  }

  const selectedBrand = brands.find((b) => b.id === formData.brandId)
  const selectedModel = models.find((m) => m.id === formData.carModelId)
  const selectedTrim = trims.find((t) => t.id === formData.carTrimId)

  return (
    <View style={s.stepWrap}>
      {/* 1. Main Specs */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>المواصفات الأساسية *</Text>

        {formData.listingType !== 'WANTED' && (
          <View style={s.inputWrapper}>
            <Text style={s.label}>الحالة *</Text>
            {errors.condition ? <Text style={s.inlineErrorTxt}>{errors.condition}</Text> : null}
            <View style={s.chipRow}>
              {CONDITION_TYPES.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.chip, formData.condition === opt.value && s.chipActive]}
                  onPress={() => onUpdateField('condition', opt.value)}
                >
                  <Text style={[s.chipTxt, formData.condition === opt.value && s.chipTxtActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>الماركة *</Text>
            <Pressable
              style={[s.selectorButton, errors.brandId && s.selectorError]}
              onPress={openBrandModal}
            >
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !formData.brandId && s.placeholder]} numberOfLines={1}>
                  {selectedBrand ? (selectedBrand as any).nameAr || selectedBrand.name : 'اختر الماركة'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
            {errors.brandId ? <Text style={s.inlineErrorTxt}>{errors.brandId}</Text> : null}
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>الموديل *</Text>
            <Pressable
              style={[
                s.selectorButton,
                !formData.brandId && s.selectorButtonDisabled,
                errors.carModelId && s.selectorError,
              ]}
              onPress={openModelModal}
              disabled={!formData.brandId}
            >
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !formData.carModelId && s.placeholder]} numberOfLines={1}>
                  {selectedModel ? selectedModel.name : 'اختر الموديل'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
            {errors.carModelId ? <Text style={s.inlineErrorTxt}>{errors.carModelId}</Text> : null}
          </View>
        </View>

        <View style={s.rowFields}>
          {trims.length > 0 && (
            <View style={s.flex1}>
              <Text style={s.label}>الفئة</Text>
              <Pressable style={s.selectorButton} onPress={openTrimModal}>
                <View style={s.selectorContent}>
                  <Text style={[s.selectorText, !formData.carTrimId && s.placeholder]} numberOfLines={1}>
                    {selectedTrim ? selectedTrim.name : 'اختر الفئة'}
                  </Text>
                </View>
                <View style={s.selectorIconWrap}>
                  <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                </View>
              </Pressable>
            </View>
          )}
          <View style={s.flex1}>
            <Text style={s.label}>سنة الصنع *</Text>
            <Pressable
              style={[
                s.selectorButton,
                !formData.carModelId && s.selectorButtonDisabled,
                errors.year && s.selectorError,
              ]}
              onPress={openYearModal}
              disabled={!formData.carModelId}
            >
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !formData.year && s.placeholder]}>
                  {formData.year || 'اختر السنة'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
            {errors.year ? <Text style={s.inlineErrorTxt}>{errors.year}</Text> : null}
          </View>
        </View>

        {formData.listingType !== 'WANTED' && formData.condition !== 'NEW' && (
          <AppInput
            label="الممشى (كم) *"
            placeholder="أدخل المسافة المقطوعة"
            value={formData.mileage}
            onChangeText={(val) => onUpdateField('mileage', val)}
            keyboardType="numeric"
            maxLength={7}
            error={errors.mileage}
          />
        )}
      </View>

      {/* 2. Additional Specs */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>مواصفات إضافية *</Text>

        <View style={s.inputWrapper}>
          <Text style={s.label}>نوع الوقود *</Text>
          <Pressable style={s.selectorButton} onPress={openFuelModal}>
            <View style={s.selectorContent}>
              <Text style={[s.selectorText, !formData.fuelType && s.placeholder]} numberOfLines={1}>
                {FUEL_TYPES.find(f => f.value === formData.fuelType)?.label || 'اختر نوع الوقود'}
              </Text>
            </View>
            <View style={s.selectorIconWrap}>
              <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>
          {errors.fuelType ? <Text style={s.inlineErrorTxt}>{errors.fuelType}</Text> : null}
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>شكل السيارة *</Text>
          <Pressable style={s.selectorButton} onPress={openBodyModal}>
            <View style={s.selectorContent}>
              <Text style={[s.selectorText, !formData.bodyType && s.placeholder]} numberOfLines={1}>
                {BODY_TYPES.find(b => b.value === formData.bodyType)?.label || 'اختر شكل السيارة'}
              </Text>
            </View>
            <View style={s.selectorIconWrap}>
              <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>
          {errors.bodyType ? <Text style={s.inlineErrorTxt}>{errors.bodyType}</Text> : null}
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>نظام الدفع *</Text>
          <Pressable style={s.selectorButton} onPress={openDriveModal}>
            <View style={s.selectorContent}>
              <Text style={[s.selectorText, !formData.driveType && s.placeholder]} numberOfLines={1}>
                {DRIVE_TYPES.find(d => d.value === formData.driveType)?.label || 'اختر نظام الدفع'}
              </Text>
            </View>
            <View style={s.selectorIconWrap}>
              <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
            </View>
          </Pressable>
          {errors.driveType ? <Text style={s.inlineErrorTxt}>{errors.driveType}</Text> : null}
        </View>

        <View style={s.inputWrapper}>
          <Text style={s.label}>ناقل الحركة *</Text>
          <View style={s.chipRow}>
            {TRANSMISSION_TYPES.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[s.chip, formData.transmission === opt.value && s.chipActive]}
                onPress={() => onUpdateField('transmission', opt.value)}
              >
                <Text style={[s.chipTxt, formData.transmission === opt.value && s.chipTxtActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.transmission ? <Text style={s.inlineErrorTxt}>{errors.transmission}</Text> : null}
        </View>

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>اللون الخارجي *</Text>
            <Pressable style={s.selectorButton} onPress={() => openColorModal('exteriorColor')}>
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !formData.exteriorColor && s.placeholder]} numberOfLines={1}>
                  {CAR_COLORS.find((c) => c.value === formData.exteriorColor)?.label || 'اختر اللون'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                {formData.exteriorColor ? (
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: CAR_COLORS.find((c) => c.value === formData.exteriorColor)?.hex,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  />
                ) : (
                  <Ionicons name="color-palette-outline" size={18} color={Colors.textMuted} />
                )}
              </View>
            </Pressable>
            {errors.exteriorColor ? <Text style={s.inlineErrorTxt}>{errors.exteriorColor}</Text> : null}
          </View>

          <View style={s.flex1}>
            <Text style={s.label}>اللون الداخلي</Text>
            <Pressable style={s.selectorButton} onPress={() => openColorModal('interior')}>
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !formData.interior && s.placeholder]} numberOfLines={1}>
                  {CAR_COLORS.find((c) => c.value === formData.interior)?.label || 'اختر اللون'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                {formData.interior ? (
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: CAR_COLORS.find((c) => c.value === formData.interior)?.hex,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  />
                ) : (
                  <Ionicons name="color-palette-outline" size={18} color={Colors.textMuted} />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <AppInput
              label="سعة المحرك (CC)"
              placeholder="مثال: 1600"
              value={formData.engineSize}
              onChangeText={(val) => onUpdateField('engineSize', val)}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <View style={s.flex1}>
            <AppInput
              label="الأحصنة"
              placeholder="مثال: 150"
              value={formData.horsepower}
              onChangeText={(val) => onUpdateField('horsepower', val)}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <AppInput
              label="الأبواب"
              placeholder="مثال: 4"
              value={formData.doors}
              onChangeText={(val) => onUpdateField('doors', val)}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <View style={s.flex1}>
            <AppInput
              label="المقاعد"
              placeholder="مثال: 5"
              value={formData.seats}
              onChangeText={(val) => onUpdateField('seats', val)}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>
      </View>

      {/* 3. Features */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>المميزات الإضافية (اختياري)</Text>
        <View style={s.featuresGrid}>
          {CAR_FEATURE_KEYS.map((feat) => {
            const isActive = formData.features.includes(feat.id)
            return (
              <TouchableOpacity
                key={feat.id}
                style={[s.featureItem, isActive && s.featureItemActive]}
                onPress={() => onToggleFeature(feat.id)}
              >
                <Ionicons
                  name={feat.icon as any}
                  size={15}
                  color={isActive ? '#ffffff' : '#64748B'}
                />
                <Text
                  style={[s.featureTxt, isActive && s.featureTxtActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {feat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={s.addFeatureWrap}>
          <TextInput
            style={s.featureInput}
            placeholder="إضافة ميزة أخرى..."
            placeholderTextColor={Colors.textMuted}
            value={customFeatureInput}
            onChangeText={onChangeCustomFeatureInput}
            textAlign="right"
            maxLength={50}
            onSubmitEditing={onAddCustomFeature}
          />
          <TouchableOpacity
            style={s.featureAddBtn}
            onPress={onAddCustomFeature}
            disabled={!customFeatureInput.trim()}
          >
            <Ionicons
              name="add"
              size={20}
              color={customFeatureInput.trim() ? Colors.primary : Colors.border}
            />
          </TouchableOpacity>
        </View>

        {/* Custom features (those not in the constant list) */}
        {formData.features
          .filter((f) => !CAR_FEATURE_KEYS.find((k) => k.id === f))
          .map((f, i) => (
            <View key={i} style={s.customFeaturePill}>
              <Text style={s.customFeaturePillTxt}>{f}</Text>
              <TouchableOpacity onPress={() => onRemoveFeature(f)} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                <Ionicons name="close-circle" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
      </View>

      <SearchableSelectModal
        visible={selectModal.visible}
        onClose={() => setSelectModal({ ...selectModal, visible: false })}
        title={selectModal.title}
        data={selectModal.data}
        selectedValue={selectModal.selectedValue}
        onSelect={selectModal.onSelect}
      />
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: { gap: Spacing.space3 },
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  inputWrapper: { gap: 6 },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 1,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  rowFields: { flexDirection: 'row', gap: Spacing.space3 },
  flex1: { flex: 1, gap: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
  },
  chipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
  },
  selectorButtonDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.6,
  },
  selectorError: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  selectorContent: {
    flex: 1,
    paddingEnd: 8,
  },
  selectorText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    color: Colors.textMuted,
    fontFamily: 'Almarai_400Regular',
  },
  selectorIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: CardSystem.radius.inner,
  },
  featureItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  featureTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
  },
  featureTxtActive: {
    color: '#ffffff',
  },
  addFeatureWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    height: 48,
  },
  featureInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#0F172A',
    paddingHorizontal: 14,
    height: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  featureAddBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  customFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 6,
  },
  customFeaturePillTxt: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: '#991B1B',
  },
})

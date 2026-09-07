import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { WizardCard } from '../../ui/WizardCard'
import { SearchableSelectModal, SelectOption } from '../../ui/SearchableSelectModal'
import { BusWizardData } from '../../../store/busWizardStore'
import { busesApi, BusManufacturer, BusModel } from '../../../api/buses'
import {
  BUS_FEATURES,
  BUS_CONDITIONS,
  BUS_TRANSMISSIONS,
  BUS_FUEL_TYPES,
} from '../../../constants/buses'

export interface BusStep3Props {
  data: BusWizardData
  errors: Record<string, string>
  onUpdateField: (field: keyof BusWizardData, value: any) => void
}

export function BusStep3Details({ data, errors, onUpdateField }: BusStep3Props) {
  const [manufacturers, setManufacturers] = useState<BusManufacturer[]>([])
  const [models, setModels] = useState<BusModel[]>([])
  const [isLoadingManufacturers, setIsLoadingManufacturers] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [manufacturersError, setManufacturersError] = useState<string | null>(null)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const [isCustomMake, setIsCustomMake] = useState(!data.manufacturerId && !!data.make)
  const [isCustomModel, setIsCustomModel] = useState(!data.modelId && !!data.model)

  const [selectModal, setSelectModal] = useState<{
    visible: boolean
    title: string
    data: SelectOption[]
    selectedValue?: string
    onSelect: (opt: SelectOption | null) => void
  }>({ visible: false, title: '', data: [], selectedValue: undefined, onSelect: () => {} })

  // Fetch manufacturers from real API
  const fetchManufacturers = () => {
    setIsLoadingManufacturers(true)
    setManufacturersError(null)
    busesApi
      .getManufacturers()
      .then((res) => {
        setManufacturers(res || [])
      })
      .catch((err) => {
        console.error('Failed to load bus manufacturers', err)
        setManufacturersError('تعذر تحميل قائمة الماركات، يرجى إعادة المحاولة')
      })
      .finally(() => {
        setIsLoadingManufacturers(false)
      })
  }

  useEffect(() => {
    fetchManufacturers()
  }, [])

  // Fetch models for selected manufacturer from real API
  useEffect(() => {
    if (data.manufacturerId && !isCustomMake) {
      setIsLoadingModels(true)
      setModelsError(null)
      busesApi
        .getModels(data.manufacturerId)
        .then((res) => {
          setModels(res || [])
        })
        .catch((err) => {
          console.error('Failed to load bus models', err)
          setModelsError('تعذر تحميل موديلات الماركة المختارة')
        })
        .finally(() => {
          setIsLoadingModels(false)
        })
    } else {
      setModels([])
    }
  }, [data.manufacturerId, isCustomMake])

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear() + 1
    const years: SelectOption[] = []
    for (let y = currentYear; y >= 1990; y--) {
      years.push({ id: String(y), label: String(y) })
    }
    return years
  }, [])

  const openManufacturerModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر الماركة',
      data: manufacturers.map((m) => ({
        id: m.id,
        label: m.nameAr || m.name,
        payload: m,
      })),
      selectedValue: data.manufacturerId || undefined,
      onSelect: (opt) => {
        if (!opt) return
        const selected = opt.payload as BusManufacturer
        onUpdateField('manufacturerId', selected.id)
        onUpdateField('make', selected.nameAr || selected.name)
        onUpdateField('modelId', null)
        onUpdateField('model', '')
        setIsCustomMake(false)
        setIsCustomModel(false)
      },
    })
  }

  const openModelModal = () => {
    if (!models.length) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر الموديل',
      data: models.map((m) => ({
        id: m.id,
        label: m.nameAr || m.name,
        payload: m,
      })),
      selectedValue: data.modelId || undefined,
      onSelect: (opt) => {
        if (!opt) return
        const selected = opt.payload as BusModel
        onUpdateField('modelId', selected.id)
        onUpdateField('model', selected.nameAr || selected.name)
        if (selected.capacity && !data.capacity) {
          onUpdateField('capacity', String(selected.capacity))
        }
        setIsCustomModel(false)
      },
    })
  }

  const openYearModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر سنة الصنع',
      data: yearOptions,
      selectedValue: data.year,
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('year', opt.id)
      },
    })
  }

  const toggleFeature = (featureId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const current = data.features || []
    const updated = current.includes(featureId)
      ? current.filter((f) => f !== featureId)
      : [...current, featureId]
    onUpdateField('features', updated)
  }

  return (
    <View style={s.stepWrap}>
      {/* 1. Basic Title & Description */}
      <WizardCard title="البيانات الأساسية *" subtitle="اكتب عنواناً ووصفاً جذاباً للحافلة">
        <AppInput
          label="عنوان الإعلان *"
          placeholder="مثال: حافلة تويوتا كوستر 30 راكب بحالة ممتازة"
          value={data.title}
          onChangeText={(val) => onUpdateField('title', val)}
          error={errors.title}
          testID="input-bus-title"
          maxLength={100}
        />
        <AppInput
          label="تفاصيل الإعلان *"
          placeholder="اكتب وصفاً مفصلاً عن الحافلة، حالة المحرك، التكييف، الفحص الدوري..."
          value={data.description}
          onChangeText={(val) => onUpdateField('description', val)}
          error={errors.description}
          multiline
          numberOfLines={4}
          containerStyle={{ marginTop: 12 }}
          testID="input-bus-description"
        />
      </WizardCard>

      {/* 2. Manufacturer & Model */}
      <WizardCard title="الماركة والموديل *" subtitle="اختر الماركة والموديل من القائمة أو أضف يدوياً">
        {/* Make / Manufacturer */}
        <Text style={s.fieldLabel}>الماركة *</Text>
        {errors.make ? <Text style={s.inlineErrorTxt}>{errors.make}</Text> : null}

        {isCustomMake ? (
          <View style={s.customInputWrap}>
            <TextInput
              style={s.customTextInput}
              placeholder="اكتب اسم الماركة..."
              placeholderTextColor={Colors.textMuted}
              value={data.make}
              onChangeText={(val) => {
                onUpdateField('make', val)
                onUpdateField('manufacturerId', null)
              }}
              textAlign="right"
              testID="custom-make-input"
            />
            <TouchableOpacity
              style={s.switchModeBtn}
              onPress={() => {
                setIsCustomMake(false)
                onUpdateField('make', '')
                onUpdateField('manufacturerId', null)
              }}
            >
              <Text style={s.switchModeTxt}>اختيار من القائمة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Pressable
              style={[s.selectorButton, !data.make && s.selectorButtonEmpty]}
              onPress={openManufacturerModal}
              disabled={isLoadingManufacturers}
              testID="open-make-modal-btn"
            >
              <View style={s.selectorContent}>
                {isLoadingManufacturers ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text
                    style={[s.selectorText, !data.make && s.placeholder]}
                    numberOfLines={1}
                  >
                    {data.make || 'اختر الماركة من القائمة...'}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
            </Pressable>

            {manufacturersError ? (
              <View style={s.apiErrorRow}>
                <Text style={s.apiErrorTxt}>{manufacturersError}</Text>
                <TouchableOpacity onPress={fetchManufacturers}>
                  <Text style={s.retryTxt}>إعادة المحاولة</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={s.manualLink}
              onPress={() => {
                setIsCustomMake(true)
                onUpdateField('manufacturerId', null)
                onUpdateField('make', '')
                onUpdateField('modelId', null)
                onUpdateField('model', '')
              }}
              testID="enable-custom-make-btn"
            >
              <Text style={s.manualLinkTxt}>الماركة غير موجودة؟ اكتبها يدوياً</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Model */}
        <View style={{ marginTop: 14 }}>
          <Text style={s.fieldLabel}>الموديل *</Text>
          {errors.model ? <Text style={s.inlineErrorTxt}>{errors.model}</Text> : null}

          {isCustomModel || isCustomMake ? (
            <View style={s.customInputWrap}>
              <TextInput
                style={s.customTextInput}
                placeholder="اكتب اسم الموديل..."
                placeholderTextColor={Colors.textMuted}
                value={data.model}
                onChangeText={(val) => {
                  onUpdateField('model', val)
                  onUpdateField('modelId', null)
                }}
                textAlign="right"
                testID="custom-model-input"
              />
              {!isCustomMake && (
                <TouchableOpacity
                  style={s.switchModeBtn}
                  onPress={() => {
                    setIsCustomModel(false)
                    onUpdateField('model', '')
                    onUpdateField('modelId', null)
                  }}
                >
                  <Text style={s.switchModeTxt}>اختيار من القائمة</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              <Pressable
                style={[
                  s.selectorButton,
                  (!data.model || !data.manufacturerId) && s.selectorButtonEmpty,
                ]}
                onPress={openModelModal}
                disabled={!data.manufacturerId || isLoadingModels}
                testID="open-model-modal-btn"
              >
                <View style={s.selectorContent}>
                  {isLoadingModels ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text
                      style={[
                        s.selectorText,
                        (!data.model || !data.manufacturerId) && s.placeholder,
                      ]}
                      numberOfLines={1}
                    >
                      {!data.manufacturerId
                        ? 'اختر الماركة أولاً'
                        : data.model || 'اختر الموديل من القائمة...'}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </Pressable>

              {modelsError ? (
                <View style={s.apiErrorRow}>
                  <Text style={s.apiErrorTxt}>{modelsError}</Text>
                </View>
              ) : null}

              {data.manufacturerId ? (
                <TouchableOpacity
                  style={s.manualLink}
                  onPress={() => {
                    setIsCustomModel(true)
                    onUpdateField('modelId', null)
                    onUpdateField('model', '')
                  }}
                  testID="enable-custom-model-btn"
                >
                  <Text style={s.manualLinkTxt}>الموديل غير موجود؟ اكتبه يدوياً</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      </WizardCard>

      {/* 3. Year, Capacity, Mileage */}
      <WizardCard title="المواصفات الفنية *" subtitle="سنة الصنع وسعة الركاب والممشى">
        <View style={s.rowFields}>
          {/* Year */}
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>سنة الصنع *</Text>
            {errors.year ? <Text style={s.inlineErrorTxt}>{errors.year}</Text> : null}
            <Pressable
              style={[s.selectorButton, !data.year && s.selectorButtonEmpty]}
              onPress={openYearModal}
              testID="open-year-modal-btn"
            >
              <Text style={[s.selectorText, !data.year && s.placeholder]} numberOfLines={1}>
                {data.year || 'السنة'}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Capacity */}
          <View style={{ flex: 1 }}>
            <AppInput
              label="عدد المقاعد *"
              placeholder="مثال: 30"
              value={data.capacity}
              onChangeText={(val) => onUpdateField('capacity', val.replace(/[^0-9]/g, ''))}
              error={errors.capacity}
              keyboardType="numeric"
              maxLength={4}
              testID="input-bus-capacity"
            />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <AppInput
            label="الممشى (كم) *"
            placeholder="مثال: 120000"
            value={data.mileage}
            onChangeText={(val) => onUpdateField('mileage', val.replace(/[^0-9]/g, ''))}
            error={errors.mileage}
            keyboardType="numeric"
            maxLength={8}
            testID="input-bus-mileage"
          />
        </View>
      </WizardCard>

      {/* 4. Transmission, Fuel, Condition */}
      <WizardCard title="الحالة ونظام الحركة" subtitle="حدد نوع ناقل الحركة ونوع الوقود">
        {/* Transmission */}
        <Text style={s.fieldLabel}>ناقل الحركة</Text>
        <View style={s.chipRow}>
          {BUS_TRANSMISSIONS.map((t) => {
            const isSel = data.transmission === t.id
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.chip, isSel && s.chipActive]}
                onPress={() => onUpdateField('transmission', t.id)}
                activeOpacity={0.7}
                testID={`transmission-${t.id}`}
              >
                <Text style={[s.chipTxt, isSel && s.chipTxtActive]}>{t.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Fuel Type */}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>نوع الوقود</Text>
        <View style={s.chipRow}>
          {BUS_FUEL_TYPES.map((f) => {
            const isSel = data.fuelType === f.id
            return (
              <TouchableOpacity
                key={f.id}
                style={[s.chip, isSel && s.chipActive]}
                onPress={() => onUpdateField('fuelType', f.id)}
                activeOpacity={0.7}
                testID={`fuel-${f.id}`}
              >
                <Text style={[s.chipTxt, isSel && s.chipTxtActive]}>{f.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Condition */}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>حالة الحافلة</Text>
        <View style={s.chipRow}>
          {BUS_CONDITIONS.map((c) => {
            const isSel = data.condition === c.id
            return (
              <TouchableOpacity
                key={c.id}
                style={[s.chip, isSel && s.chipActive]}
                onPress={() => onUpdateField('condition', c.id)}
                activeOpacity={0.7}
                testID={`condition-${c.id}`}
              >
                <Text style={[s.chipTxt, isSel && s.chipTxtActive]}>{c.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

      {/* 5. Features & Plate Number */}
      <WizardCard title="المميزات ورقم اللوحة" subtitle="حدد التجهيزات الإضافية المتوفرة في الحافلة">
        <Text style={s.fieldLabel}>التجهيزات والمميزات</Text>
        <View style={s.featuresGrid}>
          {BUS_FEATURES.map((feat) => {
            const isSel = (data.features || []).includes(feat.id)
            return (
              <TouchableOpacity
                key={feat.id}
                style={[s.featureChip, isSel && s.featureChipActive]}
                onPress={() => toggleFeature(feat.id)}
                activeOpacity={0.7}
                testID={`feature-${feat.id}`}
              >
                <Ionicons
                  name={isSel ? 'checkmark-circle' : 'add-circle-outline'}
                  size={16}
                  color={isSel ? Colors.primary : Colors.textMuted}
                />
                <Text style={[s.featureTxt, isSel && s.featureTxtActive]}>
                  {feat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={{ marginTop: 14 }}>
          <AppInput
            label="رقم اللوحة (اختياري)"
            placeholder="مثال: 1234 أ ب"
            value={data.plateNumber}
            onChangeText={(val) => onUpdateField('plateNumber', val)}
            testID="input-bus-plate"
          />
        </View>
      </WizardCard>

      {/* Searchable Select Modal */}
      <SearchableSelectModal
        visible={selectModal.visible}
        title={selectModal.title}
        data={selectModal.data}
        selectedValue={selectModal.selectedValue}
        onSelect={(opt) => {
          selectModal.onSelect(opt)
          setSelectModal((prev) => ({ ...prev, visible: false }))
        }}
        onClose={() => setSelectModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  fieldLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -2,
    marginBottom: 6,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectorButtonEmpty: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  selectorContent: {
    flex: 1,
    marginEnd: 8,
  },
  selectorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
  },
  manualLink: {
    marginTop: 6,
    paddingVertical: 4,
  },
  manualLinkTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    color: '#0F172A',
    minHeight: 48,
  },
  switchModeBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  switchModeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.primary,
    textAlign: 'center',
  },
  apiErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  apiErrorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    color: Colors.error,
  },
  retryTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flex: 1,
    minWidth: 70,
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
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 11.5,
    color: '#475569',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  chipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_700Bold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  featureChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  featureTxt: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 11,
    color: '#475569',
    writingDirection: 'rtl',
  },
  featureTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_700Bold',
  },
})

import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { SearchableSelectModal, SelectOption } from '../../ui/SearchableSelectModal'
import { MultiSelectSearchModal, MultiSelectOption } from '../../ui/MultiSelectSearchModal'
import { PartStep4Props } from '../../../types/partForm.types'
import { CompatibleVehicleType } from '../../../store/partWizardStore'
import { carsApi, CarBrand, CarModelItem } from '../../../api/cars'

const VEHICLE_TYPE_OPTIONS: { id: CompatibleVehicleType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'CAR', label: 'سيارات', icon: 'car-outline' },
  { id: 'BUS', label: 'باصات', icon: 'bus-outline' },
  { id: 'EQUIPMENT', label: 'معدات', icon: 'construct-outline' },
]

export function PartStep4Compatibility({
  formData,
  errors,
  onUpdateField,
}: PartStep4Props) {
  const [brands, setBrands] = useState<CarBrand[]>([])
  const [fetchedModels, setFetchedModels] = useState<CarModelItem[]>([])
  const [customModelInput, setCustomModelInput] = useState('')

  const [selectModal, setSelectModal] = useState<{
    visible: boolean
    title: string
    data: SelectOption[]
    selectedValue?: string
    onSelect: (opt: SelectOption | null) => void
  }>({ visible: false, title: '', data: [], selectedValue: undefined, onSelect: () => {} })

  const [multiSelectModal, setMultiSelectModal] = useState<{
    visible: boolean
    title: string
    data: MultiSelectOption[]
    selectedValues: string[]
    onConfirm: (selectedIds: string[]) => void
  }>({ visible: false, title: '', data: [], selectedValues: [], onConfirm: () => {} })

  useEffect(() => {
    carsApi.getBrands().then(setBrands).catch(console.error)
  }, [])

  useEffect(() => {
    if (formData.compatibleMakes.length === 0 || formData.compatibleMakes.includes('all')) {
      setFetchedModels([])
      return
    }
    Promise.allSettled(
      formData.compatibleMakes.map((brandId) => carsApi.getModels(brandId))
    ).then((results) => {
      const all = results
        .filter((r): r is PromiseFulfilledResult<CarModelItem[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
      const deduped = Array.from(new Map(all.map((m) => [m.name, m])).values())
      setFetchedModels(deduped)
    })
  }, [formData.compatibleMakes])

  const yearOptions = useMemo(() => {
    const start = new Date().getFullYear() + 1
    const end = 1980
    return Array.from({ length: start - end + 1 }, (_, i) => String(start - i))
  }, [])

  const toggleVehicleType = (id: CompatibleVehicleType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const current = formData.compatibleVehicleTypes
    const next = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id]
    onUpdateField('compatibleVehicleTypes', next)

    if (id === 'CAR' && current.includes('CAR')) {
      onUpdateField('compatibleMakes', [])
      onUpdateField('compatibleModels', [])
    }
  }

  const isAllMakes = formData.compatibleMakes.includes('all')

  const toggleAllMakes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (isAllMakes) {
      onUpdateField('compatibleMakes', [])
    } else {
      onUpdateField('compatibleMakes', ['all'])
      onUpdateField('compatibleModels', [])
    }
  }

  const openMakesModal = () => {
    if (isAllMakes) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMultiSelectModal({
      visible: true,
      title: 'اختر الماركات المتوافقة',
      data: brands.map((b) => ({ id: b.id, label: (b as any).nameAr || b.name })),
      selectedValues: formData.compatibleMakes.filter((m) => m !== 'all'),
      onConfirm: (selectedIds) => {
        onUpdateField('compatibleMakes', selectedIds)
        onUpdateField('compatibleModels', [])
      },
    })
  }

  const handleRemoveMake = (makeId: string) => {
    const updated = formData.compatibleMakes.filter((m) => m !== makeId)
    onUpdateField('compatibleMakes', updated)
    onUpdateField('compatibleModels', [])
  }

  const openModelsModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMultiSelectModal({
      visible: true,
      title: 'اختر الموديلات المتوافقة',
      data: fetchedModels.map((m) => ({ id: m.name, label: (m as any).nameAr || m.name })),
      selectedValues: formData.compatibleModels,
      onConfirm: (selectedNames) => {
        const fetchedNames = new Set(fetchedModels.map((m) => m.name))
        const customExisting = formData.compatibleModels.filter((name) => !fetchedNames.has(name))
        const merged = Array.from(new Set([...selectedNames, ...customExisting]))
        onUpdateField('compatibleModels', merged)
      },
    })
  }

  const handleAddCustomModel = (textToAdd?: string) => {
    const val = typeof textToAdd === 'string' ? textToAdd : customModelInput
    const trimmed = val.trim()
    if (!trimmed) return
    if (!formData.compatibleModels.includes(trimmed)) {
      onUpdateField('compatibleModels', [...formData.compatibleModels, trimmed])
    }
    setCustomModelInput('')
  }

  const handleRemoveModel = (modelName: string) => {
    onUpdateField(
      'compatibleModels',
      formData.compatibleModels.filter((m) => m !== modelName)
    )
  }

  const openYearFromModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'سنة الصنع (من)',
      data: yearOptions.map((y) => ({ id: y, label: y })),
      selectedValue: formData.yearFrom?.toString(),
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('yearFrom', Number(opt.id))
      },
    })
  }

  const openYearToModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'سنة الصنع (إلى)',
      data: yearOptions.map((y) => ({ id: y, label: y })),
      selectedValue: formData.yearTo?.toString(),
      onSelect: (opt) => {
        if (!opt) return
        onUpdateField('yearTo', Number(opt.id))
      },
    })
  }

  const isCarSelected = formData.compatibleVehicleTypes.includes('CAR')
  const specificMakes = formData.compatibleMakes.filter((m) => m !== 'all')

  return (
    <View style={s.stepWrap}>
      {/* 1. Note Banner */}
      <View style={s.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
        <Text style={s.infoBannerTxt}>
          حدد توافق القطعة لمساعدة المشترين في العثور عليها بسهولة (جميع الحقول في هذه الخطوة اختيارية).
        </Text>
      </View>

      {/* 2. Vehicle Types */}
      <WizardCard title="نوع المركبة المتوافقة">
        <View style={s.chipRow}>
          {VEHICLE_TYPE_OPTIONS.map((opt) => {
            const isActive = formData.compatibleVehicleTypes.includes(opt.id)
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.chip, isActive && s.chipActive]}
                onPress={() => toggleVehicleType(opt.id)}
                activeOpacity={0.7}
                testID={`vehicle-type-${opt.id}`}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={isActive ? Colors.primary : '#64748B'}
                />
                <Text style={[s.chipTxt, isActive && s.chipTxtActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

      {/* 3. Compatible Makes */}
      {isCarSelected && (
        <WizardCard title="الماركات المتوافقة">
          <View style={s.makesWrapper}>
            <TouchableOpacity
              style={[s.allMakesChip, isAllMakes && s.allMakesChipActive]}
              onPress={toggleAllMakes}
              activeOpacity={0.7}
              testID="all-makes-chip"
            >
              <Ionicons
                name={isAllMakes ? 'checkmark-circle' : 'radio-button-off'}
                size={16}
                color={isAllMakes ? Colors.primary : '#64748B'}
              />
              <Text style={[s.allMakesChipTxt, isAllMakes && s.allMakesChipTxtActive]}>
                متوافق مع جميع الماركات
              </Text>
            </TouchableOpacity>

            {!isAllMakes && (
              <>
                <Pressable
                  style={s.selectorButton}
                  onPress={openMakesModal}
                  testID="open-makes-modal-btn"
                >
                  <View style={s.selectorContent}>
                    <Text style={[s.selectorText, specificMakes.length === 0 && s.placeholder]} numberOfLines={1}>
                      {specificMakes.length > 0
                        ? `تم اختيار ${specificMakes.length} ماركة`
                        : 'اختر الماركات المتوافقة'}
                    </Text>
                  </View>
                  <View style={s.selectorIconWrap}>
                    <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                  </View>
                </Pressable>

                {specificMakes.length > 0 && (
                  <View style={s.pillsWrap} testID="selected-makes-pills">
                    {specificMakes.map((makeId) => {
                      const brand = brands.find((b) => b.id === makeId)
                      const label = brand ? (brand as any).nameAr || brand.name : makeId
                      return (
                        <View key={makeId} style={s.pillItem} testID={`make-pill-${makeId}`}>
                          <Text style={s.pillItemTxt}>{label}</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveMake(makeId)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            testID={`remove-make-${makeId}`}
                          >
                            <Ionicons name="close-circle" size={16} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                  </View>
                )}
              </>
            )}
          </View>
        </WizardCard>
      )}

      {/* 4. Compatible Models */}
      {isCarSelected && specificMakes.length > 0 && !isAllMakes && (
        <WizardCard title="الموديلات المتوافقة">
          <View style={s.modelsWrapper}>
            {fetchedModels.length > 0 && (
              <Pressable
                style={s.selectorButton}
                onPress={openModelsModal}
                testID="open-models-modal-btn"
              >
                <View style={s.selectorContent}>
                  <Text style={[s.selectorText, formData.compatibleModels.length === 0 && s.placeholder]} numberOfLines={1}>
                    {formData.compatibleModels.length > 0
                      ? `تم اختيار / إضافة ${formData.compatibleModels.length} موديل`
                      : 'اختر الموديلات من القائمة'}
                  </Text>
                </View>
                <View style={s.selectorIconWrap}>
                  <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                </View>
              </Pressable>
            )}

            {/* Free-text custom model input */}
            <View style={s.addModelWrap}>
              <TextInput
                style={s.modelInput}
                placeholder="إضافة موديل يدوي..."
                placeholderTextColor={Colors.textMuted}
                value={customModelInput}
                onChangeText={setCustomModelInput}
                textAlign="right"
                maxLength={40}
                onSubmitEditing={() => handleAddCustomModel()}
                testID="custom-model-input"
              />
              <TouchableOpacity
                style={s.modelAddBtn}
                onPress={() => handleAddCustomModel()}
                disabled={!customModelInput.trim()}
                testID="add-custom-model-btn"
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={customModelInput.trim() ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
            </View>

            {formData.compatibleModels.length > 0 && (
              <View style={s.pillsWrap} testID="selected-models-pills">
                {formData.compatibleModels.map((modelName) => (
                  <View key={modelName} style={s.pillItem} testID={`model-pill-${modelName}`}>
                    <Text style={s.pillItemTxt}>{modelName}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveModel(modelName)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      testID={`remove-model-${modelName}`}
                    >
                      <Ionicons name="close-circle" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </WizardCard>
      )}

      {/* 5. Year Range */}
      <WizardCard title="سنة الصنع (من - إلى)">
        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>من سنة</Text>
            <Pressable
              style={s.selectorButton}
              onPress={openYearFromModal}
              testID="year-from-btn"
            >
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !formData.yearFrom && s.placeholder]}>
                  {formData.yearFrom ? String(formData.yearFrom) : 'اختر السنة'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
          </View>

          <View style={s.flex1}>
            <Text style={s.label}>إلى سنة</Text>
            <Pressable
              style={[s.selectorButton, errors.yearTo && s.selectorError]}
              onPress={openYearToModal}
              testID="year-to-btn"
            >
              <View style={s.selectorContent}>
                <Text style={[s.selectorText, !formData.yearTo && s.placeholder]}>
                  {formData.yearTo ? String(formData.yearTo) : 'اختر السنة'}
                </Text>
              </View>
              <View style={s.selectorIconWrap}>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </View>
            </Pressable>
          </View>
        </View>
        {errors.yearTo ? <Text style={s.inlineErrorTxt} testID="year-to-error">{errors.yearTo}</Text> : null}
      </WizardCard>

      {/* Year Single Select Modal */}
      <SearchableSelectModal
        visible={selectModal.visible}
        onClose={() => setSelectModal((prev) => ({ ...prev, visible: false }))}
        title={selectModal.title}
        data={selectModal.data}
        selectedValue={selectModal.selectedValue}
        onSelect={selectModal.onSelect}
      />

      {/* Multi Select Search Modal for Makes / Models */}
      <MultiSelectSearchModal
        visible={multiSelectModal.visible}
        onClose={() => setMultiSelectModal((prev) => ({ ...prev, visible: false }))}
        title={multiSelectModal.title}
        data={multiSelectModal.data}
        selectedValues={multiSelectModal.selectedValues}
        onConfirm={multiSelectModal.onConfirm}
      />
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoBannerTxt: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#1E40AF',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#475569',
  },
  chipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
  makesWrapper: {
    gap: 10,
  },
  allMakesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  allMakesChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  allMakesChipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
  },
  allMakesChipTxtActive: {
    color: Colors.primary,
  },
  modelsWrapper: {
    gap: 10,
  },
  addModelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    height: 48,
  },
  modelInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    paddingHorizontal: 12,
    height: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modelAddBtn: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 6,
  },
  pillItemTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.primary,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.space3,
  },
  flex1: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
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
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    color: Colors.textMuted,
    fontFamily: 'Almarai_400Regular',
  },
  selectorIconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
})

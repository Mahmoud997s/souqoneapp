import React, { useState } from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { AppInput } from '../../ui/AppInput'
import { SearchableSelectModal, SelectOption } from '../../ui/SearchableSelectModal'
import { QUANTITY_OPTIONS, WARRANTY_DURATION_OPTIONS } from '../../../constants/parts'
import { PartStep3Props } from '../../../types/partForm.types'

export function PartStep3Details({ formData, errors, onUpdateField }: PartStep3Props) {
  const [selectModal, setSelectModal] = useState<{
    visible: boolean
    title: string
    data: SelectOption[]
    selectedValue?: string
    onSelect: (opt: SelectOption | null) => void
  }>({ visible: false, title: '', data: [], selectedValue: undefined, onSelect: () => {} })

  const openQuantityModal = () => {
    setSelectModal({
      visible: true,
      title: 'اختر الكمية المتوفرة',
      data: QUANTITY_OPTIONS.map((q) => ({ id: q.id, label: q.label })),
      selectedValue: formData.quantity || undefined,
      onSelect: (opt) => {
        if (opt) onUpdateField('quantity', opt.id)
      },
    })
  }

  const openWarrantyDurationModal = () => {
    setSelectModal({
      visible: true,
      title: 'مدة الضمان',
      data: WARRANTY_DURATION_OPTIONS.map((w) => ({ id: w.id, label: w.label })),
      selectedValue: formData.warrantyDuration || undefined,
      onSelect: (opt) => {
        if (opt) onUpdateField('warrantyDuration', opt.id)
      },
    })
  }

  const handleToggleWarranty = (val: boolean) => {
    onUpdateField('hasWarranty', val)
    if (!val) {
      onUpdateField('warrantyDuration', null)
    }
  }

  const getQuantityLabel = () => {
    return QUANTITY_OPTIONS.find((q) => q.id === formData.quantity)?.label || ''
  }

  const getWarrantyDurationLabel = () => {
    return WARRANTY_DURATION_OPTIONS.find((w) => w.id === formData.warrantyDuration)?.label || ''
  }

  return (
    <View style={s.stepWrap}>
      <WizardCard title="المعلومات الأساسية *" subtitle="أضف عنواناً ووصفاً دقيقاً يساعد المشتري">
        <AppInput
          label="عنوان الإعلان *"
          placeholder="مثال: مكينة كامري 2020 أصلية"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          maxLength={200}
          error={errors.title}
        />

        <AppInput
          label="الوصف *"
          placeholder="تفاصيل حالة القطعة، توافقها مع الموديلات، وأي ملاحظات أخرى..."
          value={formData.description}
          onChangeText={(val) => onUpdateField('description', val)}
          multiline
          numberOfLines={4}
          maxLength={2000}
          error={errors.description}
        />

        <AppInput
          label="رقم القطعة (اختياري)"
          placeholder="مثال: 04465-33320"
          value={formData.partNumber}
          onChangeText={(val) => onUpdateField('partNumber', val)}
          maxLength={50}
        />
      </WizardCard>

      <WizardCard title="الكمية" subtitle="حدد الكمية المتوفرة للبيع">
        <View style={s.inputWrapper}>
          <Text style={s.label}>الكمية</Text>
          <TouchableOpacity style={s.dropdownBtn} onPress={openQuantityModal} activeOpacity={0.8}>
            <Text style={formData.quantity ? s.dropdownVal : s.dropdownPlaceholder}>
              {formData.quantity ? getQuantityLabel() : 'اختر الكمية المتوفرة'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </WizardCard>

      <WizardCard title="الضمان" subtitle="هل تقدم ضماناً على هذه القطعة؟">
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>القطعة تشمل ضمان</Text>
            <Text style={s.switchSub}>تفعيل الضمان يزيد من ثقة المشتري</Text>
          </View>
          <Switch
            testID="warranty-switch"
            value={formData.hasWarranty}
            onValueChange={handleToggleWarranty}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
          />
        </View>

        {formData.hasWarranty && (
          <View style={[s.inputWrapper, { marginTop: Spacing.space3 }]}>
            <Text style={s.label}>مدة الضمان *</Text>
            <TouchableOpacity style={s.dropdownBtn} onPress={openWarrantyDurationModal} activeOpacity={0.8}>
              <Text style={formData.warrantyDuration ? s.dropdownVal : s.dropdownPlaceholder}>
                {formData.warrantyDuration ? getWarrantyDurationLabel() : 'اختر مدة الضمان'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#94A3B8" />
            </TouchableOpacity>
            {errors.warrantyDuration ? <Text style={s.inlineErrorTxt}>{errors.warrantyDuration}</Text> : null}
          </View>
        )}
      </WizardCard>

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
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownPlaceholder: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dropdownVal: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  switchSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})

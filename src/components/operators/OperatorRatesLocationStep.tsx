import React from 'react'
import { View, Text, StyleSheet, Switch, Platform } from 'react-native'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { AppInput } from '../ui/AppInput'
import { GovernorateWilayaSelect } from '../ui/GovernorateWilayaSelect'
import { OperatorRatesLocationStepProps } from '../../types/operatorForm.types'

export function OperatorRatesLocationStep({
  formData,
  errors,
  onUpdateField,
  onLocationChange,
}: OperatorRatesLocationStepProps) {
  return (
    <View style={s.stepWrap}>
      {/* Expected Rates Card */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>الأجر المتوقع ونظام التعاقد *</Text>
        <Text style={s.cardSub}>حدد الأجر الاسترشادي اليومي أو بالساعة</Text>

        <View style={s.ratesRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              label="الأجر اليومي (ر.ع) *"
              placeholder="مثال: 30"
              keyboardType="numeric"
              value={formData.dailyRate}
              onChangeText={(val) => onUpdateField('dailyRate', val)}
              error={errors.dailyRate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label="الأجر بالساعة (ر.ع) *"
              placeholder="مثال: 5"
              keyboardType="numeric"
              value={formData.hourlyRate}
              onChangeText={(val) => onUpdateField('hourlyRate', val)}
              error={errors.hourlyRate}
            />
          </View>
        </View>

        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>السعر قابل للتفاوض</Text>
            <Text style={s.switchSub}>إظهار علامة "قابل للتفاوض" في بطاقتك</Text>
          </View>
          <Switch
            value={formData.isPriceNegotiable}
            onValueChange={(val) => onUpdateField('isPriceNegotiable', val)}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
          />
        </View>
      </View>

      {/* Location Picker */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>الموقع ونطاق العمل *</Text>
        <GovernorateWilayaSelect
          governorateId={formData.governorateId}
          wilayaId={formData.wilayaId}
          onLocationChange={onLocationChange}
          govError={errors.governorate}
          cityError={errors.city}
        />
      </View>

      {/* Contact numbers */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>بيانات الاتصال والتواصل *</Text>
        <AppInput
          label="رقم الهاتف للاتصال المباشر *"
          placeholder="مثال: 96891234567"
          keyboardType="phone-pad"
          value={formData.contactPhone}
          onChangeText={(val) => onUpdateField('contactPhone', val)}
          error={errors.contactPhone}
        />

        <AppInput
          label="رقم الواتساب للتواصل السريع *"
          placeholder="مثال: 96891234567"
          keyboardType="phone-pad"
          value={formData.whatsapp}
          onChangeText={(val) => onUpdateField('whatsapp', val)}
          error={errors.whatsapp}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
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
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: Spacing.space1,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  switchSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
})

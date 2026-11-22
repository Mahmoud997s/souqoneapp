import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { WizardSelectField } from '../../ui/WizardSelectField'
import { AppInput } from '../../ui/AppInput'
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../../constants/services'
import { ServiceFormData } from '../../../store/serviceWizardStore'

export interface ServiceStep1Props {
  formData: ServiceFormData
  errors: Record<string, string>
  onUpdateField: <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => void
}

export function ServiceStep1Type({ formData, errors, onUpdateField }: ServiceStep1Props) {
  const serviceTypeOptions = useMemo(
    () =>
      SERVICE_TYPES.map((st) => ({
        value: st.id,
        label: st.label,
        testID: `service-type-${st.id}`,
      })),
    []
  )

  return (
    <View style={s.stepWrap}>
      {/* Intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="construct" size={16} color={Colors.infoPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق خدمات السيارات</Text>
          <Text style={s.introSub}>حدد نوع الخدمة وصفتك المهنية لبدء إعداد إعلانك</Text>
        </View>
      </View>

      {/* 1. Service Type */}
      <WizardCard title="نوع الخدمة *" subtitle="اختر التصنيف الأساسي للخدمة المقدمة">
        <WizardSelectField
          glass
          testID="service-type-select"
          value={formData.serviceType}
          placeholder="اختر نوع الخدمة"
          options={serviceTypeOptions}
          error={errors.serviceType}
          errorTestID="error-service-type"
          onSelect={(val) => onUpdateField('serviceType', val)}
        />
      </WizardCard>

      {/* 2. Provider Type */}
      <WizardCard title="صفة مقدم الخدمة *" subtitle="حدد صفتك أو كيانك التجاري">
        <WizardSelectField
          glass
          testID="service-provider-type-select"
          value={formData.providerType}
          placeholder="اختر صفة مقدم الخدمة"
          options={PROVIDER_TYPES.map((pt) => ({
            value: pt.id,
            label: pt.label,
            testID: `provider-type-${pt.id}`,
          }))}
          error={errors.providerType}
          errorTestID="error-provider-type"
          onSelect={(val) => onUpdateField('providerType', val)}
        />
      </WizardCard>

      {/* 3. Provider Name */}
      <WizardCard
        title="اسم مقدم الخدمة *"
        subtitle="الاسم التجاري للورشة، الشركة، أو اسم الفني المستقل"
      >
        <AppInput
          glass
          label="اسم مقدم الخدمة *"
          placeholder="مثال: كراج النجوم لصيانة المحركات أو الفني خالد"
          value={formData.providerName}
          onChangeText={(val) => onUpdateField('providerName', val)}
          error={errors.providerName}
          testID="provider-name-input"
          maxLength={80}
          containerStyle={{ marginTop: 4 }}
        />
      </WizardCard>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  introCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.space2,
  },
  introIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  introSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})

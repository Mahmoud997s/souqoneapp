import React from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { AppInput } from '../../ui/AppInput'
import { COMMON_SPECIALIZATIONS } from '../../../constants/services'
import { ServiceStep3Props } from '../../../types/serviceForm.types'

export function ServiceStep3Details({ formData, errors, onUpdateField }: ServiceStep3Props) {
  const toggleSpecialization = (spec: string) => {
    const current = formData.specializations || []
    const next = current.includes(spec)
      ? current.filter((s) => s !== spec)
      : [...current, spec]
    onUpdateField('specializations', next)
  }

  const rawSpecs = formData.serviceType ? COMMON_SPECIALIZATIONS[formData.serviceType] || [] : []
  const availableSpecs = formData.serviceType ? [...rawSpecs, 'أخرى'] : []

  return (
    <View style={s.stepWrap}>
      {/* 1. Basic Information */}
      <WizardCard title="المعلومات الأساسية *" subtitle="أضف عنواناً ووصفاً دقيقاً ومفصلاً للخدمة">
        <AppInput
          label="عنوان الإعلان *"
          placeholder="مثال: صيانة وفحص شامل للسيارات اليابانية وبرمجة كمبيوتر"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          maxLength={200}
          error={errors.title}
          testID="title-input"
        />

        <AppInput
          label="الوصف *"
          placeholder="تفاصيل الخدمة المقدمة، الأجهزة المستخدمة، الخبرة، وأي ملاحظات إضافية تهم العميل..."
          value={formData.description}
          onChangeText={(val) => onUpdateField('description', val)}
          multiline
          numberOfLines={4}
          maxLength={2000}
          error={errors.description}
          testID="description-input"
        />
      </WizardCard>

      {/* 2. Specializations Multi-select Chips */}
      <WizardCard
        title="تخصصات ومجالات الخدمة"
        subtitle="حدد التخصصات المتاحة (يمكنك اختيار أكثر من تخصص)"
      >
        {!formData.serviceType ? (
          <View style={s.infoBanner} testID="empty-service-type-msg">
            <Ionicons name="information-circle-outline" size={20} color="#1E40AF" />
            <Text style={s.infoBannerTxt}>
              اختر نوع الخدمة أولاً في الخطوة السابقة لتحديد التخصصات المتاحة
            </Text>
          </View>
        ) : (
          <View style={s.chipsWrap}>
            {availableSpecs.map((spec) => {
              const isSelected = (formData.specializations || []).includes(spec)
              return (
                <TouchableOpacity
                  key={spec}
                  testID={`spec-chip-${spec}`}
                  style={[s.specChip, isSelected && s.specChipActive]}
                  onPress={() => toggleSpecialization(spec)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                    size={16}
                    color={isSelected ? Colors.primary : '#64748B'}
                  />
                  <Text style={[s.specChipTxt, isSelected && s.specChipTxtActive]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </WizardCard>

      {/* 3. Home / Mobile Service Switch */}
      <WizardCard
        title="خدمة في موقع العميل"
        subtitle="هل تقدم الخدمة في موقع العميل أو كخدمة منزلية / متنقلة؟"
      >
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>نقدم الخدمة في موقع العميل</Text>
            <Text style={s.switchSub}>تفعيل هذا الخيار يوضح للعملاء إمكانية الانتقال لموقعهم</Text>
          </View>
          <Switch
            testID="home-service-switch"
            value={formData.isHomeService}
            onValueChange={(val) => onUpdateField('isHomeService', val)}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
          />
        </View>
      </WizardCard>
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
    paddingVertical: 12,
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  specChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  specChipTxt: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    writingDirection: 'rtl',
  },
  specChipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_700Bold',
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

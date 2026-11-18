import React from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { WizardOptionChip } from '../../wizard/WizardOptionChip'
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
          glass
          label="عنوان الإعلان *"
          placeholder="مثال: صيانة وفحص شامل للسيارات اليابانية وبرمجة كمبيوتر"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          maxLength={200}
          error={errors.title}
          testID="title-input"
        />

        <AppInput
          glass
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
            <Ionicons name="information-circle-outline" size={20} color={Colors.infoText} />
            <Text style={s.infoBannerTxt}>
              اختر نوع الخدمة أولاً في الخطوة السابقة لتحديد التخصصات المتاحة
            </Text>
          </View>
        ) : (
          <View style={s.chipsWrap}>
            {availableSpecs.map((spec) => {
              const isSelected = (formData.specializations || []).includes(spec)
              return (
                <WizardOptionChip
                  key={spec}
                  testID={`spec-chip-${spec}`}
                  label={spec}
                  icon={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                  selected={isSelected}
                  onPress={() => toggleSpecialization(spec)}
                />
              )
            })}
          </View>
        )}
      </WizardCard>

      {/* 3. Home / Mobile Service Switch */}
      <WizardCard
        title="خدمة في موقع العميل"
        subtitle="هل تقدم الخدمة في موقع العميل أو كخدمة متنقلة؟"
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
            trackColor={{ false: Colors.slateBorder, true: Colors.primary }}
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
    backgroundColor: Colors.infoSoftBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoBannerTxt: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.infoText,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.slateSurface,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
  },
  switchTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.slateHeading,
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

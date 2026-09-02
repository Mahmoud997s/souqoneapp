import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { AppInput } from '../../ui/AppInput'
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../../constants/services'
import { ServiceFormData } from '../../../store/serviceWizardStore'

export interface ServiceStep1Props {
  formData: ServiceFormData
  errors: Record<string, string>
  onUpdateField: <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => void
}

const SERVICE_TYPE_CONFIG: Record<
  string,
  { color: string; bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  MAINTENANCE: { color: '#16a34a', bg: '#dcfce7', icon: 'wrench' },
  CLEANING: { color: '#2563eb', bg: '#dbeafe', icon: 'water' },
  INSPECTION: { color: '#9333ea', bg: '#f3e8ff', icon: 'magnify' },
  BODYWORK: { color: '#ea580c', bg: '#ffedd5', icon: 'spray' },
  MODIFICATION: { color: '#eab308', bg: '#fef9c3', icon: 'tune' },
  TOWING: { color: '#dc2626', bg: '#fee2e2', icon: 'tow-truck' },
  KEYS_LOCKS: { color: '#0891b2', bg: '#cffafe', icon: 'key' },
  ACCESSORIES_INSTALL: { color: '#b45309', bg: '#fef3c7', icon: 'car-shift-pattern' },
  OTHER_SERVICE: { color: '#64748b', bg: '#f1f5f9', icon: 'dots-horizontal' },
}

export function ServiceStep1Type({ formData, errors, onUpdateField }: ServiceStep1Props) {
  return (
    <View style={s.stepWrap}>
      {/* Intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="construct" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق خدمات السيارات</Text>
          <Text style={s.introSub}>حدد نوع الخدمة وصفتك المهنية لبدء إعداد إعلانك</Text>
        </View>
      </View>

      {/* 1. Service Type Grid */}
      <WizardCard title="نوع الخدمة *" subtitle="اختر التصنيف الأساسي للخدمة المقدمة">
        {errors.serviceType ? (
          <Text style={s.inlineErrorTxt} testID="error-service-type">
            {errors.serviceType}
          </Text>
        ) : null}
        <View style={s.gridWrap}>
          {SERVICE_TYPES.map((st) => {
            const isSel = formData.serviceType === st.id
            const isOther = st.id === 'OTHER_SERVICE'
            const cfg = SERVICE_TYPE_CONFIG[st.id] || {
              color: '#2563EB',
              bg: '#EFF6FF',
              icon: 'wrench' as any,
            }

            return (
              <TouchableOpacity
                key={st.id}
                testID={`service-type-${st.id}`}
                style={[
                  s.gridCard,
                  isOther && s.gridCardFull,
                  isSel ? s.gridCardActive : null,
                  { borderColor: isSel ? cfg.color : '#E2E8F0' },
                ]}
                onPress={() => onUpdateField('serviceType', st.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.gridIconWrap,
                    isOther && s.gridIconWrapFull,
                    { backgroundColor: isSel ? cfg.color : cfg.bg },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={cfg.icon}
                    size={isOther ? 18 : 20}
                    color={isSel ? '#FFFFFF' : cfg.color}
                  />
                </View>
                <Text
                  style={[
                    s.gridCardTxt,
                    isOther && s.gridCardTxtFull,
                    isSel && { color: cfg.color, fontFamily: 'Almarai_700Bold' },
                  ]}
                  numberOfLines={isOther ? 1 : 2}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

      {/* 2. Provider Type */}
      <WizardCard title="صفة مقدم الخدمة *" subtitle="حدد صفتك أو كيانك التجاري">
        {errors.providerType ? (
          <Text style={s.inlineErrorTxt} testID="error-provider-type">
            {errors.providerType}
          </Text>
        ) : null}
        <View style={s.chipRow}>
          {PROVIDER_TYPES.map((pt) => {
            const isSel = formData.providerType === pt.id
            return (
              <TouchableOpacity
                key={pt.id}
                testID={`provider-type-${pt.id}`}
                style={[s.chip, isSel && s.chipActive]}
                onPress={() => onUpdateField('providerType', pt.id)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipTxt, isSel && s.chipTxtActive]} numberOfLines={2}>
                  {pt.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

      {/* 3. Provider Name */}
      <WizardCard
        title="اسم مقدم الخدمة *"
        subtitle="الاسم التجاري للورشة، الشركة، أو اسم الفني المستقل"
      >
        <AppInput
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#1E40AF',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  introSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#3B82F6',
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
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridCard: {
    width: '23.2%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
  },
  gridCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  gridCardActive: {
    backgroundColor: '#FAFAFA',
  },
  gridIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridIconWrapFull: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 0,
  },
  gridCardTxt: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 10,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
    paddingHorizontal: 1,
    writingDirection: 'rtl',
  },
  gridCardTxtFull: {
    fontSize: 11.5,
    lineHeight: 16,
    minHeight: 0,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  chipTxt: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  chipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_700Bold',
  },
})

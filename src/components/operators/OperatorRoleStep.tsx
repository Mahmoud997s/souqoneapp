import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { AppInput } from '../ui/AppInput'
import { OPERATOR_ROLES } from '../../constants/operators'
import { OperatorRoleStepProps } from '../../types/operatorForm.types'

export function OperatorRoleStep({ formData, errors, onUpdateField }: OperatorRoleStepProps) {
  return (
    <View style={s.stepWrap}>
      {/* Value proposition intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="sparkles" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>انضم لدليل المشغلين المعتمدين</Text>
          <Text style={s.introSub}>أبرز خبراتك ورخصك لأصحاب المعدات والشركات وتلقَّ طلبات العمل مباشرة</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>اختر نوع الدور أو الخدمة *</Text>
      <Text style={s.sectionSub}>حدد تخصصك الرئيسي ليظهر في مقدمة بطاقتك التعريفية</Text>

      {errors.operatorType ? (
        <Text style={s.inlineErrorTxt}>{errors.operatorType}</Text>
      ) : null}

      <View style={s.rolesGrid}>
        {OPERATOR_ROLES.map((r) => {
          const isSel = formData.operatorType === r.id
          return (
            <TouchableOpacity
              key={r.id}
              style={[s.roleCard, isSel && s.roleCardActive]}
              onPress={() => onUpdateField('operatorType', r.id)}
              activeOpacity={0.85}
            >
              <View style={[s.roleIconWrap, isSel && s.roleIconWrapActive]}>
                <MaterialCommunityIcons
                  name={r.icon as any}
                  size={20}
                  color={isSel ? '#ffffff' : Colors.primary}
                />
              </View>
              <View style={s.roleTextWrap}>
                <Text style={[s.roleTitle, isSel && s.roleTitleActive]} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={s.roleDesc} numberOfLines={1}>
                  {r.desc}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Grouped Info Card */}
      <View style={s.cardSection}>
        <AppInput
          label="عنوان الإعلان / المسمى المهني *"
          placeholder="مثال: مشغل معدات ثقيلة وبلدوزر خبرة 10 سنوات"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          error={errors.title}
        />

        <AppInput
          label="سنوات الخبرة الإجمالية *"
          placeholder="مثال: 8"
          keyboardType="numeric"
          value={formData.experienceYears}
          onChangeText={(val) => onUpdateField('experienceYears', val)}
          error={errors.experienceYears}
        />

        <AppInput
          label="نبذة عن الخبرات والمهام السابقة *"
          placeholder="اكتب نبذة توضح المشاريع السابقة، ساعات التوفر..."
          value={formData.description}
          onChangeText={(val) => onUpdateField('description', val)}
          multiline
          numberOfLines={3}
          error={errors.description}
        />
      </View>
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
  sectionLabel: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 3,
  },
  sectionSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: 6,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: Spacing.space3,
  },
  roleCard: {
    width: '48.5%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  roleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  roleTextWrap: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 1,
  },
  roleTitleActive: {
    color: Colors.primary,
  },
  roleDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
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
})

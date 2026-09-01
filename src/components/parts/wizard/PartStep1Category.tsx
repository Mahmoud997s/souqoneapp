import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { PART_CONDITIONS, PART_ORIGINALITY_OPTIONS } from '../../../constants/parts'
import { PartStep1Props } from '../../../types/partForm.types'

const CATEGORIES_DATA = [
  { id: 'ENGINE', label: 'المحرك', icon: 'engine', color: '#ea580c', bg: '#ffedd5' },
  { id: 'BODY', label: 'الهيكل', icon: 'car-side', color: '#2563eb', bg: '#dbeafe' },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: 'car-electric', color: '#eab308', bg: '#fef9c3' },
  { id: 'SUSPENSION', label: 'المساعدات والتعليق', icon: 'car-esp', color: '#16a34a', bg: '#dcfce7' },
  { id: 'BRAKES', label: 'الفرامل', icon: 'car-brake-alert', color: '#dc2626', bg: '#fee2e2' },
  { id: 'INTERIOR', label: 'الداخلية', icon: 'car-seat', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'TIRES', label: 'الإطارات', icon: 'tire', color: '#4b5563', bg: '#f3f4f6' },
  { id: 'BATTERIES', label: 'البطاريات', icon: 'car-battery', color: '#0891b2', bg: '#cffafe' },
  { id: 'OILS', label: 'الزيوت', icon: 'oil', color: '#b45309', bg: '#fef3c7' },
  { id: 'ACCESSORIES', label: 'إكسسوارات', icon: 'car-cog', color: '#6366f1', bg: '#e0e7ff' },
  { id: 'OTHER', label: 'أخرى', icon: 'dots-horizontal', color: '#64748b', bg: '#f1f5f9' },
]

export function PartStep1Category({ formData, errors, onUpdateField }: PartStep1Props) {
  const enrichedTypes = [
    {
      key: 'SPARE_PART_SALE',
      label: 'للبيع',
      icon: 'car-wrench',
      desc: 'عرض قطع غيار للبيع',
    },
    {
      key: 'SPARE_PART_WANTED',
      label: 'مطلوب',
      icon: 'magnify',
      desc: 'البحث عن قطع غيار معينة',
    },
  ]

  return (
    <View style={s.stepWrap}>
      {/* Intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="car-sport" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق قطع الغيار</Text>
          <Text style={s.introSub}>اعرض قطع الغيار للبيع أو اطلب ما تبحث عنه مباشرة</Text>
        </View>
      </View>

      {/* 1. Listing Type */}
      <Text style={s.sectionLabel}>نوع الإعلان *</Text>
      <Text style={s.sectionSub}>حدد الغرض من الإعلان لتخصيص الخيارات اللاحقة</Text>

      {errors.listingType ? <Text style={s.inlineErrorTxt}>{errors.listingType}</Text> : null}

      <View style={s.listingTypesRow}>
        {enrichedTypes.map((lt) => {
          const isSel = formData.listingType === lt.key
          return (
            <TouchableOpacity
              key={lt.key}
              testID={`listing-type-${lt.key}`}
              style={[s.typeCard, isSel && s.typeCardActive]}
              onPress={() => onUpdateField('listingType', lt.key)}
              activeOpacity={0.85}
            >
              <View style={[s.typeIconWrap, isSel && s.typeIconWrapActive]}>
                <MaterialCommunityIcons
                  name={lt.icon as any}
                  size={20}
                  color={isSel ? '#ffffff' : Colors.primary}
                />
              </View>
              <Text style={[s.typeTitle, isSel && s.typeTitleActive]} numberOfLines={1}>
                {lt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <WizardCard title="فئة القطعة *" subtitle="اختر التصنيف المناسب للقطعة">
        {errors.partCategory ? <Text style={s.inlineErrorTxt}>{errors.partCategory}</Text> : null}
        <View style={s.gridWrap}>
          {CATEGORIES_DATA.map((cat) => {
            const isSel = formData.partCategory === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                testID={`category-${cat.id}`}
                style={[
                  s.gridCard,
                  isSel ? s.gridCardActive : null,
                  { borderColor: isSel ? cat.color : '#E2E8F0' }
                ]}
                onPress={() => onUpdateField('partCategory', cat.id)}
                activeOpacity={0.7}
              >
                <View style={[s.gridIconWrap, { backgroundColor: isSel ? cat.color : cat.bg }]}>
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={22}
                    color={isSel ? '#FFFFFF' : cat.color}
                  />
                </View>
                <Text
                  style={[s.gridCardTxt, isSel && { color: cat.color, fontFamily: 'Almarai_700Bold' }]}
                  numberOfLines={2}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

      <WizardCard title="حالة القطعة *" subtitle="حدد حالة القطعة الحالية">
        {errors.condition ? <Text style={s.inlineErrorTxt}>{errors.condition}</Text> : null}
        <View style={s.chipRow}>
          {PART_CONDITIONS.map((c) => {
            const isSel = formData.condition === c.id
            return (
              <TouchableOpacity
                key={c.id}
                testID={`condition-${c.id}`}
                style={[s.chip, isSel && s.chipActive]}
                onPress={() => onUpdateField('condition', c.id)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipTxt, isSel && s.chipTxtActive]}>{c.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

      <WizardCard title="أصالة القطعة *" subtitle="هل القطعة أصلية أم تجارية؟">
        {errors.isOriginal ? <Text style={s.inlineErrorTxt}>{errors.isOriginal}</Text> : null}
        <View style={s.chipRow}>
          {PART_ORIGINALITY_OPTIONS.map((c) => {
            const isSel = formData.isOriginal === c.value
            return (
              <TouchableOpacity
                key={c.value.toString()}
                testID={`originality-${c.value.toString()}`}
                style={[s.chip, isSel && s.chipActive]}
                onPress={() => onUpdateField('isOriginal', c.value)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipTxt, isSel && s.chipTxtActive]}>{c.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: { gap: Spacing.space3 },
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
  listingTypesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.space3,
  },
  typeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingVertical: 10,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  typeIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  typeTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: Platform.OS === 'android' ? 2 : 0,
    writingDirection: 'rtl'
  },
  typeTitleActive: {
    color: Colors.primary,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardActive: {
    backgroundColor: '#FAFAFA',
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridCardTxt: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 16,
    minHeight: 32,
    paddingHorizontal: 4,
    writingDirection: 'rtl',
  },
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
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 12,
    color: '#475569',
    writingDirection: 'rtl',
  },
  chipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_700Bold',
  },
})

import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { WizardSelectField } from '../../ui/WizardSelectField'
import { PART_CATEGORIES, PART_CONDITIONS, PART_ORIGINALITY_OPTIONS } from '../../../constants/parts'
import { PartStep1Props } from '../../../types/partForm.types'

const LISTING_TYPES_DATA: { key: string; label: string }[] = [
  { key: 'SPARE_PART_SALE', label: 'للبيع' },
  { key: 'SPARE_PART_WANTED', label: 'مطلوب' },
]

export function PartStep1Category({ formData, errors, onUpdateField }: PartStep1Props) {
  const listingTypeOptions = useMemo(
    () =>
      LISTING_TYPES_DATA.map((lt) => ({
        value: lt.key,
        label: lt.label,
        testID: `listing-type-${lt.key}`,
      })),
    []
  )

  const categoryOptions = useMemo(
    () =>
      PART_CATEGORIES.map((cat) => ({
        value: cat.id,
        label: cat.label,
        testID: `category-${cat.id}`,
      })),
    []
  )

  return (
    <View style={s.stepWrap}>
      {/* Intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="car-sport" size={16} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق قطع الغيار</Text>
          <Text style={s.introSub}>اعرض قطع الغيار للبيع أو اطلب ما تبحث عنه مباشرة</Text>
        </View>
      </View>

      {/* 1. Listing Type */}
      <WizardCard
        title="نوع الإعلان *"
        subtitle="حدد الغرض من الإعلان لتخصيص الخيارات اللاحقة"
      >
        <WizardSelectField
          glass
          testID="part-listing-type-select"
          value={formData.listingType}
          placeholder="اختر نوع الإعلان"
          options={listingTypeOptions}
          error={errors.listingType}
          errorTestID="error-part-listing-type"
          onSelect={(val) => onUpdateField('listingType', val)}
        />
      </WizardCard>

      <WizardCard title="فئة القطعة *" subtitle="اختر التصنيف المناسب للقطعة">
        <WizardSelectField
          glass
          testID="part-category-select"
          value={formData.partCategory}
          placeholder="اختر فئة القطعة"
          options={categoryOptions}
          error={errors.partCategory}
          errorTestID="error-part-category"
          onSelect={(val) => onUpdateField('partCategory', val)}
        />
      </WizardCard>

      <WizardCard title="حالة القطعة *" subtitle="حدد حالة القطعة الحالية">
        <WizardSelectField
          glass
          testID="part-condition-select"
          value={formData.condition}
          placeholder="اختر حالة القطعة"
          options={PART_CONDITIONS.map((c) => ({
            value: c.id,
            label: c.label,
            testID: `condition-${c.id}`,
          }))}
          error={errors.condition}
          onSelect={(val) => onUpdateField('condition', val)}
        />
      </WizardCard>

      <WizardCard title="أصالة القطعة *" subtitle="هل القطعة أصلية أم تجارية؟">
        <WizardSelectField
          glass
          testID="part-originality-select"
          value={
            formData.isOriginal === null || formData.isOriginal === undefined
              ? undefined
              : String(formData.isOriginal)
          }
          placeholder="اختر أصالة القطعة"
          options={PART_ORIGINALITY_OPTIONS.map((c) => ({
            value: c.value.toString(),
            label: c.label,
            testID: `originality-${c.value.toString()}`,
          }))}
          error={errors.isOriginal}
          onSelect={(val) => onUpdateField('isOriginal', val === 'true')}
        />
      </WizardCard>

    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: { gap: Spacing.space3 },
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
    marginBottom: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})

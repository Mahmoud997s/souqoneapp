import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { AppInput } from '../../ui/AppInput'
import { WizardSelectField } from '../../ui/WizardSelectField'
import { LISTING_TYPES, EQUIPMENT_CATEGORY_GROUPS } from '../../../constants/equipment'
import { EquipmentStep1Props } from '../../../types/equipmentForm.types'
import { EquipmentListingType, EquipmentType } from '../../../types/equipment.types'

export function EquipmentStep1Type({ formData, errors, onUpdateField }: EquipmentStep1Props) {
  const listingTypeOptions = useMemo(
    () =>
      LISTING_TYPES.map((lt) => ({
        value: lt.key,
        label: lt.label,
        testID: `listing-type-${lt.key}`,
      })),
    []
  )

  const categoryGroups = useMemo(
    () =>
      EQUIPMENT_CATEGORY_GROUPS.map((group) => ({
        title: group.title,
        options: group.items.map((cat) => ({
          value: cat.key,
          label: cat.label,
          testID: `category-${cat.key}`,
        })),
      })),
    []
  )

  return (
    <View style={s.stepWrap}>
      {/* Value proposition intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="sparkles" size={16} color={Colors.infoPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق المعدات الثقيلة والشاحنات</Text>
          <Text style={s.introSub}>اعرض معدتك للبيع أو الإيجار أو اطلب معدة لمشروعك وتواصل مع آلاف المهتمين في سلطنة عمان</Text>
        </View>
      </View>

      {/* 1. Listing Type Selection */}
      <WizardCard
        title="نوع الإعلان *"
        subtitle="حدد الغرض من الإعلان لتخصيص خيارات التسعير والمواصفات"
      >
        <WizardSelectField
          testID="equipment-listing-type-select"
          value={formData.listingType}
          placeholder="اختر نوع الإعلان"
          options={listingTypeOptions}
          error={errors.listingType}
          onSelect={(val) => onUpdateField('listingType', val as EquipmentListingType)}
        />
      </WizardCard>

      {/* 2. Equipment Category Selection */}
      <WizardCard
        title="فئة المعدة *"
        subtitle="اختر الفئة المناسبة لتسهيل عثور الباحثين عليها"
      >
        <WizardSelectField
          testID="equipment-category-select"
          value={formData.equipmentType}
          placeholder="اختر فئة المعدة"
          groups={categoryGroups}
          error={errors.equipmentType}
          onSelect={(val) => onUpdateField('equipmentType', val as EquipmentType)}
        />
      </WizardCard>

      {/* 3. Basic Information Card */}
      <WizardCard
        title="بيانات الإعلان الأساسية *"
        subtitle="اكتب عنواناً جذاباً ووصفاً وافياً للمعدة وحالتها"
      >
        <AppInput
          label="عنوان الإعلان *"
          placeholder="مثال: حفار كوماتسو PC200 بحالة ممتازة للبيع أو الإيجار"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          maxLength={100}
          error={errors.title}
        />

        <AppInput
          label="تفاصيل ووصف المعدة *"
          placeholder="اكتب وصفاً تفصيلياً يشمل: سجل الصيانة، مكان تواجد المعدة، شروط التأجير، وساعات التشغيل..."
          value={formData.description}
          onChangeText={(val) => onUpdateField('description', val)}
          multiline
          numberOfLines={4}
          maxLength={2000}
          error={errors.description}
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
    marginBottom: 6,
  },
  listingTypesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 11,
    borderWidth: 1.5,
    borderColor: Colors.slateBorder,
    alignItems: 'center',
    gap: 5,
    ...Platform.select({
      ios: { shadowColor: Colors.slateHeading, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoSoftBg,
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.slateSubtleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  typeTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.slateHeading,
    textAlign: 'center',
  },
  typeTitleActive: {
    color: Colors.primary,
  },
  typeDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 9.5,
    lineHeight: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  catCard: {
    width: '31.3%',
    minHeight: 88,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.slateBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: Colors.slateHeading, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  catCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoSoftBg,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.slateSubtleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  catTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.slateBody,
    textAlign: 'center',
  },
  catTitleActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
})

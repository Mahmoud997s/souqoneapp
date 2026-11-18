import React, { useMemo } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { WizardSelectField } from '../../ui/WizardSelectField'
import { BusWizardData } from '../../../store/busWizardStore'

export interface BusStep1Props {
  data: BusWizardData
  errors: Record<string, string>
  onUpdateField: (field: keyof BusWizardData, value: any) => void
}

export interface BusListingTypeOption {
  key: 'BUS_SALE' | 'BUS_SALE_WITH_CONTRACT' | 'BUS_RENT'
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  desc: string
}

export interface BusTypeOption {
  id: 'MINI_BUS' | 'MEDIUM_BUS' | 'LARGE_BUS' | 'COASTER' | 'SCHOOL_BUS'
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  desc: string
}

export const BUS_LISTING_TYPE_OPTIONS: BusListingTypeOption[] = [
  {
    key: 'BUS_SALE',
    label: 'للبيع',
    icon: 'tag-outline',
    desc: 'بيع حافلة نقدياً أو بالتقسيط',
  },
  {
    key: 'BUS_SALE_WITH_CONTRACT',
    label: 'بيع مع عقد',
    icon: 'file-document-outline',
    desc: 'بيع حافلة سارية بعقد تشغيل',
  },
  {
    key: 'BUS_RENT',
    label: 'تأجير',
    icon: 'calendar-clock-outline',
    desc: 'تأجير يومي، شهري، أو تعاقدي',
  },
]

export const BUS_TYPE_OPTIONS: BusTypeOption[] = [
  {
    id: 'MINI_BUS',
    label: 'ميني باص',
    icon: 'van-passenger',
    desc: 'تصل إلى 15 راكب',
  },
  {
    id: 'MEDIUM_BUS',
    label: 'حافلة متوسطة',
    icon: 'bus',
    desc: 'من 16 إلى 34 راكب',
  },
  {
    id: 'LARGE_BUS',
    label: 'حافلة كبيرة',
    icon: 'bus-double-decker',
    desc: '35 راكب فأكثر',
  },
  {
    id: 'COASTER',
    label: 'كوستر',
    icon: 'bus-side',
    desc: 'نقل خفيف ورحلات',
  },
  {
    id: 'SCHOOL_BUS',
    label: 'حافلة مدرسية',
    icon: 'bus-school',
    desc: 'مطابقة لمواصفات المدارس',
  },
]

export function BusStep1TypeCategory({ data, errors, onUpdateField }: BusStep1Props) {
  const listingTypeOptions = useMemo(
    () =>
      BUS_LISTING_TYPE_OPTIONS.map((lt) => ({
        value: lt.key,
        label: lt.label,
        testID: `listing-type-${lt.key}`,
      })),
    []
  )

  const busTypeOptions = useMemo(
    () =>
      BUS_TYPE_OPTIONS.map((cat) => ({
        value: cat.id,
        label: cat.label,
        testID: `bus-type-${cat.id}`,
      })),
    []
  )

  return (
    <View style={s.stepWrap}>
      {/* Intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="bus" size={16} color={Colors.infoPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق الحافلات</Text>
          <Text style={s.introSub}>حدد نوع الإعلان وفئة الحافلة لتخصيص الخيارات اللاحقة</Text>
        </View>
      </View>

      {/* 1. Listing Type */}
      <WizardCard title="نوع الإعلان *" subtitle="حدد الغرض من الإعلان">
        <WizardSelectField
          glass
          testID="bus-listing-type-select"
          value={data.busListingType}
          placeholder="اختر نوع الإعلان"
          options={listingTypeOptions}
          error={errors.busListingType}
          errorTestID="error-bus-listing-type"
          onSelect={(val) => onUpdateField('busListingType', val)}
        />
      </WizardCard>

      {/* 2. Bus Type (Category) */}
      <WizardCard title="فئة الحافلة *" subtitle="اختر السعة والحجم المناسب للحافلة">
        <WizardSelectField
          glass
          testID="bus-type-select"
          value={data.busType}
          placeholder="اختر فئة الحافلة"
          options={busTypeOptions}
          error={errors.busType}
          errorTestID="error-bus-type"
          onSelect={(val) => onUpdateField('busType', val)}
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
  listingTypesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.whiteAlpha45,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
    position: 'relative',
    shadowColor: Colors.slateMuted,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.whiteAlpha95,
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.skyLightBg,
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
    color: Colors.slateHeading,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: Platform.OS === 'android' ? 2 : 0,
    writingDirection: 'rtl',
  },
  typeTitleActive: {
    color: Colors.primary,
  },
  typeDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 9.5,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
    paddingHorizontal: 2,
    writingDirection: 'rtl',
  },
  typeDescActive: {
    color: Colors.text2,
  },
  typeCheckIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCard: {
    width: '31.3%',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    position: 'relative',
  },
  gridCardActive: {
    backgroundColor: Colors.infoSoftBg,
    borderColor: Colors.primary,
  },
  gridIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.infoSoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridIconWrapActive: {
    backgroundColor: Colors.primary,
  },
  gridCardTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.slateBody,
    textAlign: 'center',
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  gridCardTxtActive: {
    color: Colors.primary,
  },
  gridCardSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 2,
    writingDirection: 'rtl',
  },
  gridCardSubActive: {
    color: Colors.text2,
  },
  gridCheckIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
})

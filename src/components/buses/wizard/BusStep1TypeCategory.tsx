import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
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
  return (
    <View style={s.stepWrap}>
      {/* Intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="bus" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق الحافلات</Text>
          <Text style={s.introSub}>حدد نوع الإعلان وفئة الحافلة لتخصيص الخيارات اللاحقة</Text>
        </View>
      </View>

      {/* 1. Listing Type */}
      <WizardCard title="نوع الإعلان *" subtitle="حدد الغرض من الإعلان">
        {errors.busListingType ? (
          <Text style={s.inlineErrorTxt} testID="error-bus-listing-type">
            {errors.busListingType}
          </Text>
        ) : null}

        <View style={s.listingTypesRow}>
          {BUS_LISTING_TYPE_OPTIONS.map((lt) => {
            const isSel = data.busListingType === lt.key
            return (
              <TouchableOpacity
                key={lt.key}
                testID={`listing-type-${lt.key}`}
                style={[s.typeCard, isSel && s.typeCardActive]}
                onPress={() => onUpdateField('busListingType', lt.key)}
                activeOpacity={0.85}
              >
                <View style={[s.typeIconWrap, isSel && s.typeIconWrapActive]}>
                  <MaterialCommunityIcons
                    name={lt.icon}
                    size={20}
                    color={isSel ? '#ffffff' : Colors.primary}
                  />
                </View>
                <Text style={[s.typeTitle, isSel && s.typeTitleActive]} numberOfLines={1}>
                  {lt.label}
                </Text>
                <Text style={[s.typeDesc, isSel && s.typeDescActive]} numberOfLines={2}>
                  {lt.desc}
                </Text>
                {isSel && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.primary}
                    style={s.typeCheckIcon}
                  />
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </WizardCard>

      {/* 2. Bus Type (Category) */}
      <WizardCard title="فئة الحافلة *" subtitle="اختر السعة والحجم المناسب للحافلة">
        {errors.busType ? (
          <Text style={s.inlineErrorTxt} testID="error-bus-type">
            {errors.busType}
          </Text>
        ) : null}

        <View style={s.gridWrap}>
          {BUS_TYPE_OPTIONS.map((cat) => {
            const isSel = data.busType === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                testID={`bus-type-${cat.id}`}
                style={[
                  s.gridCard,
                  isSel ? s.gridCardActive : null,
                  { borderColor: isSel ? Colors.primary : '#E2E8F0' },
                ]}
                onPress={() => onUpdateField('busType', cat.id)}
                activeOpacity={0.7}
              >
                <View style={[s.gridIconWrap, isSel && s.gridIconWrapActive]}>
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={22}
                    color={isSel ? '#FFFFFF' : Colors.primary}
                  />
                </View>
                <Text style={[s.gridCardTxt, isSel && s.gridCardTxtActive]} numberOfLines={2}>
                  {cat.label}
                </Text>
                <Text style={[s.gridCardSub, isSel && s.gridCardSubActive]} numberOfLines={1}>
                  {cat.desc}
                </Text>
                {isSel && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.primary}
                    style={s.gridCheckIcon}
                  />
                )}
              </TouchableOpacity>
            )
          })}
        </View>
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
  listingTypesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    position: 'relative',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  gridIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
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
    color: '#334155',
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

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { WizardCard } from '../../ui/WizardCard'
import { CAR_LISTING_TYPES } from '../../../constants/cars'
import { CarStep1Props } from '../../../types/carForm.types'

export function CarStep1Type({ formData, errors, onUpdateField }: CarStep1Props) {
  // Enhanced listing types with icons and descriptions
  const enrichedTypes = [
    {
      key: 'SALE',
      label: 'للبيع',
      icon: 'car-outline',
      desc: 'عرض سيارتك للبيع للباحثين عن شراء سيارات',
    },
    {
      key: 'RENTAL',
      label: 'للإيجار',
      icon: 'car-key',
      desc: 'تأجير سيارتك يومياً أو شهرياً',
    },
    {
      key: 'WANTED',
      label: 'مطلوب',
      icon: 'magnify',
      desc: 'البحث عن سيارة معينة لشرائها',
    },
  ]

  return (
    <View style={s.stepWrap}>
      {/* Value proposition intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="car-sport" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق السيارات</Text>
          <Text style={s.introSub}>اعرض سيارتك للبيع أو الإيجار وتواصل مع المهتمين في سلطنة عمان مباشرة</Text>
        </View>
      </View>

      {/* 1. Listing Type Selection */}
      <Text style={s.sectionLabel}>نوع الإعلان *</Text>
      <Text style={s.sectionSub}>حدد الغرض من الإعلان لتخصيص الخيارات اللاحقة</Text>

      {errors.listingType ? <Text style={s.inlineErrorTxt}>{errors.listingType}</Text> : null}

      <View style={s.listingTypesRow}>
        {enrichedTypes.map((lt) => {
          const isSel = formData.listingType === lt.key
          return (
            <TouchableOpacity
              key={lt.key}
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

      {/* 2. Basic Information Card */}
      <WizardCard title="بيانات الإعلان الأساسية *" subtitle="اكتب عنواناً ووصفاً وافياً يجذب الانتباه">
        <AppInput
          label="عنوان الإعلان *"
          placeholder="اكتب عنواناً جذاباً يصف سيارتك (مثل الماركة والموديل)"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          maxLength={200}
          error={errors.title}
        />

        <AppInput
          label="تفاصيل الإعلان *"
          placeholder="اكتب وصفاً تفصيلياً يشمل: حالة السيارة، الصيانة، المميزات الإضافية..."
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
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10, 
    borderRadius: Radius.lg,
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5, 
    borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    elevation: 3, // 3D floating shadow
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
})

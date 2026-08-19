import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { LISTING_TYPES, EQUIPMENT_CATEGORIES } from '../../../constants/equipment'
import { EquipmentStep1Props } from '../../../types/equipmentForm.types'

export function EquipmentStep1Type({ formData, errors, onUpdateField }: EquipmentStep1Props) {
  return (
    <View style={s.stepWrap}>
      {/* Value proposition intro banner */}
      <View style={s.introCard}>
        <View style={s.introIconWrap}>
          <Ionicons name="sparkles" size={16} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introTitle}>سوق المعدات الثقيلة والشاحنات</Text>
          <Text style={s.introSub}>اعرض معدتك للبيع أو الإيجار أو اطلب معدة لمشروعك وتواصل مع آلاف المهتمين في سلطنة عمان</Text>
        </View>
      </View>

      {/* 1. Listing Type Selection */}
      <Text style={s.sectionLabel}>نوع الإعلان *</Text>
      <Text style={s.sectionSub}>حدد الغرض من الإعلان لتخصيص خيارات التسعير والمواصفات</Text>

      {errors.listingType ? <Text style={s.inlineErrorTxt}>{errors.listingType}</Text> : null}

      <View style={s.listingTypesRow}>
        {LISTING_TYPES.map((lt) => {
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
              <Text style={s.typeDesc} numberOfLines={2}>
                {lt.desc}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 2. Equipment Category Selection */}
      <Text style={s.sectionLabel}>فئة المعدة *</Text>
      <Text style={s.sectionSub}>اختر الفئة المناسبة لتسهيل عثور الباحثين عليها</Text>

      {errors.equipmentType ? <Text style={s.inlineErrorTxt}>{errors.equipmentType}</Text> : null}

      <View style={s.categoriesGrid}>
        {EQUIPMENT_CATEGORIES.map((cat) => {
          const isSel = formData.equipmentType === cat.key
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.catCard, isSel && s.catCardActive]}
              onPress={() => onUpdateField('equipmentType', cat.key)}
              activeOpacity={0.85}
            >
              <View style={[s.catIconWrap, isSel && s.catIconWrapActive]}>
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={18}
                  color={isSel ? '#ffffff' : Colors.primary}
                />
              </View>
              <Text style={[s.catTitle, isSel && s.catTitleActive]} numberOfLines={2}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 3. Basic Information Card */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>بيانات الإعلان الأساسية *</Text>
        <Text style={s.cardSub}>اكتب عنواناً جذاباً ووصفاً وافياً للمعدة وحالتها</Text>

        <AppInput
          label="عنوان الإعلان *"
          placeholder="مثال: حفار كوماتسو PC200 بحالة ممتازة للبيع أو الإيجار"
          value={formData.title}
          onChangeText={(val) => onUpdateField('title', val)}
          error={errors.title}
        />

        <AppInput
          label="تفاصيل ووصف المعدة *"
          placeholder="اكتب وصفاً تفصيلياً يشمل: سجل الصيانة، مكان تواجد المعدة، شروط التأجير، وساعات التشغيل..."
          value={formData.description}
          onChangeText={(val) => onUpdateField('description', val)}
          multiline
          numberOfLines={4}
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
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 5,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
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
    color: '#0F172A',
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
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  catCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
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
    color: '#334155',
    textAlign: 'center',
  },
  catTitleActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
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
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14.5,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: 4,
  },
})

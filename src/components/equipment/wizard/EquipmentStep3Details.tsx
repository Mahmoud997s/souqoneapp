import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { CardSystem } from '../../../constants/cardSystem'
import { AppInput } from '../../ui/AppInput'
import { YearSelect } from '../../ui/YearSelect'
import { EQUIPMENT_CONDITIONS, POPULAR_EQUIPMENT_FEATURES } from '../../../constants/equipment'
import { EquipmentStep3Props } from '../../../types/equipmentForm.types'

export function EquipmentStep3Details({
  formData,
  errors,
  customFeatureInput,
  onChangeCustomFeatureInput,
  onToggleFeature,
  onAddCustomFeature,
  onRemoveFeature,
  onUpdateField,
}: EquipmentStep3Props) {
  const isWanted = formData.listingType === 'EQUIPMENT_WANTED'

  return (
    <View style={s.stepWrap}>
      {/* ── 1. Primary Specifications Card ── */}
      <View style={s.cardSection}>
        <View style={s.cardHeaderRow}>
          <View style={s.headerIconCircle}>
            <Ionicons name="construct-outline" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>المواصفات الأساسية والصنع *</Text>
            <Text style={s.cardSub}>أدخل الماركة وسنة الصنع لتصنيف المعدة بدقة</Text>
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <AppInput
              label="الماركة / الشركة *"
              placeholder="مثال: CAT / Komatsu"
              value={formData.make}
              onChangeText={(val) => onUpdateField('make', val)}
              maxLength={50}
              error={errors.make}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label="الموديل / الطراز *"
              placeholder="مثال: PC200-8 / WA900"
              value={formData.model}
              onChangeText={(val) => onUpdateField('model', val)}
              maxLength={50}
              error={errors.model}
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <YearSelect
              label="سنة الصنع *"
              value={formData.year}
              onChange={(val) => onUpdateField('year', val)}
              error={errors.year}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label="ساعات التشغيل (ساعة)"
              placeholder="مثال: 4500"
              keyboardType="numeric"
              value={formData.hoursUsed}
              onChangeText={(val) => onUpdateField('hoursUsed', val)}
              error={errors.hoursUsed}
            />
          </View>
        </View>
      </View>

      {/* ── 2. Equipment Condition Card (Only for Sale & Rent) ── */}
      {!isWanted && (
        <View style={s.cardSection}>
          <View style={s.cardHeaderRow}>
            <View style={s.headerIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>حالة المعدة الفنية *</Text>
              <Text style={s.cardSub}>اختر التقييم الأقرب لحالة المعدة الحالية</Text>
            </View>
          </View>

          {errors.condition ? <Text style={s.inlineErrorTxt}>{errors.condition}</Text> : null}

          <View style={s.conditionsGrid}>
            {EQUIPMENT_CONDITIONS.map((cond) => {
              const isSel = formData.condition === cond.id
              return (
                <TouchableOpacity
                  key={cond.id}
                  style={[s.condCard, isSel && s.condCardActive]}
                  onPress={() => onUpdateField('condition', cond.id)}
                  activeOpacity={0.7}
                >
                  <View style={s.condCardTop}>
                    <View style={[s.radioCircle, isSel && s.radioCircleActive]}>
                      {isSel && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                    </View>
                    <Text style={[s.condLabel, isSel && s.condLabelActive]} numberOfLines={1}>
                      {cond.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* ── 3. Technical Performance Specs ── */}
      <View style={s.cardSection}>
        <View style={s.cardHeaderRow}>
          <View style={s.headerIconCircle}>
            <Ionicons name="speedometer-outline" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>القدرة والمقاييس الفنية (اختياري)</Text>
            <Text style={s.cardSub}>مواصفات إضافية تساعد المستأجر أو المشتري على الاختيار</Text>
          </View>
        </View>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <AppInput
              label="سعة الحفر / الحمولة"
              placeholder="مثال: 1.2 م³ أو 25 طن"
              value={formData.capacity}
              onChangeText={(val) => onUpdateField('capacity', val)}
              maxLength={50}
              error={errors.capacity}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label="القوة الحصانية / المحرك"
              placeholder="مثال: 160 HP"
              value={formData.power}
              onChangeText={(val) => onUpdateField('power', val)}
              maxLength={50}
              error={errors.power}
            />
          </View>
        </View>

        <AppInput
          label="الوزن التشغيلي الإجمالي"
          placeholder="مثال: 21,500 كجم"
          value={formData.weight}
          onChangeText={(val) => onUpdateField('weight', val)}
          maxLength={50}
          error={errors.weight}
        />
      </View>

      {/* ── 4. Equipment Features & Badges ── */}
      <View style={s.cardSection}>
        <View style={s.cardHeaderRow}>
          <View style={s.headerIconCircle}>
            <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>الميزات والمرفقات المتوفرة</Text>
            <Text style={s.cardSub}>حدد الميزات الجاهزة في المعدة أو أضف ميزة خاصة</Text>
          </View>
        </View>

        <View style={s.chipsWrap}>
          {POPULAR_EQUIPMENT_FEATURES.map((feat) => {
            const isSel = formData.features.includes(feat)
            return (
              <TouchableOpacity
                key={feat}
                style={[s.chip, isSel && s.chipActive]}
                onPress={() => onToggleFeature(feat)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSel ? 'checkmark-circle' : 'add-circle-outline'}
                  size={15}
                  color={isSel ? '#ffffff' : '#64748B'}
                />
                <Text style={[s.chipTxt, isSel && s.chipTxtActive]}>{feat}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Custom Feature Add Input */}
        <View style={s.addCustomRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              placeholder="أو اكتب ميزة إضافية (مثال: جاك همر، بوم طويل)"
              value={customFeatureInput}
              onChangeText={onChangeCustomFeatureInput}
              maxLength={50}
            />
          </View>
          <TouchableOpacity
            style={[s.addBtn, !customFeatureInput.trim() && s.addBtnDisabled]}
            onPress={onAddCustomFeature}
            disabled={!customFeatureInput.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Selected Features Tags */}
        {formData.features.length > 0 && (
          <View style={s.tagsSection}>
            <Text style={s.tagsHeading}>الميزات المحددة ({formData.features.length}):</Text>
            <View style={s.tagsList}>
              {formData.features.map((feat) => (
                <View key={feat} style={s.featureTag}>
                  <Text style={s.featureTagTxt}>{feat}</Text>
                  <TouchableOpacity
                    onPress={() => onRemoveFeature(feat)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#1E40AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: 12,
  },
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },

  /* ── Condition Cards ── */
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  condCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  condCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  condCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  condLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
  },
  condLabelActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },

  /* ── Chips ── */
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: CardSystem.radius.inner,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
  },
  chipTxtActive: {
    color: '#ffffff',
  },
  addCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#94A3B8',
  },
  tagsSection: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  tagsHeading: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: CardSystem.radius.inner,
  },
  featureTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#1E40AF',
  },
})

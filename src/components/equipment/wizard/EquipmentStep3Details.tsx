import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { CardSystem } from '../../../constants/cardSystem'
import { WizardCard } from '../../ui/WizardCard'
import { WizardOptionChip } from '../../wizard/WizardOptionChip'
import { AppInput } from '../../ui/AppInput'
import { YearSelect } from '../../ui/YearSelect'
import { EQUIPMENT_CONDITIONS, POPULAR_EQUIPMENT_FEATURES } from '../../../constants/equipment'
import { EquipmentStep3Props } from '../../../types/equipmentForm.types'
import { formatRtlPlaceholder } from '../../../utils/wizardHelpers'

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
      <WizardCard
        title="المواصفات الأساسية والصنع *"
        subtitle="أدخل الماركة وسنة الصنع لتصنيف المعدة بدقة"
      >
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <AppInput
              glass
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
              glass
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
              glass
              label="ساعات التشغيل (ساعة)"
              placeholder={formatRtlPlaceholder('مثال: 4500')}
              keyboardType="numeric"
              value={formData.hoursUsed}
              onChangeText={(val) => onUpdateField('hoursUsed', val)}
              error={errors.hoursUsed}
            />
          </View>
        </View>
      </WizardCard>

      {/* ── 2. Equipment Condition Card (Only for Sale & Rent) ── */}
      {!isWanted && (
        <WizardCard
          title="حالة المعدة الفنية *"
          subtitle="اختر التقييم الأقرب لحالة المعدة الحالية"
        >
          {errors.condition ? <Text style={s.inlineErrorTxt}>{errors.condition}</Text> : null}

          <View style={s.conditionsGrid}>
            {EQUIPMENT_CONDITIONS.map((cond) => (
              <WizardOptionChip
                key={cond.id}
                label={cond.label}
                selected={formData.condition === cond.id}
                onPress={() => onUpdateField('condition', cond.id)}
                error={Boolean(errors.condition)}
              />
            ))}
          </View>
        </WizardCard>
      )}

      {/* ── 3. Technical Performance Specs ── */}
      <WizardCard
        title="القدرة والمقاييس الفنية (اختياري)"
        subtitle="مواصفات إضافية تساعد المستأجر أو المشتري على الاختيار"
      >
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <AppInput
              glass
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
              glass
              label="القوة الحصانية / المحرك"
              placeholder={formatRtlPlaceholder('مثال: 160 HP')}
              value={formData.power}
              onChangeText={(val) => onUpdateField('power', val)}
              maxLength={50}
              error={errors.power}
            />
          </View>
        </View>

        <AppInput
          glass
          label="الوزن التشغيلي الإجمالي"
          placeholder={formatRtlPlaceholder('مثال: 21,500 كجم')}
          value={formData.weight}
          onChangeText={(val) => onUpdateField('weight', val)}
          maxLength={50}
          error={errors.weight}
        />
      </WizardCard>

      {/* ── 4. Equipment Features & Badges ── */}
      <WizardCard
        title="الميزات والمرفقات المتوفرة"
        subtitle="حدد الميزات الجاهزة في المعدة أو أضف ميزة خاصة"
      >
        <View style={s.chipsWrap}>
          {POPULAR_EQUIPMENT_FEATURES.map((feat) => {
            const isSel = formData.features.includes(feat)
            return (
              <WizardOptionChip
                key={feat}
                label={feat}
                icon={isSel ? 'checkmark-circle' : 'add-circle-outline'}
                selected={isSel}
                onPress={() => onToggleFeature(feat)}
              />
            )
          })}
        </View>

        {/* Custom Feature Add Input */}
        <View style={s.addCustomRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              glass
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
            <Ionicons name="add" size={22} color={Colors.white} />
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
                    <Ionicons name="close-circle" size={16} color={Colors.infoText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </WizardCard>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: 12,
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

  /* ── Chips ── */
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
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
    backgroundColor: Colors.slateMuted,
  },
  tagsSection: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.slateSubtleBg,
    gap: 6,
  },
  tagsHeading: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.slateSecondary,
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
    backgroundColor: Colors.infoSoftBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: CardSystem.radius.inner,
  },
  featureTagTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.infoText,
  },
})

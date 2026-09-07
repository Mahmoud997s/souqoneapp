import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { WizardCard } from '../../ui/WizardCard'
import { BusWizardData } from '../../../store/busWizardStore'
import { BUS_CONDITIONS, BUS_CONTRACT_TYPES } from '../../../constants/buses'

export interface BusStep4Props {
  data: BusWizardData
  errors: Record<string, string>
  onUpdateField: (field: keyof BusWizardData, value: any) => void
}

export function BusStep4Pricing({ data, errors, onUpdateField }: BusStep4Props) {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false)

  const isSale = data.busListingType === 'BUS_SALE'
  const isRent = data.busListingType === 'BUS_RENT'
  const isSaleWithContract = data.busListingType === 'BUS_SALE_WITH_CONTRACT'

  const handleDateConfirm = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const formatted = date.toISOString().split('T')[0]
    onUpdateField('contractExpiry', formatted)
    setDatePickerVisible(false)
  }

  const handleDateCancel = () => {
    setDatePickerVisible(false)
  }

  const handleClearDate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onUpdateField('contractExpiry', null)
  }

  return (
    <View style={s.stepWrap}>
      {/* ── 1. فرع البيع المباشر (BUS_SALE) ── */}
      {isSale && (
        <>
          <WizardCard
            title="سعر البيع *"
            subtitle="أدخل سعر بيع الحافلة بالريال العماني"
          >
            <View style={s.priceInputWrap}>
              <AppInput
                label="السعر المطلوب (ر.ع) *"
                placeholder="أدخل السعر بالريال"
                keyboardType="numeric"
                value={data.price}
                onChangeText={(val) => onUpdateField('price', val)}
                maxLength={9}
                error={errors.price}
                testID="price-input"
              />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>السعر قابل للتفاوض</Text>
                <Text style={s.switchSub}>إظهار شارة "قابل للتفاوض" لجذب المشترين</Text>
              </View>
              <Switch
                value={data.isPriceNegotiable}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  onUpdateField('isPriceNegotiable', val)
                }}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                testID="price-negotiable-switch"
              />
            </View>
          </WizardCard>

          <WizardCard
            title="حالة الحافلة *"
            subtitle="حدد الحالة العامة للحافلة المعروضة"
          >
            <View style={s.chipsRow}>
              {BUS_CONDITIONS.map((cond) => {
                const isSelected = data.condition === cond.id
                return (
                  <Pressable
                    key={cond.id}
                    style={[s.chip, isSelected && s.chipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      onUpdateField('condition', cond.id)
                    }}
                    testID={`condition-chip-${cond.id}`}
                  >
                    <Text style={[s.chipText, isSelected && s.chipTextActive]}>
                      {cond.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {errors.condition ? (
              <Text style={s.errorTxt}>{errors.condition}</Text>
            ) : null}
          </WizardCard>
        </>
      )}

      {/* ── 2. فرع الإيجار (BUS_RENT) ── */}
      {isRent && (
        <WizardCard
          title="أسعار وخيارات الإيجار *"
          subtitle="أدخل السعر اليومي أو الشهري كقيمة استرشادية للمستأجرين"
        >
          <AppInput
            label="سعر الإيجار اليومي (ر.ع)"
            placeholder="مثال: 50 (اختياري)"
            keyboardType="numeric"
            value={data.dailyPrice}
            onChangeText={(val) => onUpdateField('dailyPrice', val)}
            maxLength={8}
            error={errors.dailyPrice}
            testID="daily-price-input"
          />

          <AppInput
            label="سعر الإيجار الشهري (ر.ع)"
            placeholder="مثال: 800 (اختياري)"
            keyboardType="numeric"
            value={data.monthlyPrice}
            onChangeText={(val) => onUpdateField('monthlyPrice', val)}
            maxLength={8}
            error={errors.monthlyPrice}
            testID="monthly-price-input"
          />

          <View style={s.hintBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={s.hintText}>
              يجب إدخال سعر واحد على الأقل (يومي أو شهري) لإتمام نشر الإعلان.
            </Text>
          </View>

          <View style={s.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchTitle}>شامل السائق</Text>
              <Text style={s.switchSub}>هل يتضمن الإيجار توفير سائق للحافلة؟</Text>
            </View>
            <Switch
              value={data.withDriver}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onUpdateField('withDriver', val)
              }}
              trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              testID="with-driver-switch"
            />
          </View>
        </WizardCard>
      )}

      {/* ── 3. فرع بيع مع عقد تشغيل (BUS_SALE_WITH_CONTRACT) ── */}
      {isSaleWithContract && (
        <>
          <WizardCard
            title="سعر البيع الإجمالي *"
            subtitle="أدخل سعر بيع الحافلة متضمنة عقد التشغيل القائم"
          >
            <AppInput
              label="سعر البيع المطلوب (ر.ع) *"
              placeholder="أدخل السعر الإجمالي بالريال"
              keyboardType="numeric"
              value={data.price}
              onChangeText={(val) => onUpdateField('price', val)}
              maxLength={9}
              error={errors.price}
              testID="price-input"
            />

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>السعر قابل للتفاوض</Text>
                <Text style={s.switchSub}>إظهار شارة "قابل للتفاوض" لجذب المشترين</Text>
              </View>
              <Switch
                value={data.isPriceNegotiable}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  onUpdateField('isPriceNegotiable', val)
                }}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                testID="price-negotiable-switch"
              />
            </View>

            <View style={s.sectionDivider} />

            <Text style={s.innerLabel}>حالة الحافلة *</Text>
            <View style={s.chipsRow}>
              {BUS_CONDITIONS.map((cond) => {
                const isSelected = data.condition === cond.id
                return (
                  <Pressable
                    key={cond.id}
                    style={[s.chip, isSelected && s.chipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      onUpdateField('condition', cond.id)
                    }}
                    testID={`condition-chip-${cond.id}`}
                  >
                    <Text style={[s.chipText, isSelected && s.chipTextActive]}>
                      {cond.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {errors.condition ? (
              <Text style={s.errorTxt}>{errors.condition}</Text>
            ) : null}
          </WizardCard>

          <WizardCard
            title="تفاصيل عقد التشغيل *"
            subtitle="بيانات العقد القائم ومردوده الشهري لتوضيح الجدوى للمشتري"
          >
            <View>
              <Text style={s.innerLabel}>نوع العقد *</Text>
              <View style={s.chipsWrap}>
                {BUS_CONTRACT_TYPES.map((type) => {
                  const isSelected = data.contractType === type.id
                  return (
                    <Pressable
                      key={type.id}
                      style={[s.chip, isSelected && s.chipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        onUpdateField('contractType', type.id)
                      }}
                      testID={`contract-type-chip-${type.id}`}
                    >
                      <Text style={[s.chipText, isSelected && s.chipTextActive]}>
                        {type.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {errors.contractType ? (
                <Text style={s.errorTxt}>{errors.contractType}</Text>
              ) : null}
            </View>

            <AppInput
              label="الجهة المتعاقد معها *"
              placeholder="مثال: مدرسة الشروق / شركة النقل"
              value={data.contractClient}
              onChangeText={(val) => onUpdateField('contractClient', val)}
              maxLength={100}
              error={errors.contractClient}
              testID="contract-client-input"
            />

            <AppInput
              label="الدخل الشهري للعقد (ر.ع) *"
              placeholder="مثال: 450"
              keyboardType="numeric"
              value={data.contractMonthly}
              onChangeText={(val) => onUpdateField('contractMonthly', val)}
              maxLength={8}
              error={errors.contractMonthly}
              testID="contract-monthly-input"
            />

            <AppInput
              label="المدة المتبقية للعقد (بالأشهر) *"
              placeholder="مثال: 12"
              keyboardType="numeric"
              value={data.contractDuration}
              onChangeText={(val) => onUpdateField('contractDuration', val)}
              maxLength={4}
              error={errors.contractDuration}
              testID="contract-duration-input"
            />

            {/* تاريخ انتهاء العقد (اختياري) */}
            <View style={s.dateSection}>
              <Text style={s.innerLabel}>تاريخ انتهاء العقد (اختياري)</Text>
              <View style={s.datePickerWrapper}>
                <TouchableOpacity
                  style={[s.dateBtn, data.contractExpiry ? s.dateBtnActive : null]}
                  onPress={() => setDatePickerVisible(true)}
                  activeOpacity={0.7}
                  testID="contract-expiry-btn"
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={data.contractExpiry ? Colors.primary : Colors.textMuted}
                  />
                  <Text
                    style={[
                      s.dateBtnText,
                      data.contractExpiry ? s.dateBtnTextActive : null,
                    ]}
                  >
                    {data.contractExpiry ? data.contractExpiry : 'تحديد تاريخ الانتهاء'}
                  </Text>
                </TouchableOpacity>

                {data.contractExpiry ? (
                  <TouchableOpacity
                    style={s.dateClearBtn}
                    onPress={handleClearDate}
                    activeOpacity={0.7}
                    testID="clear-contract-expiry-btn"
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              display="spinner"
              isDarkModeEnabled={false}
              minimumDate={new Date()}
              date={data.contractExpiry ? new Date(data.contractExpiry) : new Date()}
              onConfirm={handleDateConfirm}
              onCancel={handleDateCancel}
              confirmTextIOS="تأكيد"
              cancelTextIOS="إلغاء"
              locale="ar"
              themeVariant="light"
              textColor="#000000"
              buttonTextColorIOS={Colors.primary}
            />
          </WizardCard>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  priceInputWrap: {
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  switchSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  innerLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
  },
  chipTextActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  hintText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#1E40AF',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  dateSection: {
    marginTop: 4,
  },
  datePickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  dateBtnText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  dateBtnTextActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  dateClearBtn: {
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: '#FEE2E2',
  },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 4,
  },
})

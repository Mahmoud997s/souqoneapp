import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
import { GlassPickerButton } from '../../ui/GlassPickerButton'
import { WizardOptionChip } from '../../wizard/WizardOptionChip'
import { WORKING_DAYS_AR } from '../../../constants/services'
import { ServiceStep4Props } from '../../../types/serviceForm.types'

const ALL_DAYS = [...WORKING_DAYS_AR]
const SAT_TO_THU_DAYS = WORKING_DAYS_AR.filter((d) => d !== 'الجمعة')

export function formatTimeDisplay(timeStr: string | null): string {
  if (!timeStr) return 'اختر الوقت'
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return timeStr
  const period = h >= 12 ? 'م' : 'ص'
  const displayHours = h % 12 === 0 ? 12 : h % 12
  const displayMinutes = String(m).padStart(2, '0')
  return `${String(displayHours).padStart(2, '0')}:${displayMinutes} ${period}`
}

function parse24HrToDate(timeStr: string | null): Date {
  const d = new Date()
  if (!timeStr) return d
  const [h, m] = timeStr.split(':').map(Number)
  if (!isNaN(h) && !isNaN(m)) {
    d.setHours(h, m, 0, 0)
  }
  return d
}

function formatTo24Hr(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function ServiceStep4Schedule({ formData, errors, onUpdateField }: ServiceStep4Props) {
  const [activeTimePicker, setActiveTimePicker] = useState<'open' | 'close' | null>(null)

  const toggleDay = (day: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const current = formData.workingDays || []
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day]
    onUpdateField('workingDays', next)
  }

  const applyPreset = (presetDays: string[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onUpdateField('workingDays', presetDays)
  }

  const handleTimeConfirm = (date: Date) => {
    const formatted = formatTo24Hr(date)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (activeTimePicker === 'open') {
      onUpdateField('workingHoursOpen', formatted)
    } else if (activeTimePicker === 'close') {
      onUpdateField('workingHoursClose', formatted)
    }
    setActiveTimePicker(null)
  }

  const clearTime = (field: 'workingHoursOpen' | 'workingHoursClose') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onUpdateField(field, null)
  }

  const selectedDaysCount = (formData.workingDays || []).length
  const isAllDaysSelected = selectedDaysCount === 7
  const isSatToThuSelected =
    selectedDaysCount === 6 &&
    SAT_TO_THU_DAYS.every((d) => (formData.workingDays || []).includes(d))

  return (
    <View style={s.stepWrap}>
      {/* 1. Working Days */}
      <WizardCard
        title="أيام العمل (اختياري)"
        subtitle="أيام وساعات العمل اختيارية ومستقلة — حدد الأيام أو اتركها فارغة لتعني 'غير محدد'"
      >
        {/* Quick Presets */}
        <View style={s.presetRow}>
          <WizardOptionChip
            testID="preset-all-days"
            label="طوال أيام الأسبوع"
            icon={isAllDaysSelected ? 'checkmark-circle' : 'calendar-outline'}
            selected={isAllDaysSelected}
            onPress={() => applyPreset(ALL_DAYS)}
          />
          <WizardOptionChip
            testID="preset-sat-to-thu"
            label="من السبت للخميس"
            icon={isSatToThuSelected ? 'checkmark-circle' : 'calendar-outline'}
            selected={isSatToThuSelected}
            onPress={() => applyPreset(SAT_TO_THU_DAYS)}
          />
        </View>

        {/* Individual Day Chips */}
        <View style={s.daysWrap}>
          {WORKING_DAYS_AR.map((day) => {
            const isSelected = (formData.workingDays || []).includes(day)
            return (
              <WizardOptionChip
                key={day}
                testID={`day-chip-${day}`}
                label={day}
                icon={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                selected={isSelected}
                onPress={() => toggleDay(day)}
              />
            )
          })}
        </View>

        {selectedDaysCount > 0 ? (
          <TouchableOpacity
            testID="clear-all-days"
            style={s.clearDaysBtn}
            onPress={() => applyPreset([])}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={14} color={Colors.slateText} />
            <Text style={s.clearDaysBtnTxt}>إلغاء التحديد (غير محدد)</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.unspecifiedNotice} testID="unspecified-days-notice">
            <Ionicons name="information-circle-outline" size={14} color={Colors.slateText} />
            <Text style={s.unspecifiedNoticeTxt}>
              أيام وساعات العمل اختيارية ومستقلة — ترك الأيام فارغة يعني "غير محدد" للمشتري
            </Text>
          </View>
        )}

        {errors.workingDays ? (
          <Text style={s.inlineErrorTxt} testID="error-working-days">
            {errors.workingDays}
          </Text>
        ) : null}
      </WizardCard>

      {/* 2. Working Hours */}
      <WizardCard
        title="أوقات وساعات العمل (اختياري)"
        subtitle="ساعات العمل اختيارية ومستقلة عن الأيام — حدد توقيت البدء والانتهاء أو اتركهما فارغين"
      >
        <View style={s.hoursRow}>
          {/* Open Time */}
          <View style={s.hourBox}>
            <Text style={s.hourLabel}>وقت الفتح / البدء</Text>
            <View style={s.selectorWrap}>
              <GlassPickerButton
                testID="open-time-btn"
                style={s.timeBtn}
                onPress={() => setActiveTimePicker('open')}
              >
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <Text
                  style={[
                    s.timeBtnTxt,
                    !formData.workingHoursOpen && s.timeBtnTxtPlaceholder,
                  ]}
                >
                  {formatTimeDisplay(formData.workingHoursOpen)}
                </Text>
              </GlassPickerButton>
              {formData.workingHoursOpen ? (
                <TouchableOpacity
                  testID="clear-open-time"
                  style={s.clearBtn}
                  onPress={() => clearTime('workingHoursOpen')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.slateMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Close Time */}
          <View style={s.hourBox}>
            <Text style={s.hourLabel}>وقت الإغلاق / الانتهاء</Text>
            <View style={s.selectorWrap}>
              <GlassPickerButton
                testID="close-time-btn"
                style={s.timeBtn}
                onPress={() => setActiveTimePicker('close')}
              >
                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                <Text
                  style={[
                    s.timeBtnTxt,
                    !formData.workingHoursClose && s.timeBtnTxtPlaceholder,
                  ]}
                >
                  {formatTimeDisplay(formData.workingHoursClose)}
                </Text>
              </GlassPickerButton>
              {formData.workingHoursClose ? (
                <TouchableOpacity
                  testID="clear-close-time"
                  style={s.clearBtn}
                  onPress={() => clearTime('workingHoursClose')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.slateMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {errors.workingHours ? (
          <Text style={s.inlineErrorTxt} testID="error-working-hours">
            {errors.workingHours}
          </Text>
        ) : null}
      </WizardCard>

      {/* Time Picker Modal */}
      <DateTimePickerModal
        isVisible={activeTimePicker !== null}
        mode="time"
        date={
          activeTimePicker === 'open'
            ? parse24HrToDate(formData.workingHoursOpen)
            : parse24HrToDate(formData.workingHoursClose)
        }
        display="spinner"
        isDarkModeEnabled={false}
        onConfirm={handleTimeConfirm}
        onCancel={() => setActiveTimePicker(null)}
        confirmTextIOS="تأكيد"
        cancelTextIOS="إلغاء"
        locale="ar"
        themeVariant="light"
        textColor={Colors.shadowBlack}
        buttonTextColorIOS={Colors.primary}
      />
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: Spacing.space3,
  },
  hourBox: {
    flex: 1,
    gap: 6,
  },
  hourLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.slateBody,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  selectorWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  timeBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.slateHeading,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  timeBtnTxtPlaceholder: {
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
  },
  clearBtn: {
    position: 'absolute',
    end: 10,
    top: 14,
  },
  inlineErrorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 6,
  },
  clearDaysBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  clearDaysBtnTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.slateText,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  unspecifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.slateSubtleBg,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  unspecifiedNoticeTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.slateSecondary,
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
  },
})

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { WizardCard } from '../../ui/WizardCard'
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
        title="أيام العمل"
        subtitle="حدد الأيام التي تستقبل فيها الطلبات وتعمل خلالها"
      >
        {/* Quick Presets */}
        <View style={s.presetRow}>
          <TouchableOpacity
            testID="preset-all-days"
            style={[s.presetBtn, isAllDaysSelected && s.presetBtnActive]}
            onPress={() => applyPreset(ALL_DAYS)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isAllDaysSelected ? 'checkmark-circle' : 'calendar-outline'}
              size={15}
              color={isAllDaysSelected ? Colors.primary : '#475569'}
            />
            <Text style={[s.presetBtnTxt, isAllDaysSelected && s.presetBtnTxtActive]}>
              طوال أيام الأسبوع
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="preset-sat-to-thu"
            style={[s.presetBtn, isSatToThuSelected && s.presetBtnActive]}
            onPress={() => applyPreset(SAT_TO_THU_DAYS)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSatToThuSelected ? 'checkmark-circle' : 'calendar-outline'}
              size={15}
              color={isSatToThuSelected ? Colors.primary : '#475569'}
            />
            <Text style={[s.presetBtnTxt, isSatToThuSelected && s.presetBtnTxtActive]}>
              من السبت للخميس
            </Text>
          </TouchableOpacity>
        </View>

        {/* Individual Day Chips */}
        <View style={s.daysWrap}>
          {WORKING_DAYS_AR.map((day) => {
            const isSelected = (formData.workingDays || []).includes(day)
            return (
              <TouchableOpacity
                key={day}
                testID={`day-chip-${day}`}
                style={[s.dayChip, isSelected && s.dayChipActive]}
                onPress={() => toggleDay(day)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={isSelected ? Colors.primary : '#94A3B8'}
                />
                <Text style={[s.dayChipTxt, isSelected && s.dayChipTxtActive]}>{day}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {errors.workingDays ? (
          <Text style={s.inlineErrorTxt} testID="error-working-days">
            {errors.workingDays}
          </Text>
        ) : null}
      </WizardCard>

      {/* 2. Working Hours */}
      <WizardCard
        title="أوقات وساعات العمل (اختياري)"
        subtitle="حدد توقيت بدء وانتهاء ساعات العمل اليومية"
      >
        <View style={s.hoursRow}>
          {/* Open Time */}
          <View style={s.hourBox}>
            <Text style={s.hourLabel}>وقت الفتح / البدء</Text>
            <View style={s.selectorWrap}>
              <Pressable
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
              </Pressable>
              {formData.workingHoursOpen ? (
                <TouchableOpacity
                  testID="clear-open-time"
                  style={s.clearBtn}
                  onPress={() => clearTime('workingHoursOpen')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Close Time */}
          <View style={s.hourBox}>
            <Text style={s.hourLabel}>وقت الإغلاق / الانتهاء</Text>
            <View style={s.selectorWrap}>
              <Pressable
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
              </Pressable>
              {formData.workingHoursClose ? (
                <TouchableOpacity
                  testID="clear-close-time"
                  style={s.clearBtn}
                  onPress={() => clearTime('workingHoursClose')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
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
        textColor="#000000"
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
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  presetBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  presetBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
  },
  presetBtnTxtActive: {
    color: Colors.primary,
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: '30%',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  dayChipTxt: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    writingDirection: 'rtl',
  },
  dayChipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_700Bold',
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
    color: '#334155',
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
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
  },
  timeBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#0F172A',
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
})

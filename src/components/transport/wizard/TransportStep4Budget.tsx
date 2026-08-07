import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useTransportWizardStore } from '../../../store/transportWizardStore';
import { InlineError } from '../../ui/InlineError';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function TransportStep4Budget() {
  const { data, setField, errors } = useTransportWizardStore();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const handleDateConfirm = (date: Date) => {
    const formattedDate = format(date, "d MMMM yyyy", { locale: ar });
    setField('scheduledDate', formattedDate);
    setField('scheduledDateObj', date.toISOString());
    useTransportWizardStore.getState().setErrors({ ...errors, scheduledDate: '' });
    setDatePickerVisibility(false);
  };

  const handleTimeConfirm = (time: Date) => {
    const formattedTime = format(time, "h:mm a", { locale: ar });
    setField('scheduledTime', formattedTime);
    setField('scheduledTimeObj', time.toISOString());
    useTransportWizardStore.getState().setErrors({ ...errors, scheduledTime: '' });
    setTimePickerVisibility(false);
  };

  const handleBudgetMin = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    setField('budgetMin', num ? parseInt(num, 10) : undefined);
    useTransportWizardStore.getState().setErrors({ ...errors, budgetMin: '', budgetMax: '' });
  };

  const handleBudgetMax = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    setField('budgetMax', num ? parseInt(num, 10) : undefined);
    useTransportWizardStore.getState().setErrors({ ...errors, budgetMax: '' });
  };

  const isToday = data.scheduledDate === format(new Date(), "d MMMM yyyy", { locale: ar });

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>حدد ميزانيتك المقترحة وموعد النقل لإيجاد أفضل العروض المناسبة.</Text>

      {/* Timing Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>موعد النقل <Text style={styles.required}>*</Text></Text>
        
        <View style={styles.timingTypeRow}>
          <TouchableOpacity 
            style={[styles.timingBtn, data.timingType === 'asap' && styles.timingBtnActive]}
            onPress={() => setField('timingType', 'asap')}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={24} color={data.timingType === 'asap' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.timingBtnTitle, data.timingType === 'asap' && styles.timingBtnTitleActive]}>في أقرب وقت</Text>
            <Text style={styles.timingBtnDesc}>جاهز للنقل فوراً</Text>
          </TouchableOpacity>

          <View style={{ width: 12 }} />

          <TouchableOpacity 
            style={[styles.timingBtn, data.timingType === 'scheduled' && styles.timingBtnActive]}
            onPress={() => setField('timingType', 'scheduled')}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={24} color={data.timingType === 'scheduled' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.timingBtnTitle, data.timingType === 'scheduled' && styles.timingBtnTitleActive]}>مجدول</Text>
            <Text style={styles.timingBtnDesc}>تحديد تاريخ ووقت</Text>
          </TouchableOpacity>
        </View>

        {/* Date & Flexibility only if scheduled */}
        {data.timingType === 'scheduled' && (
          <View style={{ marginTop: 16 }}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.subLabel}>التاريخ المفضل <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setDatePickerVisibility(true)} activeOpacity={0.7}>
                  <Text style={[styles.dateInput, { lineHeight: 26 }, !data.scheduledDate && { color: Colors.textMuted }]}>
                    {data.scheduledDate || "اختر التاريخ"}
                  </Text>
                  <View style={styles.dateIconBox}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
                <InlineError message={errors.scheduledDate} style={{ marginTop: 8 }} />
              </View>

              <View style={{ width: 12 }} />

              <View style={styles.flex1}>
                <Text style={styles.subLabel}>الوقت المفضل <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setTimePickerVisibility(true)} activeOpacity={0.7}>
                  <Text style={[styles.dateInput, { lineHeight: 26 }, !data.scheduledTime && { color: Colors.textMuted }]}>
                    {data.scheduledTime || "اختر الوقت"}
                  </Text>
                  <View style={styles.dateIconBox}>
                    <Ionicons name="time-outline" size={20} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
                <InlineError message={errors.scheduledTime} style={{ marginTop: 8 }} />
              </View>
            </View>
            
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              display="spinner"
              isDarkModeEnabled={false}
              minimumDate={new Date()}
              onConfirm={handleDateConfirm}
              onCancel={() => setDatePickerVisibility(false)}
              confirmTextIOS="تأكيد"
              cancelTextIOS="إلغاء"
              locale="ar"
              themeVariant="light"
              textColor="#000000"
              buttonTextColorIOS={Colors.primary}
            />
            <DateTimePickerModal
              isVisible={isTimePickerVisible}
              mode="time"
              display="spinner"
              isDarkModeEnabled={false}
              minimumDate={isToday ? new Date() : undefined}
              onConfirm={handleTimeConfirm}
              onCancel={() => setTimePickerVisibility(false)}
              confirmTextIOS="تأكيد"
              cancelTextIOS="إلغاء"
              locale="ar"
              themeVariant="light"
              textColor="#000000"
              buttonTextColorIOS={Colors.primary}
            />
            
            <View style={[styles.switchRow, { marginTop: 16 }]}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.sectionTitle}>تاريخ مرن (قابل للتفاوض)</Text>
                <Text style={[styles.hint, { marginBottom: 0 }]}>أنا مرن في الموعد وأبحث عن أفضل سعر متاح.</Text>
              </View>
              <Switch
                value={data.isFlexible}
                onValueChange={v => setField('isFlexible', v)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        )}
      </View>

      {/* Budget */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الميزانية المقترحة (ر.ع) <Text style={styles.required}>*</Text></Text>
        <Text style={styles.hint}>تركها فارغة سيجعل الناقلين يقدمون أفضل أسعارهم للتنافس.</Text>
        
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.subLabel}>من</Text>
            <View style={styles.currencyInputWrapper}>
              <TextInput
                style={styles.currencyInput}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={data.budgetMin ? data.budgetMin.toString() : ''}
                onChangeText={handleBudgetMin}
              />
              <View style={styles.verticalDivider} />
              <View style={styles.currencyUnitBox}>
                <Text style={styles.unitText}>ر.ع</Text>
              </View>
            </View>
          </View>
          <View style={styles.dashWrap}>
            <Text style={styles.dash}>-</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.subLabel}>إلى</Text>
            <View style={styles.currencyInputWrapper}>
              <TextInput
                style={styles.currencyInput}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={data.budgetMax ? data.budgetMax.toString() : ''}
                onChangeText={handleBudgetMax}
              />
              <View style={styles.verticalDivider} />
              <View style={styles.currencyUnitBox}>
                <Text style={styles.unitText}>ر.ع</Text>
              </View>
            </View>
          </View>
        </View>
        {(errors.budgetMin || errors.budgetMax) ? (
          <InlineError message={errors.budgetMin || errors.budgetMax} style={{ marginTop: 8 }} />
        ) : null}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  pageDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text2,
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: Spacing.space5,
    lineHeight: 26,
  },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderRadius: Radius.lg,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  timingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    direction: 'rtl',
  },
  timingBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    alignItems: 'flex-start',
  },
  timingBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(23, 44, 100, 0.05)',
  },
  timingBtnTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    marginTop: 8,
    marginBottom: 4,
  },
  timingBtnTitleActive: {
    color: Colors.primary,
  },
  timingBtnDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  required: {
    color: Colors.error,
  },
  hint: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 4,
    marginBottom: 8,
  },
  subLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.text2,
    writingDirection: 'rtl',
    marginBottom: 6,
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTextWrap: {
    flex: 1,
    marginEnd: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    direction: 'rtl',
  },
  flex1: {
    flex: 1,
  },
  dashWrap: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  dash: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: '#F8F9FA',
  },
  dateInput: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  dateIconBox: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    direction: 'rtl',
  },
  currencyInput: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  currencyUnitBox: {
    backgroundColor: Colors.surface,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    minHeight: 52,
    paddingVertical: 12,
    backgroundColor: Colors.border,
  },
  unitText: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.textMuted,
  },
});

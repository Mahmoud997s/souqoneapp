import React from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useTransportWizardStore } from '../../../store/transportWizardStore';
import { Ionicons } from '@expo/vector-icons';
import { InlineError } from '../../ui/InlineError';

export function TransportStep3Details() {
  const { data, setField, errors } = useTransportWizardStore();

  const handleWeightChange = (val: string) => {
    // Only allow numbers
    const num = val.replace(/[^0-9]/g, '');
    setField('weightTons', num ? parseInt(num, 10) : undefined);
    useTransportWizardStore.getState().setErrors({ ...errors, weightTons: '' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>اكتب وصفاً دقيقاً للبضاعة لمساعدة الناقلين في تسعير الطلب وتجهيز المركبة المناسبة.</Text>

      {/* Cargo Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>وصف البضاعة بالتفصيل <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.textArea}
          placeholder="مثال: أثاث غرفة نوم كاملة (سرير، دولاب، تسريحة) مع 5 كراتين ملابس وأدوات مطبخ..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={data.cargoDescription}
          onChangeText={v => {
            setField('cargoDescription', v);
            useTransportWizardStore.getState().setErrors({ ...errors, cargoDescription: '' });
          }}
        />
        <Text style={styles.hint}>يرجى ذكر الأبعاد والكمية إن أمكن</Text>
        <InlineError message={errors.cargoDescription} style={{ marginTop: 8 }} />
      </View>

      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الوزن التقريبي (بالطن) <Text style={styles.required}>*</Text></Text>
        <View style={styles.weightInputWrapper}>
          <TextInput
            style={styles.weightInput}
            placeholder="مثال: 3"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            value={data.weightTons ? data.weightTons.toString() : ''}
            onChangeText={handleWeightChange}
          />
          <View style={styles.verticalDivider} />
          <View style={styles.weightUnitBox}>
            <Text style={styles.unitText}>طن</Text>
          </View>
        </View>
        <InlineError message={errors.weightTons} style={{ marginTop: 8 }} />
      </View>

      {/* Helper */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.sectionTitle}>مساعد تحميل وتنزيل</Text>
            <Text style={styles.hint}>هل تحتاج إلى عمال للمساعدة في حمل البضاعة؟</Text>
          </View>
          <Switch
            value={data.requiresHelper}
            onValueChange={v => setField('requiresHelper', v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ملاحظات إضافية للناقل <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="أي تفاصيل أخرى (مثال: يوجد درج ولا يوجد مصعد)"
          placeholderTextColor={Colors.textMuted}
          value={data.notes}
          onChangeText={v => {
            setField('notes', v);
            useTransportWizardStore.getState().setErrors({ ...errors, notes: '' });
          }}
        />
        <InlineError message={errors.notes} style={{ marginTop: 8 }} />
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
  required: {
    color: Colors.error,
  },
  hint: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 4,
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
  textArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    minHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  weightInput: {
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
  weightUnitBox: {
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTextWrap: {
    flex: 1,
    marginEnd: 16,
  },
});

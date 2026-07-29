import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useBusWizardStore } from '../../../store/busWizardStore';
import { InlineError } from '../../ui/InlineError';
import { BUS_CONTRACT_TYPES } from '../../../../app/post/_constants/bus';
import { CONDITION_TYPES } from '../../../../app/post/_constants/car';

export function BusStep4Pricing() {
  const { data, setData, errors, setErrors } = useBusWizardStore();

  const isSale = data.busListingType === 'BUS_SALE' || data.busListingType === 'BUS_SALE_WITH_CONTRACT';
  const isRent = data.busListingType === 'BUS_RENT';
  const hasContract = data.busListingType === 'BUS_SALE_WITH_CONTRACT';

  const renderOptions = (field: keyof typeof data, options: any[], style?: any) => (
    <View style={[styles.optionsRow, style]}>
      {options.map((opt) => {
        const optKey = opt.id || opt.value;
        const active = data[field] === optKey;
        return (
          <TouchableOpacity
            key={optKey}
            style={[styles.optionChip, active && styles.optionChipActive]}
            onPress={() => {
              setData({ [field]: optKey });
              setErrors({ ...errors, [field]: '' });
            }}
          >
            <Text style={[styles.optionTxt, active && styles.optionTxtActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>قم بتحديد تفاصيل التسعير وحالة الحافلة لتوضيح العرض للمشترين أو المستأجرين.</Text>

      {isSale && (
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitle}>تفاصيل البيع</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>حالة الحافلة</Text>
            {renderOptions('condition', CONDITION_TYPES, { flexWrap: 'wrap' })}
            <InlineError message={errors.condition} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>سعر البيع (ر.ع.) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={data.price}
              onChangeText={(t) => { setData({ price: t }); setErrors({ ...errors, price: '' }); }}
            />
            <InlineError message={errors.price} />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.toggleTxt}>السعر قابل للتفاوض</Text>
            </View>
            <Switch
              value={data.isPriceNegotiable}
              onValueChange={v => setData({ isPriceNegotiable: v })}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      )}

      {isRent && (
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitle}>تفاصيل الإيجار</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>الإيجار اليومي</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={data.dailyPrice}
                onChangeText={(t) => { setData({ dailyPrice: t }); setErrors({ ...errors, dailyPrice: '' }); }}
              />
              <InlineError message={errors.dailyPrice} />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <Text style={styles.label}>الإيجار الشهري</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={data.monthlyPrice}
                onChangeText={(t) => { setData({ monthlyPrice: t }); setErrors({ ...errors, monthlyPrice: '' }); }}
              />
              <InlineError message={errors.monthlyPrice} />
            </View>
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.toggleTxt}>التأجير شامل السائق</Text>
            </View>
            <Switch
              value={data.withDriver}
              onValueChange={v => setData({ withDriver: v })}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      )}

      {hasContract && (
        <View style={styles.cardGroup}>
          <Text style={styles.sectionTitle}>تفاصيل عقد التشغيل المرفق</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>نوع العقد</Text>
            {renderOptions('contractType', BUS_CONTRACT_TYPES, { flexWrap: 'wrap' })}
            <InlineError message={errors.contractType} />
          </View>
          
          <View style={styles.inputGroup}>
             <Text style={styles.label}>الجهة المتعاقد معها</Text>
             <TextInput
               style={styles.input}
               placeholder="مثال: مدرسة مسقط الدولية"
               value={data.contractClient}
               onChangeText={(t) => { setData({ contractClient: t }); setErrors({ ...errors, contractClient: '' }); }}
             />
             <InlineError message={errors.contractClient} />
          </View>
          
          <View style={styles.inputGroup}>
             <Text style={styles.label}>القيمة الشهرية للعقد (ر.ع.)</Text>
             <TextInput
               style={styles.input}
               placeholder="مثال: 500"
               keyboardType="numeric"
               value={data.contractMonthly}
               onChangeText={(t) => { setData({ contractMonthly: t }); setErrors({ ...errors, contractMonthly: '' }); }}
             />
             <InlineError message={errors.contractMonthly} />
          </View>

          <View style={styles.inputGroup}>
             <Text style={styles.label}>مدة العقد المتبقية (بالأشهر)</Text>
             <TextInput
               style={styles.input}
               placeholder="مثال: 12"
               keyboardType="numeric"
               value={data.contractDuration}
               onChangeText={(t) => { setData({ contractDuration: t }); setErrors({ ...errors, contractDuration: '' }); }}
             />
             <InlineError message={errors.contractDuration} />
          </View>
        </View>
      )}
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
    lineHeight: 28,
  },
  cardGroup: {
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.space4,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 12,
    textAlign: 'left',
    lineHeight: 28,
  },
  inputGroup: {
    marginBottom: Spacing.space4,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 8,
    textAlign: 'left',
    lineHeight: 26,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
    textAlignVertical: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.space2,
  },
  flex1: {
    flex: 1,
  },
  optionsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    justifyContent: 'flex-start'
  },
  optionChip: {
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: Radius.md,
    borderWidth: 1, 
    borderColor: Colors.border, 
    backgroundColor: Colors.white,
  },
  optionChipActive: { 
    borderColor: Colors.primary, 
    backgroundColor: Colors.primary + '10' 
  },
  optionTxt: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 13, 
    color: Colors.textMuted,
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  optionTxtActive: { 
    color: Colors.primary 
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchTextWrap: {
    flex: 1,
    marginEnd: 16,
  },
  toggleTxt: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 14, 
    color: Colors.text,
    writingDirection: 'rtl',
    lineHeight: 24,
    textAlign: 'left',
  },
});

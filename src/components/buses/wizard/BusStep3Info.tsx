import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useBusWizardStore } from '../../../store/busWizardStore';
import { InlineError } from '../../ui/InlineError';
import { AppSelect } from '../../ui/AppSelect';
import { BUS_MAKES, BUS_FEATURES } from '../../../constants/buses';

const TRANSMISSION_TYPES = [
  { id: 'AUTOMATIC', label: 'أوتوماتيك' },
  { id: 'MANUAL', label: 'يدوي' }
];

const FUEL_TYPES = [
  { id: 'DIESEL', label: 'ديزل' },
  { id: 'PETROL', label: 'بنزين' },
  { id: 'HYBRID', label: 'هجين' },
  { id: 'ELECTRIC', label: 'كهربائي' }
];

export function BusStep3Info() {
  const { data, setData, errors, setErrors } = useBusWizardStore();

  const YEARS = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, i) => {
      const year = (currentYear + 1 - i).toString();
      return { label: year, value: year };
    });
  }, []);

  const toggleFeature = (key: string) => {
    const list = [...data.features];
    const idx = list.indexOf(key);
    if (idx > -1) list.splice(idx, 1);
    else list.push(key);
    setData({ features: list });
  };

  const renderOptions = (field: keyof typeof data, options: any[], style?: any) => (
    <View style={[styles.optionsRow, style]}>
      {options.map((opt) => {
        const active = data[field] === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.optionChip, active && styles.optionChipActive]}
            onPress={() => {
              setData({ [field]: opt.id });
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
      <Text style={styles.pageDesc}>أدخل تفاصيل الحافلة بدقة لتزيد من فرصة ظهورها في البحث.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>العنوان والوصف</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>عنوان الإعلان *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: حافلة نقل مدرسي للبيع بحالة ممتازة"
            value={data.title}
            onChangeText={(t) => { setData({ title: t }); setErrors({ ...errors, title: '' }); }}
          />
          <InlineError message={errors.title} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>وصف الإعلان *</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            placeholder="اكتب تفاصيل إضافية عن الحافلة..."
            multiline
            value={data.description}
            onChangeText={(t) => { setData({ description: t }); setErrors({ ...errors, description: '' }); }}
          />
          <InlineError message={errors.description} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المواصفات الأساسية</Text>
        <View style={styles.inputGroup}>
          <AppSelect
            label="الماركة *"
            value={data.make}
            onValueChange={(val) => {
              setData({ make: val });
              setErrors({ ...errors, make: '' });
            }}
            items={BUS_MAKES.map(m => ({ label: m.label, value: m.id }))}
            placeholder="اختر الماركة"
            iconRight="chevron-down"
          />
          <InlineError message={errors.make} />
        </View>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>الموديل *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: كوستر، هايس"
            value={data.model}
            onChangeText={(t) => { setData({ model: t }); setErrors({ ...errors, model: '' }); }}
          />
          <InlineError message={errors.model} />
        </View>
        <View style={{ width: 12 }} />
        <View style={styles.flex1}>
          <Text style={styles.label}>سنة الصنع *</Text>
          <AppSelect
            value={data.year || ''}
            onValueChange={(val) => {
              setData({ year: val });
              setErrors({ ...errors, year: '' });
            }}
            items={YEARS}
            placeholder="اختر السنة"
            iconRight="calendar-outline"
          />
          <InlineError message={errors.year} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>الممشى (كم) *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: 120000"
            keyboardType="number-pad"
            value={data.mileage}
            onChangeText={(t) => { setData({ mileage: t }); setErrors({ ...errors, mileage: '' }); }}
          />
          <InlineError message={errors.mileage} />
        </View>
        <View style={{ width: 12 }} />
        <View style={styles.flex1}>
          <Text style={styles.label}>عدد المقاعد *</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: 30"
            keyboardType="number-pad"
            value={data.capacity}
            onChangeText={(t) => { setData({ capacity: t }); setErrors({ ...errors, capacity: '' }); }}
          />
          <InlineError message={errors.capacity} />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>رقم اللوحة</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: 1234 ص ب"
          value={data.plateNumber}
          onChangeText={(t) => setData({ plateNumber: t })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>ناقل الحركة</Text>
        {renderOptions('transmission', TRANSMISSION_TYPES, { flexWrap: 'wrap' })}
      </View>

      <View style={styles.inputGroup}>
        <AppSelect
          label="نوع الوقود"
          value={data.fuelType}
          onValueChange={(val) => {
            setData({ fuelType: val });
            setErrors({ ...errors, fuelType: '' });
          }}
          items={FUEL_TYPES.map(m => ({ label: m.label, value: m.id }))}
          placeholder="اختر نوع الوقود"
          iconRight="chevron-down"
        />
        <InlineError message={errors.fuelType} />
      </View>

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المميزات والإضافات</Text>
        <View style={styles.featuresGrid}>
        {BUS_FEATURES.map((feat) => {
          const isActive = data.features.includes(feat.id);
          return (
            <TouchableOpacity
              key={feat.id}
              style={[styles.featItem, isActive && styles.featItemActive]}
              onPress={() => toggleFeature(feat.id)}
            >
              <Ionicons
                name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isActive ? Colors.primary : Colors.border}
              />
              <Text style={[styles.featTxt, isActive && styles.featTxtActive]}>{feat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      </View>
      <View style={{ height: 40 }} />
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
    lineHeight: 24,
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
    marginBottom: Spacing.space4,
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
  makeBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: Radius.md, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    backgroundColor: Colors.white, 
  },
  makeBtnActive: { 
    borderColor: Colors.primary, 
    backgroundColor: Colors.primary 
  },
  makeTxt: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 13, 
    color: Colors.text,
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  makeTxtActive: { 
    color: Colors.white 
  },
  featuresGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  featItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: Radius.pill,
    backgroundColor: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.border,
  },
  featItemActive: { 
    borderColor: Colors.primary, 
    backgroundColor: Colors.primary + '10' 
  },
  featTxt: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 13, 
    color: Colors.textMuted,
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  featTxtActive: { 
    color: Colors.primary 
  },
});

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, 
  Platform, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';
import { getWilayatsForGovernorate } from '../../constants/locations';
import { AppSelect } from '../ui/AppSelect';

interface FilterState {
  serviceType?: string;
  status?: string;
  fromGovernorate?: string;
  fromCity?: string;
  toGovernorate?: string;
  toCity?: string;
  budgetMin?: string;
  budgetMax?: string;
  timingType?: 'asap' | 'scheduled' | '';
  isFlexible?: boolean | null;
  requiresHelper?: boolean | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  currentFilters: Partial<FilterState>;
  onApply: (filters: Partial<FilterState>) => void;
}

const GOVERNORATES = [
  'مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية',
  'شمال الباطنة', 'جنوب الباطنة', 'شمال الشرقية', 'جنوب الشرقية',
  'الظاهرة', 'الوسطى'
];

const STATUSES = [
  { id: 'OPEN', label: 'مفتوح' },
  { id: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { id: 'COMPLETED', label: 'مكتمل' },
];

export function TransportFiltersModal({ visible, onClose, currentFilters, onApply }: Props) {
  const [filters, setFilters] = useState<FilterState>({});

  useEffect(() => {
    if (visible) {
      setFilters({
        status: currentFilters.status || '',
        fromGovernorate: currentFilters.fromGovernorate || '',
        fromCity: currentFilters.fromCity || '',
        toGovernorate: currentFilters.toGovernorate || '',
        toCity: currentFilters.toCity || '',
        budgetMin: currentFilters.budgetMin?.toString() || '',
        budgetMax: currentFilters.budgetMax?.toString() || '',
        timingType: currentFilters.timingType || '',
        isFlexible: currentFilters.isFlexible,
        requiresHelper: currentFilters.requiresHelper,
      });
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters = {
      status: undefined,
      fromGovernorate: undefined,
      fromCity: undefined,
      toGovernorate: undefined,
      toCity: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      timingType: undefined,
      isFlexible: undefined,
      requiresHelper: undefined,
    };
    setFilters({});
    onApply(emptyFilters);
    onClose();
  };

  const fromWilayats = filters.fromGovernorate ? getWilayatsForGovernorate(filters.fromGovernorate) : [];
  const toWilayats = filters.toGovernorate ? getWilayatsForGovernorate(filters.toGovernorate) : [];

  const governorateItems = GOVERNORATES.map(g => ({ label: g, value: g }));
  const fromWilayatItems = fromWilayats.map(w => ({ label: w.label, value: w.label }));
  const toWilayatItems = toWilayats.map(w => ({ label: w.label, value: w.label }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={s.contentWrap}
          >
            <View style={s.content}>
              {/* Header */}
              <View style={s.header}>
                <Text style={s.title}>تصفية النتائج</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={s.scroll} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: Spacing.space8 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Status */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>حالة الطلب</Text>
                  <View style={[s.chipsWrap, { paddingHorizontal: 24 }]}>
                    {STATUSES.map(stat => {
                      const isActive = filters.status === stat.id;
                      return (
                        <TouchableOpacity
                          key={stat.id}
                          style={[s.chip, isActive && s.chipActive]}
                          onPress={() => setFilters(p => ({ ...p, status: isActive ? '' : stat.id }))}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.chipTxt, isActive && s.chipTxtActive]}>{stat.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* From Governorate & City */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>نقطة الانطلاق (من)</Text>
                  <View style={[s.row, { paddingHorizontal: 24 }]}>
                    <View style={s.inputWrap}>
                      <AppSelect
                        label="المحافظة"
                        placeholder="الكل"
                        value={filters.fromGovernorate || ''}
                        onValueChange={(val) => setFilters(p => ({ ...p, fromGovernorate: val, fromCity: '' }))}
                        items={[{ label: 'الكل', value: '' }, ...governorateItems]}
                        iconRight="location-outline"
                      />
                    </View>
                    <View style={s.inputWrap}>
                      <AppSelect
                        label="الولاية"
                        placeholder="الكل"
                        value={filters.fromCity || ''}
                        onValueChange={(val) => setFilters(p => ({ ...p, fromCity: val }))}
                        items={[{ label: 'الكل', value: '' }, ...fromWilayatItems]}
                        iconRight="map-outline"
                        disabled={!filters.fromGovernorate}
                      />
                    </View>
                  </View>
                </View>

                {/* To Governorate & City */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>وجهة الوصول (إلى)</Text>
                  <View style={[s.row, { paddingHorizontal: 24 }]}>
                    <View style={s.inputWrap}>
                      <AppSelect
                        label="المحافظة"
                        placeholder="الكل"
                        value={filters.toGovernorate || ''}
                        onValueChange={(val) => setFilters(p => ({ ...p, toGovernorate: val, toCity: '' }))}
                        items={[{ label: 'الكل', value: '' }, ...governorateItems]}
                        iconRight="location-outline"
                      />
                    </View>
                    <View style={s.inputWrap}>
                      <AppSelect
                        label="الولاية"
                        placeholder="الكل"
                        value={filters.toCity || ''}
                        onValueChange={(val) => setFilters(p => ({ ...p, toCity: val }))}
                        items={[{ label: 'الكل', value: '' }, ...toWilayatItems]}
                        iconRight="map-outline"
                        disabled={!filters.toGovernorate}
                      />
                    </View>
                  </View>
                </View>

                {/* Timing & Flexibility */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>تفاصيل الموعد</Text>
                  <View style={[s.chipsWrap, { paddingHorizontal: 24 }]}>
                    <TouchableOpacity
                      style={[s.chip, filters.timingType === 'asap' && s.chipActive]}
                      onPress={() => setFilters(p => ({ ...p, timingType: p.timingType === 'asap' ? '' : 'asap' }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="flash-outline" size={16} color={filters.timingType === 'asap' ? Colors.primary : '#64748b'} />
                      <Text style={[s.chipTxt, filters.timingType === 'asap' && s.chipTxtActive]}>أسرع وقت (فوري)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.chip, filters.timingType === 'scheduled' && s.chipActive]}
                      onPress={() => setFilters(p => ({ ...p, timingType: p.timingType === 'scheduled' ? '' : 'scheduled' }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="calendar-outline" size={16} color={filters.timingType === 'scheduled' ? Colors.primary : '#64748b'} />
                      <Text style={[s.chipTxt, filters.timingType === 'scheduled' && s.chipTxtActive]}>مجدول (تاريخ محدد)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.chip, filters.isFlexible === true && s.chipActive]}
                      onPress={() => setFilters(p => ({ ...p, isFlexible: p.isFlexible ? null : true }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.chipTxt, filters.isFlexible === true && s.chipTxtActive]}>مرن في الموعد</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Additional Services */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>خدمات إضافية</Text>
                  <View style={[s.chipsWrap, { paddingHorizontal: 24 }]}>
                    <TouchableOpacity
                      style={[s.chip, filters.requiresHelper === true && s.chipActive]}
                      onPress={() => setFilters(p => ({ ...p, requiresHelper: p.requiresHelper ? null : true }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="people-outline" size={16} color={filters.requiresHelper ? Colors.primary : '#64748b'} />
                      <Text style={[s.chipTxt, filters.requiresHelper && s.chipTxtActive]}>يحتاج عمال تحميل وتنزيل</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Budget */}
                <View style={[s.section, { borderBottomWidth: 0 }]}>
                  <Text style={s.sectionTitle}>الميزانية المقترحة</Text>
                  <View style={[s.row, { paddingHorizontal: 24 }]}>
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>من</Text>
                      <View style={s.inputContainer}>
                        <TextInput
                          style={s.input}
                          keyboardType="numeric"
                          value={filters.budgetMin}
                          onChangeText={v => setFilters(p => ({ ...p, budgetMin: v }))}
                          placeholder="0"
                          placeholderTextColor="#94a3b8"
                        />
                        <Text style={s.currency}>ر.ع</Text>
                      </View>
                    </View>
                    <View style={s.inputWrap}>
                      <Text style={s.inputLabel}>إلى</Text>
                      <View style={s.inputContainer}>
                        <TextInput
                          style={s.input}
                          keyboardType="numeric"
                          value={filters.budgetMax}
                          onChangeText={v => setFilters(p => ({ ...p, budgetMax: v }))}
                          placeholder="1000"
                          placeholderTextColor="#94a3b8"
                        />
                        <Text style={s.currency}>ر.ع</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={s.footer}>
                <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
                  <Text style={s.resetTxt}>إعادة تعيين</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.applyBtn} onPress={handleApply}>
                  <Text style={s.applyTxt}>عرض النتائج</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  contentWrap: {
    width: '100%',
    maxHeight: '90%',
  },
  content: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
    paddingTop: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 20 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: 20, color: '#0f172a' },
  closeBtn: { 
    padding: 4, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 16 
  },
  
  scroll: { },
  section: {
    marginBottom: 24,
  },
  sectionTitle: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 15, 
    color: '#334155', 
    marginBottom: 12, 
    textAlign: 'left',
    paddingHorizontal: 24,
  },
  
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    backgroundColor: '#f8fafc',
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    gap: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: Colors.primary,
  },
  chipTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#64748b' },
  chipTxtActive: { color: Colors.primary },

  row: { flexDirection: 'row', gap: 16 },
  inputWrap: { flex: 1 },
  inputLabel: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#64748b', marginBottom: 8, textAlign: 'left' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: Radius.lg,
    height: 48,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_700Bold', 
    fontSize: 16, 
    color: '#0f172a',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  currency: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 14, 
    color: '#94a3b8',
    marginLeft: 8,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    gap: 16,
  },
  resetBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: '#f1f5f9',
  },
  resetTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: '#64748b' },
  applyBtn: {
    flex: 2,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    gap: 8,
  },
  applyTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 15, color: '#fff' },
});

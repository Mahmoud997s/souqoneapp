import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useBusWizardStore } from '../../../store/busWizardStore';
import { InlineError } from '../../ui/InlineError';

const BUS_LISTING_TYPES = [
  { id: 'BUS_SALE', label: 'للبيع', desc: 'بيع حافلة', icon: 'tag', color: '#10b981' },
  { id: 'BUS_RENT', label: 'تأجير', desc: 'تأجير يومي أو شهري', icon: 'calendar-clock', color: '#3b82f6' },
  { id: 'BUS_SALE_WITH_CONTRACT', label: 'بيع مع عقد', desc: 'بيع حافلة تعمل بعقد تشغيل', icon: 'file-document-outline', color: '#f59e0b' },
];

const LOCAL_BUS_TYPES = [
  { id: 'MINI_BUS', label: 'ميني باص', desc: 'تصل إلى 15 راكب', icon: 'bus-side', color: '#8b5cf6' },
  { id: 'MEDIUM_BUS', label: 'حافلة متوسطة', desc: 'من 16 إلى 34 راكب', icon: 'bus', color: '#3b82f6' },
  { id: 'LARGE_BUS', label: 'حافلة كبيرة', desc: '35 راكب فأكثر', icon: 'bus-double-decker', color: '#10b981' },
  { id: 'COASTER', label: 'كوستر', desc: 'للرحلات والنقل الخفيف', icon: 'van-passenger', color: '#f59e0b' },
  { id: 'SCHOOL_BUS', label: 'حافلة مدرسية', desc: 'مطابقة لمواصفات المدارس', icon: 'bus-school', color: '#ef4444' },
];

export function BusStep2Type() {
  const { data, setData, errors, setErrors } = useBusWizardStore();

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>اختر نوع الإعلان وفئة الحافلة لنتمكن من عرض التفاصيل المناسبة لك.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>نوع الإعلان *</Text>
        <View style={styles.grid}>
          {BUS_LISTING_TYPES.map(st => {
            const isSelected = data.busListingType === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                style={[styles.card, isSelected && styles.cardActive]}
                onPress={() => {
                  setData({ busListingType: st.id });
                  setErrors({ ...errors, busListingType: '' });
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, { backgroundColor: isSelected ? st.color + '15' : '#f1f5f9' }]}>
                  <MaterialCommunityIcons name={st.icon as any} size={28} color={isSelected ? st.color : Colors.textMuted} />
                </View>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                  {st.label}
                </Text>
                <Text style={[styles.cardDesc, isSelected && { color: st.color }]}>
                  {st.desc}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={st.color} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <InlineError message={errors.busListingType} style={{ marginTop: 8 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>فئة الحافلة *</Text>
        <View style={styles.grid}>
          {LOCAL_BUS_TYPES.map(cat => {
            const isSelected = data.busType === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.smallCard, isSelected && styles.cardActive]}
                onPress={() => {
                  setData({ busType: cat.id });
                  setErrors({ ...errors, busType: '' });
                }}
                activeOpacity={0.85}
              >
                <View style={[styles.smallIconBox, { backgroundColor: isSelected ? cat.color + '15' : '#f8fafc' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={22} color={isSelected ? cat.color : Colors.textMuted} />
                </View>
                <Text style={[styles.smallCardLabel, isSelected && styles.cardLabelActive]} numberOfLines={1}>
                  {cat.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={16} color={cat.color} style={styles.smallCheckIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <InlineError message={errors.busType} style={{ marginTop: 8 }} />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '31%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardLabelActive: {
    color: Colors.primary,
  },
  cardDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  smallCard: {
    width: '31%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  smallIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  smallCardLabel: {
    fontSize: 12,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  smallCheckIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});

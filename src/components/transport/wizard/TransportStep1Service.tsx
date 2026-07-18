import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useTransportWizardStore } from '../../../store/transportWizardStore';
import { TransportServiceType } from '../../../types/transport.types';

import { InlineError } from '../../ui/InlineError';

const SERVICE_TYPES: { key: TransportServiceType; label: string; icon: any; color: string; desc: string }[] = [
  { key: 'GOODS', label: 'بضائع عامة', desc: 'نقل البضائع والمواد التجارية', icon: 'cube-outline', color: '#2563eb' },
  { key: 'FURNITURE', label: 'أثاث ومنزليات', desc: 'نقل العفش والمفروشات المنزلية', icon: 'home-outline', color: '#7c3aed' },
  { key: 'CONSTRUCTION', label: 'مواد البناء', desc: 'الإسمنت، الحديد، الرمل والطابوق', icon: 'hammer-outline', color: '#d97706' },
  { key: 'HEAVY', label: 'شحن ثقيل', desc: 'المركبات، الحاويات، والأوزان الكبيرة', icon: 'car-outline', color: '#dc2626' },
  { key: 'BACKLOAD', label: 'عودة فارغة', desc: 'حمولات بأسعار مخفضة لشاحنات عائدة', icon: 'swap-horizontal-outline', color: '#16a34a' },
  { key: 'EQUIPMENT', label: 'معدات وآليات', desc: 'حفارات، رافعات، ومعدات صناعية', icon: 'construct-outline', color: '#0891b2' },
];

export function TransportStep1Service() {
  const { data, setField, errors } = useTransportWizardStore();

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>اختر نوع الحمولة لنتمكن من عرض طلبك للناقلين المناسبين بكفاءة.</Text>

      <Text style={styles.sectionTitle}>نوع الشحن *</Text>
      <View style={styles.grid}>
        {SERVICE_TYPES.map(st => {
          const isSelected = data.serviceType === st.key;
          return (
            <TouchableOpacity
              key={st.key}
              style={[styles.card, isSelected && styles.cardActive]}
              onPress={() => {
                setField('serviceType', st.key);
                useTransportWizardStore.getState().setErrors({ ...errors, serviceType: '' });
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: isSelected ? st.color + '15' : '#f1f5f9' }]}>
                <Ionicons name={st.icon} size={28} color={isSelected ? st.color : Colors.textMuted} />
              </View>
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                {st.label}
              </Text>
              <Text style={[styles.cardDesc, isSelected && { color: st.color }]}>
                {st.desc}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={st.color}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <InlineError message={errors.serviceType} style={{ marginTop: 16 }} />
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
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
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
  },
  cardLabelActive: {
    color: Colors.primary,
  },
  cardDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 16,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    end: 8,
  },
});

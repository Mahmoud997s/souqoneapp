import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useTransportWizardStore } from '../../../store/transportWizardStore';
import { TransportServiceType } from '../../../types/transport.types';

import { InlineError } from '../../ui/InlineError';

import { getServiceLabel } from '../../../constants/transport';

const SERVICE_TYPES: { key: TransportServiceType; label: string; icon: any; desc: string }[] = [
  { key: 'GOODS', label: getServiceLabel('GOODS'), desc: 'نقل البضائع والمواد التجارية', icon: 'package-variant-closed' },
  { key: 'FURNITURE', label: getServiceLabel('FURNITURE'), desc: 'نقل العفش والمفروشات المنزلية', icon: 'sofa-outline' },
  { key: 'CONSTRUCTION', label: getServiceLabel('CONSTRUCTION'), desc: 'الإسمنت، الحديد، الرمل والطابوق', icon: 'crane' },
  { key: 'HEAVY', label: getServiceLabel('HEAVY'), desc: 'المركبات، الحاويات، والأوزان الكبيرة', icon: 'truck-trailer' },
  { key: 'BACKLOAD', label: getServiceLabel('BACKLOAD'), desc: 'حمولات بأسعار مخفضة لشاحنات عائدة', icon: 'truck-check-outline' },
  { key: 'EQUIPMENT', label: getServiceLabel('EQUIPMENT'), desc: 'حفارات، رافعات، ومعدات صناعية', icon: 'excavator' },
  { key: 'CARS', label: getServiceLabel('CARS'), desc: 'نقل سيارات، دراجات، ومركبات', icon: 'tow-truck' },
  { key: 'LIVESTOCK', label: getServiceLabel('LIVESTOCK'), desc: 'نقل مواشي، طيور، وحيوانات', icon: 'cow' },
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
              <View style={[styles.iconBox, isSelected && styles.iconBoxActive]}>
                <MaterialCommunityIcons 
                  name={st.icon as any} 
                  size={28} 
                  color={isSelected ? Colors.primary : Colors.primary} 
                />
              </View>
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                {st.label}
              </Text>
              <Text style={[styles.cardDesc, isSelected && styles.cardDescActive]}>
                {st.desc}
              </Text>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.primary}
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
    backgroundColor: Colors.paleMint,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconBoxActive: {
    backgroundColor: Colors.white,
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
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  cardDescActive: {
    color: Colors.text,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    end: 8,
  },
});

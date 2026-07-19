import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCarrierWizardStore } from '../../../store/carrierWizardStore';
import { Colors } from '../../../constants/colors';
import { InlineError } from '../../ui/InlineError';

const VEHICLE_TYPES = [
  { key: 'PICKUP', label: 'بيك أب', icon: 'car-pickup' },
  { key: 'VAN', label: 'شاحنة مغلقة', icon: 'van-utility' },
  { key: 'TRUCK_SMALL', label: 'شاحنة صغيرة', icon: 'truck-outline' },
  { key: 'TRUCK_3_TON', label: 'شاحنة ٣ طن', icon: 'truck' },
  { key: 'TRUCK_7_TON', label: 'شاحنة ٧ طن', icon: 'truck-fast' },
  { key: 'TRUCK_10_TON', label: 'شاحنة ١٠ طن', icon: 'truck-cargo-container' },
  { key: 'TRUCK_LARGE', label: 'شاحنة كبيرة', icon: 'truck' },
  { key: 'TRAILER', label: 'قاطرة ومقطورة', icon: 'truck-trailer' },
  { key: 'REFRIGERATED', label: 'شاحنة تبريد', icon: 'snowflake' },
  { key: 'FLATBED', label: 'سطحة', icon: 'truck-flatbed' },
  { key: 'TIPPER', label: 'قلّاب', icon: 'dump-truck' },
  { key: 'CRANE', label: 'رافعة (ونش)', icon: 'crane' },
  { key: 'EXCAVATOR', label: 'حفارة', icon: 'excavator' },
  { key: 'OTHER', label: 'أخرى', icon: 'dots-horizontal' },
];

const SERVICE_TYPES = [
  { key: 'GOODS', label: 'بضائع عامة', icon: 'package-variant-closed' },
  { key: 'FURNITURE', label: 'أثاث وعفش', icon: 'sofa-outline' },
  { key: 'CONSTRUCTION', label: 'مواد بناء', icon: 'crane' },
  { key: 'HEAVY', label: 'نقل ثقيل', icon: 'truck-trailer' },
  { key: 'BACKLOAD', label: 'شحنات مجمعة', icon: 'truck-check-outline' },
  { key: 'EQUIPMENT', label: 'معدات وآليات', icon: 'excavator' },
  { key: 'CARS', label: 'نقل سيارات', icon: 'tow-truck' },
  { key: 'LIVESTOCK', label: 'نقل مواشي', icon: 'cow' },
];

export default function CarrierStep2Vehicles() {
  const { vehicleTypes, serviceTypes, toggleArrayItem, errors } = useCarrierWizardStore();

  return (
    <View style={s.container}>
      
      <View style={s.header}>
        <Text style={s.subtitle}>حدد نوع المركبات التي تملكها أو تقودها، وما هي أنواع الحمولات التي يمكنك نقلها.</Text>
      </View>

      {/* Vehicle Types */}
      <Text style={s.sectionTitle}>أنواع المركبات المتوفرة لديك *</Text>
      <View style={s.grid}>
        {VEHICLE_TYPES.map(item => {
          const isSelected = vehicleTypes.includes(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              style={[s.card, isSelected && s.cardActive, errors.vehicleTypes ? { borderColor: '#ef4444' } : null]}
              onPress={() => {
                toggleArrayItem('vehicleTypes', item.key);
                useCarrierWizardStore.getState().setErrors({ ...errors, vehicleTypes: '' });
              }}
              activeOpacity={0.7}
            >
              <View style={[s.iconBox, isSelected && s.iconBoxActive]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={isSelected ? Colors.primary : '#64748b'} />
              </View>
              <Text style={[s.cardLabel, isSelected && s.cardLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <InlineError message={errors.vehicleTypes} style={{ marginTop: 8 }} />

      {/* Service Types */}
      <Text style={[s.sectionTitle, { marginTop: 24 }]}>أنواع الخدمات / الحمولات *</Text>
      <View style={s.grid}>
        {SERVICE_TYPES.map(item => {
          const isSelected = serviceTypes.includes(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              style={[s.card, isSelected && s.cardActive, errors.serviceTypes ? { borderColor: '#ef4444' } : null]}
              onPress={() => {
                toggleArrayItem('serviceTypes', item.key);
                useCarrierWizardStore.getState().setErrors({ ...errors, serviceTypes: '' });
              }}
              activeOpacity={0.7}
            >
              <View style={[s.iconBox, isSelected && s.iconBoxActive]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={isSelected ? Colors.primary : '#64748b'} />
              </View>
              <Text style={[s.cardLabel, isSelected && s.cardLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <InlineError message={errors.serviceTypes} style={{ marginTop: 8 }} />

    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'left',
    paddingVertical: 4,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: 4,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'left',
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  card: {
    width: '31%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: Colors.primary + '15',
  },
  cardLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    paddingVertical: 4,
  },
  cardLabelActive: {
    color: Colors.primary,
  },
});

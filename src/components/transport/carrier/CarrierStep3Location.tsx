import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrierWizardStore } from '../../../store/carrierWizardStore';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { InlineError } from '../../ui/InlineError';
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect';
import { MapLocationPicker } from '../../ui/MapLocationPicker';

export default function CarrierStep3Location() {
  const { governorateId, wilayaId, baseLat, baseLng, setLocation, setField, errors } = useCarrierWizardStore();
  const [isMapVisible, setIsMapVisible] = useState(false);

  return (
    <View style={s.container}>
      
      <View style={s.header}>
        <Text style={s.subtitle}>أين تتواجد بشكل أساسي لكي يتم ترشيح الطلبات القريبة منك؟</Text>
      </View>

      <View style={s.section}>
        <GovernorateWilayaSelect
          governorateId={governorateId}
          wilayaId={wilayaId}
          onLocationChange={(govId, wilId, govName, wilName) => {
            setLocation(govId, wilId, govName, wilName);
            useCarrierWizardStore.getState().setErrors({ ...errors, governorateId: '' });
          }}
          govError={errors.governorateId}
          cityError={errors.wilayaId}
        />
        
        <TouchableOpacity 
          style={s.mapButton} 
          activeOpacity={0.7}
          onPress={() => setIsMapVisible(true)}
        >
          <Ionicons name="map-outline" size={20} color={Colors.primary} />
          <Text style={s.mapButtonText}>
            {baseLat && baseLng ? 'تعديل الموقع على الخريطة ✓' : 'تحديد الموقع بدقة على الخريطة 📍'}
          </Text>
        </TouchableOpacity>

        {baseLat && baseLng && (
          <View style={s.coordBox}>
            <Ionicons name="location" size={14} color="#94a3b8" />
            <Text style={s.coordText}>{baseLat.toFixed(5)}, {baseLng.toFixed(5)}</Text>
          </View>
        )}

        {!!errors.governorateId && <InlineError message={errors.governorateId} style={{ marginTop: 12 }} />}
        {!!errors.city && <InlineError message={errors.city} style={{ marginTop: 4 }} />}
      </View>

      <View style={s.infoBox}>
        <Ionicons name="information-circle" size={24} color="#0ea5e9" />
        <Text style={s.infoText}>سيتيح لك التطبيق لاحقاً استقبال الطلبات من جميع المحافظات، لكن تحديد موقعك الأساسي سيساعدنا في عرض الطلبات الأقرب إليك أولاً.</Text>
      </View>

      <MapLocationPicker
        isVisible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        title="موقع التواجد الأساسي"
        initialLat={baseLat}
        initialLng={baseLng}
        onConfirm={(lat, lng) => {
          setField('baseLat', lat);
          setField('baseLng', lng);
        }}
      />

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
  section: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  mapButtonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.primary,
  },
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  coordText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: Radius.md,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 22,
    textAlign: 'left',
    paddingVertical: 4,
  },
});

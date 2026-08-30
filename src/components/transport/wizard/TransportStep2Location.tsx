import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useTransportWizardStore } from '../../../store/transportWizardStore';
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect';
import { MapLocationPicker } from '../../ui/MapLocationPicker';
import { InlineError } from '../../ui/InlineError';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export function TransportStep2Location() {
  const { data, setField, setFromLocation, setToLocation, errors } = useTransportWizardStore();
  const [mapType, setMapType] = React.useState<'from' | 'to' | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>حدد موقع استلام وتسليم البضاعة بدقة لتسهيل وصول الناقل.</Text>

      {/* From */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>من (موقع الاستلام) *</Text>
        <GovernorateWilayaSelect
          governorateId={data.fromGovernorateId}
          wilayaId={data.fromWilayaId}
          govLabelText="المحافظة"
          cityLabelText="الولاية / المدينة (اختياري)"
          govError={errors.fromGovernorateId}
          cityError={errors.fromWilayaId}
          onLocationChange={(govId, wilId, govName, wilName) => {
            setFromLocation(govId, wilId, govName, wilName);
            useTransportWizardStore.getState().setErrors({ ...errors, fromGovernorateId: '', fromWilayaId: '' });
          }}
        />
        
        <TouchableOpacity 
          style={styles.mapButton} 
          activeOpacity={0.7}
          onPress={() => setMapType('from')}
        >
          <Ionicons name="map-outline" size={20} color={Colors.primary} />
          <Text style={styles.mapButtonText}>
            {data.fromLat && data.fromLng ? 'تعديل الموقع على الخريطة ✓' : 'تحديد الموقع بدقة على الخريطة 📍'}
          </Text>
        </TouchableOpacity>
        {data.fromLat && data.fromLng && (
          <View style={styles.coordBox}>
            <Ionicons name="location" size={14} color={Colors.textMuted} />
            <Text style={styles.coordText}>{data.fromLat.toFixed(5)}, {data.fromLng.toFixed(5)}</Text>
          </View>
        )}

        <InlineError message={errors.fromGovernorateId} style={{ marginTop: 12 }} />
      </View>

      {/* To */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إلى (موقع التسليم) *</Text>
        <GovernorateWilayaSelect
          governorateId={data.toGovernorateId}
          wilayaId={data.toWilayaId}
          govLabelText="المحافظة"
          cityLabelText="الولاية / المدينة (اختياري)"
          govError={errors.toGovernorateId}
          cityError={errors.toWilayaId}
          onLocationChange={(govId, wilId, govName, wilName) => {
            setToLocation(govId, wilId, govName, wilName);
            useTransportWizardStore.getState().setErrors({ ...errors, toGovernorateId: '', toWilayaId: '' });
          }}
        />
        
        <TouchableOpacity 
          style={styles.mapButton} 
          activeOpacity={0.7}
          onPress={() => setMapType('to')}
        >
          <Ionicons name="map-outline" size={20} color={Colors.primary} />
          <Text style={styles.mapButtonText}>
            {data.toLat && data.toLng ? 'تعديل الموقع على الخريطة ✓' : 'تحديد الموقع بدقة على الخريطة 📍'}
          </Text>
        </TouchableOpacity>
        {data.toLat && data.toLng && (
          <View style={styles.coordBox}>
            <Ionicons name="location" size={14} color={Colors.textMuted} />
            <Text style={styles.coordText}>{data.toLat.toFixed(5)}, {data.toLng.toFixed(5)}</Text>
          </View>
        )}

        <InlineError message={errors.toGovernorateId} style={{ marginTop: 12 }} />
      </View>

      <MapLocationPicker
        isVisible={mapType !== null}
        onClose={() => setMapType(null)}
        title={mapType === 'from' ? "موقع الاستلام" : "موقع التسليم"}
        initialLat={mapType === 'from' ? data.fromLat : data.toLat}
        initialLng={mapType === 'from' ? data.fromLng : data.toLng}
        onConfirm={(lat, lng) => {
          if (mapType === 'from') {
            setField('fromLat', lat);
            setField('fromLng', lng);
          } else {
            setField('toLat', lat);
            setField('toLng', lng);
          }
        }}
      />
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
    fontSize: 15,
    color: Colors.text,
    writingDirection: 'rtl',
    marginBottom: 16,
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
    borderColor: Colors.border,
  },
  coordText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  }
});

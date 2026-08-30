import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';
import { useBusWizardStore } from '../../../store/busWizardStore';
import { useAuthStore } from '../../../store/authStore';
import { InlineError } from '../../ui/InlineError';
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect';
import { MapLocationPicker } from '../../ui/MapLocationPicker';

export function BusStep5Location() {
  const { data, setData, errors, setErrors, setLocation } = useBusWizardStore();
  const { user } = useAuthStore();
  const [mapVisible, setMapVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.pageDesc}>تفاصيل الموقع ومعلومات التواصل لضمان وصول المهتمين إليك.</Text>


      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الموقع الجغرافي</Text>
        
        <GovernorateWilayaSelect
          governorateId={data.governorateId}
          wilayaId={data.wilayaId}
          onLocationChange={(govId, wilId, govName, wilName) => {
            setLocation(govId, wilId, govName, wilName);
            setErrors({ ...errors, governorateId: '' });
          }}
          govError={errors.governorateId}
          cityError={errors.wilayaId}
        />
        <InlineError message={errors.governorateId || errors.city} style={{ marginTop: 8 }} />

        <TouchableOpacity 
          style={styles.mapButton} 
          activeOpacity={0.7}
          onPress={() => setMapVisible(true)}
        >
          <Ionicons name="map-outline" size={20} color={Colors.primary} />
          <Text style={styles.mapButtonText}>
            {data.latitude && data.longitude ? 'تعديل الموقع على الخريطة ✓' : 'تحديد الموقع بدقة على الخريطة 📍'}
          </Text>
        </TouchableOpacity>

        {data.latitude && data.longitude ? (
          <View style={styles.coordBox}>
            <Ionicons name="location" size={14} color={Colors.textMuted} />
            <Text style={styles.coordText}>{data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}</Text>
          </View>
        ) : null}
      </View>
      
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>معلومات التواصل *</Text>
          {user?.phone && (
            <TouchableOpacity 
              style={styles.useMyPhoneBtn}
              onPress={() => {
                setData({ contactPhone: user.phone, whatsapp: user.phone });
                setErrors({ ...errors, contactPhone: '' });
              }}
            >
              <Text style={styles.useMyPhoneTxt}>استخدام رقمي</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>رقم الجوال *</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: 96899999999"
              keyboardType="phone-pad"
              value={data.contactPhone}
              onChangeText={(t) => { setData({ contactPhone: t }); setErrors({ ...errors, contactPhone: '' }); }}
            />
            <InlineError message={errors.contactPhone} />
          </View>
          <View style={{ width: 12 }} />
          <View style={styles.flex1}>
            <Text style={styles.label}>رقم الواتساب</Text>
            <TextInput
              style={styles.input}
              placeholder="نفس رقم الجوال"
              keyboardType="phone-pad"
              value={data.whatsapp}
              onChangeText={(t) => setData({ whatsapp: t })}
            />
          </View>
        </View>
      </View>

      <MapLocationPicker
        isVisible={mapVisible}
        onClose={() => setMapVisible(false)}
        title="موقع الحافلة"
        initialLat={data.latitude ?? undefined}
        initialLng={data.longitude ?? undefined}
        onConfirm={(lat, lng) => {
          setData({ latitude: lat, longitude: lng });
        }}
      />
      
      <View style={{ height: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 16 },
  pageDesc: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text2, textAlign: 'center', marginBottom: Spacing.space5, lineHeight: 28 },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderRadius: Radius.lg,
    marginBottom: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text, textAlign: 'left', marginBottom: 16, writingDirection: 'rtl', lineHeight: 28 },
  inputGroup: { marginBottom: Spacing.space4 },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.text, textAlign: 'left', marginBottom: 8, writingDirection: 'rtl', lineHeight: 26 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Almarai_400Regular', fontSize: 15, color: Colors.text, textAlign: 'right', writingDirection: 'rtl', textAlignVertical: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  flex1: { flex: 1 },
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
  },
  useMyPhoneBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  useMyPhoneTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
  },
});

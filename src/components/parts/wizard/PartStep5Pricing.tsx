import React, { useState } from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { WizardCard } from '../../ui/WizardCard'
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect'
import { MapLocationPicker } from '../../ui/MapLocationPicker'
import { PartStep5Props } from '../../../types/partForm.types'

export function PartStep5Pricing({
  formData,
  errors,
  onUpdateField,
  onLocationChange,
}: PartStep5Props) {
  const [mapVisible, setMapVisible] = useState(false)

  const hasCoords = formData.latitude != null && formData.longitude != null

  return (
    <View style={s.stepWrap}>
      {/* 1. Pricing Card */}
      <WizardCard
        title="سعر القطعة *"
        subtitle="أدخل سعر البيع المطلوب بالريال العماني"
      >
        <AppInput
          label="السعر المطلوب (ر.ع) *"
          placeholder="أدخل السعر بالريال"
          keyboardType="numeric"
          value={formData.price != null ? formData.price.toString() : ''}
          onChangeText={(val) => onUpdateField('price', val ? Number(val) : null)}
          maxLength={9}
          error={errors.price}
          testID="price-input"
        />

        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>السعر قابل للتفاوض</Text>
            <Text style={s.switchSub}>إظهار شارة "قابل للتفاوض" لجذب المهتمين</Text>
          </View>
          <Switch
            value={formData.isPriceNegotiable}
            onValueChange={(val) => onUpdateField('isPriceNegotiable', val)}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
            testID="price-negotiable-switch"
          />
        </View>
      </WizardCard>

      {/* 2. Geographic Location Card */}
      <WizardCard
        title="موقع تواجد القطعة *"
        subtitle="حدد المحافظة والولاية بدقة لتظهر في نتائج البحث الجغرافي"
      >
        <GovernorateWilayaSelect
          governorateId={formData.governorateId}
          wilayaId={formData.wilayaId}
          onLocationChange={onLocationChange}
          govError={errors.governorateId}
          cityError={errors.wilayaId}
          fallbackGovName={formData.governorateNameAr}
          fallbackCityName={formData.wilayaNameAr}
        />

        {/* Interactive Map Picker Section */}
        <View style={s.mapSectionDivider} />

        {hasCoords ? (
          <View style={s.coordsBox} testID="coords-box">
            <View style={s.coordsInfoRow}>
              <View style={s.coordsIconWrap}>
                <Ionicons name="location" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.coordsTitle}>تم تثبيت الموقع على الخريطة بنجاح ✓</Text>
                <Text style={s.coordsSub}>
                  {formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}
                </Text>
              </View>
            </View>
            <View style={s.coordsActionsRow}>
              <TouchableOpacity
                style={s.coordsEditBtn}
                onPress={() => setMapVisible(true)}
                activeOpacity={0.8}
                testID="edit-map-coords-btn"
              >
                <Ionicons name="map-outline" size={14} color={Colors.primary} />
                <Text style={s.coordsEditBtnTxt}>تعديل على الخريطة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.coordsClearBtn}
                onPress={() => {
                  onUpdateField('latitude', null)
                  onUpdateField('longitude', null)
                }}
                activeOpacity={0.8}
                testID="clear-map-coords-btn"
              >
                <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
                <Text style={s.coordsClearBtnTxt}>إلغاء الإحداثيات</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={s.mapTriggerBtn}
            onPress={() => setMapVisible(true)}
            activeOpacity={0.8}
            testID="open-map-picker-btn"
          >
            <View style={s.mapTriggerIconCircle}>
              <Ionicons name="map-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.mapTriggerTitle}>تحديد الموقع بدقة على الخريطة 📍</Text>
              <Text style={s.mapTriggerSub}>اختياري — يساعد المشترين على الوصول إليك</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </WizardCard>

      {/* 3. Contact Information Card */}
      <WizardCard
        title="بيانات التواصل (اختياري)"
        subtitle="أرقام التواصل تظهر للمشترين للتواصل المباشر"
      >
        <AppInput
          label="رقم الهاتف للتواصل"
          placeholder="مثال: 91234567"
          keyboardType="phone-pad"
          value={formData.contactPhone}
          onChangeText={(val) => onUpdateField('contactPhone', val)}
          maxLength={15}
          error={errors.contactPhone}
          testID="contact-phone-input"
        />

        <AppInput
          label="رقم الواتساب"
          placeholder="مثال: 91234567"
          keyboardType="phone-pad"
          value={formData.whatsapp}
          onChangeText={(val) => onUpdateField('whatsapp', val)}
          maxLength={15}
          error={errors.whatsapp}
          testID="whatsapp-input"
        />
      </WizardCard>

      {/* Modal for Map Location Picking */}
      <MapLocationPicker
        isVisible={mapVisible}
        onClose={() => setMapVisible(false)}
        title="موقع القطعة على الخريطة"
        initialLat={formData.latitude ?? undefined}
        initialLng={formData.longitude ?? undefined}
        onConfirm={(lat, lng) => {
          onUpdateField('latitude', lat)
          onUpdateField('longitude', lng)
          setMapVisible(false)
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: Spacing.space3,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  switchSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  mapSectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 4,
    marginBottom: 4,
  },
  mapTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapTriggerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTriggerTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  mapTriggerSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  coordsBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  coordsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#065F46',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  coordsSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#047857',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  coordsActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  coordsEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coordsEditBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.primary,
  },
  coordsClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coordsClearBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.error,
  },
})

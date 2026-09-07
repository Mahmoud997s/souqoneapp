import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { WizardCard } from '../../ui/WizardCard'
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect'
import { MapLocationPicker } from '../../ui/MapLocationPicker'
import { BusWizardData } from '../../../store/busWizardStore'

export interface BusStep5Props {
  data: BusWizardData
  errors: Record<string, string>
  onUpdateField: (field: keyof BusWizardData, value: any) => void
  onLocationChange: (govId: number, wilId: number, govName: string, wilName: string) => void
}

export function BusStep5Location({
  data,
  errors,
  onUpdateField,
  onLocationChange,
}: BusStep5Props) {
  const [mapVisible, setMapVisible] = useState(false)

  const hasCoords = data.latitude != null && data.longitude != null

  const handleClearCoords = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onUpdateField('latitude', null)
    onUpdateField('longitude', null)
  }

  return (
    <View style={s.stepWrap}>
      {/* ── 1. بطاقة الموقع الجغرافي ── */}
      <WizardCard
        title="الموقع الجغرافي *"
        subtitle="حدد المحافظة والولاية لتظهر الحافلة في نتائج البحث المحلي بدقة"
      >
        <GovernorateWilayaSelect
          governorateId={data.governorateId}
          wilayaId={data.wilayaId}
          onLocationChange={onLocationChange}
          govError={errors.governorateId}
          cityError={errors.wilayaId}
          fallbackGovName={data.governorateNameAr}
          fallbackCityName={data.wilayaNameAr}
        />

        {/* فاصل قسم الخريطة */}
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
                  {data.latitude?.toFixed(4)}, {data.longitude?.toFixed(4)}
                </Text>
              </View>
            </View>
            <View style={s.coordsActionsRow}>
              <TouchableOpacity
                style={s.coordsEditBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setMapVisible(true)
                }}
                activeOpacity={0.8}
                testID="edit-map-coords-btn"
              >
                <Ionicons name="map-outline" size={14} color={Colors.primary} />
                <Text style={s.coordsEditBtnTxt}>تعديل على الخريطة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.coordsClearBtn}
                onPress={handleClearCoords}
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setMapVisible(true)
            }}
            activeOpacity={0.8}
            testID="open-map-picker-btn"
          >
            <View style={s.mapTriggerIconCircle}>
              <Ionicons name="map-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.mapTriggerTitle}>تحديد الموقع بدقة على الخريطة 📍</Text>
              <Text style={s.mapTriggerSub}>اختياري — يساعد المشترين على الوصول لموقع الحافلة</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </WizardCard>

      {/* ── 2. بطاقة معلومات التواصل ── */}
      <WizardCard
        title="بيانات التواصل *"
        subtitle="أرقام التواصل التي ستظهر للمشترين والمستأجرين المهتمين"
      >
        <AppInput
          label="رقم الهاتف للتواصل *"
          placeholder="مثال: 91234567"
          keyboardType="phone-pad"
          value={data.contactPhone}
          onChangeText={(val) => onUpdateField('contactPhone', val)}
          maxLength={15}
          error={errors.contactPhone}
          testID="contact-phone-input"
        />

        <AppInput
          label="رقم الواتساب (اختياري)"
          placeholder="مثال: 91234567"
          keyboardType="phone-pad"
          value={data.whatsapp}
          onChangeText={(val) => onUpdateField('whatsapp', val)}
          maxLength={15}
          error={errors.whatsapp}
          testID="whatsapp-input"
        />
      </WizardCard>

      {/* ── Modal لتحديد الموقع على الخريطة ── */}
      <MapLocationPicker
        isVisible={mapVisible}
        onClose={() => setMapVisible(false)}
        title="موقع الحافلة على الخريطة"
        initialLat={data.latitude ?? undefined}
        initialLng={data.longitude ?? undefined}
        onConfirm={(lat, lng) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
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

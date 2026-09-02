import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { WizardCard } from '../../ui/WizardCard'
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect'
import { MapLocationPicker } from '../../ui/MapLocationPicker'
import { ServiceStep5Props } from '../../../types/serviceForm.types'

export function ServiceStep5Pricing({
  formData,
  errors,
  onUpdateField,
  onLocationChange,
}: ServiceStep5Props) {
  const [mapVisible, setMapVisible] = useState(false)

  const hasCoords = formData.latitude != null && formData.longitude != null

  return (
    <View style={s.stepWrap}>
      {/* 1. Pricing Card */}
      <WizardCard
        title="سعر الخدمة *"
        subtitle="حدد تكلفة أو نطاق أسعار تقديم الخدمة بالريال العماني"
      >
        <AppInput
          label="سعر الخدمة (يبدأ من) (ر.ع) *"
          placeholder="أدخل السعر بالريال العماني"
          keyboardType="numeric"
          value={formData.priceFrom != null ? formData.priceFrom.toString() : ''}
          onChangeText={(val) => {
            const num = val ? Number(val) : null
            onUpdateField('priceFrom', num !== null && isNaN(num) ? null : num)
          }}
          maxLength={9}
          error={errors.priceFrom}
          testID="price-from-input"
        />

        <AppInput
          label="السعر الأعلى (ر.ع) (اختياري)"
          placeholder="السعر الأعلى، اختياري"
          keyboardType="numeric"
          value={formData.priceTo != null ? formData.priceTo.toString() : ''}
          onChangeText={(val) => {
            const num = val ? Number(val) : null
            onUpdateField('priceTo', num !== null && isNaN(num) ? null : num)
          }}
          maxLength={9}
          error={errors.priceTo}
          testID="price-to-input"
        />
      </WizardCard>

      {/* 2. Location Card */}
      <WizardCard
        title="موقع تقديم الخدمة *"
        subtitle="حدد المحافظة والولاية لتظهر الخدمة في نتائج البحث الجغرافي"
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

        {/* Address Input */}
        <AppInput
          label="العنوان التفصيلي / الشارع (اختياري)"
          placeholder="مثال: شارع رقم 8، المنطقة الصناعية"
          value={formData.address}
          onChangeText={(val) => onUpdateField('address', val)}
          maxLength={150}
          error={errors.address}
          testID="address-input"
          containerStyle={{ marginTop: Spacing.space2 }}
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
              <Text style={s.mapTriggerTitle}>تحديد موقع الورشة / الخدمة على الخريطة 📍</Text>
              <Text style={s.mapTriggerSub}>اختياري — يساعد العملاء على الوصول إليك بدقة</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </WizardCard>

      {/* 3. Contact Details */}
      <WizardCard
        title="بيانات التواصل (اختياري)"
        subtitle="وسائل التواصل المباشرة المتاحة للعملاء"
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

        <AppInput
          label="الموقع الإلكتروني / رابط الحساب (اختياري)"
          placeholder="مثال: https://instagram.com/mygarage أو mygarage.om"
          keyboardType="url"
          value={formData.website}
          onChangeText={(val) => onUpdateField('website', val)}
          maxLength={200}
          error={errors.website}
          testID="website-input"
        />
      </WizardCard>

      {/* Modal for Map Location Picking */}
      <MapLocationPicker
        isVisible={mapVisible}
        onClose={() => setMapVisible(false)}
        title="موقع الخدمة على الخريطة"
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
  mapSectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: Spacing.space2,
    marginBottom: Spacing.space2,
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

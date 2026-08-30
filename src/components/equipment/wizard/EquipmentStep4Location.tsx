import React, { useState } from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { CardSystem } from '../../../constants/cardSystem'
import { AppInput } from '../../ui/AppInput'
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect'
import { MapLocationPicker } from '../../ui/MapLocationPicker'
import { EquipmentStep4Props } from '../../../types/equipmentForm.types'

export function EquipmentStep4Location({
  formData,
  errors,
  onUpdateField,
  onLocationChange,
}: EquipmentStep4Props) {
  const [mapVisible, setMapVisible] = useState(false)

  const isSale = formData.listingType === 'EQUIPMENT_SALE'
  const isRent = formData.listingType === 'EQUIPMENT_RENT'
  const isWanted = formData.listingType === 'EQUIPMENT_WANTED'

  const hasCoords = formData.latitude != null && formData.longitude != null

  return (
    <View style={s.stepWrap}>
      {/* 1. Pricing & Commercial Terms Card */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>
          {isWanted ? 'الميزانية والكمية المطلوبة *' : isRent ? 'أسعار الإيجار الاسترشادية *' : 'سعر البيع المطلوب *'}
        </Text>
        <Text style={s.cardSub}>
          {isWanted
            ? 'حدد الميزانية التقديرية والكمية ومدة العمل'
            : isRent
            ? 'أدخل الأجر اليومي أو الشهري وشروط التشغيل'
            : 'أدخل سعر البيع بالريال العماني'}
        </Text>

        {/* Sale Pricing */}
        {isSale && (
          <>
            <AppInput
              label="سعر البيع الإجمالي (ر.ع) *"
              placeholder="مثال: 18500"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(val) => onUpdateField('price', val)}
              error={errors.price}
            />

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>السعر قابل للتفاوض</Text>
                <Text style={s.switchSub}>إظهار شارة "قابل للتفاوض" لجذب المشترين</Text>
              </View>
              <Switch
                value={formData.isPriceNegotiable}
                onValueChange={(val) => onUpdateField('isPriceNegotiable', val)}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              />
            </View>
          </>
        )}

        {/* Rent Pricing */}
        {isRent && (
          <>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="الأجر اليومي (ر.ع)"
                  placeholder="مثال: 45"
                  keyboardType="numeric"
                  value={formData.dailyPrice}
                  onChangeText={(val) => onUpdateField('dailyPrice', val)}
                  error={errors.dailyPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="الأجر الشهري (ر.ع)"
                  placeholder="مثال: 950"
                  keyboardType="numeric"
                  value={formData.monthlyPrice}
                  onChangeText={(val) => onUpdateField('monthlyPrice', val)}
                  error={errors.monthlyPrice}
                />
              </View>
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>مع مشغل / سائق معتمد</Text>
                <Text style={s.switchSub}>الإيجار يشمل سائق أو مشغل للمعدة</Text>
              </View>
              <Switch
                value={formData.withOperator}
                onValueChange={(val) => onUpdateField('withOperator', val)}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>خدمة النقل والتوصيل متوفرة</Text>
                <Text style={s.switchSub}>إمكانية توصيل المعدة لموقع عمل المستأجر</Text>
              </View>
              <Switch
                value={formData.deliveryAvailable}
                onValueChange={(val) => onUpdateField('deliveryAvailable', val)}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              />
            </View>
          </>
        )}

        {/* Wanted Details */}
        {isWanted && (
          <>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="الميزانية كحد أدنى (ر.ع)"
                  placeholder="مثال: 200"
                  keyboardType="numeric"
                  value={formData.budgetMin}
                  onChangeText={(val) => onUpdateField('budgetMin', val)}
                  error={errors.budgetMin}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="الميزانية كحد أقصى (ر.ع) *"
                  placeholder="مثال: 800"
                  keyboardType="numeric"
                  value={formData.budgetMax}
                  onChangeText={(val) => onUpdateField('budgetMax', val)}
                  error={errors.budgetMax}
                />
              </View>
            </View>

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="العدد / الكمية المطلوبة *"
                  placeholder="مثال: 2"
                  keyboardType="numeric"
                  value={formData.quantity}
                  onChangeText={(val) => onUpdateField('quantity', val)}
                  error={errors.quantity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="مدة العمل المطلوبة"
                  placeholder="مثال: 3 أشهر"
                  value={formData.rentalDuration}
                  onChangeText={(val) => onUpdateField('rentalDuration', val)}
                  maxLength={50}
                />
              </View>
            </View>
          </>
        )}
      </View>

      {/* 2. Geographic Location Card */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>موقع تواجد المعدة *</Text>
        <Text style={s.cardSub}>حدد المحافظة والولاية بدقة لتظهر في نتائج البحث الجغرافي</Text>

        <GovernorateWilayaSelect
          governorateId={formData.governorateId}
          wilayaId={formData.wilayaId}
          onLocationChange={onLocationChange}
          govError={errors.governorateId}
          cityError={errors.city}
        />

        {/* Interactive Map Picker Section */}
        <View style={s.mapSectionDivider} />

        {hasCoords ? (
          <View style={s.coordsBox}>
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
          >
            <View style={s.mapTriggerIconCircle}>
              <Ionicons name="map-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.mapTriggerTitle}>تحديد الموقع بدقة على الخريطة 📍</Text>
              <Text style={s.mapTriggerSub}>اختياري — يساعد المشترين على حساب مسافة النقل بدقة</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Direct Contact Info Card */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>بيانات التواصل المباشر (اختياري)</Text>
        <Text style={s.cardSub}>أرقام التواصل التي ستظهر في الإعلان (تُملأ تلقائياً من حسابك)</Text>

        <AppInput
          label="رقم هاتف الاتصال"
          placeholder="مثال: 96891234567"
          keyboardType="phone-pad"
          value={formData.contactPhone}
          onChangeText={(val) => onUpdateField('contactPhone', val)}
          error={errors.contactPhone}
        />

        <AppInput
          label="رقم الواتساب"
          placeholder="مثال: 96891234567"
          keyboardType="phone-pad"
          value={formData.whatsapp}
          onChangeText={(val) => onUpdateField('whatsapp', val)}
          error={errors.whatsapp}
        />
      </View>

      {/* Modal for Map Picking */}
      <MapLocationPicker
        isVisible={mapVisible}
        onClose={() => setMapVisible(false)}
        title="موقع المعدة على الخريطة"
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
  cardSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14.5,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: -4,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
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
    borderRadius: CardSystem.radius.inner,
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
    borderRadius: CardSystem.radius.inner,
  },
  coordsClearBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.error,
  },
})

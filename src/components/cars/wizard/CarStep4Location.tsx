import React, { useState } from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { GovernorateWilayaSelect } from '../../ui/GovernorateWilayaSelect'
import { MapLocationPicker } from '../../ui/MapLocationPicker'
import { CarStep4Props } from '../../../types/carForm.types'
import { CANCELLATION_POLICIES } from '../../../constants/cars'

export function CarStep4Location({
  formData,
  errors,
  onUpdateField,
  onLocationChange,
}: CarStep4Props) {
  const [mapVisible, setMapVisible] = useState(false)

  const isSale = formData.listingType === 'SALE'
  const isRent = formData.listingType === 'RENTAL'
  const isWanted = formData.listingType === 'WANTED'

  const hasCoords = formData.latitude != null && formData.longitude != null

  return (
    <View style={s.stepWrap}>
      {/* 1. Pricing & Commercial Terms Card */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>
          {isWanted ? 'الميزانية المطلوبة *' : isRent ? 'أسعار الإيجار والشروط *' : 'سعر البيع المطلوب *'}
        </Text>
        <Text style={s.cardSub}>
          {isWanted
            ? 'حدد الميزانية التقديرية التي تبحث عنها'
            : isRent
            ? 'أدخل الأجر اليومي أو الشهري وشروط التأجير'
            : 'أدخل سعر البيع بالريال العماني'}
        </Text>

        {/* Sale Pricing */}
        {(isSale || isWanted) && (
          <>
            <AppInput
              label={isWanted ? "الميزانية المتوقعة (ر.ع) *" : "سعر البيع (ر.ع) *"}
              placeholder="أدخل المبلغ بالريال"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(val) => onUpdateField('price', val)}
              maxLength={9}
              error={errors.price}
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
                  label="الإيجار اليومي (ر.ع)"
                  placeholder="أدخل الإيجار اليومي"
                  keyboardType="numeric"
                  value={formData.dailyPrice}
                  onChangeText={(val) => onUpdateField('dailyPrice', val)}
                  maxLength={6}
                  error={errors.dailyPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="الإيجار الشهري (ر.ع)"
                  placeholder="أدخل الإيجار الشهري"
                  keyboardType="numeric"
                  value={formData.monthlyPrice}
                  onChangeText={(val) => onUpdateField('monthlyPrice', val)}
                  maxLength={7}
                  error={errors.monthlyPrice}
                />
              </View>
            </View>

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="أقل عدد أيام للإيجار"
                  placeholder="أدخل عدد الأيام"
                  keyboardType="numeric"
                  value={formData.minRentalDays}
                  onChangeText={(val) => onUpdateField('minRentalDays', val)}
                  maxLength={3}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  label="مبلغ التأمين المسترد (ر.ع)"
                  placeholder="أدخل مبلغ التأمين"
                  keyboardType="numeric"
                  value={formData.depositAmount}
                  onChangeText={(val) => onUpdateField('depositAmount', val)}
                  maxLength={6}
                />
              </View>
            </View>
            
            <View style={{ marginBottom: 12 }}>
              <AppInput
                label="الحد اليومي المسموح (كم)"
                placeholder="أدخل المسافة بالكيلومتر"
                keyboardType="numeric"
                value={formData.kmLimitPerDay}
                onChangeText={(val) => onUpdateField('kmLimitPerDay', val)}
                maxLength={6}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={[s.switchTitle, { marginBottom: 8 }]}>سياسة الإلغاء</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
                {CANCELLATION_POLICIES.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      s.chip,
                      formData.cancellationPolicy === opt.value && s.chipActive,
                      { flex: 0 },
                    ]}
                    onPress={() => onUpdateField('cancellationPolicy', opt.value)}
                  >
                    <Text
                      style={[
                        s.chipTxt,
                        formData.cancellationPolicy === opt.value && s.chipTxtActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>مع سائق</Text>
                <Text style={s.switchSub}>السيارة متوفرة للتأجير مع سائق</Text>
              </View>
              <Switch
                value={formData.withDriver}
                onValueChange={(val) => onUpdateField('withDriver', val)}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>متوفر التوصيل للعميل</Text>
                <Text style={s.switchSub}>إمكانية توصيل السيارة للعميل في موقعه</Text>
              </View>
              <Switch
                value={formData.deliveryAvailable}
                onValueChange={(val) => onUpdateField('deliveryAvailable', val)}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              />
            </View>
            
            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>شامل التأمين الشامل</Text>
                <Text style={s.switchSub}>سعر الإيجار يشمل التأمين الشامل للسيارة</Text>
              </View>
              <Switch
                value={formData.insuranceIncluded}
                onValueChange={(val) => onUpdateField('insuranceIncluded', val)}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              />
            </View>
          </>
        )}
      </View>

      {/* 2. Geographic Location Card */}
      <View style={s.cardSection}>
        <Text style={s.cardTitle}>موقع تواجد السيارة *</Text>
        <Text style={s.cardSub}>حدد المحافظة والولاية بدقة لتظهر في نتائج البحث الجغرافي</Text>

        <GovernorateWilayaSelect
          governorateId={formData.governorateId}
          wilayaId={formData.wilayaId}
          onLocationChange={onLocationChange}
          govError={errors.governorateId}
          cityError={errors.wilayaId}
          fallbackGovName={formData.governorateName}
          fallbackCityName={formData.wilayaName}
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
              <Text style={s.mapTriggerSub}>اختياري — يساعد المشترين على الوصول إليك</Text>
            </View>
            <Ionicons name="chevron-back" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Modal for Map Picking */}
      <MapLocationPicker
        isVisible={mapVisible}
        onClose={() => setMapVisible(false)}
        title="موقع السيارة على الخريطة"
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    color: '#475569',
  },
  chipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
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

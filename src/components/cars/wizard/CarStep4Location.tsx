import React, { useState } from 'react'
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { AppInput } from '../../ui/AppInput'
import { WizardCard } from '../../ui/WizardCard'
import { WizardOptionChip } from '../../wizard/WizardOptionChip'
import { WhatsappToggle } from '../../ui/WhatsappToggle'
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
      <WizardCard
        title={isWanted ? 'الميزانية المطلوبة *' : isRent ? 'أسعار الإيجار والشروط *' : 'سعر البيع المطلوب *'}
        subtitle={
          isWanted
            ? 'حدد الميزانية التقديرية التي تبحث عنها'
            : isRent
            ? 'أدخل الأجر اليومي أو الشهري وشروط التأجير'
            : 'أدخل سعر البيع بالريال العماني'
        }
      >
        {/* Sale Pricing */}
        {(isSale || isWanted) && (
          <>
            <AppInput
              glass
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
                trackColor={{ false: Colors.slateBorder, true: Colors.primary }}
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
                  glass
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
                  glass
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
                  glass
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
                  glass
                  label="مبلغ التأمين المسترد (ر.ع)"
                  placeholder="أدخل مبلغ التأمين"
                  keyboardType="numeric"
                  value={formData.depositAmount}
                  onChangeText={(val) => onUpdateField('depositAmount', val)}
                  maxLength={6}
                />
              </View>
            </View>
            
            <View style={{ marginBottom: Spacing.space3 }}>
              <AppInput
                glass
                label="الحد اليومي المسموح (كم)"
                placeholder="أدخل المسافة بالكيلومتر"
                keyboardType="numeric"
                value={formData.kmLimitPerDay}
                onChangeText={(val) => onUpdateField('kmLimitPerDay', val)}
                maxLength={6}
              />
            </View>

            <View>
              <Text style={[s.switchTitle, { marginBottom: 8 }]}>سياسة الإلغاء</Text>
              <View style={s.chipRow}>
                {CANCELLATION_POLICIES.map((opt) => (
                  <WizardOptionChip
                    key={opt.value}
                    label={opt.label}
                    selected={formData.cancellationPolicy === opt.value}
                    onPress={() => onUpdateField('cancellationPolicy', opt.value)}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </WizardCard>

      {/* 2. Rental Options & Terms */}
      {isRent && (
        <WizardCard title="خيارات وشروط الإيجار *">
          <View style={[s.switchRow, { borderTopWidth: 0, paddingTop: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchTitle}>مع سائق</Text>
              <Text style={s.switchSub}>السيارة متوفرة للتأجير مع سائق</Text>
            </View>
            <Switch
              value={formData.withDriver}
              onValueChange={(val) => onUpdateField('withDriver', val)}
              trackColor={{ false: Colors.slateBorder, true: Colors.primary }}
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
              trackColor={{ false: Colors.slateBorder, true: Colors.primary }}
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
              trackColor={{ false: Colors.slateBorder, true: Colors.primary }}
            />
          </View>
        </WizardCard>
      )}

      {/* 3. Geographic Location Card */}
      <WizardCard title="موقع تواجد السيارة *" subtitle="حدد المحافظة والولاية بدقة لتظهر في نتائج البحث الجغرافي">

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
                <Ionicons name="location" size={18} color={Colors.emerald} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.coordsTitle}>تم تثبيت الموقع على الخريطة بنجاح ✓</Text>
                <Text style={s.coordsSub}>
                  {formData.wilayaName || formData.governorateName
                    ? `${formData.governorateName || ''}${formData.wilayaName ? ` - ${formData.wilayaName}` : ''}`
                    : 'تم تحديد الموقع على الخريطة ✓'}
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
            <Ionicons name="chevron-back" size={18} color={Colors.slateMuted} />
          </TouchableOpacity>
        )}
      </WizardCard>

      {/* Contact: number is always the registered account's phone; WhatsApp switch via shared WhatsappToggle */}
      <WhatsappToggle
        value={formData.whatsappEnabled === true}
        onValueChange={(val) => onUpdateField('whatsappEnabled', val)}
      />

      {/* Modal for Map Picking */}
      <MapLocationPicker
        isVisible={mapVisible}
        onClose={() => setMapVisible(false)}
        title="موقع السيارة على الخريطة"
        initialLat={formData.latitude ?? undefined}
        initialLng={formData.longitude ?? undefined}
        governorate={formData.governorateName || formData.governorateId}
        wilaya={formData.wilayaName || formData.wilayaId}
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
  contactSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    borderTopColor: Colors.slateSubtleBg,
  },
  switchTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.slateHeading,
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
    backgroundColor: Colors.slateSurface,
    borderWidth: 1.5,
    borderColor: Colors.slateBorder,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.infoSoftBg,
    borderColor: Colors.primary,
  },
  chipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    color: Colors.slateSecondary,
  },
  chipTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
  mapSectionDivider: {
    height: 1,
    backgroundColor: Colors.slateSubtleBg,
    marginTop: 4,
    marginBottom: 4,
  },
  mapTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.slateSurface,
    borderWidth: 1,
    borderColor: Colors.slateBorderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapTriggerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTriggerTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  coordsSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
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

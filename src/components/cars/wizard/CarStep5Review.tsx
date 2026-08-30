import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { CardSystem } from '../../../constants/cardSystem'
import { CarStep5Props } from '../../../types/carForm.types'
import {
  CONDITION_TYPES,
  FUEL_TYPES,
  BODY_TYPES,
  DRIVE_TYPES,
  TRANSMISSION_TYPES,
  CAR_COLORS,
  CAR_FEATURE_KEYS,
} from '../../../constants/cars'

export function CarStep5Review({ formData, onEditStep }: CarStep5Props) {
  const isSale = formData.listingType === 'SALE'
  const isRent = formData.listingType === 'RENTAL'
  const isWanted = formData.listingType === 'WANTED'

  const locationText =
    formData.governorateName && formData.wilayaName
      ? `${formData.governorateName} - ${formData.wilayaName}`
      : formData.governorateName || 'سلطنة عمان'

  const allImages = [
    ...(formData.existingImages || []).map((img: any) => (typeof img === 'string' ? img : img.url || img.uri)),
    ...(formData.images || []).map((img: any) => (typeof img === 'string' ? img : img.uri || img.url)),
  ].filter(Boolean)

  const getLabel = (arr: any[], val: string) => arr.find((a) => a.value === val)?.label || val
  const getColorLabel = (val: string) => CAR_COLORS.find((c) => c.value === val)?.label || val

  const listingTypeLabel = isSale ? 'للبيع' : isRent ? 'للإيجار' : isWanted ? 'مطلوب' : formData.listingType

  return (
    <View style={s.stepWrap}>
      {/* ── Top Notice ── */}
      <View style={s.noticeBox}>
        <Ionicons name="checkmark-circle" size={20} color="#059669" />
        <Text style={s.noticeTxt}>
          راجع تفاصيل الإعلان بعناية قبل الضغط على تأكيد ونشر الإعلان.
        </Text>
      </View>

      {/* ── CARD 1: Photos Gallery ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>1</Text>
            </View>
            <Text style={s.cardTitle}>الصور والمرفقات ({allImages.length})</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(1)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {allImages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.thumbsScroll}
          >
            {allImages.map((uri, idx) => (
              <View key={idx} style={s.thumbWrap}>
                <Image source={{ uri }} style={s.thumbImg} contentFit="cover" transition={200} />
                {idx === 0 && (
                  <View style={s.primaryBadge}>
                    <Text style={s.primaryBadgeTxt}>الرئيسية</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={s.emptyTxt}>لم يتم إرفاق صور للسيارة (اختياري)</Text>
        )}
      </BlurView>

      {/* ── CARD 2: Basic Information ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>2</Text>
            </View>
            <Text style={s.cardTitle}>البيانات الأساسية</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(2)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        <View style={s.rowsList}>
          <View style={s.row}>
            <Text style={s.label}>نوع الإعلان</Text>
            <View
              style={[
                s.badge,
                isSale && s.badgeSale,
                isRent && s.badgeRent,
                isWanted && s.badgeWanted,
              ]}
            >
              <Text
                style={[
                  s.badgeTxt,
                  isSale && s.badgeTxtSale,
                  isRent && s.badgeTxtRent,
                  isWanted && s.badgeTxtWanted,
                ]}
              >
                {listingTypeLabel}
              </Text>
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.label}>عنوان الإعلان</Text>
            <Text style={[s.value, s.valueBold]}>{formData.title || '—'}</Text>
          </View>
        </View>

        {formData.description ? (
          <View style={s.descBox}>
            <Text style={s.descLabel}>الوصف والنبذة:</Text>
            <Text style={s.descTxt}>{formData.description}</Text>
          </View>
        ) : null}
      </BlurView>

      {/* ── CARD 3: Technical Specifications ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>3</Text>
            </View>
            <Text style={s.cardTitle}>المواصفات الفنية والميزات</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(3)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* 2-Column Clean Spec Boxes */}
        <View style={s.grid}>
          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>الماركة</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {formData.make || '—'}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>الموديل</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {formData.model || '—'}
            </Text>
          </View>
          
          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>الفئة</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {formData.trim || '—'}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>سنة الصنع</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {formData.year || '—'}
            </Text>
          </View>

          {!isWanted ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الحالة الفنية</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {getLabel(CONDITION_TYPES, formData.condition)}
              </Text>
            </View>
          ) : null}

          {formData.mileage ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الممشى</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {Number(formData.mileage).toLocaleString('en-US')} كم
              </Text>
            </View>
          ) : null}

          {formData.transmission ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>ناقل الحركة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {getLabel(TRANSMISSION_TYPES, formData.transmission)}
              </Text>
            </View>
          ) : null}

          {formData.fuelType ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>نوع الوقود</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {getLabel(FUEL_TYPES, formData.fuelType)}
              </Text>
            </View>
          ) : null}

          {formData.bodyType ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>شكل السيارة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {getLabel(BODY_TYPES, formData.bodyType)}
              </Text>
            </View>
          ) : null}

          {formData.driveType ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>نظام الدفع</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {getLabel(DRIVE_TYPES, formData.driveType)}
              </Text>
            </View>
          ) : null}
          
          {formData.exteriorColor ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>اللون الخارجي</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: CAR_COLORS.find(c => c.value === formData.exteriorColor)?.hex, borderWidth: 1, borderColor: '#E2E8F0' }} />
                <Text style={s.gridVal} numberOfLines={1}>
                  {getColorLabel(formData.exteriorColor)}
                </Text>
              </View>
            </View>
          ) : null}

          {formData.engineSize ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>سعة المحرك</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {formData.engineSize} CC
              </Text>
            </View>
          ) : null}
          
          {formData.horsepower ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الأحصنة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {formData.horsepower} حصان
              </Text>
            </View>
          ) : null}
        </View>

        {/* Features Badges */}
        {formData.features.length > 0 && (
          <View style={s.featuresBox}>
            <Text style={s.featuresTitle}>الميزات المحددة ({formData.features.length}):</Text>
            <View style={s.featuresList}>
              {formData.features.map((feat) => {
                const featureObj = CAR_FEATURE_KEYS.find(f => f.id === feat)
                const label = featureObj ? featureObj.label : feat
                const icon = featureObj ? (featureObj.icon as any) : 'checkmark-circle'
                return (
                  <View key={feat} style={s.featureChip}>
                    <Ionicons name={icon} size={13} color="#059669" />
                    <Text style={s.featureChipTxt}>{label}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </BlurView>

      {/* ── CARD 4: Pricing & Location ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>4</Text>
            </View>
            <Text style={s.cardTitle}>السعر والموقع</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(4)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* ── 1. Dedicated Price Display Box ── */}
        {(isSale || isWanted) && (
          <View style={s.priceBox}>
            <View style={s.priceBoxTop}>
              <Text style={s.priceBoxTitle}>{isWanted ? 'الميزانية المتوقعة' : 'سعر البيع المطلوب'}</Text>
              {formData.isPriceNegotiable ? (
                <View style={s.negoBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={s.negoBadgeTxt}>قابل للتفاوض</Text>
                </View>
              ) : null}
            </View>
            <Text style={s.priceBigNumber}>
              {formData.price ? Number(formData.price).toLocaleString('en-US') : '0'}{' '}
              <Text style={s.priceCurrency}>ر.ع</Text>
            </Text>
          </View>
        )}

        {isRent && (
          <View style={s.rentPriceBox}>
            <View style={s.rentHeaderRow}>
              <View style={s.rentIconCircle}>
                <Ionicons name="calendar-outline" size={14} color="#059669" />
              </View>
              <Text style={s.rentPriceBoxTitle}>أسعار الإيجار والشروط</Text>
            </View>

            <View style={s.rentRatesRow}>
              <View style={s.rentRateCard}>
                <Text style={s.rentRateLabel}>الإيجار اليومي</Text>
                <Text style={s.rentRateValue}>
                  {formData.dailyPrice ? Number(formData.dailyPrice).toLocaleString('en-US') : '—'}{' '}
                  <Text style={s.priceCurrencySm}>ر.ع</Text>
                </Text>
              </View>

              <View style={s.rentRateCard}>
                <Text style={s.rentRateLabel}>الإيجار الشهري</Text>
                <Text style={s.rentRateValue}>
                  {formData.monthlyPrice ? Number(formData.monthlyPrice).toLocaleString('en-US') : '—'}{' '}
                  <Text style={s.priceCurrencySm}>ر.ع</Text>
                </Text>
              </View>
            </View>
            
            {formData.depositAmount ? (
              <View style={s.row}>
                <Text style={s.label}>مبلغ التأمين المسترد</Text>
                <Text style={[s.value, { color: Colors.primary }]}>{formData.depositAmount} ر.ع</Text>
              </View>
            ) : null}

            {(formData.withDriver || formData.deliveryAvailable || formData.insuranceIncluded) && (
              <View style={s.rentTermsRow}>
                {formData.withDriver ? (
                  <View style={s.termBadge}>
                    <Ionicons name="person" size={12} color="#065F46" />
                    <Text style={s.termBadgeTxt}>مع سائق</Text>
                  </View>
                ) : null}
                {formData.deliveryAvailable ? (
                  <View style={s.termBadge}>
                    <Ionicons name="car" size={12} color="#065F46" />
                    <Text style={s.termBadgeTxt}>توصيل لموقع العميل</Text>
                  </View>
                ) : null}
                {formData.insuranceIncluded ? (
                  <View style={s.termBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#065F46" />
                    <Text style={s.termBadgeTxt}>شامل التأمين</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* ── 2. Location Rows ── */}
        <View style={s.rowsList}>
          <View style={s.row}>
            <View style={s.rowIconLabel}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={s.label}>الموقع الجغرافي</Text>
            </View>
            <Text style={s.value}>{locationText}</Text>
          </View>

          {formData.latitude != null && formData.longitude != null ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="map-outline" size={16} color="#059669" />
                <Text style={s.label}>موقع الخريطة</Text>
              </View>
              <View style={s.gpsBadge}>
                <Ionicons name="location" size={12} color="#059669" />
                <Text style={s.gpsBadgeTxt}>
                  {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)} ✓
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </BlurView>
    </View>
  )
}

const s = StyleSheet.create({
  stepWrap: {
    gap: 12,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeTxt: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16.5,
    color: '#065F46',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  card: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  cardWhiteWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 11.5,
    color: Colors.primary,
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.primary,
  },
  rowsList: {
    gap: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#64748B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  value: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  valueBold: {
    fontFamily: 'Almarai_800ExtraBold',
    color: '#0F172A',
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSale: {
    backgroundColor: '#EFF6FF',
  },
  badgeRent: {
    backgroundColor: '#ECFDF5',
  },
  badgeWanted: {
    backgroundColor: '#FEF3C7',
  },
  badgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
  },
  badgeTxtSale: {
    color: '#1D4ED8',
  },
  badgeTxtRent: {
    color: '#047857',
  },
  badgeTxtWanted: {
    color: '#B45309',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gpsBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#047857',
    writingDirection: 'ltr',
  },
  descBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    marginTop: 2,
  },
  descLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  descTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 17.5,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  thumbsScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  thumbWrap: {
    width: 74,
    height: 74,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 3,
    start: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 8.5,
    color: '#FFFFFF',
  },
  emptyTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItemBox: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 2,
  },
  gridLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#64748B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  gridVal: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  featuresBox: {
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  featuresTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: CardSystem.radius.inner,
  },
  featureChipTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#166534',
  },
  priceBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: 12,
    gap: 6,
  },
  priceBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBoxTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#166534',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  negoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  negoBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    color: '#15803D',
  },
  priceBigNumber: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 19,
    lineHeight: 25,
    color: '#15803D',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceCurrency: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#166534',
  },
  rentPriceBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: 12,
    gap: 10,
  },
  rentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rentIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentPriceBoxTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#166534',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rentRatesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rentRateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.md,
    padding: 10,
    alignItems: 'center',
  },
  rentRateLabel: {
    fontFamily: 'Almarai_600SemiBold',
    fontSize: 11,
    color: '#065F46',
    marginBottom: 2,
  },
  rentRateValue: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: '#15803D',
  },
  priceCurrencySm: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#166534',
  },
  rentTermsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
  },
  termBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  termBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    color: '#065F46',
  },
})

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
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { CardSystem } from '../../../constants/cardSystem'
import {
  getEquipmentTypeLabel,
  getEquipmentListingTypeLabel,
  getEquipmentConditionLabel,
} from '../../../utils/equipment-mappers'
import { EquipmentStep5Props } from '../../../types/equipmentForm.types'

export function EquipmentStep5Review({ formData, onEditStep }: EquipmentStep5Props) {
  const isSale = formData.listingType === 'EQUIPMENT_SALE'
  const isRent = formData.listingType === 'EQUIPMENT_RENT'
  const isWanted = formData.listingType === 'EQUIPMENT_WANTED'

  const locationText =
    formData.governorate && formData.city
      ? `${formData.governorate} - ${formData.city}`
      : formData.governorate || 'سلطنة عمان'

  const allImages = [
    ...(formData.existingImages || []).map((img: any) => (typeof img === 'string' ? img : img.url || img.uri)),
    ...(formData.images || []).map((img: any) => (typeof img === 'string' ? img : img.uri || img.url)),
  ].filter(Boolean)

  return (
    <View style={s.stepWrap}>
      {/* ── Top Notice ── */}
      <View style={s.noticeBox}>
        <Ionicons name="checkmark-circle" size={20} color="#059669" />
        <Text style={s.noticeTxt}>
          راجع تفاصيل الإعلان بعناية قبل الضغط على تأكيد ونشر الإعلان.
        </Text>
      </View>

      {/* ── CARD 1: Basic Information ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>1</Text>
            </View>
            <Text style={s.cardTitle}>البيانات الأساسية</Text>
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
                {getEquipmentListingTypeLabel(formData.listingType)}
              </Text>
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.label}>فئة المعدة</Text>
            <Text style={s.value}>{getEquipmentTypeLabel(formData.equipmentType)}</Text>
          </View>

          <View style={s.row}>
            <Text style={s.label}>عنوان الإعلان</Text>
            <Text style={[s.value, s.valueBold]}>{formData.title}</Text>
          </View>
        </View>

        {formData.description ? (
          <View style={s.descBox}>
            <Text style={s.descLabel}>الوصف والنبذة:</Text>
            <Text style={s.descTxt}>{formData.description}</Text>
          </View>
        ) : null}
      </View>

      {/* ── CARD 2: Photos Gallery ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>2</Text>
            </View>
            <Text style={s.cardTitle}>الصور والمرفقات ({allImages.length})</Text>
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
          <Text style={s.emptyTxt}>لم يتم إرفاق صور للمعدة (اختياري)</Text>
        )}
      </View>

      {/* ── CARD 3: Technical Specifications ── */}
      <View style={s.card}>
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
            <Text style={s.gridLabel}>سنة الصنع</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {formData.year || '—'}
            </Text>
          </View>

          {!isWanted ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الحالة الفنية</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {getEquipmentConditionLabel(formData.condition)}
              </Text>
            </View>
          ) : null}

          {formData.hoursUsed ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>ساعات التشغيل</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {formData.hoursUsed} ساعة
              </Text>
            </View>
          ) : null}

          {formData.capacity ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>السعة / الحمولة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {formData.capacity}
              </Text>
            </View>
          ) : null}

          {formData.power ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>القوة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {formData.power}
              </Text>
            </View>
          ) : null}

          {formData.weight ? (
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الوزن الإجمالي</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {formData.weight}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Features Badges */}
        {formData.features.length > 0 && (
          <View style={s.featuresBox}>
            <Text style={s.featuresTitle}>الميزات المحددة ({formData.features.length}):</Text>
            <View style={s.featuresList}>
              {formData.features.map((feat) => (
                <View key={feat} style={s.featureChip}>
                  <Ionicons name="checkmark-circle" size={13} color="#059669" />
                  <Text style={s.featureChipTxt}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ── CARD 4: Pricing, Location & Contact ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>4</Text>
            </View>
            <Text style={s.cardTitle}>السعر والموقع والتواصل</Text>
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
        {isSale && (
          <View style={s.priceBox}>
            <View style={s.priceBoxTop}>
              <Text style={s.priceBoxTitle}>سعر البيع المطلوب</Text>
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
              <Text style={s.rentPriceBoxTitle}>أسعار الإيجار الاسترشادية</Text>
            </View>

            <View style={s.rentRatesRow}>
              <View style={s.rentRateCard}>
                <Text style={s.rentRateLabel}>الأجر اليومي</Text>
                <Text style={s.rentRateValue}>
                  {formData.dailyPrice ? Number(formData.dailyPrice).toLocaleString('en-US') : '—'}{' '}
                  <Text style={s.priceCurrencySm}>ر.ع</Text>
                </Text>
                <Text style={s.rentRateSub}>لكل يوم تشغيل</Text>
              </View>

              <View style={s.rentRateCard}>
                <Text style={s.rentRateLabel}>الأجر الشهري</Text>
                <Text style={s.rentRateValue}>
                  {formData.monthlyPrice ? Number(formData.monthlyPrice).toLocaleString('en-US') : '—'}{' '}
                  <Text style={s.priceCurrencySm}>ر.ع</Text>
                </Text>
                <Text style={s.rentRateSub}>لكل شهر تشغيل</Text>
              </View>
            </View>

            {(formData.withOperator || formData.deliveryAvailable) && (
              <View style={s.rentTermsRow}>
                {formData.withOperator ? (
                  <View style={s.termBadge}>
                    <Ionicons name="person" size={12} color="#065F46" />
                    <Text style={s.termBadgeTxt}>مع مشغل / سائق</Text>
                  </View>
                ) : null}
                {formData.deliveryAvailable ? (
                  <View style={s.termBadge}>
                    <Ionicons name="car" size={12} color="#065F46" />
                    <Text style={s.termBadgeTxt}>توصيل لموقع العمل</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        )}

        {isWanted && (
          <View style={s.priceBoxWanted}>
            <Text style={s.priceBoxTitleWanted}>الميزانية والطلب</Text>
            <Text style={s.priceBigNumberWanted}>
              {formData.budgetMin ? `${formData.budgetMin} - ` : ''}
              {formData.budgetMax || '0'}{' '}
              <Text style={s.priceCurrencyWanted}>ر.ع</Text>
            </Text>
            <View style={s.wantedBadgesRow}>
              {formData.quantity ? (
                <View style={s.wantedBadge}>
                  <Text style={s.wantedBadgeTxt}>الكمية المطلوبة: {formData.quantity} معدة</Text>
                </View>
              ) : null}
              {formData.rentalDuration ? (
                <View style={s.wantedBadge}>
                  <Text style={s.wantedBadgeTxt}>المدة: {formData.rentalDuration}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ── 2. Location & Contact Rows ── */}
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

          {formData.contactPhone ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="call-outline" size={16} color={Colors.primary} />
                <Text style={s.label}>هاتف الاتصال</Text>
              </View>
              <Text style={s.phoneValue}>{formData.contactPhone}</Text>
            </View>
          ) : null}

          {formData.whatsapp ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={s.label}>رقم الواتساب</Text>
              </View>
              <Text style={s.whatsappValue}>{formData.whatsapp}</Text>
            </View>
          ) : null}
        </View>
      </View>
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

  /* ── Clean Card Structure ── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
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

  /* ── Key-Value Rows ── */
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
  phoneValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.primary,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  whatsappValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#16A34A',
    writingDirection: 'ltr',
    textAlign: 'left',
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

  /* ── Description Box ── */
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

  /* ── Thumbs Scroll ── */
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

  /* ── Specs Grid with Soft Cells ── */
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

  /* ── Dedicated Pricing Boxes (Card 4) ── */
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

  /* Rent Price Box Styles (Modern & Symmetric) */
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
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentPriceBoxTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    lineHeight: 17,
    color: '#166534',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rentRatesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rentRateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 2,
    alignItems: 'flex-start',
  },
  rentRateLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#64748B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rentRateValue: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: '#15803D',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceCurrencySm: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#166534',
  },
  rentRateSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 9.5,
    lineHeight: 13,
    color: '#059669',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rentTermsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  termBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  termBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#065F46',
  },

  /* Wanted Price Box Styles */
  priceBoxWanted: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.md,
    padding: 12,
    gap: 6,
  },
  priceBoxTitleWanted: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#92400E',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceBigNumberWanted: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#B45309',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceCurrencyWanted: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    color: '#92400E',
  },
  wantedBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  wantedBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wantedBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#78350F',
  },
})

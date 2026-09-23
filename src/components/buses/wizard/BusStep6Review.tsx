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
import { BusWizardData } from '../../../store/busWizardStore'
import {
  BUS_LISTING_TYPES,
  BUS_TYPES,
  BUS_CONDITIONS,
  BUS_TRANSMISSIONS,
  BUS_FUEL_TYPES,
  BUS_CONTRACT_TYPES,
  BUS_FEATURES,
} from '../../../constants/buses'

export interface BusStep6Props {
  data: BusWizardData
  onEditStep: (step: number) => void
}

export function BusStep6Review({ data, onEditStep }: BusStep6Props) {
  const isSale = data.busListingType === 'BUS_SALE'
  const isRent = data.busListingType === 'BUS_RENT'
  const isContract = data.busListingType === 'BUS_SALE_WITH_CONTRACT'

  const locationText =
    data.governorateNameAr && data.wilayaNameAr
      ? `${data.governorateNameAr} - ${data.wilayaNameAr}`
      : data.governorateNameAr || 'سلطنة عمان'

  const allImages = [
    ...(data.existingImages || []).map((img: any) =>
      typeof img === 'string' ? img : img.url || img.uri
    ),
    ...(data.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.uri || img.url
    ),
  ].filter(Boolean)

  const listingTypeLabel =
    BUS_LISTING_TYPES.find((t) => t.id === data.busListingType)?.label || data.busListingType || '—'
  const busTypeLabel =
    BUS_TYPES.find((t) => t.id === data.busType)?.label || data.busType || '—'
  const conditionLabel =
    BUS_CONDITIONS.find((c) => c.id === data.condition)?.label || data.condition || '—'
  const transmissionLabel =
    BUS_TRANSMISSIONS.find((t) => t.id === data.transmission)?.label || data.transmission || '—'
  const fuelTypeLabel =
    BUS_FUEL_TYPES.find((f) => f.id === data.fuelType)?.label || data.fuelType || '—'
  const contractTypeLabel =
    BUS_CONTRACT_TYPES.find((c) => c.id === data.contractType)?.label || data.contractType || '—'

  return (
    <View style={s.stepWrap}>
      {/* ── 1. Top Notice Banner ── */}
      <View style={s.noticeBox}>
        <Ionicons name="checkmark-circle" size={20} color="#059669" />
        <Text style={s.noticeTxt}>
          راجع تفاصيل الإعلان بعناية قبل الضغط على تأكيد ونشر الإعلان.
        </Text>
      </View>

      {/* ── 2. CARD 1: Photos Gallery (Step 2) ── */}
      <BlurView intensity={50} tint="light" blurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

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
            testID="edit-step-images"
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
          <Text style={s.emptyTxt}>لم يتم إرفاق صور</Text>
        )}
      </BlurView>

      {/* ── 3. CARD 2: Basic Info & Classification (Step 1) ── */}
      <BlurView intensity={50} tint="light" blurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>1</Text>
            </View>
            <Text style={s.cardTitle}>البيانات الأساسية والنوع</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(1)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="edit-step-basic"
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
                isSale ? s.badgeSale : isRent ? s.badgeRent : s.badgeContract,
              ]}
            >
              <Text
                style={[
                  s.badgeTxt,
                  isSale ? s.badgeTxtSale : isRent ? s.badgeTxtRent : s.badgeTxtContract,
                ]}
              >
                {listingTypeLabel}
              </Text>
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.label}>فئة الحافلة</Text>
            <View style={s.typeBadge}>
              <Text style={s.typeBadgeTxt}>{busTypeLabel}</Text>
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.label}>عنوان الإعلان</Text>
            <Text style={[s.value, s.valueBold]}>{data.title || '—'}</Text>
          </View>
        </View>

        {data.description ? (
          <View style={s.descBox}>
            <Text style={s.descLabel}>الوصف والنبذة:</Text>
            <Text style={s.descTxt}>{data.description}</Text>
          </View>
        ) : null}
      </BlurView>

      {/* ── 4. CARD 3: Specifications & Details (Step 3) ── */}
      <BlurView intensity={50} tint="light" blurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>3</Text>
            </View>
            <Text style={s.cardTitle}>مواصفات وتفاصيل الحافلة</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(3)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="edit-step-details"
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        <View style={s.grid}>
          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>الماركة / الشركة</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {data.make || '—'}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>الموديل / الطراز</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {data.model || '—'}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>سنة الصنع</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {data.year || '—'}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>سعة الركاب</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {data.capacity ? `${data.capacity} راكب` : '—'}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>المسافة المقطوعة</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {data.mileage ? `${Number(data.mileage).toLocaleString('en-US')} كم` : '—'}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>الحالة</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {conditionLabel}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>ناقل الحركة</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {transmissionLabel}
            </Text>
          </View>

          <View style={s.gridItemBox}>
            <Text style={s.gridLabel}>نوع الوقود</Text>
            <Text style={s.gridVal} numberOfLines={1}>
              {fuelTypeLabel}
            </Text>
          </View>

          {data.plateNumber ? (
            <View style={[s.gridItemBox, { width: '100%' }]}>
              <Text style={s.gridLabel}>رقم اللوحة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {data.plateNumber}
              </Text>
            </View>
          ) : null}
        </View>

        {/* مميزات الحافلة */}
        {data.features && data.features.length > 0 ? (
          <View style={s.subSection}>
            <Text style={s.subSectionTitle}>المميزات والتجهيزات:</Text>
            <View style={s.badgesWrap}>
              {data.features.map((featId) => {
                const feat = BUS_FEATURES.find((f) => f.id === featId)
                return (
                  <View key={featId} style={s.featureBadge}>
                    <Ionicons name="checkmark-circle-outline" size={13} color={Colors.primary} />
                    <Text style={s.featureBadgeTxt}>{feat?.label || featId}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        ) : null}
      </BlurView>

      {/* ── 5. CARD 4: Pricing & Financials (Step 4) ── */}
      <BlurView intensity={50} tint="light" blurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>4</Text>
            </View>
            <Text style={s.cardTitle}>بيانات التسعير والعقد</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(4)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="edit-step-pricing"
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* Branch 1: BUS_SALE */}
        {isSale && (
          <View style={s.priceBox} testID="sale-pricing-box">
            <View style={s.priceBoxTop}>
              <Text style={s.priceBoxTitle}>سعر البيع المطلوب</Text>
              {data.isPriceNegotiable ? (
                <View style={s.negoBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={s.negoBadgeTxt}>قابل للتفاوض</Text>
                </View>
              ) : null}
            </View>
            <Text style={s.priceBigNumber}>
              {data.price ? Number(data.price).toLocaleString('en-US') : '0'}{' '}
              <Text style={s.priceCurrency}>ر.ع</Text>
            </Text>
          </View>
        )}

        {/* Branch 2: BUS_RENT */}
        {isRent && (
          <View style={s.rentalBox} testID="rent-pricing-box">
            <View style={s.rowsList}>
              {data.dailyPrice ? (
                <View style={s.row}>
                  <Text style={s.label}>الإيجار اليومي</Text>
                  <Text style={[s.value, s.valueHighlight]}>
                    {Number(data.dailyPrice).toLocaleString('en-US')} ر.ع / يوم
                  </Text>
                </View>
              ) : null}

              {data.monthlyPrice ? (
                <View style={s.row}>
                  <Text style={s.label}>الإيجار الشهري</Text>
                  <Text style={[s.value, s.valueHighlight]}>
                    {Number(data.monthlyPrice).toLocaleString('en-US')} ر.ع / شهر
                  </Text>
                </View>
              ) : null}

              <View style={s.row}>
                <Text style={s.label}>خيار السائق</Text>
                <View style={[s.badge, data.withDriver ? s.badgeSale : s.badgeWanted]}>
                  <Text style={[s.badgeTxt, data.withDriver ? s.badgeTxtSale : s.badgeTxtWanted]}>
                    {data.withDriver ? 'مع سائق' : 'بدون سائق'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Branch 3: BUS_SALE_WITH_CONTRACT */}
        {isContract && (
          <View style={s.contractBox} testID="contract-pricing-box">
            <View style={s.priceBox}>
              <View style={s.priceBoxTop}>
                <Text style={s.priceBoxTitle}>سعر البيع المطلوب</Text>
              </View>
              <Text style={s.priceBigNumber}>
                {data.price ? Number(data.price).toLocaleString('en-US') : '0'}{' '}
                <Text style={s.priceCurrency}>ر.ع</Text>
              </Text>
            </View>

            <View style={s.subSectionBorder}>
              <Text style={s.subSectionTitle}>تفاصيل العقد التشغيلي المرفق:</Text>
              <View style={s.grid}>
                <View style={s.gridItemBox}>
                  <Text style={s.gridLabel}>نوع العقد</Text>
                  <Text style={s.gridVal} numberOfLines={1}>
                    {contractTypeLabel}
                  </Text>
                </View>

                <View style={s.gridItemBox}>
                  <Text style={s.gridLabel}>الجهة المتعاقد معها</Text>
                  <Text style={s.gridVal} numberOfLines={1}>
                    {data.contractClient || '—'}
                  </Text>
                </View>

                <View style={s.gridItemBox}>
                  <Text style={s.gridLabel}>الدخل الشهري</Text>
                  <Text style={[s.gridVal, { color: '#059669' }]} numberOfLines={1}>
                    {data.contractMonthly
                      ? `${Number(data.contractMonthly).toLocaleString('en-US')} ر.ع`
                      : '—'}
                  </Text>
                </View>

                <View style={s.gridItemBox}>
                  <Text style={s.gridLabel}>المدة المتبقية</Text>
                  <Text style={s.gridVal} numberOfLines={1}>
                    {data.contractDuration ? `${data.contractDuration} شهر` : '—'}
                  </Text>
                </View>

                {data.contractExpiry ? (
                  <View style={[s.gridItemBox, { width: '100%' }]}>
                    <Text style={s.gridLabel}>تاريخ انتهاء العقد</Text>
                    <Text style={s.gridVal} numberOfLines={1}>
                      {data.contractExpiry}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </BlurView>

      {/* ── 6. CARD 5: Location & Contact (Step 5) ── */}
      <BlurView intensity={50} tint="light" blurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>5</Text>
            </View>
            <Text style={s.cardTitle}>الموقع وبيانات التواصل</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(5)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="edit-step-location"
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        <View style={s.rowsList}>
          <View style={s.row}>
            <View style={s.rowIconLabel}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={s.label}>الموقع الجغرافي</Text>
            </View>
            <Text style={s.value}>{locationText}</Text>
          </View>

          {data.latitude != null && data.longitude != null ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="map-outline" size={16} color="#059669" />
                <Text style={s.label}>موقع الخريطة</Text>
              </View>
              <View style={s.gpsBadge}>
                <Ionicons name="location" size={12} color="#059669" />
                <Text style={s.gpsBadgeTxt}>
                  {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)} ✓
                </Text>
              </View>
            </View>
          ) : null}

          {data.contactPhone ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="call-outline" size={16} color="#64748B" />
                <Text style={s.label}>رقم الهاتف</Text>
              </View>
              <Text style={s.value}>{data.contactPhone}</Text>
            </View>
          ) : null}

          {data.whatsapp ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="logo-whatsapp" size={16} color="#059669" />
                <Text style={s.label}>رقم الواتساب</Text>
              </View>
              <Text style={s.value}>{data.whatsapp}</Text>
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
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  cardTint: {
    ...StyleSheet.absoluteFill,
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
    flexShrink: 1,
  },
  valueBold: {
    fontFamily: 'Almarai_800ExtraBold',
    color: '#0F172A',
    fontSize: 13,
  },
  valueHighlight: {
    color: '#059669',
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
    backgroundColor: '#FDF4FF',
  },
  badgeContract: {
    backgroundColor: '#FEF3C7',
  },
  badgeWanted: {
    backgroundColor: '#F1F5F9',
  },
  badgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
  },
  badgeTxtSale: {
    color: '#1D4ED8',
  },
  badgeTxtRent: {
    color: '#A21CAF',
  },
  badgeTxtContract: {
    color: '#B45309',
  },
  badgeTxtWanted: {
    color: '#475569',
  },
  typeBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  typeBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#15803D',
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
  subSection: {
    gap: 8,
    marginTop: 4,
  },
  subSectionBorder: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  subSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#475569',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  featureBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.primary,
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
  rentalBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contractBox: {
    gap: 10,
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
})

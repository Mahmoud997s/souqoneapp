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
import { PartStep6Props } from '../../../types/partForm.types'
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_ORIGINALITY_OPTIONS,
  QUANTITY_OPTIONS,
  WARRANTY_DURATION_OPTIONS,
} from '../../../constants/parts'

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAR: 'سيارات',
  BUS: 'باصات',
  EQUIPMENT: 'معدات',
}

export function PartStep6Review({ formData, onEditStep, brands = [] }: PartStep6Props) {
  const isSale = formData.listingType === 'SPARE_PART_SALE'
  const isWanted = formData.listingType === 'SPARE_PART_WANTED'

  const locationText =
    formData.governorateNameAr && formData.wilayaNameAr
      ? `${formData.governorateNameAr} - ${formData.wilayaNameAr}`
      : formData.governorateNameAr || 'سلطنة عمان'

  const allImages = [
    ...(formData.existingImages || []).map((img: any) =>
      typeof img === 'string' ? img : img.url || img.uri
    ),
    ...(formData.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.uri || img.url
    ),
  ].filter(Boolean)

  const categoryLabel =
    PART_CATEGORIES.find((c) => c.id === formData.partCategory)?.label || formData.partCategory || '—'
  const conditionLabel =
    PART_CONDITIONS.find((c) => c.id === formData.condition)?.label || formData.condition || '—'
  const originalityLabel =
    PART_ORIGINALITY_OPTIONS.find((o) => o.value === formData.isOriginal)?.label ||
    (formData.isOriginal ? 'أصلي وكالة' : 'تجاري / بديل')
  const quantityLabel =
    QUANTITY_OPTIONS.find((q) => q.id === formData.quantity)?.label || formData.quantity || '—'
  const warrantyLabel = formData.hasWarranty
    ? (WARRANTY_DURATION_OPTIONS.find((w) => w.id === formData.warrantyDuration)?.label || 'ساري الضمان')
    : 'بدون ضمان'

  const hasCompatibilityData =
    formData.compatibleVehicleTypes.length > 0 ||
    formData.compatibleMakes.length > 0 ||
    formData.compatibleModels.length > 0 ||
    formData.yearFrom !== null ||
    formData.yearTo !== null

  const isAllMakes = formData.compatibleMakes.includes('all')
  const makesDisplay = isAllMakes
    ? 'متوافق مع جميع الماركات'
    : formData.compatibleMakes
        .map((id) => {
          const brand = brands.find((b) => String(b.id) === String(id))
          return brand?.nameAr || brand?.name || id
        })
        .join('، ')

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
            onPress={() => onEditStep(2)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="edit-step-photos"
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
          <Text style={s.emptyTxt}>لم يتم إرفاق صور للقطعة (اختياري)</Text>
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
            <View style={[s.badge, isSale ? s.badgeSale : s.badgeWanted]}>
              <Text style={[s.badgeTxt, isSale ? s.badgeTxtSale : s.badgeTxtWanted]}>
                {isSale ? 'للبيع' : isWanted ? 'مطلوب' : formData.listingType || '—'}
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

      {/* ── CARD 3: Part Details & Specifications ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>3</Text>
            </View>
            <Text style={s.cardTitle}>مواصفات وتفاصيل القطعة</Text>
          </View>
        </View>

        {/* Section A: Core Classification */}
        <View style={s.subSection}>
          <View style={s.subSectionHeader}>
            <Text style={s.subSectionTitle}>التصنيف الأساسي</Text>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => onEditStep(1)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="edit-step-classification"
            >
              <Ionicons name="create-outline" size={13} color={Colors.primary} />
              <Text style={s.editBtnTxt}>تعديل</Text>
            </TouchableOpacity>
          </View>

          <View style={s.grid}>
            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>القسم / الفئة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>

            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الحالة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {conditionLabel}
              </Text>
            </View>

            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الأصالة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {originalityLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Section B: Additional Details */}
        <View style={[s.subSection, s.subSectionBorder]}>
          <View style={s.subSectionHeader}>
            <Text style={s.subSectionTitle}>تفاصيل إضافية</Text>
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
              <Text style={s.gridLabel}>رقم القطعة (OEM/Part No)</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {formData.partNumber || '—'}
              </Text>
            </View>

            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الكمية المتوفرة</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {quantityLabel}
              </Text>
            </View>

            <View style={s.gridItemBox}>
              <Text style={s.gridLabel}>الضمان</Text>
              <Text style={s.gridVal} numberOfLines={1}>
                {warrantyLabel}
              </Text>
            </View>
          </View>
        </View>
      </BlurView>

      {/* ── CARD 4: Compatibility (Conditional) ── */}
      {hasCompatibilityData && (
        <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card} testID="compatibility-card">
          <View style={s.cardWhiteWash} pointerEvents="none" />
          <View style={s.cardTint} pointerEvents="none" />

          <View style={s.cardHeader}>
            <View style={s.headerTitleWrap}>
              <View style={s.stepNumBadge}>
                <Text style={s.stepNumTxt}>4</Text>
              </View>
              <Text style={s.cardTitle}>توافق القطعة مع المركبات</Text>
            </View>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => onEditStep(4)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="edit-step-compatibility"
            >
              <Ionicons name="create-outline" size={13} color={Colors.primary} />
              <Text style={s.editBtnTxt}>تعديل</Text>
            </TouchableOpacity>
          </View>

          <View style={s.rowsList}>
            {/* Vehicle Types */}
            {formData.compatibleVehicleTypes.length > 0 && (
              <View style={s.row}>
                <Text style={s.label}>نوع المركبة</Text>
                <View style={s.badgesWrap}>
                  {formData.compatibleVehicleTypes.map((type) => (
                    <View key={type} style={s.compatBadge}>
                      <Text style={s.compatBadgeTxt}>{VEHICLE_TYPE_LABELS[type] || type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Compatible Makes */}
            {formData.compatibleMakes.length > 0 && (
              <View style={s.row}>
                <Text style={s.label}>الماركات المتوافقة</Text>
                <Text style={s.value}>{makesDisplay}</Text>
              </View>
            )}

            {/* Compatible Models */}
            {formData.compatibleModels.length > 0 && (
              <View style={s.row}>
                <Text style={s.label}>الموديلات المتوافقة</Text>
                <Text style={s.value}>{formData.compatibleModels.join('، ')}</Text>
              </View>
            )}

            {/* Years */}
            {(formData.yearFrom || formData.yearTo) && (
              <View style={s.row}>
                <Text style={s.label}>سنوات الصنع</Text>
                <Text style={s.value}>
                  {formData.yearFrom ? `من ${formData.yearFrom}` : ''}
                  {formData.yearFrom && formData.yearTo ? ' ' : ''}
                  {formData.yearTo ? `إلى ${formData.yearTo}` : ''}
                </Text>
              </View>
            )}
          </View>
        </BlurView>
      )}

      {/* ── CARD 5: Pricing & Location ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>5</Text>
            </View>
            <Text style={s.cardTitle}>السعر والموقع والتواصل</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(5)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="edit-step-pricing"
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        {/* Price Box */}
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
            {formData.price != null ? Number(formData.price).toLocaleString('en-US') : '0'}{' '}
            <Text style={s.priceCurrency}>ر.ع</Text>
          </Text>
        </View>

        {/* Location & Contact Rows */}
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
                <Ionicons name="call-outline" size={16} color="#64748B" />
                <Text style={s.label}>رقم الهاتف</Text>
              </View>
              <Text style={s.value}>{formData.contactPhone}</Text>
            </View>
          ) : null}

          {formData.whatsapp ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="logo-whatsapp" size={16} color="#059669" />
                <Text style={s.label}>رقم الواتساب</Text>
              </View>
              <Text style={s.value}>{formData.whatsapp}</Text>
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
    flexShrink: 1,
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
  badgeTxtWanted: {
    color: '#B45309',
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
  subSection: {
    gap: 8,
  },
  subSectionBorder: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: '#475569',
    textAlign: 'left',
    writingDirection: 'rtl',
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
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  compatBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  compatBadgeTxt: {
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

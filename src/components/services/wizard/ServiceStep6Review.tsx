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
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../../constants/services'
import { formatTimeDisplay } from './ServiceStep4Schedule'
import { ServiceStep6Props } from '../../../types/serviceForm.types'

export function ServiceStep6Review({ formData, onEditStep }: ServiceStep6Props) {
  const allImages = [
    ...(formData.existingImages || []).map((img: any) =>
      typeof img === 'string' ? img : img.url || img.uri
    ),
    ...(formData.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.uri || img.url
    ),
  ].filter(Boolean)

  const serviceTypeLabel =
    SERVICE_TYPES.find((t) => t.id === formData.serviceType)?.label ||
    formData.serviceType ||
    '—'

  const providerTypeLabel =
    PROVIDER_TYPES.find((p) => p.id === formData.providerType)?.label ||
    formData.providerType ||
    '—'

  const locationText =
    formData.governorateNameAr && formData.wilayaNameAr
      ? `${formData.governorateNameAr} - ${formData.wilayaNameAr}`
      : formData.governorateNameAr || 'غير محدد'

  const specializationsText =
    formData.specializations && formData.specializations.length > 0
      ? formData.specializations.join('، ')
      : 'غير محدد'

  const workingDaysText =
    formData.workingDays && formData.workingDays.length > 0
      ? formData.workingDays.join('، ')
      : 'غير محدد'

  const hasWorkingHours =
    formData.workingHoursOpen || formData.workingHoursClose
  const workingHoursText = hasWorkingHours
    ? `${formatTimeDisplay(formData.workingHoursOpen)} - ${formatTimeDisplay(formData.workingHoursClose)}`
    : 'غير محدد'

  const getPriceDisplay = () => {
    if (formData.priceFrom != null && formData.priceTo != null) {
      return `من ${formData.priceFrom} إلى ${formData.priceTo} ر.ع`
    }
    if (formData.priceFrom != null) {
      return `${formData.priceFrom} ر.ع`
    }
    return 'غير محدد'
  }

  return (
    <View style={s.stepWrap}>
      {/* ── Top Notice ── */}
      <View style={s.noticeBox}>
        <Ionicons name="checkmark-circle" size={20} color="#059669" />
        <Text style={s.noticeTxt}>
          راجع تفاصيل الخدمة بعناية قبل الضغط على تأكيد ونشر الإعلان.
        </Text>
      </View>

      {/* ── CARD 1: Photos & Attachments (Step 2) ── */}
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
          <Text style={s.emptyTxt}>لم يتم إرفاق صور</Text>
        )}
      </BlurView>

      {/* ── CARD 2: Basic Information (Step 1) ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>2</Text>
            </View>
            <Text style={s.cardTitle}>نوع الخدمة ومقدمها</Text>
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
            <Text style={s.label}>نوع الخدمة</Text>
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{serviceTypeLabel}</Text>
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.label}>صفة مقدم الخدمة</Text>
            <Text style={s.value}>{providerTypeLabel}</Text>
          </View>

          <View style={s.row}>
            <Text style={s.label}>اسم الورشة / مقدم الخدمة</Text>
            <Text style={[s.value, s.valueBold]}>{formData.providerName || '—'}</Text>
          </View>
        </View>
      </BlurView>

      {/* ── CARD 3: Service Details (Step 3) ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>3</Text>
            </View>
            <Text style={s.cardTitle}>تفاصيل الخدمة</Text>
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

        <View style={s.rowsList}>
          <View style={s.row}>
            <Text style={s.label}>عنوان الإعلان</Text>
            <Text style={[s.value, s.valueBold]}>{formData.title || '—'}</Text>
          </View>

          <View style={s.row}>
            <Text style={s.label}>التخصصات</Text>
            <Text style={s.value}>{specializationsText}</Text>
          </View>

          {formData.isHomeService ? (
            <View style={s.row} testID="home-service-review-badge">
              <Text style={s.label}>طبيعة الخدمة</Text>
              <View style={s.homeServiceBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={s.homeServiceBadgeTxt}>خدمة متنقلة / في موقع العميل</Text>
              </View>
            </View>
          ) : null}
        </View>

        {formData.description ? (
          <View style={s.descBox}>
            <Text style={s.descLabel}>الوصف والنبذة:</Text>
            <Text style={s.descTxt}>{formData.description}</Text>
          </View>
        ) : null}
      </BlurView>

      {/* ── CARD 4: Working Schedule (Step 4) ── */}
      <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={s.card}>
        <View style={s.cardWhiteWash} pointerEvents="none" />
        <View style={s.cardTint} pointerEvents="none" />

        <View style={s.cardHeader}>
          <View style={s.headerTitleWrap}>
            <View style={s.stepNumBadge}>
              <Text style={s.stepNumTxt}>4</Text>
            </View>
            <Text style={s.cardTitle}>أوقات وجدول العمل</Text>
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditStep(4)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="edit-step-schedule"
          >
            <Ionicons name="create-outline" size={13} color={Colors.primary} />
            <Text style={s.editBtnTxt}>تعديل</Text>
          </TouchableOpacity>
        </View>

        <View style={s.rowsList}>
          <View style={s.row}>
            <Text style={s.label}>أيام العمل</Text>
            <Text style={s.value}>{workingDaysText}</Text>
          </View>

          <View style={s.row}>
            <Text style={s.label}>ساعات العمل</Text>
            <Text style={s.value}>{workingHoursText}</Text>
          </View>
        </View>
      </BlurView>

      {/* ── CARD 5: Pricing, Location & Contact (Step 5) ── */}
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
          <Text style={s.priceBoxTitle}>سعر الخدمة</Text>
          <Text style={s.priceBigNumber} testID="price-display-txt">
            {getPriceDisplay()}
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

          {formData.address ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="navigate-outline" size={16} color="#64748B" />
                <Text style={s.label}>العنوان</Text>
              </View>
              <Text style={s.value}>{formData.address}</Text>
            </View>
          ) : null}

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

          {formData.website ? (
            <View style={s.row}>
              <View style={s.rowIconLabel}>
                <Ionicons name="globe-outline" size={16} color="#64748B" />
                <Text style={s.label}>الموقع الإلكتروني</Text>
              </View>
              <Text style={s.value}>{formData.website}</Text>
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
    backgroundColor: '#EFF6FF',
  },
  badgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#1D4ED8',
  },
  homeServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  homeServiceBadgeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#047857',
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
  priceBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: 12,
    gap: 6,
  },
  priceBoxTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#166534',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  priceBigNumber: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#15803D',
    textAlign: 'left',
    writingDirection: 'rtl',
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

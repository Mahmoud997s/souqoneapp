import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useService } from '../../src/hooks/useServices'
import { Colors } from '../../src/constants/colors'
import { chatApi } from '../../src/api/chat'
import { useAuthStore } from '../../src/store/authStore'
import { useServiceWizardStore } from '../../src/store/serviceWizardStore'
import { servicesApi } from '../../src/api/services'
import { dialogService } from '../../src/store/dialogStore'
import { formatLocation } from '../../src/utils/mappers'
import { SERVICE_TYPES, PROVIDER_TYPES } from '../../src/constants/services'

const { width: SW } = Dimensions.get('window')

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { data: item, isLoading, isError } = useService(id)
  const [imgIdx, setImgIdx] = useState(0)

  if (isLoading) {
    return <View style={[s.root, s.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  if (isError || !item) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر تحميل الخدمة</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>رجوع</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const raw = item as any
  const images: string[] = (raw.images ?? []).map((img: any) => img.url ?? img)
  const priceFrom = raw.priceFrom != null ? parseFloat(raw.priceFrom) : (raw.price != null ? parseFloat(raw.price) : 0)
  const priceTo = raw.priceTo != null ? parseFloat(raw.priceTo) : null
  const seller = raw.seller ?? raw.user
  const isOwner = !!user?.id && !!seller?.id && user.id === seller.id

  const serviceTypeLabel = SERVICE_TYPES.find((t) => t.id === raw.serviceType)?.label ?? raw.serviceType
  const providerTypeLabel = PROVIDER_TYPES.find((p) => p.id === raw.providerType)?.label ?? raw.providerType

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    try {
      const sellerId = seller?.id
      const res = await chatApi.createRoom({
        entityType: 'SERVICE',
        entityId: id as string,
        receiverId: sellerId,
      })
      const conversationId = res.data?.id
      router.push(`/chat/${conversationId}` as any)
    } catch (e) {
      dialogService.alert('خطأ', 'تعذر فتح المحادثة')
    }
  }

  const handleEditService = () => {
    useServiceWizardStore.getState().setEditMode(raw.id, {
      title: raw.title ?? '',
      description: raw.description ?? '',
      serviceType: raw.serviceType ?? null,
      providerType: raw.providerType ?? null,
      providerName: raw.providerName ?? '',
      specializations: raw.specializations ?? [],
      isHomeService: Boolean(raw.isHomeService),
      workingHoursOpen: raw.workingHoursOpen ?? null,
      workingHoursClose: raw.workingHoursClose ?? null,
      workingDays: raw.workingDays ?? [],
      priceFrom: raw.priceFrom != null ? Number(raw.priceFrom) : (raw.price != null ? Number(raw.price) : null),
      priceTo: raw.priceTo != null ? Number(raw.priceTo) : null,
      currency: raw.currency ?? 'OMR',
      contactPhone: raw.contactPhone ?? '',
      whatsapp: raw.whatsapp ?? '',
      website: raw.website ?? '',
      governorateId: raw.governorateId ? Number(raw.governorateId) : null,
      wilayaId: raw.wilayaId ? Number(raw.wilayaId) : null,
      governorateNameAr: raw.governorateRef?.nameAr ?? raw.governorate ?? '',
      wilayaNameAr: raw.wilayaRef?.nameAr ?? raw.city ?? '',
      address: raw.address ?? '',
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      existingImages: (raw.images ?? []).map((img: any) => ({
        id: typeof img === 'string' ? img : (img.id || img.url),
        url: typeof img === 'string' ? img : (img.url || img.uri),
      })),
    })
    router.push('/services/new' as any)
  }

  const handleDeleteService = async () => {
    dialogService.confirm(
      'حذف الإعلان',
      'هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.',
      async () => {
        try {
          await servicesApi.remove(raw.id)
          dialogService.alert('تم', 'تم حذف إعلان الخدمة بنجاح', 'success')
          router.back()
        } catch (e: any) {
          dialogService.alert('خطأ', e?.message || 'فشل حذف الإعلان', 'error')
        }
      },
      'نعم، احذف',
      'تراجع',
      true
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <TouchableOpacity style={[s.backBtn, { top: insets.top + 8 }]} onPress={() => router.back()}>
        <Ionicons name="arrow-forward" size={22} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false}>
        <View style={s.imgBox}>
          {images.length > 0 ? (
            <>
              <Image source={{ uri: images[imgIdx] }} style={s.mainImg} contentFit="cover" />
              {images.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbRow} contentContainerStyle={{ gap: 6, padding: 6 }}>
                  {images.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => setImgIdx(i)}>
                      <Image source={{ uri }} style={[s.thumb, imgIdx === i && s.thumbActive]} contentFit="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={s.imgFallback}>
              <Ionicons name="build-outline" size={64} color="rgba(75,85,99,0.2)" />
              <Text style={s.imgFallbackTxt}>لا توجد صور</Text>
            </View>
          )}
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeTxt}>خدمة سيارات</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.title}>{raw.title ?? raw.serviceName}</Text>

          <View style={s.priceRow}>
            <View>
              {priceTo != null && priceTo > 0 ? (
                <Text style={s.priceLabel}>نطاق السعر التقريبي</Text>
              ) : priceFrom > 0 ? (
                <Text style={s.priceLabel}>السعر يبدأ من</Text>
              ) : null}
              <Text style={s.price}>
                {priceTo != null && priceTo > 0
                  ? `${priceFrom.toLocaleString('en-US')} - ${priceTo.toLocaleString('en-US')} ر.ع.`
                  : priceFrom > 0
                  ? `${priceFrom.toLocaleString('en-US')} ر.ع.`
                  : 'تواصل لمعرفة السعر'}
              </Text>
            </View>
            {formatLocation(raw) && (
              <View style={s.locationPill}>
                <Ionicons name="location-outline" size={14} color={Colors.primary} />
                <Text style={s.locationTxt}>{formatLocation(raw)}</Text>
              </View>
            )}
          </View>

          <View style={s.tagsRow}>
            {serviceTypeLabel && (
              <View style={s.tag}>
                <Ionicons name="build-outline" size={14} color={Colors.primary} />
                <Text style={s.tagTxt}>{serviceTypeLabel}</Text>
              </View>
            )}
            {providerTypeLabel && (
              <View style={s.tag}>
                <Ionicons name="business-outline" size={14} color={Colors.primary} />
                <Text style={s.tagTxt}>{providerTypeLabel}</Text>
              </View>
            )}
            {raw.isHomeService && (
              <View style={[s.tag, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="home-outline" size={14} color="#059669" />
                <Text style={[s.tagTxt, { color: '#059669' }]}>خدمة منزلية / متنقلة</Text>
              </View>
            )}
          </View>

          {raw.providerName && (
            <View style={s.providerBox}>
              <Ionicons name="ribbon-outline" size={16} color={Colors.primary} />
              <Text style={s.providerLabel}>مقدم الخدمة:</Text>
              <Text style={s.providerVal}>{raw.providerName}</Text>
            </View>
          )}

          <View style={s.divider} />

          {raw.description && (
            <>
              <Text style={s.sectionTitle}>الوصف وتفاصيل الخدمة</Text>
              <Text style={s.desc}>{raw.description}</Text>
              <View style={s.divider} />
            </>
          )}

          {raw.specializations && raw.specializations.length > 0 && (
            <>
              <Text style={s.sectionTitle}>التخصصات والخدمات المقدمة</Text>
              <View style={s.featuresWrap}>
                {raw.specializations.map((spec: string, i: number) => (
                  <View key={i} style={s.featureChip}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={s.featureTxt}>{spec}</Text>
                  </View>
                ))}
              </View>
              <View style={s.divider} />
            </>
          )}

          {(raw.workingDays?.length > 0 || raw.workingHoursOpen || raw.workingHoursClose) && (
            <>
              <Text style={s.sectionTitle}>أوقات وجدول العمل</Text>
              <View style={s.scheduleCard}>
                {raw.workingDays?.length > 0 && (
                  <View style={s.scheduleRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                    <Text style={s.scheduleLabel}>أيام العمل:</Text>
                    <Text style={s.scheduleVal}>{raw.workingDays.join('، ')}</Text>
                  </View>
                )}
                {(raw.workingHoursOpen || raw.workingHoursClose) && (
                  <View style={s.scheduleRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                    <Text style={s.scheduleLabel}>ساعات العمل:</Text>
                    <Text style={s.scheduleVal}>
                      {raw.workingHoursOpen ? `من ${raw.workingHoursOpen}` : ''}
                      {raw.workingHoursClose ? ` إلى ${raw.workingHoursClose}` : ''}
                    </Text>
                  </View>
                )}
              </View>
              <View style={s.divider} />
            </>
          )}

          {seller && (
            <>
              <Text style={s.sectionTitle}>معلومات المعلن</Text>
              <View style={s.sellerCard}>
                <View style={s.sellerInfo}>
                  {seller.avatarUrl ? (
                    <Image source={{ uri: seller.avatarUrl }} style={s.avatar} contentFit="cover" />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Ionicons name="person" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={s.sellerTexts}>
                    <View style={s.sellerNameRow}>
                      <Text style={s.sellerName}>{seller.displayName ?? seller.username}</Text>
                      {seller.isVerified && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                    </View>
                    {seller.governorate && <Text style={s.sellerGov}>{seller.governorate}</Text>}
                  </View>
                </View>
                <TouchableOpacity style={s.sellerProfileBtn} onPress={() => router.push(`/profile/${seller.id}` as any)}>
                  <Text style={s.sellerProfileTxt}>الملف الشخصي</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[s.contactBar, { paddingBottom: insets.bottom + 12 }]}>
        {isOwner ? (
          <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
            <TouchableOpacity
              style={[s.callBtn, { flex: 1, backgroundColor: '#fee2e2', borderColor: '#f87171' }]}
              onPress={handleDeleteService}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[s.callTxt, { color: Colors.error }]}>حذف</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.callBtn, { flex: 1 }]}
              onPress={handleEditService}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={s.callTxt}>تعديل</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {seller?.phone && (
              <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${seller.phone}`)}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
                <Text style={s.callTxt}>اتصال</Text>
              </TouchableOpacity>
            )}
            {seller?.phone && (
              <TouchableOpacity style={s.waBtn} onPress={() => Linking.openURL(`whatsapp://send?phone=${seller.phone.replace('+', '')}`)}>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={s.waTxt}>واتساب</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.bookBtn} onPress={handleChat}>
              <Ionicons name="calendar-outline" size={20} color="#fff" />
              <Text style={s.bookTxt}>حجز</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold', color: Colors.error, marginTop: 12, fontSize: 16 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryTxt: { fontFamily: 'Almarai_700Bold', color: '#fff' },
  backBtn: {
    position: 'absolute', start: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  imgBox: { width: SW, backgroundColor: '#E8EBF0' },
  mainImg: { width: SW, height: SW * 0.65 },
  thumbRow: { position: 'absolute', bottom: 0, start: 0, end: 0 },
  thumb: { width: 60, height: 48, borderRadius: 6, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: Colors.primary },
  imgFallback: { width: SW, height: SW * 0.55, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imgFallbackTxt: { fontFamily: 'Almarai_400Regular', color: Colors.textMuted, fontSize: 13 },
  typeBadge: {
    position: 'absolute', end: 12, top: 12,
    backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  typeBadgeTxt: { fontFamily: 'Almarai_700Bold', color: '#fff', fontSize: 12 },
  body: { backgroundColor: '#fff', borderTopStartRadius: 20, borderTopEndRadius: 20, marginTop: -16, padding: 20, gap: 14 },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: 20, color: Colors.text, textAlign: 'right', lineHeight: 30 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontFamily: 'Almarai_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  price: { fontFamily: 'Almarai_800ExtraBold', fontSize: 24, color: Colors.primary, textAlign: 'right' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  locationTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.primary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.primary },
  providerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  providerLabel: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: Colors.textMuted },
  providerVal: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: Colors.text, textAlign: 'right' },
  desc: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text2, textAlign: 'right', lineHeight: 24 },
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  featureTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.success },
  scheduleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
  },
  scheduleVal: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.text2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  sellerCard: {
    backgroundColor: '#f7f9fc', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sellerTexts: { gap: 3 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerName: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text },
  sellerGov: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: Colors.textMuted },
  sellerProfileBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  sellerProfileTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.primary },
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  callTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary },
  waBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, backgroundColor: '#16a34a' },
  waTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#fff' },
  bookBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, backgroundColor: Colors.primary },
  bookTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#fff' },
})

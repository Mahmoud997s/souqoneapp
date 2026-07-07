import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Dimensions, Platform, Modal,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useEquipmentItem } from '../../src/hooks/useEquipment'
import { Colors } from '../../src/constants/colors'
import { chatApi } from '../../src/api/chat'
import { useAuthStore } from '../../src/store/authStore'
import { formatLocation, translateEnum } from '../../src/utils/mappers'
import { Alert } from 'react-native'
import { EQUIPMENT_CONDITIONS, EQUIPMENT_LISTING_TYPES } from '../../src/utils/equipment-mappers'

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

const { width: SW } = Dimensions.get('window')

const COND_COLORS: Record<string, { bg: string; text: string }> = {
  NEW:      { bg: '#d1fae5', text: '#065f46' },
  LIKE_NEW: { bg: '#d1fae5', text: '#065f46' },
  USED:     { bg: '#f1f5f9', text: '#475569' },
  GOOD:     { bg: '#e0f2fe', text: '#0369a1' },
  FAIR:     { bg: '#fef3c7', text: '#b45309' },
  POOR:     { bg: '#fee2e2', text: '#b91c1c' },
  REFURBISHED: { bg: '#e0f2fe', text: '#0369a1' },
}

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { data: item, isLoading, isError } = useEquipmentItem(id)
  const [imgIdx, setImgIdx] = useState(0)
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)

  if (isLoading) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (isError || !item) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر تحميل المعدة</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const raw = item as any
  const images: string[] = (raw.images ?? []).map((img: any) => img.url ?? img)
  const price = parseFloat(raw.price) || 0
  const seller = raw.seller ?? raw.user ?? raw.operator
  const condColor = COND_COLORS[raw.condition?.toUpperCase()] ?? COND_COLORS.USED
  const isRental = raw.listingType === 'EQUIPMENT_RENT'
  const isOwner = user?.id && seller?.id && user.id === seller.id

  let priceLabel = ''
  let priceSub = ''
  
  if (isRental && (raw.dailyPrice || raw.monthlyPrice)) {
    if (raw.dailyPrice) {
      priceLabel = Number(raw.dailyPrice).toLocaleString('en-US')
      priceSub = '/ يوم'
    } else {
      priceLabel = Number(raw.monthlyPrice).toLocaleString('en-US')
      priceSub = '/ شهر'
    }
  } else if (price > 0) {
    priceLabel = price.toLocaleString('en-US')
  }

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    if (user.id === seller?.id) {
      Alert.alert('تنبيه', 'لا يمكنك محادثة نفسك')
      return
    }
    try {
      const res = await chatApi.createRoom({
        entityType: 'EQUIPMENT_LISTING',
        entityId: id as string,
        receiverId: seller?.id,
      })
      const conversationId = res.data?.id
      if (conversationId) {
        const initialText = encodeURIComponent(`مرحباً، بخصوص إعلان المعدة: ${raw.title}`)
        router.push(`/chat/${conversationId}?initialText=${initialText}` as any)
      } else {
        Alert.alert('خطأ', 'لم يتم إرجاع المحادثة من الخادم')
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message
      const parsedMsg = Array.isArray(errorMsg) ? errorMsg.join('\n') : (typeof errorMsg === 'string' ? errorMsg : 'تعذر فتح المحادثة')
      Alert.alert('خطأ', parsedMsg)
    }
  }

  const y = raw.year
  const h = raw.hoursUsed
  const governorate = raw.governorate
  const city = raw.city

  const specs = [
    y && { icon: 'calendar-outline',    label: 'سنة الصنع',     value: String(y) },
    h && { icon: 'time-outline', label: 'ساعات العمل',     value: `${Number(h).toLocaleString('ar')} ساعة` },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  const vehicleDetailsTable = [
    raw.make && { label: 'العلامة التجارية', value: raw.make },
    raw.condition && { label: 'الحالة', value: EQUIPMENT_CONDITIONS[raw.condition as keyof typeof EQUIPMENT_CONDITIONS]?.label || raw.condition },
    raw.year && { label: 'سنة الصنع', value: raw.year },
    raw.hoursUsed != null && { label: 'ساعات العمل', value: `${Number(raw.hoursUsed).toLocaleString('en-US')} ساعة` },
    raw.equipmentType && { label: 'نوع المعدة', value: raw.equipmentType },
  ].filter(Boolean) as { label: string; value: string }[]

  const serviceDetailsTable = [
    isRental && raw.dailyPrice != null && { label: 'الإيجار اليومي', value: `${Number(raw.dailyPrice).toLocaleString('en-US')} ر.ع` },
    isRental && raw.monthlyPrice != null && { label: 'الإيجار الشهري', value: `${Number(raw.monthlyPrice).toLocaleString('en-US')} ر.ع` },
    isRental && raw.withOperator != null && { label: 'مشغل', value: raw.withOperator ? 'بمشغل' : 'بدون مشغل' },
    isRental && raw.deliveryAvailable != null && { label: 'توصيل المعدة', value: raw.deliveryAvailable ? 'متاح' : 'غير متاح' },
  ].filter(Boolean) as { label: string; value: string }[]

  const featuresList = [...(raw.features || [])]

  return (
    <View style={s.root}>
      {/* ── BACK BUTTON ── */}
      <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()} activeOpacity={0.8}>
        <Ionicons name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── IMAGES ── */}
        <View style={s.imgBox}>
          {images.length > 0 ? (
            <View>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(Math.abs(e.nativeEvent.contentOffset.x) / SW)
                  setImgIdx(newIdx)
                }}
              >
                {images.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={s.mainImg} contentFit="cover" transition={200} />
                ))}
              </ScrollView>
              
              {/* Gradient Overlay top for back button contrast */}
              <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent']} style={s.imgGradientTop} />
              
              {/* Counter Pill */}
              {images.length > 1 && (
                <View style={s.imgCounter}>
                  <Ionicons name="images-outline" size={12} color="#fff" style={{ marginEnd: 4 }} />
                  <Text style={s.imgCounterTxt}>{imgIdx + 1} / {images.length}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={s.imgFallback}>
              <Ionicons name="hardware-chip-outline" size={64} color="rgba(75,85,99,0.2)" />
              <Text style={s.imgFallbackTxt}>لا توجد صور</Text>
            </View>
          )}

        </View>

        {/* ── BODY ── */}
        <View style={s.body}>
          
          {/* Header Area */}
          <View style={s.headerArea}>
            {/* Title */}
            <Text style={s.title}>{raw.title}</Text>

            {/* Meta Row: Badge + Location */}
            <View style={s.metaRow}>
              {raw.listingType && (
                <View style={s.typeBadgeInline}>
                  <Text style={s.typeBadgeTxtInline}>{EQUIPMENT_LISTING_TYPES[raw.listingType as keyof typeof EQUIPMENT_LISTING_TYPES]?.label ?? raw.listingType}</Text>
                </View>
              )}

              {isRental && raw.withOperator && (
                <View style={[s.typeBadgeInline, { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Ionicons name="person" size={12} color="#ffffff" />
                  <Text style={s.typeBadgeTxtInline}>مع مشغل</Text>
                </View>
              )}

              {raw.condition && (
                <View style={[s.condBadge, { backgroundColor: condColor.bg }]}>
                  <Text style={[s.condTxt, { color: condColor.text }]}>
                    {EQUIPMENT_CONDITIONS[raw.condition?.toUpperCase() as keyof typeof EQUIPMENT_CONDITIONS]?.label ?? raw.condition}
                  </Text>
                </View>
              )}

              <View style={s.locationWrap}>
                <Ionicons name="location-outline" size={14} color="#475569" />
                <Text style={s.locationTxtMeta}>{formatLocation(raw)}</Text>
              </View>
            </View>
          </View>

          {/* Price Card */}
          <View style={s.priceCard}>
            <View style={s.priceRight}>
              <View style={s.iconBgWrap}>
                 <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
              </View>
              <View style={s.priceLabelWrap}>
                <Text style={s.priceLabelTxt}>السعر</Text>
                {raw.isPriceNegotiable && (
                  <Text style={s.negotiable}>قابل للتفاوض</Text>
                )}
              </View>
            </View>
            <View style={s.priceLeft}>
              {priceLabel ? (
                <Text style={s.price}>
                  {priceLabel} <Text style={s.currency}>{raw.currency === 'USD' ? '$' : 'ر.ع'}</Text>
                  {priceSub ? <Text style={s.priceSub}> {priceSub}</Text> : null}
                </Text>
              ) : (
                <Text style={s.price}>تواصل لمعرفة السعر</Text>
              )}
            </View>
          </View>

          {/* ── SELLER ── */}
          {seller && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>معلومات البائع</Text>
              <TouchableOpacity
                style={s.sellerCard}
                onPress={() => router.push(`/profile/${seller.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={s.sellerInfo}>
                  {seller.avatarUrl ? (
                    <Image source={{ uri: seller.avatarUrl }} style={s.avatar} />
                  ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                      <Ionicons name="person" size={24} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={s.sellerTexts}>
                    <View style={s.sellerNameRow}>
                      <Text style={s.sellerName}>{seller.displayName || seller.username || seller.name || 'بائع'}</Text>
                      {seller.isVerified && <Ionicons name="checkmark-circle" size={16} color="#1877F2" />}
                    </View>
                    <Text style={s.sellerGov}>عضو منذ {new Date(seller.createdAt || new Date()).getFullYear()}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── DESCRIPTION ── */}
          {raw.description && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>الوصف</Text>
              <View style={s.descContainer}>
                <Text 
                  style={s.desc} 
                  numberOfLines={isDescExpanded ? undefined : 5}
                >
                  {raw.description}
                </Text>
                {(raw.description.length > 200 || raw.description.split('\n').length > 5) && (
                  <TouchableOpacity 
                    style={s.showMoreBtn} 
                    onPress={() => setIsDescExpanded(!isDescExpanded)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.showMoreTxt}>{isDescExpanded ? 'عرض أقل' : 'قراءة المزيد'}</Text>
                    <Ionicons name={isDescExpanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── SPECS HIGHLIGHTS ── */}
          {specs.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>أبرز المواصفات</Text>
              <View style={s.specsGrid}>
                {specs.map((sItem, i) => (
                  <View key={i} style={s.specItem}>
                    <View style={s.specIconWrap}>
                      <Ionicons name={sItem.icon as any} size={18} color={Colors.primary} />
                    </View>
                    <Text style={s.specVal} numberOfLines={1}>{sItem.value}</Text>
                    <Text style={s.specLbl} numberOfLines={1}>{sItem.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── VEHICLE DETAILS TABLE ── */}
          {vehicleDetailsTable.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>التفاصيل التقنية</Text>
              <View style={s.detailsTable}>
                {(isDetailsExpanded ? vehicleDetailsTable : vehicleDetailsTable.slice(0, 4)).map((row, i, arr) => (
                  <View key={i} style={[
                    s.detailsRow, 
                    i % 2 !== 0 && s.detailsRowAlt, 
                    (i === arr.length - 1 && vehicleDetailsTable.length <= 4) && s.detailsRowLast
                  ]}>
                    <Text style={s.detailsRowLbl}>{row.label}</Text>
                    <Text style={s.detailsRowVal}>{row.value}</Text>
                  </View>
                ))}
                {vehicleDetailsTable.length > 4 && (
                  <TouchableOpacity 
                    style={[s.showMoreBtn, { borderTopWidth: 0, marginTop: 0, paddingBottom: 12 }]} 
                    onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.showMoreTxt}>{isDetailsExpanded ? 'عرض أقل' : `عرض الكل (${vehicleDetailsTable.length})`}</Text>
                    <Ionicons name={isDetailsExpanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── SERVICE DETAILS TABLE ── */}
          {serviceDetailsTable.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{isRental ? 'تفاصيل الإيجار' : 'تفاصيل الخدمة'}</Text>
              <View style={s.detailsTable}>
                {serviceDetailsTable.map((row, i, arr) => (
                  <View key={i} style={[
                    s.detailsRow, 
                    i % 2 !== 0 && s.detailsRowAlt, 
                    i === arr.length - 1 && s.detailsRowLast
                  ]}>
                    <Text style={s.detailsRowLbl}>{row.label}</Text>
                    <Text style={s.detailsRowVal}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── LOCATION & MAP ── */}
          {(governorate || city || raw.locationNote || (raw.latitude && raw.longitude)) ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>الموقع والعنوان</Text>

              {/* Text Location */}
              {(governorate || city || raw.locationNote) ? (
                <View style={[s.descContainer, { marginBottom: (raw.latitude && raw.longitude) ? 16 : 0 }]}>
                  {formatLocation(raw) ? <Text style={s.desc}>{formatLocation(raw)}</Text> : null}
                  {raw.locationNote && <Text style={[s.desc, { marginTop: 8, color: '#64748b' }]}>{raw.locationNote}</Text>}
                </View>
              ) : null}

              {/* Map Location */}
              {(raw.latitude && raw.longitude) ? (
                <>
                  {Platform.OS === 'web' ? (
                    <View style={[s.mapContainer, s.center]}>
                      <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                      <Text style={{ fontFamily: 'Almarai_400Regular', color: '#6B7280', marginTop: 8 }}>الخريطة غير مدعومة في المتصفح</Text>
                    </View>
                  ) : (
                    <View style={s.mapContainer}>
                      {MapView && (
                        <MapView
                          style={{ width: '100%', height: '100%' }}
                          initialRegion={{
                            latitude: Number(raw.latitude),
                            longitude: Number(raw.longitude),
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                          }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                        >
                          <Marker coordinate={{ latitude: Number(raw.latitude), longitude: Number(raw.longitude) }} />
                        </MapView>
                      )}
                      {/* Overlay to prevent accidental touches capturing scroll */}
                      <View style={StyleSheet.absoluteFillObject} />
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={s.directionsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${raw.latitude},${raw.longitude}`)
                    }}
                  >
                    <Ionicons name="navigate-circle-outline" size={24} color={Colors.primary} />
                    <Text style={s.directionsTxt}>الحصول على الاتجاهات</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* ── FIXED CONTACT BAR ── */}
      <View style={[s.contactBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isOwner ? (
          <TouchableOpacity
            style={[s.callWideBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.push(`/post/edit/${raw.id}?type=equipment` as any)}
            activeOpacity={0.9}
          >
            <Ionicons name="create-outline" size={22} color={Colors.white} />
            <Text style={[s.callWideTxt, { color: Colors.white }]}>تعديل الإعلان</Text>
          </TouchableOpacity>
        ) : (
          <>
            {seller && (
              <TouchableOpacity
                style={{ position: 'relative' }}
                onPress={() => router.push(`/profile/${seller.id}` as any)}
                activeOpacity={0.9}
              >
                <View style={[s.iconBtn, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }]}>
                  {seller.avatarUrl ? (
                    <Image source={{ uri: seller.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <Ionicons name="person" size={22} color={Colors.textMuted} />
                  )}
                </View>
                {seller.isVerified && (
                  <View style={s.verifiedBadgeContact}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.chatIconBtn}
              onPress={handleChat}
              activeOpacity={0.9}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
            {seller?.phone && (
              <TouchableOpacity
                style={s.waBtn}
                onPress={() => {
                  const msg = encodeURIComponent(`مرحباً، بخصوص إعلان المعدة: ${raw.title}`)
                  Linking.openURL(`whatsapp://send?phone=${seller.phone.replace('+', '')}&text=${msg}`)
                }}
                activeOpacity={0.9}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            {seller?.phone ? (
              <TouchableOpacity
                style={s.callWideBtn}
                onPress={() => Linking.openURL(`tel:${seller.phone}`)}
                activeOpacity={0.9}
              >
                <Ionicons name="call" size={22} color={Colors.primary} />
                <Text style={s.callWideTxt}>اتصال</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={s.callWideBtn}
                onPress={handleChat}
                activeOpacity={0.9}
              >
                <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
                <Text style={s.callWideTxt}>محادثة</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.error, marginTop: 16, fontSize: 18 },
  retryBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 100 },
  retryTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: '#fff', fontSize: 15 },

  backBtn: {
    position: 'absolute', start: 16, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },

  // Images
  imgBox: { width: SW, backgroundColor: '#E8EBF0', position: 'relative' },
  mainImg: { width: SW, height: SW * 0.7 },
  imgGradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  
  imgCounter: {
    position: 'absolute', end: 16, bottom: 44,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  imgCounterTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, color: '#fff', fontSize: 13, paddingTop: 2 },
  
  imgFallback: { width: SW, height: SW * 0.7, alignItems: 'center', justifyContent: 'center', gap: 12 },
  imgFallbackTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.textMuted, fontSize: 15 },

  // Body
  body: { 
    backgroundColor: '#f8fafc', 
    borderTopStartRadius: 32, borderTopEndRadius: 32, 
    marginTop: -28, 
    paddingTop: 28, paddingHorizontal: 20, 
    gap: 24 
  },

  headerArea: { gap: 12 },
  title: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 24, color: '#0f172a', writingDirection: 'rtl', lineHeight: 34 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  typeBadgeInline: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeBadgeTxtInline: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: '#ffffff' },
  condBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  condTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13 },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  locationTxtMeta: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: '#475569' },

  // Price Card
  priceCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceLeft: { alignItems: 'flex-start' },
  priceLabelWrap: { alignItems: 'flex-start' },
  priceLabelTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, fontSize: 15, color: '#64748b', writingDirection: 'rtl' },
  negotiable: { fontFamily: 'Almarai_700Bold', paddingTop: 2, paddingBottom: 0, includeFontPadding: false, fontSize: 11, color: Colors.success, writingDirection: 'rtl' },
  price: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 22, color: '#0f172a', writingDirection: 'rtl' },
  currency: { fontFamily: 'Almarai_700Bold', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 13, color: '#0f172a' },
  priceSub: { fontFamily: 'Almarai_400Regular', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 13, color: '#64748b' },
  iconBgWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

  section: { gap: 16 },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: '#0f172a', writingDirection: 'rtl' },

  // Specs
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start' },
  specItem: {
    width: (SW - 40 - 36) / 4, // 4 columns
    backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 2,
    alignItems: 'center', gap: 2, 
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  specIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  specVal: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 12, color: '#0f172a', textAlign: 'center' },
  specLbl: { fontFamily: 'Almarai_400Regular', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 10, color: '#64748b', textAlign: 'center' },

  // Details Table
  detailsTable: { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailsRowAlt: { backgroundColor: '#f8fafc' },
  detailsRowLast: { borderBottomWidth: 0 },
  detailsRowLbl: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#64748b' },
  detailsRowVal: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#0f172a' },

  // Features
  featuresContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  featureChip: { width: Math.floor((SW - 88) / 4) - 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f8fafc', paddingHorizontal: 2, paddingVertical: 10, borderRadius: 12 },
  featureTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 0, paddingBottom: 0, includeFontPadding: false, fontSize: 10, color: '#334155', textAlign: 'center' },

  // Description
  descContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  desc: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: '#334155', writingDirection: 'rtl', lineHeight: 26 },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  showMoreTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.primary },

  // Seller
  sellerCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  sellerTexts: { gap: 2, alignItems: 'flex-start' },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerName: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, fontSize: 16, color: '#0f172a', writingDirection: 'rtl' },
  sellerGov: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, fontSize: 13, color: '#64748b', writingDirection: 'rtl', textAlign: 'right' },

  // Contact bar
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', gap: 12,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16,
  },
  iconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  verifiedBadgeContact: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  chatIconBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexShrink: 0 },
  waBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexShrink: 0 },
  callWideBtn: { flex: 1, height: 56, backgroundColor: '#EFF6FF', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  callWideTxt: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary, fontSize: 16 },
  // Location & Map
  mapContainer: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', position: 'relative' },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  directionsTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.primary, fontSize: 14 },

})

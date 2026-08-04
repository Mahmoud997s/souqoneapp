import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Dimensions, Platform, Modal, FlatList, Share
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useBus } from '../../src/hooks/useBuses'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { chatApi } from '../../src/api/chat'
import { usersApi } from '../../src/api/users'
import { listingsApi } from '../../src/api/listings'
import { useAuthStore } from '../../src/store/authStore'
import { formatLocation, translateEnum } from '../../src/utils/mappers'
import { dialogService } from '../../src/store/dialogStore'
import { CONDITIONS, TRANSMISSION_TYPES, FUEL_TYPES } from '../../src/constants/filters'
import { BUS_FEATURES, BUS_CONTRACT_TYPES, BUS_TYPES, BUS_MAKES } from '../../src/constants/buses'
import { BusContractDashboard } from '../../src/components/buses/BusContractDashboard'

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width: SW } = Dimensions.get('window')

const FUEL_LABELS: Record<string, string> = {
  PETROL: 'بنزين', DIESEL: 'ديزل', HYBRID: 'هجين',
  ELECTRIC: 'كهربائي', GAS: 'غاز' }
const TRANS_LABELS: Record<string, string> = {
  AUTOMATIC: 'أوتوماتيك', MANUAL: 'يدوي', CVT: 'CVT' }
const COND_LABELS: Record<string, string> = {
  NEW: 'جديد', LIKE_NEW: 'شبه جديد', USED: 'مستعمل',
  GOOD: 'جيد', FAIR: 'مقبول', POOR: 'ضعيف' }
const COND_COLORS: Record<string, { bg: string; text: string }> = {
  NEW:      { bg: '#d1fae5', text: '#065f46' },
  LIKE_NEW: { bg: '#d1fae5', text: '#065f46' },
  USED:     { bg: '#f1f5f9', text: '#475569' },
  GOOD:     { bg: '#e0f2fe', text: '#0369a1' },
  FAIR:     { bg: '#fef3c7', text: '#b45309' },
  POOR:     { bg: '#fee2e2', text: '#b91c1c' } }
const TYPE_LABELS: Record<string, string> = {
  SALE: 'للبيع', RENTAL: 'للإيجار', WANTED: 'مطلوب',
  BUS_SALE: 'للبيع', BUS_RENT: 'للإيجار', BUS_SALE_WITH_CONTRACT: 'بيع مع عقد' }
const CANCEL_LABELS: Record<string, string> = {
  FLEXIBLE: 'مرنة', MODERATE: 'متوسطة', STRICT: 'صارمة'
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { data: item, isLoading, isError } = useBus(id)
  const [imgIdx, setImgIdx] = useState(0)
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  const [isContractExpanded, setIsContractExpanded] = useState(false)
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewRef = useRef((info: any) => {
    if (info.viewableItems.length > 0 && info.viewableItems[0].index != null) {
      setImgIdx(info.viewableItems[0].index);
    }
  }).current;

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
        <Text style={s.errorTxt}>تعذّر تحميل الإعلان</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const raw = item as any
  const images: string[] = (raw.images ?? []).map((img: any) => img.url ?? img)
  const price = parseFloat(raw.price) || 0
  const seller = raw.seller ?? raw.user
  const condColor = COND_COLORS[raw.condition?.toUpperCase()] ?? COND_COLORS.USED
  const isRental = raw.busListingType === 'BUS_RENT' || raw.listingType === 'RENTAL'
  const isContract = raw.busListingType === 'BUS_SALE_WITH_CONTRACT'
  const isOwner = user?.id === seller?.id

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
      dialogService.alert('تنبيه', 'لا يمكنك محادثة نفسك', 'warning')
      return
    }
    try {
      const sellerId = seller?.id
      const res = await chatApi.createRoom({
        entityType: 'LISTING',
        entityId: id as string })
      const conversationId = res.data?.id
      if (conversationId) {
        const initialText = encodeURIComponent(`مرحباً، بخصوص إعلانك: ${raw.title}`)
        router.push(`/chat/${conversationId}?initialText=${initialText}` as any)
      } else {
        dialogService.alert('خطأ', 'لم يتم إرجاع المحادثة من الخادم', 'error')
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message
      const parsedMsg = Array.isArray(errorMsg) ? errorMsg.join('\n') : (typeof errorMsg === 'string' ? errorMsg : 'تعذر فتح المحادثة')
      dialogService.alert('خطأ', parsedMsg, 'error')
    }
  }

  const y = raw.year
  const m = raw.mileage
  const cap = raw.capacity
  const bType = raw.busType
  const cond = raw.condition
  const governorate = raw.governorate
  const city = raw.city

  const translatedBusType = BUS_TYPES.find(b => b.id === bType)?.label || bType
  const translatedMake = BUS_MAKES.find(m => m.id.toLowerCase() === String(raw.make).toLowerCase() || m.label.toLowerCase().includes(String(raw.make).toLowerCase()))?.label || raw.make

  const specs = [
    y && { icon: 'calendar-outline',    label: 'الموديل',     value: String(y) },
    m && { icon: 'speedometer-outline', label: 'الممشى',      value: `${Number(m).toLocaleString('en-US')} كم` },
    cap && { icon: 'people-outline',    label: 'السعة',      value: `${cap} راكب` },
    bType && { icon: 'layers-outline', label: 'النوع',     value: translatedBusType },
    cond && { icon: 'construct-outline',label: 'الحالة',     value: COND_LABELS[cond] || cond },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  const vehicleDetailsTable = [
    raw.make && { label: 'العلامة التجارية', value: translatedMake },
    raw.model && { label: 'الموديل', value: raw.model },
    raw.condition && { label: 'الحالة', value: COND_LABELS[raw.condition] || raw.condition },
    raw.year && { label: 'سنة الصنع', value: raw.year },
    raw.transmission && { label: 'ناقل الحركة', value: translateEnum(raw.transmission, TRANSMISSION_TYPES) },
    raw.fuelType && { label: 'الوقود', value: translateEnum(raw.fuelType, FUEL_TYPES) },
    raw.capacity && { label: 'سعة الركاب', value: `${raw.capacity} راكب` },
    raw.busType && { label: 'نوع الحافلة', value: translatedBusType },
    isRental && raw.dailyPrice != null && { label: 'الإيجار اليومي', value: `${Number(raw.dailyPrice).toLocaleString('en-US')} ر.ع` },
    isRental && raw.monthlyPrice != null && { label: 'الإيجار الشهري', value: `${Number(raw.monthlyPrice).toLocaleString('en-US')} ر.ع` },
  ].filter(Boolean) as { label: string; value: any }[]

  const contractDetailsTable = [
    raw.contractType && { label: 'نوع العقد / الجهة', value: BUS_CONTRACT_TYPES.find(c => c.id === raw.contractType)?.label || raw.contractType },
    raw.contractClient && { label: 'اسم الجهة / العميل', value: raw.contractClient },
    raw.contractMonthly != null && { label: 'الدخل الشهري للعقد', value: `${Number(raw.contractMonthly).toLocaleString('en-US')} ر.ع` },
    raw.contractDuration && { label: 'مدة العقد المتبقية', value: `${raw.contractDuration} شهر` },
    raw.withDriver !== undefined && { label: 'السائق', value: raw.withDriver ? 'شامل السائق' : 'بدون سائق' },
  ].filter(Boolean) as { label: string; value: any }[]

  const featuresList = [...(raw.features || [])]
  if (raw.withDriver) featuresList.unshift('مع سائق')

  const isSold = raw.status === 'SOLD' || raw.status === 'EXPIRED'

  const handleShare = async () => {
    try {
      const title = raw.title || 'حافلة للبيع / للإيجار على سوق وان'
      const message = `شاهد هذا الإعلان على سوق وان: ${title}\nhttps://souqone.app/buses/${id}`
      await Share.share({
        title,
        message,
        url: `https://souqone.app/buses/${id}`,
      })
    } catch (error) {
      console.log('Error sharing listing:', error)
    }
  }

  const handleOptions = () => {
    dialogService.showOptions('خيارات الإعلان', [
      { text: 'إبلاغ عن هذا الإعلان', icon: 'flag-outline',  onPress: handleReport },
      { text: 'حظر هذا المستخدم',    icon: 'ban-outline',   onPress: handleBlock, style: 'destructive' },
    ])
  }

  const handleReport = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    try {
      await listingsApi.report(id as string, 'User reported listing from app')
      dialogService.alert('تم الإبلاغ', 'تم استلام بلاغك بنجاح. سيتم مراجعة الإعلان من قبل الإدارة.', 'success')
    } catch (error) {
      console.log('Error reporting listing:', error)
      dialogService.alert('خطأ', 'حدث خطأ أثناء الإبلاغ. يرجى المحاولة لاحقاً.', 'error')
    }
  }

  const handleBlock = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    try {
      if (!raw?.seller?.id) return
      await usersApi.blockUser(raw.seller.id, 'User blocked seller from app')
      dialogService.alert('تم الحظر', 'تم حظر المستخدم بنجاح. لن ترى إعلاناته بعد الآن.', 'success')
    } catch (error) {
      console.log('Error blocking user:', error)
      dialogService.alert('خطأ', 'حدث خطأ أثناء حظر المستخدم. يرجى المحاولة لاحقاً.', 'error')
    }
  }

  return (
    <View style={s.root}>
      {/* ── TOP HEADER BAR (BACK & SHARE) ── */}
      <View style={[s.headerTopBar, { top: insets.top + 12 }]}>
        <TouchableOpacity style={s.topHeaderBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-forward" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.topHeaderBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity style={s.topHeaderBtn} onPress={handleOptions} activeOpacity={0.8}>
            <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── IMAGES ── */}
        <View style={s.imgBox}>
          {isSold && (
            <View style={s.soldBanner}>
              <Text style={s.soldBannerTxt}>تم البيع</Text>
            </View>
          )}
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
                  <View key={i} style={{ width: SW }}>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setIsGalleryOpen(true)}>
                      <Image source={{ uri }} style={s.mainImg} contentFit="cover" transition={200} />
                    </TouchableOpacity>
                  </View>
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
              <Ionicons name="car-outline" size={64} color="rgba(75,85,99,0.2)" />
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
                  <Text style={s.typeBadgeTxtInline}>{TYPE_LABELS[raw.listingType?.toUpperCase()] ?? raw.listingType}</Text>
                </View>
              )}

              {isRental && raw.withDriver && (
                <View style={[s.typeBadgeInline, { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Ionicons name="person" size={12} color="#ffffff" />
                  <Text style={s.typeBadgeTxtInline}>مع سائق</Text>
                </View>
              )}

              <View style={[s.condBadge, { backgroundColor: condColor.bg }]}>
                <Text style={[s.condTxt, { color: condColor.text }]}>
                  {COND_LABELS[raw.condition?.toUpperCase()] ?? raw.condition}
                </Text>
              </View>

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
                      <Text style={s.sellerName}>{seller.displayName || seller.username || 'بائع'}</Text>
                      {seller.isVerified && <Ionicons name="checkmark-circle" size={16} color="#1877F2" />}
                      {/* @ts-ignore */}
                      {seller.accountType === 'company' && (
                        <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, color: '#fff', fontFamily: 'Almarai_700Bold' }}>شركة</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.trustSignalsRow}>
                      <View style={s.trustBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B"/>
                        <Text style={[s.trustBadgeTxt, { color: '#F59E0B' }]}>4.8</Text>
                      </View>
                      <View style={s.trustBadge}>
                        <Ionicons name="calendar-outline" size={12} color={Colors.primary}/>
                        <Text style={s.trustBadgeTxt}>عضو منذ {new Date(seller.createdAt || Date.now()).getFullYear()}</Text>
                      </View>
                      <View style={s.trustBadge}>
                        <Ionicons name="cube-outline" size={12} color={Colors.primary}/>
                        <Text style={s.trustBadgeTxt}>{seller.listingsCount ?? Math.floor(Math.random() * 20) + 1} إعلانات</Text>
                      </View>
                    </View>
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
                {(isSpecsExpanded ? specs : specs.slice(0, 4)).map((sItem, i) => (
                  <View key={i} style={s.specItem}>
                    <View style={s.specIconWrap}>
                      <Ionicons name={sItem.icon as any} size={18} color={Colors.primary} />
                    </View>
                    <Text style={s.specVal} numberOfLines={1}>{sItem.value}</Text>
                    <Text style={s.specLbl} numberOfLines={1}>{sItem.label}</Text>
                  </View>
                ))}
              </View>
              {specs.length > 4 && (
                <TouchableOpacity 
                  style={[s.showMoreBtn, { marginTop: 4, paddingTop: 8 }]} 
                  onPress={() => setIsSpecsExpanded(!isSpecsExpanded)}
                  activeOpacity={0.8}
                >
                  <Text style={s.showMoreTxt}>{isSpecsExpanded ? 'عرض أقل' : `عرض الكل (${specs.length})`}</Text>
                  <Ionicons name={isSpecsExpanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── VEHICLE DETAILS TABLE ── */}
          {vehicleDetailsTable.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>تفاصيل المركبة</Text>
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

          {/* ── CONTRACT INVESTMENT DASHBOARD BUTTON & CARD ── */}
          {(raw.contractMonthly != null || raw.contractType) && (
            <View style={s.section}>
              <TouchableOpacity
                style={s.contractToggleBtn}
                onPress={() => setIsContractExpanded(!isContractExpanded)}
                activeOpacity={0.8}
              >
                <View style={s.contractToggleLeft}>
                  <View style={s.contractToggleIconBadge}>
                    <Ionicons name="document-text" size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2, alignItems: 'flex-start' }}>
                    <Text style={s.contractToggleTitle}>عرض تفاصيل واستثمار عقد التشغيل</Text>
                    {raw.contractMonthly != null && (
                      <Text style={s.contractToggleSub}>
                        الدخل الشهري: {Number(raw.contractMonthly).toLocaleString('en-US')} ر.ع
                      </Text>
                    )}
                  </View>
                </View>
                <View style={s.contractToggleRight}>
                  <Ionicons
                    name={isContractExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.primary}
                  />
                </View>
              </TouchableOpacity>

              {isContractExpanded && (
                <View style={{ marginTop: 8 }}>
                  <BusContractDashboard
                    contractMonthly={raw.contractMonthly}
                    contractDuration={raw.contractDuration}
                    contractType={raw.contractType}
                    contractClient={raw.contractClient}
                    price={raw.price}
                    withDriver={raw.withDriver}
                  />
                </View>
              )}
            </View>
          )}



          {/* ── FEATURES ── */}
          {featuresList.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>المميزات الإضافية</Text>
              <View style={s.featuresContainer}>
                <View style={s.featuresWrap}>
                  {(isFeaturesExpanded ? featuresList : featuresList.slice(0, 8)).map((f: string, i: number) => {
                    const matched = BUS_FEATURES.find(k => k.id === f);
                    const label = matched ? matched.label : f;
                    let iconName = 'checkmark-circle-outline';
                    if (f === 'مع سائق') iconName = 'person-outline';
                    
                    return (
                      <View key={i} style={s.featureChip}>
                        <Ionicons name={iconName as any} size={18} color={Colors.success} />
                        <Text style={s.featureTxt} numberOfLines={2}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
                {featuresList.length > 8 && (
                  <TouchableOpacity 
                    style={[s.showMoreBtn, { borderTopWidth: 0, marginTop: 4, paddingBottom: 0 }]} 
                    onPress={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.showMoreTxt}>{isFeaturesExpanded ? 'عرض أقل' : `عرض الكل (${featuresList.length})`}</Text>
                    <Ionicons name={isFeaturesExpanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}
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
                      <Text style={{ fontFamily: 'Almarai_700Bold',  color: '#6B7280', marginTop: 8 }}>الخريطة غير مدعومة في المتصفح</Text>
                    </View>
                  ) : (
                    <View style={s.mapContainer}>
                      {MapView && (
                        <MapView
                          style={{ width: '100%', height: '100%' }}
                          provider={PROVIDER_GOOGLE}
                          initialRegion={{
                            latitude: Number(raw.latitude),
                            longitude: Number(raw.longitude),
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05 }}
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
      <View style={[s.contactBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {isOwner ? (
          <TouchableOpacity
            style={s.callWideBtn}
            onPress={() => router.push(`/post/edit/${raw.id}?type=bus` as any)}
            activeOpacity={0.9}
          >
            <Ionicons name="create-outline" size={22} color={Colors.white} />
            <Text style={s.callWideTxt}>تعديل الإعلان</Text>
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
              style={[s.chatIconBtn, isSold && s.disabledBtn]}
              onPress={isSold ? undefined : handleChat}
              activeOpacity={isSold ? 1 : 0.9}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
            {seller?.phone && (
              <TouchableOpacity
                style={[s.waBtn, isSold && s.disabledBtn]}
                onPress={isSold ? undefined : () => {
                  const msg = encodeURIComponent(`مرحباً، بخصوص إعلانك: ${raw.title}`)
                  Linking.openURL(`whatsapp://send?phone=${seller.phone.replace('+', '')}&text=${msg}`)
                }}
                activeOpacity={isSold ? 1 : 0.9}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            {seller?.phone ? (
              <TouchableOpacity
                style={[s.callWideBtn, isSold && s.disabledBtn]}
                onPress={isSold ? undefined : () => Linking.openURL(`tel:${seller.phone}`)}
                activeOpacity={isSold ? 1 : 0.9}
              >
                <Ionicons name="call" size={22} color={Colors.white} />
                <Text style={s.callWideTxt}>{isSold ? 'تم البيع' : 'اتصال'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.callWideBtn, isSold && s.disabledBtn]}
                onPress={isSold ? undefined : handleChat}
                activeOpacity={isSold ? 1 : 0.9}
              >
                <Ionicons name="chatbubbles" size={22} color={Colors.white} />
                <Text style={s.callWideTxt}>{isSold ? 'تم البيع' : 'تواصل'}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* ── FULLSCREEN GALLERY MODAL ── */}
      <Modal visible={isGalleryOpen} transparent={true} animationType="fade" onRequestClose={() => setIsGalleryOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity style={{ position: 'absolute', top: insets.top + 16, start: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }} onPress={() => setIsGalleryOpen(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={images}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={imgIdx}
            getItemLayout={(_, index) => ({
              length: SW,
              offset: SW * index,
              index })}
            onViewableItemsChanged={onViewRef}
            viewabilityConfig={viewConfigRef}
            renderItem={({ item }) => (
              <View style={{ width: SW, height: '100%', justifyContent: 'center' }}>
                <Image source={{ uri: item }} style={{ width: '100%', height: SW * 1.5 }} contentFit="contain" transition={200} />
              </View>
            )}
          />
          {images.length > 1 && (
            <View style={{ position: 'absolute', bottom: insets.bottom + 40, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Almarai_700Bold',  }}>{imgIdx + 1} / {images.length}</Text>
            </View>
          )}
        </View>
      </Modal>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.error, marginTop: 16, fontSize: 18 },
  retryBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 100 },
  retryTxt: { fontFamily: 'Almarai_700Bold',  color: '#fff', fontSize: 15 },

  headerTopBar: {
    position: 'absolute',
    left: Spacing.space4,
    right: Spacing.space4,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topHeaderBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4
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
    flexDirection: 'row', alignItems: 'center' },
  imgCounterTxt: { fontFamily: 'Almarai_700Bold',  paddingBottom: 4, color: '#fff', fontSize: 13, paddingTop: 2 },
  
  imgFallback: { width: SW, height: SW * 0.7, alignItems: 'center', justifyContent: 'center', gap: 12 },
  imgFallbackTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.textMuted, fontSize: 15 },

  // Body
  body: { 
    backgroundColor: '#f8fafc', 
    borderTopStartRadius: 32, borderTopEndRadius: 32, 
    marginTop: -28, 
    paddingTop: 28, paddingHorizontal: 20, 
    gap: 24 
  },

  headerArea: { gap: 12 },
  title: { fontFamily: 'Almarai_700Bold',  fontSize: 22, color: '#0f172a', writingDirection: 'rtl', lineHeight: 34 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  typeBadgeInline: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeBadgeTxtInline: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#ffffff', lineHeight: 20 },
  condBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  condTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 13, lineHeight: 20 },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  locationTxtMeta: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#475569', lineHeight: 20 },

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
  priceLabelTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 15, color: '#64748b', writingDirection: 'rtl', lineHeight: 24 },
  negotiable: { fontFamily: 'Almarai_700Bold',  fontSize: 11, color: Colors.success, writingDirection: 'rtl', lineHeight: 18 },
  price: { fontFamily: 'Almarai_700Bold',  fontSize: 22, color: '#0f172a', writingDirection: 'rtl', lineHeight: 32 },
  currency: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#0f172a', lineHeight: 20 },
  priceSub: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#64748b', lineHeight: 20 },
  iconBgWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

  section: { gap: 16 },
  sectionTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: '#0f172a', writingDirection: 'rtl', lineHeight: 28 },

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
  specVal: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: '#0f172a', textAlign: 'center', lineHeight: 18 },
  specLbl: { fontFamily: 'Almarai_700Bold',  fontSize: 10, color: '#64748b', textAlign: 'center', lineHeight: 16 },

  // Contract Toggle Button Styles
  contractToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  contractToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  contractToggleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractToggleTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: '#0f172a',
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 22,
  },
  contractToggleSub: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
    writingDirection: 'rtl',
    textAlign: 'left',
    lineHeight: 18,
  },
  contractToggleRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBanner: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  soldBannerTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: '#ffffff',
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // Details Table
  detailsTable: { backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailsRowAlt: { backgroundColor: '#f8fafc' },
  detailsRowLast: { borderBottomWidth: 0 },
  detailsRowLbl: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#64748b', lineHeight: 22, textAlign: 'left', writingDirection: 'rtl' },
  detailsRowVal: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#0f172a', lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },

  // Features
  featuresContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  featureChip: { width: Math.floor((SW - 88) / 4) - 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f8fafc', paddingHorizontal: 2, paddingVertical: 10, borderRadius: 12 },
  featureTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 10, color: '#334155', textAlign: 'center', lineHeight: 16 },

  // Description
  descContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  desc: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#334155', writingDirection: 'rtl', lineHeight: 26 },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  showMoreTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.primary, lineHeight: 20 },

  // Seller
  sellerCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  sellerTexts: { gap: 2, alignItems: 'flex-start' },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerName: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: '#0f172a', writingDirection: 'rtl', lineHeight: 24 },
  sellerGov: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#64748b', writingDirection: 'rtl', textAlign: 'left', lineHeight: 20 },
  trustSignalsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trustBadgeTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, color: Colors.primary, lineHeight: 18 },

  // Contact bar
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16, paddingTop: 10,
    flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16 },
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  verifiedBadgeContact: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  chatIconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexShrink: 0 },
  waBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexShrink: 0 },
  callWideBtn: { flex: 1, height: 48, backgroundColor: '#EFF6FF', borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  callWideTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.primary, fontSize: 15 },
  // Location & Map
  mapContainer: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', position: 'relative' },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  directionsTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.primary, fontSize: 14 }
})

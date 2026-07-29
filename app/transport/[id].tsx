import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Dimensions, Platform, TextInput
} from 'react-native'
import { dialogService } from '../../src/store/dialogStore'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useTransportItem } from '../../src/hooks/useTransport'
import { Colors } from '../../src/constants/colors'
import { chatApi } from '../../src/api/chat'
import { transportApi } from '../../src/api/transport'
import { useAuthStore } from '../../src/store/authStore'
import { resolveLocationGov } from '../../src/utils/mappers'
import { getServiceLabel, getRequestStatusLabel, getQuoteStatusLabel } from '../../src/constants/transport'

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

const { width: SW } = Dimensions.get('window')

// ─── Constants ───────────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<string, any> = {
  GOODS: 'cube',
  FURNITURE: 'home',
  CONSTRUCTION: 'hammer',
  HEAVY: 'car',
  BACKLOAD: 'swap-horizontal',
  EQUIPMENT: 'construct',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: '#dcfce7', text: '#16a34a' },
  QUOTED:      { bg: '#dbeafe', text: '#2563eb' },
  ACCEPTED:    { bg: '#fef3c7', text: '#d97706' },
  IN_PROGRESS: { bg: '#f3e8ff', text: '#7c3aed' },
  COMPLETED:   { bg: '#d1fae5', text: '#059669' },
  CANCELLED:   { bg: '#fee2e2', text: '#dc2626' },
  EXPIRED:     { bg: '#f3f4f6', text: '#6b7280' },
}
const QUOTE_STATUS_COLORS: Record<string, string> = { PENDING: '#d97706', ACCEPTED: '#16a34a', REJECTED: '#dc2626', WITHDRAWN: '#6b7280' }

export default function TransportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { data: item, isLoading, isError, refetch } = useTransportItem(id)
  
  const [imgIdx, setImgIdx] = useState(0)
  const [quotes, setQuotes] = useState<any[]>([])
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteHours, setQuoteHours] = useState('')
  const [quoteMsg, setQuoteMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadQuotes = async () => {
    if (!id) return
    setQuotesLoading(true)
    try {
      const res = await transportApi.getQuotes(id)
      const d = (res.data as any)
      setQuotes(Array.isArray(d) ? d : d?.items ?? d?.data ?? [])
    } catch { setQuotes([]) }
    finally { setQuotesLoading(false) }
  }

  useEffect(() => { if (id) loadQuotes() }, [id])

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
        <Text style={s.errorTxt}>تعذّر تحميل تفاصيل الطلب</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>العودة للخلف</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const raw = item as any
  const images: string[] = [] // Transport usually doesn't have images, but if it did, we'd map them here
  const owner = raw.user
  const isOwner = user?.id === raw.userId
  const isOpen = raw.status === 'OPEN' || raw.status === 'QUOTED'

  const serviceLabel = getServiceLabel(raw.serviceType)
  const serviceIcon  = SERVICE_ICONS[raw.serviceType] ?? 'cube'
  const statusColor = STATUS_COLORS[raw.status] ?? STATUS_COLORS.OPEN
  
  const fromLabel = resolveLocationGov(raw.fromGovernorate) + (raw.fromCity ? `، ${raw.fromCity}` : '')
  const toLabel   = resolveLocationGov(raw.toGovernorate)   + (raw.toCity   ? `، ${raw.toCity}`   : '')

  const title = `نقل ${serviceLabel} من ${resolveLocationGov(raw.fromGovernorate)}`
  
  const budgetMin = parseFloat(String(raw.budgetMin ?? 0))
  const budgetMax = parseFloat(String(raw.budgetMax ?? 0))
  let priceLabel = 'تواصل للسعر'
  if (budgetMin > 0 && budgetMax > 0) priceLabel = `${budgetMin} - ${budgetMax}`
  else if (budgetMin > 0) priceLabel = `من ${budgetMin}`
  else if (budgetMax > 0) priceLabel = `حتى ${budgetMax}`

  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    if (user.id === owner?.id) {
      dialogService.alert('تنبيه', 'لا يمكنك محادثة نفسك', 'warning')
      return
    }
    try {
      const res = await chatApi.createRoom({
        entityType: 'TRANSPORT_REQUEST',
        entityId: id as string,
        receiverId: owner?.id,
      })
      const conversationId = res.data?.id
      if (conversationId) {
        const initialText = encodeURIComponent(`مرحباً، بخصوص طلب نقل: ${title}`)
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

  const handleCall = () => { if (owner?.phone) Linking.openURL(`tel:${owner.phone}`) }

  const handleSubmitQuote = async () => {
    if (!user) { router.push('/(auth)/login' as any); return }
    if (!quotePrice) { dialogService.alert('خطأ', 'أدخل السعر', 'warning'); return }
    setSubmitting(true)
    try {
      await transportApi.submitQuote(id, {
        price: parseFloat(quotePrice),
        estimatedHours: quoteHours ? parseFloat(quoteHours) : undefined,
        message: quoteMsg || undefined,
      })
      setQuotePrice(''); setQuoteHours(''); setQuoteMsg('')
      loadQuotes()
      refetch()
      dialogService.alert('تم', 'تم إرسال عرضك بنجاح', 'success')
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message
      const parsedMsg = Array.isArray(errorMsg) ? errorMsg.join('\n') : (typeof errorMsg === 'string' ? errorMsg : 'تعذر إرسال العرض')
      dialogService.alert('خطأ', parsedMsg, 'error')
    } finally { setSubmitting(false) }
  }

  const handleAcceptQuote = async (quoteId: string) => {
    dialogService.confirm(
      'قبول العرض',
      'هل أنت متأكد من قبول هذا العرض؟',
      async () => {
        try {
          await transportApi.acceptQuote(quoteId)
          loadQuotes()
          refetch()
        } catch (e: any) { 
          const errorMsg = e?.response?.data?.message
          const parsedMsg = Array.isArray(errorMsg) ? errorMsg.join('\n') : (typeof errorMsg === 'string' ? errorMsg : 'حدث خطأ')
          dialogService.alert('خطأ', parsedMsg, 'error') 
        }
      },
      'نعم',
      'لا',
    )
  }

  const specs = [
    raw.weightTons && { icon: 'barbell-outline', label: 'الوزن', value: `${raw.weightTons} طن` },
    raw.scheduledAt && { icon: 'calendar-outline', label: 'الموعد', value: new Date(raw.scheduledAt).toLocaleDateString('ar-OM') },
    raw.isFlexible && { icon: 'time-outline', label: 'التوقيت', value: 'مرن' },
  ].filter(Boolean) as { icon: string; label: string; value: string }[]

  const requestDetailsTable = [
    { label: 'نوع الحمولة', value: serviceLabel },
    raw.fromGovernorate && { label: 'من (الانطلاق)', value: fromLabel },
    raw.toGovernorate && { label: 'إلى (الوجهة)', value: toLabel },
    { label: 'يحتاج مساعدين', value: raw.requiresHelper ? 'نعم' : 'لا' },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <View style={s.root}>
      {/* ── BACK BUTTON ── */}
      <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()} activeOpacity={0.8}>
        <Ionicons name="arrow-forward" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── IMAGES / PLACEHOLDER ── */}
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
              <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent']} style={s.imgGradientTop} />
              {images.length > 1 && (
                <View style={s.imgCounter}>
                  <Ionicons name="images-outline" size={12} color="#fff" style={{ marginEnd: 4 }} />
                  <Text style={s.imgCounterTxt}>{imgIdx + 1} / {images.length}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={s.imgFallback}>
              <Ionicons name={serviceIcon} size={64} color="rgba(75,85,99,0.2)" />
              <Text style={s.imgFallbackTxt}>{serviceLabel}</Text>
            </View>
          )}
        </View>

        {/* ── BODY ── */}
        <View style={s.body}>
          
          {/* Header Area */}
          <View style={s.headerArea}>
            <Text style={s.title}>{title}</Text>

            <View style={s.metaRow}>
              <View style={s.typeBadgeInline}>
                <Text style={s.typeBadgeTxtInline}>{serviceLabel}</Text>
              </View>

              <View style={[s.condBadge, { backgroundColor: statusColor.bg }]}>
                <Text style={[s.condTxt, { color: statusColor.text }]}>
                  {getRequestStatusLabel(raw.status)}
                </Text>
              </View>

              <View style={s.locationWrap}>
                <Ionicons name="swap-horizontal-outline" size={14} color="#475569" />
                <Text style={s.locationTxtMeta}>{fromLabel} - {toLabel}</Text>
              </View>
            </View>
          </View>

          {isOwner && isOpen && (
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 12, marginBottom: 24, gap: 8, borderWidth: 1, borderColor: '#e2e8f0' }}
              onPress={() => router.push(`/transport/requests/${id}/edit` as any)}
            >
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary }}>تعديل الطلب</Text>
            </TouchableOpacity>
          )}

          {/* Price Card */}
          <View style={s.priceCard}>
            <View style={s.priceRight}>
              <View style={s.iconBgWrap}>
                 <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              </View>
              <View style={s.priceLabelWrap}>
                <Text style={s.priceLabelTxt}>الميزانية المقترحة</Text>
                {raw.isFlexible && (
                  <Text style={s.negotiable}>سعر مرن للتفاوض</Text>
                )}
              </View>
            </View>
            <View style={s.priceLeft}>
              {priceLabel !== 'تواصل للسعر' ? (
                <Text style={s.price}>
                  {priceLabel} <Text style={s.currency}>ر.ع</Text>
                </Text>
              ) : (
                <Text style={s.price}>تواصل للسعر</Text>
              )}
            </View>
          </View>

          {/* Specs Grid */}
          {specs.length > 0 && (
            <View style={s.specsGrid}>
              {specs.map((sp, i) => (
                <View key={i} style={s.specItem}>
                  <Ionicons name={sp.icon as any} size={20} color={Colors.primary} style={{ marginBottom: 6 }} />
                  <Text style={s.specLabel}>{sp.label}</Text>
                  <Text style={s.specValue}>{sp.value}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.divider} />

          {/* Request Details Table */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>تفاصيل الطلب</Text>
            <View style={s.table}>
              {requestDetailsTable.map((row, i) => (
                <View key={i} style={[s.tableRow, i % 2 !== 0 && s.tableRowAlt]}>
                  <Text style={s.tableLabel}>{row.label}</Text>
                  <Text style={s.tableValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.divider} />

          {/* Description */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>وصف الحمولة</Text>
            <Text style={s.descText}>
              {raw.cargoDescription || 'لا يوجد وصف.'}
            </Text>
            {raw.notes && (
              <Text style={s.descText}>
                {'\n'}<Text style={{fontFamily: 'Almarai_700Bold'}}>ملاحظات إضافية:</Text> {raw.notes}
              </Text>
            )}
          </View>

          <View style={s.divider} />

          {/* Quotes Section */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>عروض الأسعار ({quotes.length})</Text>
            {quotesLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : quotes.length === 0 ? (
              <Text style={s.noQuotes}>لا توجد عروض بعد</Text>
            ) : (
              <View style={s.quotesList}>
                {quotes.map(q => (
                  <View key={q.id} style={s.quoteCard}>
                    <View style={s.quoteCardTop}>
                      <View style={s.quoteCarrier}>
                        <View style={s.quoteAvatar}>
                          <Text style={s.quoteAvatarText}>{(q.carrier?.companyName ?? q.carrier?.user?.displayName ?? 'م').charAt(0)}</Text>
                        </View>
                        <View>
                          <Text style={s.quoteCarrierName}>{q.carrier?.companyName ?? q.carrier?.user?.displayName ?? 'مزود خدمة'}</Text>
                          {q.carrier?.averageRating > 0 && (
                            <View style={s.ratingRow}>
                              <Ionicons name="star" size={11} color="#d97706" />
                              <Text style={s.ratingText}>{q.carrier.averageRating.toFixed(1)}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.quotePrice}>{q.price} ر.ع.</Text>
                        <View style={[s.quoteStatusBadge, { backgroundColor: (QUOTE_STATUS_COLORS[q.status] ?? '#6b7280') + '18' }]}>
                          <Text style={[s.quoteStatusText, { color: QUOTE_STATUS_COLORS[q.status] ?? '#6b7280' }]}>{getQuoteStatusLabel(q.status)}</Text>
                        </View>
                      </View>
                    </View>
                    {q.estimatedHours && <Text style={s.quoteHours}>المدة المتوقعة: {q.estimatedHours} ساعة</Text>}
                    {q.message && <Text style={s.quoteMessage}>{q.message}</Text>}
                    {isOwner && q.status === 'PENDING' && (
                      <TouchableOpacity style={s.acceptBtn} onPress={() => handleAcceptQuote(q.id)}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
                        <Text style={s.acceptBtnText}>قبول العرض</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Quote Form */}
          {!isOwner && isOpen && (
            <View style={s.quoteFormCard}>
              <View style={s.quoteFormHeader}>
                <Ionicons name="send-outline" size={18} color={Colors.primary} />
                <Text style={s.quoteFormTitle}>قدّم عرضك كـ مزود خدمة</Text>
              </View>
              <TextInput
                style={s.quoteInput}
                placeholder="السعر (ر.ع.) *"
                placeholderTextColor={Colors.textMuted}
                value={quotePrice}
                onChangeText={setQuotePrice}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={s.quoteInput}
                placeholder="المدة المتوقعة للنقل (ساعات)"
                placeholderTextColor={Colors.textMuted}
                value={quoteHours}
                onChangeText={setQuoteHours}
                keyboardType="number-pad"
              />
              <TextInput
                style={[s.quoteInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                placeholder="رسالة إضافية للمالك (اختياري)"
                placeholderTextColor={Colors.textMuted}
                value={quoteMsg}
                onChangeText={setQuoteMsg}
                multiline
              />
              <TouchableOpacity
                style={[s.submitQuoteBtn, submitting && { opacity: 0.5 }]}
                onPress={handleSubmitQuote}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Ionicons name="arrow-back" size={16} color="#fff" />
                    <Text style={s.submitQuoteTxt}>إرسال العرض</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── BOTTOM ACTION BAR ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
        <View style={s.bottomActions}>
          <TouchableOpacity style={s.chatBtn} onPress={handleChat} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={s.chatTxt}>تواصل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.callBtn} onPress={handleCall} activeOpacity={0.85}>
            <Ionicons name="call" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  errorTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: '#0f172a', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  retryTxt: { fontFamily: 'Almarai_700Bold',  color: '#fff', fontSize: 14 },
  
  backBtn: {
    position: 'absolute', left: 16, zIndex: 100,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },

  imgBox: { width: SW, height: SW * 0.65, backgroundColor: '#f1f5f9' },
  mainImg: { width: SW, height: '100%' },
  imgGradientTop: { position: 'absolute', top: 0, width: '100%', height: 80 },
  imgFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imgFallbackTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: '#94a3b8', marginTop: 12 },
  imgCounter: {
    position: 'absolute', bottom: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
  },
  imgCounterTxt: { fontFamily: 'Almarai_700Bold',  color: '#fff', fontSize: 12 },

  body: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20 },
  
  headerArea: { marginBottom: 20 },
  title: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 20, color: '#0f172a', writingDirection: 'rtl', lineHeight: 28 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  typeBadgeInline: { backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  typeBadgeTxtInline: { fontFamily: 'Almarai_700Bold',  fontSize: 11, color: '#0284c7' },
  condBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  condTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 11 },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTxtMeta: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: '#475569' },

  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBgWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  priceLabelWrap: { gap: 2 },
  priceLabelTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: '#64748b', writingDirection: 'rtl' },
  negotiable: { fontFamily: 'Almarai_700Bold',  fontSize: 10, color: '#10b981' },
  priceLeft: { alignItems: 'flex-end' },
  price: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.primary },
  currency: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: '#64748b' },

  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  specItem: {
    flex: 1, minWidth: '28%',
    backgroundColor: '#f8fafc', padding: 12, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  specLabel: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: '#64748b', marginBottom: 2 },
  specValue: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#0f172a', textAlign: 'center' },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 24 },

  section: { marginBottom: 8 },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 16, color: '#0f172a', marginBottom: 16, writingDirection: 'rtl' },
  
  table: { backgroundColor: '#f8fafc', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  tableRowAlt: { backgroundColor: '#fff' },
  tableLabel: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: '#64748b' },
  tableValue: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#0f172a', writingDirection: 'rtl', flex: 1, textAlign: 'left', marginStart: 16 },

  descText: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: '#334155', lineHeight: 26, writingDirection: 'rtl' },

  noQuotes: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  quotesList: { gap: 10 },
  quoteCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  quoteCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  quoteCarrier: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quoteAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  quoteAvatarText: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.primary },
  quoteCarrierName: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { fontFamily: 'Almarai_700Bold',  fontSize: 10, color: '#d97706' },
  quotePrice: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 15, color: Colors.primary },
  quoteStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, marginTop: 4 },
  quoteStatusText: { fontFamily: 'Almarai_700Bold',  fontSize: 10 },
  quoteHours: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.text2 },
  quoteMessage: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.text2, writingDirection: 'rtl' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.primary + '12', borderWidth: 1, borderColor: Colors.primary + '30' },
  acceptBtnText: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },

  quoteFormCard: { borderWidth: 1.5, borderColor: Colors.primary + '40', padding: 16, borderRadius: 16, backgroundColor: '#f8fafc', marginTop: 16 },
  quoteFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  quoteFormTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 15, color: Colors.text },
  quoteInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, height: 44, paddingHorizontal: 14, fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text, textAlign: 'right', writingDirection: 'rtl', marginBottom: 10 },
  submitQuoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, backgroundColor: Colors.primary, marginTop: 4 },
  submitQuoteTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#fff' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    paddingHorizontal: 20, paddingTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10,
  },
  bottomActions: { flexDirection: 'row', gap: 12 },
  chatBtn: {
    flex: 1, height: 50, borderRadius: 100, backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  chatTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 15, color: '#fff' },
  callBtn: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#bfdbfe',
  },
})

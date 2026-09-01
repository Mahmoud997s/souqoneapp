import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePart } from '../../src/hooks/useParts'
import { Colors } from '../../src/constants/colors'
import { chatApi } from '../../src/api/chat'
import { formatLocation } from '../../src/utils/mappers'
import { useBrands } from '../../src/hooks/useCars'
import { POPULAR_PART_MAKES } from '../../src/constants/parts'
import { useAuthStore } from '../../src/store/authStore'
import { usePartWizardStore } from '../../src/store/partWizardStore'
import { partsApi } from '../../src/api/parts'
import { dialogService } from '../../src/store/dialogStore'

const ACCENT = '#ea580c' // Orange Accent

const { width: SW } = Dimensions.get('window')

const COND_COLORS: Record<string, { bg: string; text: string }> = {
  NEW:      { bg: '#d1fae5', text: '#065f46' },
  LIKE_NEW: { bg: '#d1fae5', text: '#065f46' },
  USED:     { bg: '#f3f4f6', text: '#4b5563' },
  GOOD:     { bg: '#dbeafe', text: '#1d4ed8' },
  FAIR:     { bg: '#fef3c7', text: '#92400e' },
}
const COND_LABELS: Record<string, string> = {
  NEW: 'جديد', LIKE_NEW: 'شبه جديد', USED: 'مستعمل', GOOD: 'جيد', FAIR: 'مقبول',
}

export default function PartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { data: item, isLoading, isError } = usePart(id)
  const { data: brands } = useBrands()
  const [imgIdx, setImgIdx] = useState(0)

  if (isLoading) {
    return <View style={[s.root, s.center]}><ActivityIndicator size="large" color={ACCENT} /></View>
  }

  if (isError || !item) {
    return (
      <View style={[s.root, s.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={s.errorTxt}>تعذّر تحميل القطعة</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryTxt}>رجوع</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const raw = item as any
  const images: string[] = (raw.images ?? []).map((img: any) => img.url ?? img)
  const price = parseFloat(raw.price) || 0
  const seller = raw.seller ?? raw.user
  const isOwner = !!user?.id && !!seller?.id && user.id === seller.id
  const condColor = COND_COLORS[raw.condition] ?? COND_COLORS.USED

  const handleChat = async () => {
    if (!seller?.id) return
    try {
      const res = await chatApi.createRoom({ entityType: 'parts', entityId: id, receiverId: seller.id })
      router.push(`/chat/${res.data.id}` as any)
    } catch (err) {
      console.log('Chat error', err)
    }
  }

  const handleEditPart = () => {
    usePartWizardStore.getState().setEditMode(raw.id, {
      title: raw.title ?? '',
      description: raw.description ?? '',
      partCategory: raw.partCategory,
      condition: raw.condition,
      partNumber: raw.partNumber ?? '',
      compatibleMakes: raw.compatibleMakes ?? [],
      compatibleModels: raw.compatibleModels ?? [],
      yearFrom: raw.yearFrom ?? null,
      yearTo: raw.yearTo ?? null,
      isOriginal: raw.isOriginal ?? false,
      hasWarranty: raw.hasWarranty ?? false,
      warrantyDuration: raw.warrantyDuration ?? null,
      quantity: raw.quantity ?? null,
      compatibleVehicleTypes: raw.compatibleVehicleTypes ?? [],
      price: Number(raw.price) || null,
      currency: raw.currency ?? 'OMR',
      isPriceNegotiable: raw.isPriceNegotiable ?? false,
      contactPhone: raw.contactPhone ?? '',
      whatsapp: raw.whatsapp ?? '',
      governorateId: raw.governorateId ? Number(raw.governorateId) : null,
      wilayaId: raw.wilayaId ? Number(raw.wilayaId) : null,
      governorateNameAr: raw.governorateRef?.nameAr ?? raw.governorate ?? '',
      wilayaNameAr: raw.wilayaRef?.nameAr ?? raw.city ?? '',
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      existingImages: (raw.images ?? []).map((img: any) => ({ id: img.id, url: img.url })),
    })
    router.push('/parts/new' as any)
  }

  const handleDeletePart = async () => {
    dialogService.confirm(
      'حذف الإعلان',
      'هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.',
      async () => {
        try {
          await partsApi.remove(raw.id)
          dialogService.alert('تم', 'تم حذف إعلان القطعة بنجاح', 'success')
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
              <Ionicons name="construct-outline" size={64} color="rgba(75,85,99,0.2)" />
              <Text style={s.imgFallbackTxt}>لا توجد صور</Text>
            </View>
          )}
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeTxt}>قطعة غيار</Text>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.titleRow}>
            <Text style={s.title}>{raw.title ?? raw.partName}</Text>
            <View style={[s.condBadge, { backgroundColor: condColor.bg }]}>
              <Text style={[s.condTxt, { color: condColor.text }]}>
                {COND_LABELS[raw.condition] ?? raw.condition}
              </Text>
            </View>
          </View>

          <View style={s.priceRow}>
            <Text style={s.price}>
              {price > 0 ? price.toLocaleString('en-US') : 'تواصل للسعر'}
              {price > 0 && <Text style={s.currency}> ر.ع.</Text>}
            </Text>
            {formatLocation(raw) ? (
              <View style={s.locationPill}>
                <Ionicons name="location-outline" size={14} color={ACCENT} />
                <Text style={s.locationTxt}>{formatLocation(raw)}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.tagsRow}>
            {raw.partCategory && (
              <View style={s.tag}>
                <Ionicons name="grid-outline" size={14} color={ACCENT} />
                <Text style={s.tagTxt}>{raw.partCategory}</Text>
              </View>
            )}
            {raw.brand && (
              <View style={s.tag}>
                <Ionicons name="pricetag-outline" size={14} color={ACCENT} />
                <Text style={s.tagTxt}>{raw.brand}</Text>
              </View>
            )}
            {raw.isOriginal && (
              <View style={[s.tag, { backgroundColor: '#ea580c' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={[s.tagTxt, { color: '#fff' }]}>أصلية</Text>
              </View>
            )}
            {raw.compatibleMakes && raw.compatibleMakes.length > 0 && (
              <View style={s.tag}>
                <Ionicons name="car-outline" size={14} color={ACCENT} />
                <Text style={s.tagTxt}>
                  {raw.compatibleMakes.map((m: string) => {
                    if (m === 'all') return 'متوافق مع الجميع'
                    const foundApi = brands?.find((b) => b.id === m)
                    if (foundApi) return foundApi.nameAr || foundApi.name
                    const foundLocal = POPULAR_PART_MAKES.find((pm) => pm.id === m)
                    return foundLocal ? foundLocal.label : m
                  }).join('، ')}
                </Text>
              </View>
            )}
          </View>

          <View style={s.divider} />

          {raw.description && (
            <>
              <Text style={s.sectionTitle}>الوصف</Text>
              <Text style={s.desc}>{raw.description}</Text>
              <View style={s.divider} />
            </>
          )}

          {seller && (
            <>
              <Text style={s.sectionTitle}>البائع</Text>
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
              onPress={handleDeletePart}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[s.callTxt, { color: Colors.error }]}>حذف</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.callBtn, { flex: 1 }]}
              onPress={handleEditPart}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color={ACCENT} />
              <Text style={s.callTxt}>تعديل</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {seller?.phone && (
              <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${seller.phone}`)}>
                <Ionicons name="call-outline" size={20} color={ACCENT} />
                <Text style={s.callTxt}>اتصال</Text>
              </TouchableOpacity>
            )}
            {seller?.phone && (
              <TouchableOpacity style={s.waBtn} onPress={() => Linking.openURL(`whatsapp://send?phone=${seller.phone.replace('+', '')}`)}>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={s.waTxt}>واتساب</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.chatBtn} onPress={handleChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
              <Text style={s.chatTxt}>محادثة</Text>
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
  errorTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.error, marginTop: 12, fontSize: 16 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryTxt: { fontFamily: 'Almarai_700Bold',  color: '#fff' },
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
  thumbActive: { borderColor: ACCENT },
  imgFallback: { width: SW, height: SW * 0.55, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imgFallbackTxt: { fontFamily: 'Almarai_400Regular',  color: Colors.textMuted, fontSize: 13 },
  typeBadge: {
    position: 'absolute', end: 12, top: 12,
    backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  typeBadgeTxt: { fontFamily: 'Almarai_700Bold',  color: '#fff', fontSize: 12 },
  body: { backgroundColor: '#fff', borderTopStartRadius: 20, borderTopEndRadius: 20, marginTop: -16, padding: 20, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontFamily: 'Almarai_800ExtraBold',  fontSize: 20, color: Colors.text, textAlign: 'right', lineHeight: 30 },
  condBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  condTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 28, color: ACCENT, textAlign: 'right' },
  currency: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: ACCENT },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  locationTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: ACCENT },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: ACCENT },
  divider: { height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 16, color: Colors.text, textAlign: 'right' },
  desc: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, textAlign: 'right', lineHeight: 24 },
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
  sellerName: { fontFamily: 'Almarai_700Bold',  fontSize: 15, color: Colors.text },
  sellerGov: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.textMuted },
  sellerProfileBtn: { backgroundColor: '#fff7ed', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  sellerProfileTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: ACCENT },
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: ACCENT, backgroundColor: '#fff7ed' },
  callTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: ACCENT },
  waBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, backgroundColor: '#16a34a' },
  waTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#fff' },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, backgroundColor: '#1f2937' },
  chatTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#fff' },
})

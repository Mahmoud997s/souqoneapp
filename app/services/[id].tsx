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
import { dialogService } from '../../src/store/dialogStore'

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
  const price = parseFloat(raw.price ?? raw.pricePerHour) || 0
  const seller = raw.seller ?? raw.user

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
            <Text style={s.typeBadgeTxt}>خدمة</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.title}>{raw.title ?? raw.serviceName}</Text>

          <View style={s.priceRow}>
            <View>
              {price > 0 && <Text style={s.priceLabel}>يبدأ من</Text>}
              <Text style={s.price}>
                {price > 0 ? `${price.toLocaleString('en-US')} ر.ع.` : 'تواصل للسعر'}
              </Text>
            </View>
            {(raw.city || raw.governorate) && (
              <View style={s.locationPill}>
                <Ionicons name="location-outline" size={14} color={Colors.primary} />
                <Text style={s.locationTxt}>{raw.city || raw.governorate}</Text>
              </View>
            )}
          </View>

          {raw.serviceType && (
            <View style={s.tagsRow}>
              <View style={s.tag}>
                <Ionicons name="build-outline" size={14} color={Colors.primary} />
                <Text style={s.tagTxt}>{raw.serviceType}</Text>
              </View>
            </View>
          )}

          <View style={s.divider} />

          {raw.description && (
            <>
              <Text style={s.sectionTitle}>الوصف</Text>
              <Text style={s.desc}>{raw.description}</Text>
              <View style={s.divider} />
            </>
          )}

          {raw.features?.length > 0 && (
            <>
              <Text style={s.sectionTitle}>الخدمات المقدمة</Text>
              <View style={s.featuresWrap}>
                {raw.features.map((f: string, i: number) => (
                  <View key={i} style={s.featureChip}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={s.featureTxt}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={s.divider} />
            </>
          )}

          {seller && (
            <>
              <Text style={s.sectionTitle}>مقدم الخدمة</Text>
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
  thumbActive: { borderColor: Colors.primary },
  imgFallback: { width: SW, height: SW * 0.55, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imgFallbackTxt: { fontFamily: 'Almarai_400Regular',  color: Colors.textMuted, fontSize: 13 },
  typeBadge: {
    position: 'absolute', end: 12, top: 12,
    backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  typeBadgeTxt: { fontFamily: 'Almarai_700Bold',  color: '#fff', fontSize: 12 },
  body: { backgroundColor: '#fff', borderTopStartRadius: 20, borderTopEndRadius: 20, marginTop: -16, padding: 20, gap: 14 },
  title: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 20, color: Colors.text, textAlign: 'right', lineHeight: 30 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontFamily: 'Almarai_400Regular',  fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginBottom: 2 },
  price: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 26, color: Colors.primary, textAlign: 'right' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  locationTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 16, color: Colors.text, textAlign: 'right' },
  desc: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, textAlign: 'right', lineHeight: 24 },
  featuresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  featureTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.success },
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
  sellerProfileBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  sellerProfileTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    flexDirection: 'row', gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 6,
  },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  callTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.primary },
  waBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, backgroundColor: '#16a34a' },
  waTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#fff' },
  bookBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 12, backgroundColor: Colors.primary },
  bookTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: '#fff' },
})

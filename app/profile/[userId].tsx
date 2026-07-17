import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { CarCard } from '../../src/components/cars/CarCard'
import { chatApi } from '../../src/api/chat'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { useListings } from '../../src/hooks/useListings'
import { usePublicProfile } from '../../src/hooks/useProfile'
import { useAuthStore } from '../../src/store/authStore'

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const insets = useSafeAreaInsets()
  const { data: profile, isLoading: profileLoading } = usePublicProfile(userId)
  const { data: userListings, isLoading: listingsLoading } = useListings({ sellerId: userId })
  const { user } = useAuthStore()

  if (profileLoading) {
    return (
      <View style={s.root}>
        <AppHeader title="الملف الشخصي" showBack />
        <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </View>
    )
  }

  const phoneToUse = profile?.phone || 
    (userListings?.[0] as any)?.raw?.seller?.phone || 
    (userListings?.[0] as any)?.raw?.user?.phone

  const displayName = profile?.displayName ?? profile?.username ?? 'مستخدم'
  const joinYear = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '—'
  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    if (user.id === userId) {
      Alert.alert('تنبيه', 'لا يمكنك محادثة نفسك')
      return
    }
    try {
      const res = await chatApi.createRoom({
        entityType: 'USER',
        entityId: userId as string,
      })
      const conversationId = res.data?.id
      if (conversationId) {
        router.push(`/chat/${conversationId}` as any)
      } else {
        Alert.alert('خطأ', 'لم يتم إرجاع المحادثة من الخادم')
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message
      const parsedMsg = Array.isArray(errorMsg) ? errorMsg.join('\\n') : (typeof errorMsg === 'string' ? errorMsg : 'تعذر فتح المحادثة')
      Alert.alert('خطأ', parsedMsg)
    }
  }

  return (
    <View style={s.root}>
      <AppHeader title="الملف الشخصي" showBack />

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.profileCard}>
          <View style={s.avatarBox}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarLetter}>{displayName.charAt(0)}</Text>
              </View>
            )}
            {profile?.isVerified && (
              <View style={s.verified}>
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              </View>
            )}
          </View>
          <Text style={s.name}>{displayName}</Text>
          {profile?.governorate && (
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={s.locationTxt}>{profile.governorate}</Text>
            </View>
          )}
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Ionicons name="cube-outline" size={24} color={Colors.primary} />
            <Text style={s.statVal}>{userListings?.length ?? '—'}</Text>
            <Text style={s.statLbl}>إعلانات</Text>
          </View>
          <View style={s.statBox}>
            <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
            <Text style={s.statVal}>{joinYear}</Text>
            <Text style={s.statLbl}>عضو منذ</Text>
          </View>
          <View style={s.statBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color={profile?.isVerified ? Colors.success : Colors.border} />
            <Text style={s.statVal}>{profile?.isVerified ? 'موثّق' : 'غير موثّق'}</Text>
            <Text style={s.statLbl}>الحالة</Text>
          </View>
        </View>

        {(userListings?.length ?? 0) > 0 && (
          <>
            <Text style={s.sectionTitle}>إعلانات {displayName}</Text>
            {listingsLoading ? (
              <View style={s.list}>
                {[1, 2].map(i => <SkeletonCard key={i} />)}
              </View>
            ) : (
              <View style={s.list}>
                {(userListings ?? []).slice(0, 6).map(item => (
                  <CarCard
                    key={item.id}
                    item={item as any}
                    onPress={() => router.push(`/listings/${item.id}` as any)}
                    fullWidth
                    showChips
                  />
                ))}
              </View>
            )}
          </>
        )}

        {!listingsLoading && (userListings?.length ?? 0) === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="cube-outline" size={48} color={Colors.border} />
            <Text style={s.emptyTxt}>لا توجد إعلانات</Text>
          </View>
        )}
      </ScrollView>

      <View style={[s.contactBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {phoneToUse && (
          <TouchableOpacity
            style={s.callBtn}
            onPress={() => Linking.openURL(`tel:${phoneToUse}`)}
            activeOpacity={0.9}
          >
            <Ionicons name="call" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {phoneToUse && (
          <TouchableOpacity
            style={s.waBtn}
            onPress={() => Linking.openURL(`whatsapp://send?phone=${phoneToUse.replace('+', '')}`)}
            activeOpacity={0.9}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.chatBtn}
          onPress={handleChat}
          activeOpacity={0.9}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          <Text style={s.chatTxt}>محادثة</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  profileCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.space4,
    alignItems: 'center', marginBottom: Spacing.space4, borderWidth: 1, borderColor: Colors.border,
  },
  avatarBox: { position: 'relative', marginBottom: Spacing.space3 },
  avatar: { width: 80, height: 80, borderRadius: Radius.pill, borderWidth: 3, borderColor: '#f7f9fc' },
  avatarFallback: { backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 32, color: Colors.primary },
  verified: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  name: { fontFamily: 'Almarai_700Bold',  fontSize: 20, color: Colors.text, writingDirection: 'rtl' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted },
  statsRow: { flexDirection: 'row', gap: Spacing.space3, marginBottom: Spacing.space6 },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.space3, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statVal: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text, marginVertical: 4 },
  statLbl: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.text2 },
  sectionTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text, marginBottom: Spacing.space3, writingDirection: 'rtl' },
  list: { gap: Spacing.space4 },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: Spacing.space3 },
  emptyTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.text2, fontSize: 16 },
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', gap: 12,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16,
  },
  callBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  waBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  chatBtn: { flex: 1, height: 56, backgroundColor: Colors.primary, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  chatTxt: { fontFamily: 'Almarai_800ExtraBold',  color: '#fff', fontSize: 16 },
})

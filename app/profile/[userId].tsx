import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
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
import { VerifiedBadge } from '../../src/components/ui/VerifiedBadge'
import { useListings } from '../../src/hooks/useListings'
import { usePublicProfile } from '../../src/hooks/useProfile'
import { useAuthStore } from '../../src/store/authStore'
import { dialogService } from '../../src/store/dialogStore'

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const insets = useSafeAreaInsets()
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = usePublicProfile(userId)
  const { data: userListings, isLoading: listingsLoading, refetch: refetchListings } = useListings({ sellerId: userId })
  const { user } = useAuthStore()

  if (profileLoading) {
    return (
      <View style={s.root}>
        <AppHeader title="الملف الشخصي" showBack />
        <View style={s.loadingCard} accessibilityRole="progressbar" accessibilityLabel="جارٍ تحميل الملف الشخصي">
          <SkeletonCard fullWidth imageHeight={72} compactBody />
          <Text style={s.loadingText}>جارٍ تحميل الملف الشخصي</Text>
        </View>
      </View>
    )
  }

  if (profileError) {
    return (
      <View style={s.root}>
        <AppHeader title="الملف الشخصي" showBack />
        <View style={s.center}>
          <Text style={s.emptyTxt} accessibilityRole="alert">تعذر تحميل الملف الشخصي</Text>
          <TouchableOpacity style={s.retryButton} onPress={() => { void refetchProfile() }} accessibilityRole="button" accessibilityLabel="إعادة المحاولة">
            <Text style={s.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={s.root}>
        <AppHeader title="الملف الشخصي" showBack />
        <View style={s.center}><Text style={s.emptyTxt}>الملف الشخصي غير موجود</Text></View>
      </View>
    )
  }

  const displayName = profile?.displayName ?? profile?.username ?? 'مستخدم'
  const joinYear = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '—'
  const handleChat = async () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    if (user.id === userId) {
      dialogService.alert('تنبيه', 'لا يمكنك محادثة نفسك')
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
        dialogService.alert('خطأ', 'لم يتم إرجاع المحادثة من الخادم')
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message
      const parsedMsg = Array.isArray(errorMsg) ? errorMsg.join('\\n') : (typeof errorMsg === 'string' ? errorMsg : 'تعذر فتح المحادثة')
      dialogService.alert('خطأ', parsedMsg)
    }
  }

  return (
    <View style={s.root}>
      <AppHeader title="الملف الشخصي" showBack />

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={profileLoading || listingsLoading} onRefresh={() => { void Promise.all([refetchProfile(), refetchListings()]) }} />}
      >
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
                <VerifiedBadge size={20} />
              </View>
            )}
          </View>
          <Text style={s.name}>{displayName}</Text>
          {(profile.governorateRef?.nameAr || profile.wilayaRef?.nameAr || profile.governorate) && (
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={s.locationTxt}>{profile.governorateRef?.nameAr ?? profile.wilayaRef?.nameAr ?? profile.governorate}</Text>
            </View>
          )}
          {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
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
            {profile?.isVerified ? (
              <VerifiedBadge size={24} />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={24} color={Colors.border} />
            )}
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
                    onPress={() => router.push(`/cars/${item.id}` as any)}
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
        <TouchableOpacity
          style={s.chatBtn}
          onPress={handleChat}
          activeOpacity={0.9}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color={Colors.white} />
          <Text style={s.chatTxt}>محادثة</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCard: { margin: Spacing.space4, minHeight: 140, backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', gap: Spacing.space3, padding: Spacing.space3 },
  loadingText: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: 20, color: Colors.textMuted },
  retryButton: { minHeight: Spacing.touch, minWidth: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.space4, marginTop: Spacing.space3, borderRadius: Radius.md, backgroundColor: Colors.primary },
  retryText: { fontFamily: 'Almarai_700Bold', fontSize: 14, lineHeight: 20, color: Colors.white },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  profileCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.space4,
    alignItems: 'center', marginBottom: Spacing.space4, borderWidth: 1, borderColor: Colors.border,
  },
  avatarBox: { position: 'relative', marginBottom: Spacing.space3 },
  avatar: { width: 80, height: 80, borderRadius: Radius.pill, borderWidth: 3, borderColor: Colors.surfaceAlt },
  avatarFallback: { backgroundColor: Colors.paleMint, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 32, lineHeight: 40, color: Colors.primary },
  verified: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: Colors.white, borderRadius: Radius.pill,
    padding: 1.5,
  },
  name: { fontFamily: 'Almarai_700Bold',  fontSize: 20, lineHeight: 28, color: Colors.text, writingDirection: 'rtl' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 13, lineHeight: 20, color: Colors.textMuted },
  bio: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: 22, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.space2 },
  statsRow: { flexDirection: 'row', gap: Spacing.space3, marginBottom: Spacing.space6 },
  statBox: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.space3, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statVal: { fontFamily: 'Almarai_700Bold',  fontSize: 16, lineHeight: 24, color: Colors.text, marginVertical: 4 },
  statLbl: { fontFamily: 'Almarai_400Regular',  fontSize: 12, lineHeight: 18, color: Colors.text2 },
  sectionTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, lineHeight: 26, color: Colors.text, marginBottom: Spacing.space3, writingDirection: 'rtl' },
  list: { gap: Spacing.space4 },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: Spacing.space3 },
  emptyTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.text2, fontSize: 16, lineHeight: 24 },
  contactBar: {
    position: 'absolute', bottom: 0, start: 0, end: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', gap: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: Colors.text, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 16,
  },
  chatBtn: { flex: 1, height: 56, backgroundColor: Colors.primary, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  chatTxt: { fontFamily: 'Almarai_800ExtraBold',  color: Colors.white, fontSize: 16, lineHeight: 24 },
})

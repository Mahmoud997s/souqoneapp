import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { chatApi } from '../../src/api/chat'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { VerifiedBadge } from '../../src/components/ui/VerifiedBadge'
import { usePublicProfile } from '../../src/hooks/useProfile'
import { usePublicProfileCars } from '../../src/hooks/public-profile/usePublicProfileCars'
import { usePublicProfileBuses } from '../../src/hooks/public-profile/usePublicProfileBuses'
import { usePublicProfileEquipment } from '../../src/hooks/public-profile/usePublicProfileEquipment'
import { usePublicProfileParts } from '../../src/hooks/public-profile/usePublicProfileParts'
import { usePublicProfileServices } from '../../src/hooks/public-profile/usePublicProfileServices'
import { PublicProfileListingVertical } from '../../src/hooks/public-profile/publicProfileKeys'
import { PublicProfileTabs } from '../../src/components/profile/public-profile/PublicProfileTabs'
import { PublicProfileSectionList } from '../../src/components/profile/public-profile/PublicProfileSectionList'
import { UnifiedCardItem } from '../../src/types/unified-card.types'
import { useAuthStore } from '../../src/store/authStore'
import { dialogService } from '../../src/store/dialogStore'

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<PublicProfileListingVertical>('car')
  const profileQuery = usePublicProfile(userId)
  const { data: profile, isLoading: profileLoading, isError: profileError, error: profileErrorDetails, refetch: refetchProfile } = profileQuery
  const carsQuery = usePublicProfileCars(userId, activeTab === 'car')
  const busesQuery = usePublicProfileBuses(userId, activeTab === 'bus')
  const equipmentQuery = usePublicProfileEquipment(userId, activeTab === 'equipment')
  const partsQuery = usePublicProfileParts(userId, activeTab === 'part')
  const servicesQuery = usePublicProfileServices(userId, activeTab === 'service')
  const activeInventoryQuery = activeTab === 'car' ? carsQuery : activeTab === 'bus' ? busesQuery : activeTab === 'equipment' ? equipmentQuery : activeTab === 'part' ? partsQuery : servicesQuery
  const { user, isLoading: authLoading } = useAuthStore()

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

  const isProfileNotFound = isHttpNotFound(profileErrorDetails)

  if (isProfileNotFound) {
    return (
      <View style={s.root}>
        <AppHeader title="الملف الشخصي" showBack />
        <View style={s.center}><Text style={s.emptyTxt}>الملف الشخصي غير موجود</Text></View>
      </View>
    )
  }

  if (profileError && !profile) {
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
  const inventoryItems = activeInventoryQuery?.data?.pages.flatMap((page) => page.data) ?? []
  const profileCount = profile._count.listings + profile._count.busListings + profile._count.equipmentListings + profile._count.spareParts + profile._count.carServices
  const inventoryHeader = (
    <>
      {profileError && (
        <View style={s.refreshError}>
          <Text style={s.refreshErrorText}>تعذر تحديث بيانات الملف الشخصي</Text>
          <TouchableOpacity onPress={() => { void refetchProfile() }} accessibilityRole="button" accessibilityLabel="إعادة محاولة تحديث الملف الشخصي">
            <Text style={s.refreshRetryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.profileCard}>
        <View style={s.avatarBox}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}><Text style={s.avatarLetter}>{displayName.charAt(0)}</Text></View>
          )}
          {profile.isVerified && <View style={s.verified}><VerifiedBadge size={20} /></View>}
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
          <Text style={s.statVal}>{profileCount}</Text>
          <Text style={s.statLbl}>إعلانات</Text>
        </View>
        <View style={s.statBox}>
          <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
          <Text style={s.statVal}>{joinYear}</Text>
          <Text style={s.statLbl}>عضو منذ</Text>
        </View>
        <View style={s.statBox}>
          {profile.isVerified ? <VerifiedBadge size={24} /> : <Ionicons name="checkmark-circle-outline" size={24} color={Colors.border} />}
          <Text style={s.statVal}>{profile.isVerified ? 'موثّق' : 'غير موثّق'}</Text>
          <Text style={s.statLbl}>الحالة</Text>
        </View>
      </View>
      <PublicProfileTabs counts={profile._count} selected={activeTab} onSelect={setActiveTab} />
    </>
  )
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

      <PublicProfileSectionList
        contentContainerStyle={{ paddingHorizontal: Spacing.space4, paddingBottom: 16 + 56 + Math.max(insets.bottom, 16) + 1 }}
        vertical={activeTab}
        header={inventoryHeader}
        items={inventoryItems}
        isLoading={activeInventoryQuery?.isLoading ?? false}
        isError={activeInventoryQuery?.isError ?? false}
        isRefreshing={Boolean(profileQuery.isRefetching || (activeInventoryQuery?.isRefetching && !activeInventoryQuery.isFetchingNextPage))}
        isFetchingNextPage={activeInventoryQuery?.isFetchingNextPage ?? false}
        hasNextPage={Boolean(activeInventoryQuery?.hasNextPage)}
        onRefresh={() => { void Promise.all([refetchProfile(), activeInventoryQuery?.refetch() ?? Promise.resolve()]) }}
        onRetry={() => {
          if (activeInventoryQuery?.isFetchNextPageError) void activeInventoryQuery.fetchNextPage()
          else void activeInventoryQuery?.refetch()
        }}
        onLoadMore={() => { if (activeInventoryQuery?.hasNextPage) void activeInventoryQuery.fetchNextPage() }}
        onPressItem={(item: UnifiedCardItem) => {
          if (activeTab === 'car') router.push({ pathname: '/cars/[id]', params: { id: item.id } })
          if (activeTab === 'bus') router.push({ pathname: '/buses/[id]', params: { id: item.id } })
          if (activeTab === 'equipment') router.push({ pathname: '/equipment/[id]', params: { id: item.id } })
          if (activeTab === 'part') router.push({ pathname: '/parts/[id]', params: { id: item.id } })
          if (activeTab === 'service') router.push({ pathname: '/services/[id]', params: { id: item.id } })
        }}
      />

      {!authLoading && (
        <View style={[s.contactBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={s.chatBtn}
            onPress={user?.id === userId ? () => router.push('/profile/edit-profile') : handleChat}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={user?.id === userId ? 'تعديل ملفي الشخصي' : 'محادثة'}
          >
            <Ionicons
              name={user?.id === userId ? 'create-outline' : 'chatbubble-ellipses'}
              size={22}
              color={Colors.white}
            />
            <Text style={s.chatTxt}>{user?.id === userId ? 'تعديل ملفي الشخصي' : 'محادثة'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

function isHttpNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) return false
  const response = error.response
  return Boolean(response && typeof response === 'object' && 'status' in response && response.status === 404)
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCard: { margin: Spacing.space4, minHeight: 140, backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', gap: Spacing.space3, padding: Spacing.space3 },
  loadingText: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: 20, color: Colors.textMuted },
  retryButton: { minHeight: Spacing.touch, minWidth: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.space4, marginTop: Spacing.space3, borderRadius: Radius.md, backgroundColor: Colors.primary },
  retryText: { fontFamily: 'Almarai_700Bold', fontSize: 14, lineHeight: 20, color: Colors.white },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  refreshError: { marginBottom: Spacing.space3, padding: Spacing.space3, borderRadius: Radius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, gap: Spacing.space2 },
  refreshErrorText: { fontFamily: 'Almarai_400Regular', fontSize: 13, lineHeight: 20, color: Colors.textMuted, textAlign: 'center' },
  refreshRetryText: { fontFamily: 'Almarai_700Bold', fontSize: 14, lineHeight: 20, color: Colors.primary, textAlign: 'center' },
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

import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { chatApi } from '../../src/api/chat'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { PublicProfileTokens } from '../../src/constants/publicProfileTokens'
import { PublicProfileHero } from '../../src/components/profile/public-profile/PublicProfileHero'
import { PublicProfileTabs } from '../../src/components/profile/public-profile/PublicProfileTabs'
import { PublicProfileSectionList } from '../../src/components/profile/public-profile/PublicProfileSectionList'
import { PublicProfileTopBar } from '../../src/components/profile/public-profile/PublicProfileTopBar'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { usePublicProfileCars } from '../../src/hooks/public-profile/usePublicProfileCars'
import { usePublicProfileBuses } from '../../src/hooks/public-profile/usePublicProfileBuses'
import { usePublicProfileEquipment } from '../../src/hooks/public-profile/usePublicProfileEquipment'
import { usePublicProfileParts } from '../../src/hooks/public-profile/usePublicProfileParts'
import { usePublicProfileServices } from '../../src/hooks/public-profile/usePublicProfileServices'
import { PublicProfileListingVertical } from '../../src/hooks/public-profile/publicProfileKeys'
import { usePublicProfile } from '../../src/hooks/useProfile'
import { useAuthStore } from '../../src/store/authStore'
import { dialogService } from '../../src/store/dialogStore'
import { UnifiedCardItem } from '../../src/types/unified-card.types'
import { findNewestPublicProfileChatTarget } from '../../src/utils/publicProfileChatTarget'

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

  const background = (
    <>
      <LinearGradient
        colors={PublicProfileTokens.pageGlowColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 1, y: 0.85 }}
        style={s.topGlow}
        pointerEvents="none"
      />
      <PublicProfileTopBar topInset={insets.top} onBack={() => router.back()} />
    </>
  )

  if (profileLoading) {
    return (
      <View style={s.root}>
        {background}
        <View style={[s.loadingContent, { paddingTop: insets.top + PublicProfileTokens.topBarTopOffset + PublicProfileTokens.topBarSize + Spacing.space4 }]}>
          <View style={s.loadingCard} accessibilityRole="progressbar" accessibilityLabel="جارٍ تحميل الملف الشخصي">
            <SkeletonCard fullWidth imageHeight={72} compactBody />
            <Text style={s.loadingText}>جارٍ تحميل الملف الشخصي</Text>
          </View>
        </View>
      </View>
    )
  }

  const isProfileNotFound = isHttpNotFound(profileErrorDetails)
  if (isProfileNotFound || (!profile && !profileError)) {
    return (
      <View style={s.root}>
        {background}
        <View style={[s.stateContent, { paddingTop: insets.top + PublicProfileTokens.topBarTopOffset + PublicProfileTokens.topBarSize }]}>
          <Text style={s.stateText}>الملف الشخصي غير موجود</Text>
        </View>
      </View>
    )
  }

  if (profileError && !profile) {
    return (
      <View style={s.root}>
        {background}
        <View style={[s.stateContent, { paddingTop: insets.top + PublicProfileTokens.topBarTopOffset + PublicProfileTokens.topBarSize }]}>
          <Text style={s.stateText} accessibilityRole="alert">تعذر تحميل الملف الشخصي</Text>
          <TouchableOpacity style={s.retryButton} onPress={() => { void refetchProfile() }} accessibilityRole="button" accessibilityLabel="إعادة المحاولة">
            <Text style={s.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!profile) return null

  const profileCount = profile._count.listings + profile._count.busListings + profile._count.equipmentListings + profile._count.spareParts + profile._count.carServices
  const isOwner = user?.id === userId
  const action = authLoading ? undefined : isOwner ? 'owner' : profileCount > 0 ? 'visitor' : undefined
  const inventoryItems = activeInventoryQuery?.data?.pages.flatMap((page) => page.data) ?? []

  const handleChat = async () => {
    if (!user) {
      router.push({ pathname: '/(auth)/login' })
      return
    }
    if (isOwner) {
      return
    }
    try {
      const target = await findNewestPublicProfileChatTarget(userId)
      if (!target) {
        dialogService.alert('تعذر فتح المحادثة', 'لم نعثر على إعلان نشط. أعد المحاولة.')
        return
      }
      const response = await chatApi.createRoom(target)
      const conversationId = response.data?.id
      if (conversationId) router.push({ pathname: '/chat/[id]', params: { id: conversationId } })
      else dialogService.alert('تعذر فتح المحادثة', 'أعد المحاولة لبدء المحادثة.')
    } catch {
      dialogService.alert('تعذر فتح المحادثة', 'حدث خطأ مؤقت. أعد المحاولة.')
    }
  }

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
      <PublicProfileHero
        profile={profile}
        action={action ? { kind: action, onPress: action === 'owner' ? () => router.push('/profile/edit-profile') : handleChat } : undefined}
      />
      <PublicProfileTabs counts={profile._count} selected={activeTab} onSelect={setActiveTab} />
    </>
  )

  return (
    <View style={s.root}>
      {background}
      <PublicProfileSectionList
        contentContainerStyle={{
          paddingHorizontal: Spacing.space4,
          paddingTop: insets.top + PublicProfileTokens.topBarTopOffset + PublicProfileTokens.topBarSize + Spacing.space4,
          paddingBottom: Math.max(insets.bottom, Spacing.space4) + Spacing.space4,
        }}
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
  topGlow: { position: 'absolute', top: 0, start: 0, end: 0, height: PublicProfileTokens.pageTopGlowHeight },
  loadingContent: { flex: 1, paddingHorizontal: Spacing.space4 },
  loadingCard: { minHeight: 140, backgroundColor: Colors.white, borderRadius: PublicProfileTokens.heroRadius, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', gap: Spacing.space3, padding: Spacing.space3 },
  loadingText: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: 20, color: Colors.textMuted },
  stateContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.space3, paddingHorizontal: Spacing.space4 },
  stateText: { fontFamily: 'Almarai_700Bold', color: Colors.text, fontSize: 16, lineHeight: 24, textAlign: 'center', writingDirection: 'rtl' },
  retryButton: { minHeight: Spacing.touch, minWidth: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.space4, borderRadius: PublicProfileTokens.actionRadius, backgroundColor: Colors.primary },
  retryText: { fontFamily: 'Almarai_700Bold', fontSize: 14, lineHeight: 20, color: Colors.white },
  refreshError: { marginBottom: Spacing.space3, padding: Spacing.space3, borderRadius: PublicProfileTokens.statsRadius, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, gap: Spacing.space2 },
  refreshErrorText: { fontFamily: 'Almarai_400Regular', fontSize: 13, lineHeight: 20, color: Colors.textMuted, textAlign: 'center', writingDirection: 'rtl' },
  refreshRetryText: { fontFamily: 'Almarai_700Bold', fontSize: 14, lineHeight: 20, color: Colors.primary, textAlign: 'center', writingDirection: 'rtl' },
})

import React from 'react'
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'
import { useProfileOverview } from '../../src/hooks/useProfileOverview'
import { GlassNavBar } from '../../src/components/ui/GlassNavBar'
import { ProfileHeroCard } from '../../src/components/profile/ProfileHeroCard'
import { ProfilePremiumBanner } from '../../src/components/profile/ProfilePremiumBanner'
import { ProfileSectionCard } from '../../src/components/profile/ProfileSectionCard'
import { ProfileLogoutSection } from '../../src/components/profile/ProfileLogoutSection'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const {
    user,
    locationName,
    displayName,
    handle,
    avatarUrl,
    firstLetter,
    myListings,
    favorites,
    handleBack,
    handleLogout,
    activitiesItems,
    transportItems,
    accountItems,
  } = useProfileOverview()

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── Fixed Top Navigation Bar ── */}
      <GlassNavBar
        title="الملف الشخصي"
        paddingTop={insets.top}
        onBackPress={handleBack}
        actions={[
          { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as any), accessibilityLabel: 'الرسائل والمحادثات' },
          { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as any), accessibilityLabel: 'الإشعارات' },
          { icon: 'create-outline', onPress: () => router.push('/profile/edit-profile' as any), accessibilityLabel: 'تعديل الملف الشخصي' },
        ]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          {
            paddingTop: insets.top + 66,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >
        {/* ── User Profile Card ── */}
        <ProfileHeroCard
          displayName={displayName}
          handle={handle}
          avatarUrl={avatarUrl}
          firstLetter={firstLetter}
          isVerified={user?.isVerified}
          listingsCount={myListings?.length ?? 0}
          favoritesCount={favorites?.length ?? 0}
          locationName={locationName}
        />

        {/* ── Subscription Card ── */}
        <ProfilePremiumBanner />

        {/* ── Section 1: النشاط والإعلانات ── */}
        <ProfileSectionCard title="نشاطي وإعلاناتي" items={activitiesItems} />

        {/* ── Section 2: خدمات النقل ── */}
        <ProfileSectionCard title="خدمات النقل واللوجستيات" items={transportItems} />

        {/* ── Section 3: الحساب والأمان ── */}
        <ProfileSectionCard title="الحساب والإعدادات" items={accountItems} />

        {/* ── Support & Help Button ── */}
        <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 10 }} />

        {/* ── Logout Button & Version ── */}
        <ProfileLogoutSection onLogout={handleLogout} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
  },
})
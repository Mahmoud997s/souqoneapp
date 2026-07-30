import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Dimensions, Platform, StatusBar, I18nManager,
} from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { Gradients } from '../../src/constants/gradients'
import { Spacing } from '../../src/constants/spacing'
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader'
import { Radius } from '../../src/constants/radius'
import { useJobsRaw } from '../../src/hooks/useJobs'
import { useDrivers } from '../../src/hooks/useDrivers'
import { useMyDriverProfile } from '../../src/hooks/useDriverProfile'
import { useMyEmployerProfile } from '../../src/hooks/useEmployerProfile'
import { useAuthStore } from '../../src/store/authStore'
import { useJobProfileStore } from '../../src/store/jobProfileStore'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { JobCard } from '../../src/components/cards/JobCard'
import { DriverCard } from '../../src/components/cards/DriverCard'
import { normalizeJobType } from '../../src/utils/normalizeJobType'
import VerificationBanner from '../../src/components/jobs/VerificationBanner'
import { useVerificationStatus } from '../../src/hooks/useVerification'

const { width: SW } = Dimensions.get('window')

// ─── Animation Constants Removed (Handled by AnimatedHeroHeader) ──────────────

// ─── Quick Action Card ────────────────────────────────────────────────────────
function ActionCard({
  icon, label, desc, color, bg, onPress,
}: {
  icon: string; label: string; desc: string
  color: string; bg: string; onPress: () => void
}) {
  return (
    <TouchableOpacity style={[act.card, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[act.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={act.textBox}>
        <Text style={[act.label, { color: Colors.text }]} numberOfLines={1}>{label}</Text>
        <Text style={act.desc} numberOfLines={1}>{desc}</Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={st.pill}>
      <Ionicons name={icon as any} size={18} color={Colors.white} />
      <Text style={st.value}>{value}</Text>
      <Text style={st.label}>{label}</Text>
    </View>
  )
}


const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

function DriversSwiper({ drivers }: { drivers: any[] }) {
  if (!drivers || drivers.length === 0) return null
  return (
    <View style={{ marginTop: 0, marginBottom: Spacing.space2 }}>
      <Text style={s.sectionTitle}>سائقين جاهزين للعمل</Text>
      <FlatList
        data={drivers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.space4, gap: Spacing.space4 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={s.driverCircleCard}
            onPress={() => router.push(`/jobs/drivers/${item.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={s.driverCircleAvatarWrap}>
              {item.user?.avatarUrl ? (
                <Image source={{ uri: item.user.avatarUrl }} style={s.driverCircleAvatar} />
              ) : (
                <View style={[s.driverCircleAvatar, { backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 24, color: Colors.primary,  }}>
                    {item.user?.displayName?.[0] || 'س'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.driverCircleName} numberOfLines={1}>
              {item.user?.displayName || 'سائق'}
            </Text>
            <View style={s.driverCircleRating}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={s.driverCircleRatingTxt}>{item.averageRating ? item.averageRating.toFixed(1) : 'جديد'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

export default function JobsLandingScreen() {
  const insets = useSafeAreaInsets()
  const isRTL = I18nManager.isRTL
  const { user } = useAuthStore()
  const { activeRole } = useJobProfileStore()
  const { data: jobs, isLoading: jobsLoading } = useJobsRaw({ limit: 15 })
  const { data: driversPage, isLoading: driversLoading } = useDrivers({ limit: 15 })
  
  const { data: driverProfile, isLoading: dLoading } = useMyDriverProfile()
  const { data: employerProfile, isLoading: eLoading } = useMyEmployerProfile()
  const { data: verification } = useVerificationStatus()

  useEffect(() => {
    // If role already set in session, do nothing
    if (activeRole) return

    // Wait for queries to finish
    if (dLoading || eLoading) return

    // If backend has profile, update session
    if (driverProfile) {
      useJobProfileStore.getState().setActiveRole('driver')
    } else if (employerProfile) {
      useJobProfileStore.getState().setActiveRole('employer')
    } else {
      // New user (no profile anywhere) -> redirect to onboarding instantly
      router.replace('/jobs/onboarding' as any)
    }
  }, [dLoading, eLoading, driverProfile, employerProfile, activeRole])

  // ─── Banner state ───
  const [activeBanner, setActiveBanner] = useState(0)

  // ─── Scroll animation (Reanimated ─ runs on UI thread) ───
  const scrollY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const totalJobs = (jobs?.length ?? 0)
  const totalDrivers = (driversPage as any)?.total ?? (driversPage as any)?.count ?? 0

  const isEmployer = activeRole === 'employer'
  const isDriver   = activeRole === 'driver'
  const hasProfile = !!activeRole


  // ─── Filtered Data ───
  const hiringJobs = useMemo(() => jobs?.filter((j: any) => normalizeJobType(j.jobType) === 'HIRING').slice(0, 3) || [], [jobs])
  const serviceJobs = useMemo(() => jobs?.filter((j: any) => normalizeJobType(j.jobType) === 'OFFERING').slice(0, 3) || [], [jobs])
  const topDrivers = useMemo(() => {
    const arr = (driversPage as any)?.items || (driversPage as any)?.drivers || (driversPage as any)?.data || (Array.isArray(driversPage) ? driversPage : [])
    return [...arr].sort((a: any, b: any) => (b.averageRating || 0) - (a.averageRating || 0))
  }, [driversPage])

  // ─── Header Content (Banners, Actions, etc) ───
  const HeaderContent = useCallback(() => (
    <>
      {/* ── NOT REGISTERED YET ── */}
      {!hasProfile && (
        <View style={s.profileCta}>
          <Ionicons name="person-circle-outline" size={36} color={Colors.primary} />
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={s.profileCtaTitle}>أكمل بروفايلك</Text>
            <Text style={s.profileCtaDesc}>سجّل كسائق أو صاحب عمل للاستفادة الكاملة</Text>
          </View>
          <TouchableOpacity style={s.profileCtaBtn} onPress={() => router.push('/jobs/onboarding' as any)}>
            <Text style={s.profileCtaBtnTxt}>ابدأ</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasProfile && (!verification || verification.status?.toUpperCase() !== 'APPROVED') && (
        <View style={{ marginHorizontal: Spacing.space5, marginTop: Spacing.space1 }}>
          <VerificationBanner status={verification?.status} rejectionReason={verification?.rejectionReason} />
        </View>
      )}

      {/* ── DRIVERS SWIPER ── */}
      <DriversSwiper drivers={topDrivers} />

      {/* ── QUICK ACTIONS ── */}
      <Text style={s.sectionTitle}>ماذا تريد؟</Text>
      <View style={s.actionsGrid}>
        <ActionCard
          icon="briefcase-outline" label="تصفح الوظائف"
          desc="أحدث الفرص المتاحة"
          color={Colors.primary} bg="#EFF6FF"
          onPress={() => router.push('/jobs/browse' as any)}
        />
        <ActionCard
          icon="people-outline" label="دليل السائقين"
          desc="تواصل مع سائق محترف"
          color="#16a34a" bg="#F0FDF4"
          onPress={() => router.push('/jobs/drivers' as any)}
        />
        <ActionCard
          icon="add-circle-outline" label="انشر وظيفة"
          desc="أضف إعلان توظيف"
          color="#d97706" bg="#FFFBEB"
          onPress={() => router.push('/jobs/create' as any)}
        />
        <ActionCard
          icon="analytics-outline" label="لوحة التحكم"
          desc="إعلاناتي وطلباتي"
          color="#7c3aed" bg="#F5F3FF"
          onPress={() => router.push('/jobs/dashboard' as any)}
        />
      </View>

      <View style={{ height: Spacing.space4 }} />
    </>
  ), [hasProfile, user, activeBanner, verification, topDrivers])

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as any}
        title="ســوق ون للوظائف"
        titleAccent="وظيفة او سائقك المثالي"
        navSearchPlaceholder="ابحث عن وظيفة..."
        onNavSearchPress={() => router.push('/jobs/browse' as any)}
        heroSearchPlaceholder="ابحث عن وظيفة أو سائق..."
        onHeroSearchPress={() => router.push('/jobs/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'انشر وظيفة',
          icon: 'add-circle-outline',
          onPress: () => router.push('/jobs/create' as any)
        }}
        outlineCta={{
          label: hasProfile ? 'لوحة التحكم' : 'سجّل كسائق',
          icon: hasProfile ? 'grid-outline' : 'car-outline',
          onPress: () => router.push((hasProfile ? '/jobs/dashboard' : '/jobs/onboarding') as any)
        }}
      />

      {/* ═══════════════ MAIN CONTENT (ScrollView) ═══════════════ */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 185 + 4, paddingBottom: 100 },
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <HeaderContent />

        {/* Section 1: Hiring Jobs */}
        <View style={s.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitleHeader}>أحدث طلبات التوظيف</Text>
            <Text style={s.sectionSubHeader}>شركات تبحث عن سائقين الآن</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/jobs/browse?jobType=HIRING' as any)} style={s.seeAllBtn}>
            <Text style={s.seeAllTxt}>الكل</Text>
            <Ionicons name="chevron-back" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 10 }}>
           {jobsLoading ? (
             <><SkeletonCard style={{ marginBottom: Spacing.space4 }} /><SkeletonCard style={{ marginBottom: Spacing.space4 }} /></>
           ) : hiringJobs.length > 0 ? (
             hiringJobs.map((job: any) => <JobCard key={job.id ?? job._id} job={job} onPress={() => router.push(`/jobs/${job.id ?? job._id}` as any)} />)
           ) : (
             <View style={s.emptyBox}>
               <Ionicons name="briefcase-outline" size={40} color={Colors.border} />
               <Text style={s.emptyTxt}>لا توجد طلبات توظيف حالياً</Text>
             </View>
           )}
        </View>

        {/* Section 2: Top Drivers */}
        <View style={s.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitleHeader}>سائقون متميزون</Text>
            <Text style={s.sectionSubHeader}>محترفون متاحون للعمل الآن</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/jobs/drivers' as any)} style={s.seeAllBtn}>
            <Text style={s.seeAllTxt}>الكل</Text>
            <Ionicons name="chevron-back" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 10 }}>
           {driversLoading ? (
             <><SkeletonCard style={{ marginBottom: Spacing.space4 }} /><SkeletonCard style={{ marginBottom: Spacing.space4 }} /></>
           ) : topDrivers.length > 0 ? (
             topDrivers.map((driver: any) => <DriverCard key={driver.id ?? driver._id} driver={driver} onPress={() => router.push(`/jobs/drivers/${driver.id ?? driver._id}` as any)} />)
           ) : (
             <View style={s.emptyBox}>
               <Ionicons name="person-outline" size={40} color={Colors.border} />
               <Text style={s.emptyTxt}>لا يوجد سائقين حالياً</Text>
             </View>
           )}
        </View>

        {/* Section 3: Service Jobs */}
        <View style={s.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.sectionTitleHeader}>سائقون يعرضون خدماتهم</Text>
            <Text style={s.sectionSubHeader}>يبحثون عن فرصة عمل الآن</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/jobs/browse?jobType=OFFERING' as any)} style={s.seeAllBtn}>
            <Text style={s.seeAllTxt}>الكل</Text>
            <Ionicons name="chevron-back" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 10, marginBottom: Spacing.space6 }}>
           {jobsLoading ? (
             <><SkeletonCard style={{ marginBottom: Spacing.space4 }} /><SkeletonCard style={{ marginBottom: Spacing.space4 }} /></>
           ) : serviceJobs.length > 0 ? (
             serviceJobs.map((job: any) => <JobCard key={job.id ?? job._id} job={job} onPress={() => router.push(`/jobs/${job.id ?? job._id}` as any)} />)
           ) : (
             <View style={s.emptyBox}>
               <Ionicons name="car-outline" size={40} color={Colors.border} />
               <Text style={s.emptyTxt}>لا توجد خدمات معروضة حالياً</Text>
             </View>
           )}
        </View>
      </Animated.ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const act = StyleSheet.create({
  card: {
    width: (SW - Spacing.space5 * 2 - Spacing.space4) / 2,
    flexDirection: 'row',
    borderRadius: Radius.lg, padding: Spacing.space3,
    gap: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  iconBox: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  textBox: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', gap: 4 },
  label:   { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.text, textAlign: 'left', writingDirection: 'rtl' },
  desc:    { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.text2, textAlign: 'left', writingDirection: 'rtl' },
})

const st = StyleSheet.create({
  pill:   { alignItems: 'center', flex: 1, gap: 2 },
  value:  { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.white },
  label:  { fontFamily: 'Almarai_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.75)' },
})

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surface },
  content: { gap: 0 },

  // ─── Sections ───
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, marginTop: Spacing.space5, marginBottom: Spacing.space3,
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.text,
    paddingHorizontal: 10,
    marginTop: Spacing.space5, marginBottom: Spacing.space3,
    alignSelf: 'flex-start',
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.text,
    textAlign: 'left', writingDirection: 'rtl',
  },
  sectionSubHeader: {
    fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted,
    marginTop: 2, textAlign: 'left', writingDirection: 'rtl',
  },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    backgroundColor: Colors.primary + '10', borderRadius: Radius.pill,
  },
  seeAllTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.primary },

  // ─── Actions grid ───
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: Spacing.space4,
    marginBottom: 0,
  },

  // ─── Job cards container ───
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.space6, gap: Spacing.space2 },
  emptyTxt: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.textMuted },

  // ─── Driver banner ───
  driverBannerGrad: { padding: Spacing.space5, flexDirection: 'row', overflow: 'hidden', minHeight: 110, borderRadius: Radius.lg },
  driverBannerContent: { flex: 1, gap: Spacing.space1, alignItems: 'flex-start' },
  driverBannerTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.white },
  driverBannerSub:   { fontFamily: 'Almarai_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  driverBannerBtn: {
    marginTop: Spacing.space3, flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    backgroundColor: Colors.white, alignSelf: 'flex-start',
    paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill,
  },
  driverBannerBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: '#059669' },
  driverBannerIcon:   { position: 'absolute', end: -16, bottom: -12 },

  // ─── Profile CTA ───
  profileCta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space3,
    marginHorizontal: Spacing.space5, marginTop: Spacing.space1,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
    padding: Spacing.space4,
    ...Platform.select({
      ios:     { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  profileCtaTitle: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.text },
  profileCtaDesc:  { fontFamily: 'Almarai_400Regular', fontSize: 12, color: Colors.text2, marginTop: 2 },
  profileCtaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space3,
  },
  profileCtaBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.white },

  // ─── DRIVER SWIPER ───
  driverCircleCard: {
    alignItems: 'center',
    width: 76,
  },
  driverCircleAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.space2,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 2,
  },
  driverCircleAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  driverCircleName: {
    fontFamily: 'Almarai_700Bold',
    
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
    width: '100%',
  },
  driverCircleRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  driverCircleRatingTxt: {
    fontFamily: 'Almarai_700Bold',
    
    fontSize: 10,
    color: '#D97706',
  },
})

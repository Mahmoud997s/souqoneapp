import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Dimensions, Platform, StatusBar, I18nManager,
} from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { Colors } from '../../src/constants/colors'
import { Gradients } from '../../src/constants/gradients'
import { Spacing } from '../../src/constants/spacing'
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

const { width: SW } = Dimensions.get('window')

// ─── Animation Constants ──────────────────────────────────────────────────────
const THRESHOLD  = 40   // Dead zone: no animation in first 40px
const ANIM_RANGE = 140  // Animation happens over 140px (40→180)
const ANIM_END   = THRESHOLD + ANIM_RANGE // 180

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

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export default function JobsLandingScreen() {
  const insets = useSafeAreaInsets()
  const isRTL = I18nManager.isRTL
  const { user } = useAuthStore()
  const { activeRole } = useJobProfileStore()
  const { data: jobs, isLoading: jobsLoading } = useJobsRaw({ limit: 15 })
  const { data: driversPage, isLoading: driversLoading } = useDrivers({ limit: 3 })
  
  const { data: driverProfile, isLoading: dLoading } = useMyDriverProfile()
  const { data: employerProfile, isLoading: eLoading } = useMyEmployerProfile()

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

  // ─── Dynamic heights ───
  const COMPACT_HEIGHT = insets.top + 56
  const HERO_HEIGHT    = insets.top + 215 // Hero: top bar + title + search + buttons ───

  // ─── Animated Styles (UI Thread) ───
  const headerAnimStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [HERO_HEIGHT, HERO_HEIGHT, COMPACT_HEIGHT],
      Extrapolation.CLAMP
    ),
    borderBottomLeftRadius: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [32, 32, 0],
      Extrapolation.CLAMP
    ),
    borderBottomRightRadius: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [32, 32, 0],
      Extrapolation.CLAMP
    ),
  }))

  const heroContentAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.5],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }))

  const heroSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.6],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }))

  const navSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD + ANIM_RANGE * 0.4, ANIM_END],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }))

  // ─── Filtered Data ───
  const hiringJobs = useMemo(() => jobs?.filter((j: any) => normalizeJobType(j.jobType) === 'HIRING').slice(0, 3) || [], [jobs])
  const serviceJobs = useMemo(() => jobs?.filter((j: any) => normalizeJobType(j.jobType) === 'OFFERING').slice(0, 3) || [], [jobs])
  const topDrivers = useMemo(() => {
    const arr = (driversPage as any)?.items || (driversPage as any)?.drivers || (driversPage as any)?.data || (Array.isArray(driversPage) ? driversPage : [])
    return arr.slice(0, 3)
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

      {/* ── BANNERS CAROUSEL ── */}
      <View style={{ marginTop: Spacing.space4, height: 150 }}>
        <Carousel
          style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
          loop={true}
          width={SW}
          height={150}
          autoPlay={false}
          data={[{ id: 'b1', type: 'driver' }, { id: 'b2', type: 'job' }]}
          onSnapToItem={(index) => setActiveBanner(index)}
          renderItem={({ item }) => {
            if (item.type === 'driver') {
              return (
                <View style={{ flex: 1, transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
                  <TouchableOpacity
                    style={{ width: SW, paddingHorizontal: 10, flex: 1 }}
                    onPress={() => router.push('/jobs/drivers' as any)}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#065F46', '#059669']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[s.driverBannerGrad, { flex: 1 }]}
                    >
                      <View style={s.driverBannerContent}>
                        <Text style={s.driverBannerTitle}>هل تبحث عن سائق؟</Text>
                        <Text style={s.driverBannerSub}>تواصل مع سائقين موثّقين الآن</Text>
                        <View style={s.driverBannerBtn}>
                          <Text style={s.driverBannerBtnTxt}>استعرض السائقين</Text>
                          <Ionicons name="arrow-back" size={14} color="#059669" />
                        </View>
                      </View>
                      <Ionicons name="car-sport" size={80} color="rgba(255,255,255,0.15)" style={s.driverBannerIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )
            } else {
              return (
                <View style={{ flex: 1, transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
                  <TouchableOpacity
                    style={{ width: SW, paddingHorizontal: 10, flex: 1 }}
                    onPress={() => router.push('/jobs/create' as any)}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={Gradients.hero as any}
                      locations={[0, 0.6, 1]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[s.driverBannerGrad, { flex: 1 }]}
                    >
                      <View style={s.driverBannerContent}>
                        <Text style={s.driverBannerTitle}>هل تبحث عن فرصة عمل كسائق؟</Text>
                        <Text style={s.driverBannerSub}>انضم لأكبر بورصة سائقين في عُمان</Text>
                        <View style={[s.driverBannerBtn, { backgroundColor: Colors.accent }]}>
                          <Text style={[s.driverBannerBtnTxt, { color: Colors.white }]}>ابدأ الآن - مجاناً</Text>
                        </View>
                      </View>
                      <Ionicons name="briefcase" size={80} color="rgba(255,255,255,0.1)" style={s.driverBannerIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )
            }
          }}
        />

        {/* Dots Indicator */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: Spacing.space3 }}>
          <View style={{ width: activeBanner === 0 ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: activeBanner === 0 ? Colors.primary : Colors.border }} />
          <View style={{ width: activeBanner === 1 ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: activeBanner === 1 ? Colors.primary : Colors.border }} />
        </View>
      </View>

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
  ), [hasProfile, user, activeBanner])

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedLinearGradient
        colors={Gradients.hero as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[
          s.stickyHeader,
          { paddingTop: insets.top + 8 },
          headerAnimStyle,
        ]}
      >
        {/* Grid Overlay */}
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>
        </View>

        {/* ── TOP BAR (always visible) ── */}
        <View style={s.heroTop}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push('/');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-outline" size={22} color={Colors.white} />
          </TouchableOpacity>

          {/* ── NAVBAR SEARCH (fades IN on scroll) ── */}
          <Animated.View style={[s.navSearch, navSearchAnimStyle]}>
            <TouchableOpacity
              style={s.navSearchInner}
              onPress={() => router.push('/jobs/browse' as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={16} color={Colors.white} style={{ opacity: 0.8 }} />
              <Text style={s.navSearchTxt}>ابحث عن وظيفة...</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={s.dashBtn} onPress={() => router.push('/jobs/dashboard' as any)} activeOpacity={0.7}>
            <Ionicons name="grid-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── HERO EXPANDABLE CONTENT (fades OUT on scroll) ── */}
        <Animated.View style={[s.heroCenter, heroContentAnimStyle]} pointerEvents="auto">
          <Text style={s.heroTitle}>
             ابحث عن عمل{'\n'}
            <Text style={s.heroTitleAccent}> وظيفة او سائقك المثالي</Text>
          </Text>

          {/* ── HERO SEARCH BAR (fades OUT on scroll) ── */}
          <Animated.View style={[{ alignSelf: 'stretch' }, heroSearchAnimStyle]}>
            <TouchableOpacity style={s.searchBar} onPress={() => router.push('/jobs/browse' as any)} activeOpacity={0.9}>
              <View style={s.searchInnerWrapper}>
                <Ionicons name="search" size={18} color={Colors.textMuted} />
                <Text style={s.searchPlaceholder}>ابحث عن وظيفة أو سائق...</Text>
              </View>
              <View style={s.searchFilterBtn}>
                <Ionicons name="options-outline" size={18} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ── CTA BUTTONS (inside hero) ── */}
          <View style={s.ctaRow}>
            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnPrimary]}
              onPress={() => router.push('/jobs/create' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={s.ctaBtnPrimaryTxt}>انشر وظيفة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnOutline]}
              onPress={() => router.push((hasProfile ? '/jobs/dashboard' : '/jobs/onboarding') as any)}
              activeOpacity={0.8}
            >
              <Ionicons name={hasProfile ? "grid-outline" : "car-outline"} size={18} color="#FFFFFF" />
              <Text style={s.ctaBtnOutlineTxt}>{hasProfile ? 'لوحة التحكم' : 'سجّل كسائق'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </AnimatedLinearGradient>

      {/* ═══════════════ MAIN CONTENT (ScrollView) ═══════════════ */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingTop: HERO_HEIGHT + 4, paddingBottom: 100 },
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
    width: (SW - 10 * 2 - Spacing.space4) / 2,
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
  label:   { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 15, color: Colors.text, textAlign: 'left', writingDirection: 'rtl' },
  desc:    { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.text2, textAlign: 'left', writingDirection: 'rtl' },
})

const st = StyleSheet.create({
  pill:   { alignItems: 'center', flex: 1, gap: 2 },
  value:  { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: Colors.white },
  label:  { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
})

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surface },
  content: { gap: 0 },

  // ─── Sticky Header ───
  stickyHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    paddingHorizontal: 10,
    paddingBottom: Spacing.space1,
    overflow: 'hidden',
  },

  // ─── Top Bar (always visible) ───
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.space2,
  },
  dashBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ─── Navbar Search (compact, appears on scroll) ───
  navSearch: {
    flex: 1,
    marginHorizontal: Spacing.space3,
  },
  navSearchInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 40, borderRadius: 20,
    paddingHorizontal: Spacing.space3, gap: Spacing.space2,
  },
  navSearchTxt: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13,
    color: 'rgba(255,255,255,0.7)', writingDirection: 'rtl'
  },

  // ─── Hero Expandable Content ───
  heroCenter: {
    alignItems: 'center',
    paddingVertical: 0,
    marginTop: -40,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8, paddingHorizontal: Spacing.space4,
    borderRadius: Radius.pill,
    marginBottom: 0,
  },
  heroBadgeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80' },
  heroBadgeTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: 'rgba(255,255,255,0.9)' },

  heroTitle: {
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 22,
    color: Colors.white,
    lineHeight: 36,
    marginBottom: Spacing.space2,
    textAlign: 'center',
  },
  heroTitleAccent: {
    color: Colors.accent,
  },
  heroSub: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.space2,
    textAlign: 'center',
    maxWidth: '85%',
  },

  // ─── Hero Actions ───
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space3,
    width: '100%',
    paddingHorizontal: 4,
  },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: Radius.xl,
  },
  heroBtnPrimary: {
    backgroundColor: Colors.accent,
  },
  heroBtnPrimaryTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: '#FFFFFF',
  },
  heroBtnOutline: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    gap: Spacing.space1,
  },
  heroBtnOutlineTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.white,
  },

  // ─── Hero Search Bar ───
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, height: 48, borderRadius: Radius.xl,
    marginBottom: Spacing.space3,
    alignSelf: 'stretch',
    paddingStart: Spacing.space4, paddingEnd: Spacing.space1,
    gap: Spacing.space2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchInnerWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
  },
  searchPlaceholder: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, color: Colors.textMuted, fontSize: 13, flex: 1, writingDirection: 'rtl' },
  searchFilterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },

  // ─── Sections ───
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, marginTop: Spacing.space5, marginBottom: Spacing.space3,
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: Colors.text,
    paddingHorizontal: 10,
    marginTop: Spacing.space5, marginBottom: Spacing.space3,
    alignSelf: 'flex-start',
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: Colors.text,
    textAlign: 'left', writingDirection: 'rtl',
  },
  sectionSubHeader: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.textMuted,
    marginTop: 2, textAlign: 'left', writingDirection: 'rtl',
  },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    backgroundColor: Colors.primary + '10', borderRadius: Radius.pill,
  },
  seeAllTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.primary },

  // ─── CTA Buttons (inside hero) ───
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.space3,
    paddingHorizontal: 0,
    marginTop: 0,
    marginBottom: Spacing.space1,
    alignSelf: 'stretch',
  },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: Radius.xl,
    gap: Spacing.space1,
  },
  ctaBtnPrimary: {
    backgroundColor: Colors.accent,
  },
  ctaBtnPrimaryTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: '#FFFFFF',
  },
  ctaBtnOutline: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
  },
  ctaBtnOutlineTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.white,
  },

  // ─── Actions grid ───
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: Spacing.space4,
    marginBottom: 0,
  },

  // ─── Job cards container ───
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.space6, gap: Spacing.space2 },
  emptyTxt: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.textMuted },

  // ─── Driver banner ───
  driverBannerGrad: { padding: Spacing.space5, flexDirection: 'row', overflow: 'hidden', minHeight: 110, borderRadius: Radius.lg },
  driverBannerContent: { flex: 1, gap: Spacing.space1, alignItems: 'flex-start' },
  driverBannerTitle: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: Colors.white },
  driverBannerSub:   { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  driverBannerBtn: {
    marginTop: Spacing.space3, flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    backgroundColor: Colors.white, alignSelf: 'flex-start',
    paddingVertical: Spacing.space1, paddingHorizontal: Spacing.space3,
    borderRadius: Radius.pill,
  },
  driverBannerBtnTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: '#059669' },
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
  profileCtaTitle: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: Colors.text },
  profileCtaDesc:  { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: Colors.text2, marginTop: 2 },
  profileCtaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.space2, paddingHorizontal: Spacing.space3,
  },
  profileCtaBtnTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.white },
})

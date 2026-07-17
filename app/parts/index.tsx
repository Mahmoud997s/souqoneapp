import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'

import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useParts } from '../../src/hooks/useParts'

import { PartsCategoriesGrid } from '../../src/components/parts/PartsCategoriesGrid'
import { PartHorizontalList } from '../../src/components/parts/PartHorizontalList'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

export default function PartsLandingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  // Fetch Parts Data
  const { data: allParts = [], isLoading: loadingParts } = useParts({ limit: 15 })
  
  // We mock a 'featured' subset for now by just slicing
  const featuredParts = allParts.slice(0, 5)
  const newParts = allParts.slice(5, 15)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // ─── Dynamic heights ───
  const [heroContentH, setHeroContentH] = useState(160)
  const COMPACT_HEIGHT = insets.top + 56
  const HERO_HEIGHT    = insets.top + 44 + heroContentH // Exact fit

  const THRESHOLD  = 50
  const ANIM_RANGE = 80
  const ANIM_END   = THRESHOLD + ANIM_RANGE

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

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedLinearGradient
        colors={['#1f2937', '#374151', '#111827']} // Dark Gray Theme
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[
          s.stickyHeader,
          { paddingTop: insets.top + 4 },
          headerAnimStyle,
        ]}
      >
        {/* Grid Overlay */}
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
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
              onPress={() => router.push('/parts/browse' as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={16} color={Colors.white} style={{ opacity: 0.8 }} />
              <Text style={s.navSearchTxt}>ابحث عن قطع الغيار...</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={s.dashBtn} onPress={() => router.push('/profile/favorites?tab=parts' as any)} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── HERO EXPANDABLE CONTENT (fades OUT on scroll) ── */}
        <Animated.View 
          style={[s.heroCenter, heroContentAnimStyle]} 
          pointerEvents="auto"
          onLayout={(e) => setHeroContentH(e.nativeEvent.layout.height)}
        >
          <Text style={s.heroTitle}>
             سوق قطع الغيار{'\n'}
            <Text style={s.heroTitleAccent}> ابحث بكل سهولة وثقة</Text>
          </Text>

          {/* ── HERO SEARCH BAR (fades OUT on scroll) ── */}
          <Animated.View style={[{ alignSelf: 'stretch' }, heroSearchAnimStyle]}>
            <TouchableOpacity style={s.searchBar} onPress={() => router.push('/parts/browse' as any)} activeOpacity={0.9}>
              <View style={s.searchInner}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
                <Text style={s.searchPlaceholder}>عن أي قطعة تبحث؟</Text>
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
              onPress={() => router.push('/post' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#1f2937" />
              <Text style={s.ctaBtnPrimaryTxt}>اعرض قطع للبيع</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnOutline]}
              onPress={() => router.push('/parts/browse' as any)}
              activeOpacity={0.8}
            >
              <Text style={s.ctaBtnOutlineTxt}>تصفح المتاجر</Text>
              <Ionicons name="business-outline" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </AnimatedLinearGradient>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HERO_HEIGHT + Spacing.space4, paddingBottom: 100 }}
      >
        <View style={s.content}>
          <PartsCategoriesGrid />

          <PartHorizontalList
            title="قطع غيار مميزة"
            subTitle="أفضل القطع الموثوقة المتاحة حالياً"
            data={featuredParts}
            isLoading={loadingParts}
            emptyText="لا توجد قطع غيار مميزة حالياً"
            onSeeAll={() => router.push('/parts/browse' as any)}
            onPressItem={(item) => router.push(`/parts/${item.id}` as any)}
          />

          <PartHorizontalList
            title="أُضيف حديثاً"
            subTitle="أحدث قطع الغيار المضافة للسوق"
            data={newParts}
            isLoading={loadingParts}
            emptyText="لا توجد قطع غيار حديثة"
            onSeeAll={() => router.push('/parts/browse' as any)}
            onPressItem={(item) => router.push(`/parts/${item.id}` as any)}
          />
        </View>
      </Animated.ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  
  // ─── Header ───
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: Spacing.space5,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#1f2937', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 44,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  dashBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  navSearch: {
    flex: 1, marginHorizontal: Spacing.space3,
  },
  navSearchInner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    height: 38, borderRadius: 19, paddingHorizontal: Spacing.space3, gap: Spacing.space2,
  },
  navSearchTxt: {
    fontFamily: 'Almarai_400Regular', 
    fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'left', flex: 1,
  },

  heroCenter: {
    marginTop: -16,
    zIndex: 1,
  },
  heroTitle: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 22, color: Colors.white, lineHeight: 36, marginBottom: Spacing.space3, textAlign: 'center',
  },
  heroTitleAccent: {
    color: '#ea580c', // Orange Accent
  },

  // ─── Search Bar ───
  searchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, height: 52, borderRadius: Radius.xl,
    paddingStart: Spacing.space4, paddingEnd: Spacing.space1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: Spacing.space3,
  },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, flex: 1 },
  searchPlaceholder: {
    fontFamily: 'Almarai_400Regular', 
    color: Colors.textMuted, fontSize: 13, flex: 1, textAlign: 'left',
  },
  searchFilterBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#ea580c', alignItems: 'center', justifyContent: 'center',
  },

  // ─── CTA Buttons ───
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.space3, width: '100%',
  },
  ctaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: Radius.xl,
  },
  ctaBtnPrimary: {
    backgroundColor: Colors.white,
  },
  ctaBtnPrimaryTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13, color: '#1f2937', marginLeft: 6,
  },
  ctaBtnOutline: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', gap: Spacing.space1,
  },
  ctaBtnOutlineTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.white,
  },

  // ─── Content ───
  content: {
    paddingHorizontal: Spacing.space5,
  },
})

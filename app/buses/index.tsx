import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, InteractionManager,
  Dimensions, TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler, useSharedValue, useAnimatedStyle,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { useBuses } from '../../src/hooks/useBuses';

// Feature Components
import { BusActionCards } from '../../src/components/buses/landing/BusActionCards';
import { BusCategoriesGrid } from '../../src/components/buses/landing/BusCategoriesGrid';
import { BusLandingSection } from '../../src/components/buses/landing/BusLandingSection';
import { BusPromoBanner } from '../../src/components/buses/landing/BusPromoBanner';
import { BusesHowItWorks } from '../../src/components/buses/landing/BusesHowItWorks';

const { width: SW } = Dimensions.get('window');
const THRESHOLD  = 40;
const ANIM_RANGE = 140;
const ANIM_END   = THRESHOLD + ANIM_RANGE;
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Reusable Action Card (Matched from Transport)
function ActionCard({
  icon, label, desc, color, bg, onPress, iconFamily = 'Ionicons'
}: {
  icon: string; label: string; desc: string
  color: string; bg: string; onPress: () => void; iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'
}) {
  return (
    <TouchableOpacity style={[act.card, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[act.iconBox, { backgroundColor: color + '20' }]}>
        {iconFamily === 'MaterialCommunityIcons' ? (
          <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        ) : (
          <Ionicons name={icon as any} size={20} color={color} />
        )}
      </View>
      <View style={act.textBox}>
        <Text style={[act.label, { color: Colors.text }]} numberOfLines={1}>{label}</Text>
        <Text style={act.desc} numberOfLines={1}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

const act = StyleSheet.create({
  card: {
    width: (SW - Spacing.space5 * 2 - Spacing.space4) / 2,
    padding: Spacing.space2 + 4,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  textBox: { flex: 1 },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 13, textAlign: 'left', marginBottom: 2 },
  desc: { fontFamily: 'Almarai_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'left', paddingBottom: 2 },
});

export default function BusesLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const COMPACT_HEIGHT = insets.top + 56;
  const HERO_HEIGHT    = insets.top + 185;

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
  }));

  const heroContentAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.5],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const heroSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD, THRESHOLD + ANIM_RANGE * 0.6],
      [1, 1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const navSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD + ANIM_RANGE * 0.4, ANIM_END],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const [loadRest, setLoadRest] = useState(false);
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150);
    });
    return () => task.cancel();
  }, []);

  // Data is fetched inside BusLandingSection components

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── STICKY HEADER ── */}
      <AnimatedLinearGradient
        colors={Gradients.hero as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.stickyHeader, { paddingTop: insets.top + 8 }, headerAnimStyle]}
      >
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

        {/* TOP BAR */}
        <View style={s.heroTop}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => { if (router.canGoBack()) router.back(); else router.push('/'); }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-outline" size={22} color={Colors.white} />
          </TouchableOpacity>

          {/* NAVBAR SEARCH (fades IN on scroll) */}
          <Animated.View style={[s.navSearch, navSearchAnimStyle]}>
            <TouchableOpacity 
              style={s.navSearchInner}
              onPress={() => router.push('/buses/browse')}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={s.navSearchTxt}>ابحث عن حافلة...</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* RIGHT ICON FOR BALANCE (MATCH TRANSPORT DASHBTN) */}
          <TouchableOpacity style={s.dashBtn} onPress={() => router.push('/buses/favorites' as any)} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* HERO EXPANDABLE CONTENT (fades OUT on scroll) */}
        <Animated.View style={[s.heroCenter, heroContentAnimStyle]} pointerEvents="auto">
          <View style={{ alignItems: 'center', marginBottom: Spacing.space2 }}>
            <Text style={s.heroTitle}>سوق ون للحافلات</Text>
            <Text style={s.heroTitleAccent}>بيع وتأجير الحافلات بسهولة وموثوقية</Text>
          </View>

          {/* HERO SEARCH BAR */}
          <Animated.View style={[{ alignSelf: 'stretch' }, heroSearchAnimStyle]}>
            <TouchableOpacity style={s.searchBar} onPress={() => router.push('/buses/browse' as any)} activeOpacity={0.9}>
              <View style={s.searchInnerWrapper}>
                <Ionicons name="search" size={18} color={Colors.textMuted} />
                <Text style={s.searchPlaceholder}>ابحث عن ماركة، موديل، أو فئة...</Text>
              </View>
              <View style={s.searchFilterBtn}>
                <Ionicons name="options-outline" size={18} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* CTA BUTTONS (inside hero) */}
          <View style={s.ctaRow}>
            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnPrimary]}
              onPress={() => router.push('/buses/new' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={s.ctaBtnPrimaryTxt}>أضف حافلة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnOutline]}
              onPress={() => router.push('/buses/browse' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="bus-outline" size={20} color="#FFFFFF" />
              <Text style={s.ctaBtnOutlineTxt}>تصفح الحافلات</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </AnimatedLinearGradient>

      {/* ── SCROLLABLE CONTENT ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HERO_HEIGHT + 24, paddingBottom: insets.bottom + 80 }}
      >
        <View style={s.content}>
          <BusPromoBanner />
          <BusCategoriesGrid />

          {/* LISTS */}
          {loadRest && (
            <>
              <BusLandingSection 
                title="حافلات مميزة" 
                subTitle="إعلانات موثوقة ومميزة" 
                queryParams={{ isPremium: true, limit: 6 }}
                emptyText="لا توجد حافلات مميزة حالياً"
                onSeeAll={() => router.push('/buses/browse?isPremium=true')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection 
                title="الأكثر طلباً" 
                subTitle="الحافلات الأكثر شعبية وبحثاً" 
                queryParams={{ sort: 'popular', limit: 6 }}
                emptyText="لا توجد بيانات حالياً"
                onSeeAll={() => router.push('/buses/browse?sort=popular')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection 
                title="حافلات للبيع" 
                queryParams={{ busListingType: 'BUS_SALE', limit: 6 }}
                emptyText="لا توجد حافلات للبيع حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_SALE')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection 
                title="حافلات للإيجار" 
                queryParams={{ busListingType: 'BUS_RENT', limit: 6 }}
                emptyText="لا توجد حافلات للإيجار حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_RENT')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />
            </>
          )}

          <BusesHowItWorks />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  
  // ── HEADER ──
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: Spacing.space5,
    paddingBottom: Spacing.space1,
    overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space2,
    zIndex: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  dashBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  navSearch: {
    flex: 1, marginHorizontal: Spacing.space3,
  },
  navSearchInner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    height: 40, borderRadius: 20, paddingHorizontal: Spacing.space3, gap: Spacing.space2,
  },
  navSearchTxt: {
    fontFamily: 'Almarai_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'left', flex: 1, writingDirection: 'rtl'
  },

  // ── HERO ──
  heroCenter: {
    alignItems: 'center',
    paddingVertical: 0,
    marginTop: -40,
  },
  heroTitle: {
    fontFamily: 'Almarai_800ExtraBold', fontSize: 26,
    color: Colors.white, textAlign: 'center', paddingVertical: 2,
  },
  heroTitleAccent: {
    fontFamily: 'Almarai_400Regular', fontSize: 16,
    color: Colors.accent, paddingVertical: 2,
  },

  // ── SEARCH BAR ──
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', height: 48, borderRadius: Radius.xl,
    paddingStart: Spacing.space4, paddingEnd: Spacing.space1, gap: Spacing.space2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchInnerWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2 },
  searchPlaceholder: { fontFamily: 'Almarai_400Regular', color: Colors.textMuted, fontSize: 13, flex: 1, writingDirection: 'rtl', textAlign: 'left' },
  searchFilterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },

  // ── CTA BUTTONS ──
  ctaRow: {
    flexDirection: 'row', gap: Spacing.space3, paddingHorizontal: 4, marginTop: 12, alignSelf: 'stretch', marginBottom: Spacing.space1,
  },
  ctaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: Radius.xl, gap: Spacing.space1,
  },
  ctaBtnPrimary: { backgroundColor: Colors.accent },
  ctaBtnPrimaryTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#FFFFFF' },
  ctaBtnOutline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent' },
  ctaBtnOutlineTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.white },

  content: { paddingHorizontal: 0 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.space5, gap: Spacing.space4, justifyContent: 'space-between', marginBottom: Spacing.space1, marginTop: Spacing.space4,
  },
});

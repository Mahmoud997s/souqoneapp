import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, InteractionManager,
  Dimensions, FlatList, I18nManager
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
import { useQuery } from '@tanstack/react-query';

import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { transportApi } from '../../src/api/transport';

import { TransportCategoriesGrid } from '../../src/components/transport/landing/TransportCategoriesGrid';
import { TransportHorizontalList } from '../../src/components/transport/landing/TransportHorizontalList';
import { TransportHowItWorks } from '../../src/components/transport/landing/TransportHowItWorks';
import { CarrierCTABanner } from '../../src/components/transport/landing/CarrierCTABanner';
import { CarrierCard } from '../../src/components/transport/CarrierCard';

const { width: SW } = Dimensions.get('window');

const THRESHOLD  = 40;
const ANIM_RANGE = 140;
const ANIM_END   = THRESHOLD + ANIM_RANGE;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        ) : (
          <Ionicons name={icon as any} size={24} color={color} />
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
    padding: Spacing.space3 + 2,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  textBox: { flex: 1 },
  label: { fontFamily: 'Almarai_800ExtraBold', fontSize: 14, textAlign: 'left', marginBottom: 2 },
  desc: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'left', paddingBottom: 4 },
});

function CarriersSwiper({ carriers }: { carriers: any[] }) {
  const router = useRouter();
  if (!carriers || carriers.length === 0) return null;
  return (
    <View style={{ marginTop: Spacing.space3, marginBottom: Spacing.space5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.space5, marginBottom: Spacing.space4 }}>
        <Text style={{ fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: Colors.text, paddingVertical: 4 }}>الناقلون المتميزون</Text>
        <TouchableOpacity onPress={() => router.push('/transport/carriers' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary }}>عرض الكل</Text>
          <Ionicons name="chevron-back" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={carriers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.space5, gap: 16 }}
        snapToInterval={(SW * 0.85) + 16}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={{ width: SW * 0.85 }}>
            <CarrierCard
              carrier={item}
              onPress={() => router.push(`/transport/carriers/${item.id}` as any)}
              compact={true}
            />
          </View>
        )}
      />
    </View>
  );
}

export default function TransportLandingScreen() {
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

  const { data: latestRes, isLoading: loadingLatest } = useQuery({
    queryKey: ['transport-requests-latest'],
    queryFn: () => transportApi.getAll({ status: 'OPEN', limit: 10 }),
    enabled: loadRest,
  });

  const latestRequests = useMemo(() => {
    const d = latestRes?.data as any;
    return d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
  }, [latestRes]);

  const { data: carriersRes, isLoading: loadingCarriers } = useQuery({
    queryKey: ['transport-carriers-featured'],
    queryFn: () => transportApi.getCarriers(),
    enabled: loadRest,
  });

  const featuredCarriers = useMemo(() => {
    const d = carriersRes?.data as any;
    return d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
  }, [carriersRes]);

  const { data: myProfileRes } = useQuery({
    queryKey: ['my-carrier-profile'],
    queryFn: () => transportApi.getMyCarrierProfile(),
    retry: false,
    enabled: loadRest,
  });

  const isCarrier = !!myProfileRes?.data;

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
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push('/');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-outline" size={22} color={Colors.white} />
          </TouchableOpacity>

          {/* NAVBAR SEARCH (fades IN on scroll) */}
          <Animated.View style={[s.navSearch, navSearchAnimStyle]}>
            <TouchableOpacity
              style={s.navSearchInner}
              onPress={() => router.push('/transport/browse' as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={16} color={Colors.white} style={{ opacity: 0.8 }} />
              <Text style={s.navSearchTxt}>ابحث عن طلب شحن...</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={s.dashBtn} onPress={() => router.push('/transport/carrier-dashboard' as any)} activeOpacity={0.7}>
            <Ionicons name="grid-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* HERO EXPANDABLE CONTENT (fades OUT on scroll) */}
        <Animated.View style={[s.heroCenter, heroContentAnimStyle]} pointerEvents="auto">
          <View style={{ alignItems: 'center', marginBottom: Spacing.space2 }}>
            <Text style={s.heroTitle}>سوق ون للنقــل</Text>
            <Text style={s.heroTitleAccent}> شحن موثوق لأي مكان في سلطنة عمــان</Text>
          </View>

          {/* HERO SEARCH BAR */}
          <Animated.View style={[{ alignSelf: 'stretch' }, heroSearchAnimStyle]}>
            <TouchableOpacity style={s.searchBar} onPress={() => router.push('/transport/browse' as any)} activeOpacity={0.9}>
              <View style={s.searchInnerWrapper}>
                <Ionicons name="search" size={18} color={Colors.textMuted} />
                <Text style={s.searchPlaceholder}>ابحث عن طلبات شحن أو ناقلين...</Text>
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
              onPress={() => router.push('/transport/new' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={s.ctaBtnPrimaryTxt}>إنشاء طلب نقل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnOutline]}
              onPress={() => {
                if (isCarrier) {
                  router.push('/transport/browse' as any);
                } else {
                  router.push('/transport/carrier-register' as any);
                }
              }}
              activeOpacity={0.8}
            >
              {isCarrier ? (
                <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="truck-fast-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={s.ctaBtnOutlineTxt}>
                {isCarrier ? 'تصفح الطلبات' : 'سجل كناقل'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </AnimatedLinearGradient>

      {/* ── MAIN SCROLL CONTENT ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HERO_HEIGHT + 16, paddingBottom: insets.bottom + 80 }}
      >
        <View style={s.content}>

          {/* QUICK ACTIONS */}
          <View style={s.actionsGrid}>
            <ActionCard
              icon="cube-outline" label="إنشاء طلب"
              desc="انقل بضاعتك بأمان"
              color={Colors.primary} bg="#EFF6FF"
              onPress={() => router.push('/transport/new' as any)}
            />
            <ActionCard
              icon="compass-outline" label="تصفح الطلبات"
              desc="ابحث عن حمولة لنقلها"
              color="#16a34a" bg="#F0FDF4"
              onPress={() => router.push('/transport/browse' as any)}
            />
            <ActionCard
              icon="truck-fast-outline" label="دليل الناقلين"
              desc="أفضل شركات النقل"
              color="#d97706" bg="#FFFBEB"
              iconFamily="MaterialCommunityIcons"
              onPress={() => router.push('/transport/carriers' as any)}
            />
            <ActionCard
              icon="analytics-outline" label="لوحتي"
              desc="إدارة طلباتي وعروضي"
              color="#7c3aed" bg="#F5F3FF"
              onPress={() => router.push('/transport/carrier-dashboard' as any)}
            />
          </View>

          {loadRest && !loadingCarriers && featuredCarriers.length > 0 && (
            <CarriersSwiper carriers={featuredCarriers} />
          )}

          <TransportCategoriesGrid />

          {loadRest && (
            <TransportHorizontalList
              title="أحدث طلبات النقل"
              subTitle="تصفح الطلبات المفتوحة وقدم عرضك"
              data={latestRequests}
              isLoading={loadingLatest}
              emptyText="لا توجد طلبات نقل حالياً"
              onSeeAll={() => router.push('/transport/browse' as any)}
              onPressItem={(item) => router.push(`/transport/${item.id}` as any)}
            />
          )}

          <TransportHowItWorks />

          {!isCarrier && <CarrierCTABanner />}
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
    fontFamily: 'Almarai_700Bold', fontSize: 22,
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
    marginBottom: Spacing.space3, alignSelf: 'stretch',
    paddingStart: Spacing.space4, paddingEnd: Spacing.space1, gap: Spacing.space2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchInnerWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2 },
  searchPlaceholder: { fontFamily: 'Almarai_400Regular', color: Colors.textMuted, fontSize: 13, flex: 1, writingDirection: 'rtl', textAlign: 'left' },
  searchFilterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },

  // ── CTA BUTTONS ──
  ctaRow: {
    flexDirection: 'row', gap: Spacing.space3, paddingHorizontal: 4, marginTop: 0, alignSelf: 'stretch', marginBottom: Spacing.space1,
  },
  ctaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: Radius.xl, gap: Spacing.space1,
  },
  ctaBtnPrimary: { backgroundColor: Colors.accent },
  ctaBtnPrimaryTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: '#FFFFFF' },
  ctaBtnOutline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent' },
  ctaBtnOutlineTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.white },

  // ── CONTENT ──
  content: { paddingHorizontal: 0 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.space5, gap: Spacing.space4, justifyContent: 'space-between', marginBottom: Spacing.space4, marginTop: Spacing.space2,
  },
});

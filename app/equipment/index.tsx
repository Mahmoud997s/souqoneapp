import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  InteractionManager,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
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
import { useEquipment, useOperatorsInfinite } from '../../src/hooks/useEquipment'

import { EquipmentCategoriesGrid } from '../../src/components/equipment/EquipmentCategoriesGrid'
import { EquipmentPromoBanners } from '../../src/components/equipment/EquipmentPromoBanners'
import { EquipmentHorizontalList } from '../../src/components/equipment/EquipmentHorizontalList'
import { EquipmentHowItWorks } from '../../src/components/equipment/EquipmentHowItWorks'
import { EquipmentBottomBar } from '../../src/components/equipment/EquipmentBottomBar'
import { UnifiedCard } from '../../src/components/cards/UnifiedCard'
import { CarCard } from '../../src/components/cars/CarCard'
import { OperatorCard } from '../../src/components/cards/OperatorCard'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const MOCK_OPERATORS = [
  {
    id: 'op1',
    title: 'مشغل بلدوزر وجرافة',
    price: 30, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'الباطنة شمال',
    isVerified: true,
    raw: { operatorType: 'مشغل', experienceYears: 15, equipmentTypes: ['بلدوزر', 'جرافة'] }
  },
  {
    id: 'op2',
    title: 'فني صيانة مولدات كهربائية',
    price: 20, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'الداخلية',
    raw: { operatorType: 'صيانة', experienceYears: 6, equipmentTypes: ['مولدات', 'كهرباء صناعية'] }
  },
  {
    id: 'op3',
    title: 'فني صيانة معدات هيدروليك',
    price: 8, priceLabel: 'ساعة', currency: 'ر.ع.',
    governorate: 'مسقط',
    raw: { operatorType: 'فني', experienceYears: 12, equipmentTypes: ['هيدروليك', 'محركات ديزل'] }
  },
  {
    id: 'op4',
    title: 'مشغل رافعة برجية معتمد',
    price: 35, priceLabel: 'يوم', currency: 'ر.ع.',
    governorate: 'ظفار',
    raw: { operatorType: 'مشغل', experienceYears: 8, equipmentTypes: ['رافعات برجية', 'رافعات متحركة'] }
  },
]

const EQUIPMENT_TYPES = [
  { id: 'excavator', title: 'حفارة', icon: 'excavator', family: 'MCI', color: '#f59e0b' },
  { id: 'crane', title: 'رافعة', icon: 'crane', family: 'MCI', color: '#3b82f6' },
  { id: 'loader', title: 'لودر', icon: 'tractor', family: 'MCI', color: '#22c55e' },
  { id: 'bulldozer', title: 'بلدوزر', icon: 'bulldozer', family: 'MCI', color: '#14b8a6' },
  { id: 'forklift', title: 'رافعة شوكية', icon: 'forklift', family: 'MCI', color: '#8b5cf6' },
  { id: 'mixer', title: 'خلاطة', icon: 'cement', family: 'MCI', color: '#f43f5e' },
  { id: 'generator', title: 'مولد', icon: 'flash', family: 'Ionicons', color: '#f59e0b' },
  { id: 'compressor', title: 'ضاغط', icon: 'air-filter', family: 'MCI', color: '#3b82f6' },
  { id: 'truck', title: 'شاحنة', icon: 'truck-outline', family: 'MCI', color: '#8b5cf6' },
  { id: 'dump_truck', title: 'قلاب', icon: 'dump-truck', family: 'MCI', color: '#14b8a6' },
  { id: 'water_tanker', title: 'تنكر مياه', icon: 'water-pump', family: 'MCI', color: '#f43f5e' },
]


export default function EquipmentLandingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  // Fetch Data
  const { data: latestEquipment = [], isLoading: loadingEq } = useEquipment({ limit: 10 })
  
  const [loadRest, setLoadRest] = useState(false)
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150)
    })
    return () => task.cancel()
  }, [])

  const { data: saleData = [] } = useEquipment({ listingType: 'EQUIPMENT_SALE', limit: 10 }, { enabled: loadRest })
  const { data: rentData = [] } = useEquipment({ listingType: 'EQUIPMENT_RENT', limit: 10 }, { enabled: loadRest })
  const saleEquipment = saleData
  const rentEquipment = rentData

  const { data: opData, isLoading: loadingOp } = useOperatorsInfinite()
  const fetchedOperators = opData?.pages.flatMap(p => p.items)?.slice(0, 10) || []
  const operators = fetchedOperators.length > 0 ? fetchedOperators : MOCK_OPERATORS

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // ─── Dynamic heights ───
  const [heroContentH, setHeroContentH] = useState(160)
  const COMPACT_HEIGHT = insets.top + 56
  const HERO_HEIGHT    = insets.top + 44 + heroContentH 

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
        colors={['#0B2447', '#1a3a6b', '#0d3060']}
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
              onPress={() => router.push('/equipment/browse')}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={16} color={Colors.white} style={{ opacity: 0.8 }} />
              <Text style={s.navSearchTxt}>ابحث عن معدة...</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={s.dashBtn} onPress={() => {}} activeOpacity={0.7}>
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
             سوق المعدات{'\n'}
            <Text style={s.heroTitleAccent}> الثقيلة والمشغلين</Text>
          </Text>

          {/* ── HERO SEARCH BAR (fades OUT on scroll) ── */}
          <Animated.View style={[{ alignSelf: 'stretch' }, heroSearchAnimStyle]}>
            <TouchableOpacity style={s.searchBar} onPress={() => router.push('/equipment/browse')} activeOpacity={0.9}>
              <View style={s.searchInner}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
                <Text style={s.searchPlaceholder}>حفار، رافعة شوكية، لودر...</Text>
              </View>
              <View style={s.searchFilterBtn}>
                <Ionicons name="options-outline" size={18} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ── CTA BUTTONS (inside hero) ── */}
          <View style={s.ctaRow}>
            <TouchableOpacity style={[s.ctaBtn, s.ctaBtnPrimary]} onPress={() => router.push('/equipment/browse')} activeOpacity={0.8}>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={s.ctaBtnPrimaryTxt}>تصفح المعدات</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ctaBtn, s.ctaBtnOutline]}
              onPress={() => router.push('/equipment/operators/add')}
              activeOpacity={0.8}
            >
              <Text style={s.ctaBtnOutlineTxt}>سجل كمشغل</Text>
              <Ionicons name="person-add-outline" size={16} color={Colors.white} />
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
          <EquipmentPromoBanners />

          <View style={s.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitleHeader}>تصفّح حسب القسم</Text>
              <Text style={s.sectionSubHeader}>اختر ما يناسبك من بين أقسامنا المتنوعة</Text>
            </View>
          </View>

          <View style={s.sectionsGrid}>
            <TouchableOpacity style={s.sectionItem} onPress={() => router.push('/equipment/browse?type=sale')}>
              <View style={[s.sectionItemIconBox, { backgroundColor: '#fffbeb' }]}>
                <Ionicons name="cube-outline" size={24} color="#f59e0b" />
              </View>
              <Text style={s.sectionItemTitle}>للبيع</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sectionItem} onPress={() => router.push('/equipment/browse?type=rental')}>
              <View style={[s.sectionItemIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="construct-outline" size={24} color="#10b981" />
              </View>
              <Text style={s.sectionItemTitle}>للإيجار</Text>
            </TouchableOpacity>



            <TouchableOpacity style={s.sectionItem} onPress={() => router.push('/equipment/operators/browse')}>
              <View style={[s.sectionItemIconBox, { backgroundColor: '#f5f3ff' }]}>
                <Ionicons name="people-outline" size={24} color="#8b5cf6" />
              </View>
              <Text style={s.sectionItemTitle}>المشغلين</Text>
            </TouchableOpacity>
          </View>

          <View style={s.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitleHeader}>تصفّح حسب نوع المعدة</Text>
              <Text style={s.sectionSubHeader}>اختر نوع المعدة المناسب لمشروعك</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5, marginBottom: Spacing.space6 }} contentContainerStyle={{ paddingHorizontal: Spacing.space5, gap: Spacing.space3, flexDirection: 'row' }}>
            {EQUIPMENT_TYPES.map((item) => (
              <TouchableOpacity key={item.id} style={s.eqTypeItem} onPress={() => router.push(`/equipment/browse?type=${item.id}` as any)} activeOpacity={0.8}>
                <View style={[s.eqTypeIconBox, { backgroundColor: item.color + '10' }]}>
                  {item.family === 'MCI' ? (
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                  ) : (
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  )}
                </View>
                <Text style={s.eqTypeTxt}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitleHeader}>أحدث المعدات المضافة</Text>
                <Text style={s.sectionSubHeader}>تصفح أحدث المعدات المتوفرة للبيع أو للإيجار</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/equipment/browse')} style={s.seeAllBtn}>
                <Text style={s.seeAllTxt}>الكل</Text>
                <Ionicons name="chevron-back" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={s.hList}>
              {latestEquipment.map((item, i) => (
                <CarCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
              ))}
            </ScrollView>
          </View>

          {loadRest && (
            <>
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للبيع</Text>
                    <Text style={s.sectionSubHeader}>تصفح أفضل المعدات المعروضة للبيع</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=sale')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={[s.hList, saleEquipment.length === 0 && { paddingHorizontal: Spacing.space5 }]}>
                  {saleEquipment.length > 0 ? (
                    saleEquipment.map((item, i) => (
                      <CarCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
                    ))
                  ) : (
                    <Text style={s.emptyTxt}>لا يوجد معدات للبيع حالياً</Text>
                  )}
                </ScrollView>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للإيجار</Text>
                    <Text style={s.sectionSubHeader}>اكتشف المعدات المتاحة للإيجار اليومي أو الشهري</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=rental')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={[s.hList, rentEquipment.length === 0 && { paddingHorizontal: Spacing.space5 }]}>
                  {rentEquipment.length > 0 ? (
                    rentEquipment.map((item, i) => (
                      <CarCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
                    ))
                  ) : (
                    <Text style={s.emptyTxt}>لا توجد معدات للإيجار حالياً</Text>
                  )}
                </ScrollView>
              </View>



              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>أمهر المشغلين</Text>
                    <Text style={s.sectionSubHeader}>أفضل السائقين والمشغلين الخبراء</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/operators/browse')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={s.hList}>
                  {operators.map((item, i) => (
                    <View key={i} style={{ width: 280 }}>
                      <OperatorCard item={item as any} onPress={() => router.push(`/equipment/operators/${item.id}`)} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <EquipmentHowItWorks />
        </View>
      </Animated.ScrollView>

      <EquipmentBottomBar />
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
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
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
    fontSize: 22, color: Colors.white, lineHeight: 40, marginBottom: Spacing.space3, textAlign: 'center',
  },
  heroTitleAccent: {
    color: '#d97706',
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
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#0B2447', alignItems: 'center', justifyContent: 'center',
  },

  // ─── Eq Type Item ───
  eqTypeItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 70,
  },
  eqTypeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eqTypeTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
  },
  emptyTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    width: '100%',
    paddingVertical: Spacing.space4,
  },

  // ─── CTA Buttons ───
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.space3, width: '100%',
  },
  ctaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: Radius.xl,
  },
  ctaBtnPrimary: {
    backgroundColor: '#d97706',
  },
  ctaBtnPrimaryTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.white, marginLeft: 6,
  },
  ctaBtnOutline: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(0,0,0,0.1)', gap: Spacing.space1,
  },
  ctaBtnOutlineTxt: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 13, color: Colors.white,
  },

  // ─── Content ───
  content: {
    paddingHorizontal: Spacing.space5,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.space3, marginTop: 0,
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
  },
  sectionTitleHeader: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, textAlign: 'left' },
  sectionSubHeader: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted, textAlign: 'left' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.primary },
  sectionHeaderCenter: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space4, marginTop: Spacing.space3,
  },
  sectionTitleHeaderCenter: { 
    fontFamily: 'Almarai_800ExtraBold',  
    fontSize: 20, color: Colors.text, textAlign: 'center' 
  },
  sectionSubHeaderCenter: { 
    fontFamily: 'Almarai_400Regular',  
    fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 2 
  },
  sectionsGrid: {
    flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.space2,
    marginBottom: Spacing.space6,
  },
  sectionItem: {
    width: '31%',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.space3, paddingHorizontal: 0, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  sectionItemIconBox: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  sectionItemTitle: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11, color: Colors.text, textAlign: 'center',
  },
  hList: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3,
    paddingBottom: Spacing.space2,
  },
  cardWrapper: {
    width: 260,
  }
})

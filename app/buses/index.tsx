import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  InteractionManager, ScrollView, FlatList, Pressable
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

import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { useBuses } from '../../src/hooks/useBuses'
import { CarCard } from '../../src/components/cars/CarCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

export default function BusesLandingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  const [loadRest, setLoadRest] = useState(false)
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150)
    })
    return () => task.cancel()
  }, [])

  const { data: baseData = [], isLoading } = useBuses()
  
  // Simulated filtering on client for landing sections
  const saleBuses = useMemo(() => baseData.filter(b => b.listingType === 'BUS_SALE'), [baseData])
  const rentBuses = useMemo(() => baseData.filter(b => b.listingType === 'BUS_RENT'), [baseData])
  const contractBuses = useMemo(() => baseData.filter(b => b.listingType === 'BUS_SALE_WITH_CONTRACT'), [baseData])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const COMPACT_HEIGHT = insets.top + 56
  const HERO_HEIGHT = insets.top + 180
  const THRESHOLD = 50
  const ANIM_RANGE = 80
  const ANIM_END = THRESHOLD + ANIM_RANGE

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
    transform: [{
      translateY: interpolate(
        scrollY.value,
        [0, THRESHOLD],
        [0, -20],
        Extrapolation.CLAMP
      )
    }]
  }))

  const compactTitleAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [THRESHOLD + ANIM_RANGE * 0.5, ANIM_END],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }))

  const renderHorizontalList = (title: string, subTitle: string, listData: any[], loading: boolean) => {
    // Hide section entirely when empty and not loading
    if (!loading && listData.length === 0) return null

    return (
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.flex1}>
            <Text style={s.sectionTitleHeader}>{title}</Text>
            <Text style={s.sectionSubHeader}>{subTitle}</Text>
          </View>
          <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push('/buses/browse' as any)}>
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={s.seeAllTxt}>الكل</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList}>
          {loading ? (
            [1, 2, 3].map((i) => (
              <View key={i} style={s.cardWrapper}><SkeletonCard /></View>
            ))
          ) : (
            listData.map((item) => (
              <View key={item.id} style={s.cardWrapper}>
                <CarCard item={item as any} onPress={() => router.push(`/buses/${item.id}` as any)} />
              </View>
            ))
          )}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* ── HEADER ── */}
      <AnimatedLinearGradient
        colors={[Colors.primary, '#0369a1']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.header, headerAnimStyle]}
      >
        <View style={[s.topBar, { paddingTop: insets.top }]}>
          <TouchableOpacity style={s.iconBtn} onPress={() => {
              if (router.canGoBack()) router.back();
              else router.push('/');
          }}>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Animated Compact Title (replaces the old one, but we add search now) */}
          <Animated.View style={[s.navSearch, compactTitleAnimStyle]} pointerEvents="auto">
            <TouchableOpacity
              style={s.navSearchInner}
              onPress={() => router.push('/buses/browse' as any)}
              activeOpacity={0.9}
            >
              <Ionicons name="search" size={16} color="#fff" style={{ opacity: 0.8 }} />
              <Text style={s.navSearchTxt}>عن أي حافلة تبحث؟</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ width: 36 }} />
        </View>

        {/* Hero Content */}
        <Animated.View style={[s.heroContent, heroContentAnimStyle]}>
          <Text style={s.heroTitle}>سوق الحافلات والنقل الجماعي</Text>
          <Text style={s.heroSubtitle}>بيع، تأجير، وعقود تشغيل الحافلات والكوسترات</Text>
          
          <Animated.View style={[{ alignSelf: 'stretch', width: '100%' }]}>
            <TouchableOpacity style={s.searchBar} onPress={() => router.push('/buses/browse' as any)} activeOpacity={0.9}>
              <View style={s.searchInner}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
                <Text style={s.searchPlaceholder}>عن أي حافلة تبحث؟</Text>
              </View>
              <View style={s.searchFilterBtn}>
                <Ionicons name="options-outline" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </AnimatedLinearGradient>

      {/* ── BODY ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HERO_HEIGHT + 16, paddingBottom: 100 }}
      >
        {/* Categories Grid */}
        <View style={s.gridWrap}>
          <Text style={s.sectionTitleHeader}>الخدمات المتاحة</Text>
          <View style={s.catsGrid}>
            <TouchableOpacity style={s.catItem} onPress={() => router.push('/buses/browse?busListingType=BUS_SALE' as any)}>
              <View style={[s.catIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="pricetags" size={24} color="#0ea5e9" />
              </View>
              <Text style={s.catLabel}>شراء حافلة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.catItem} onPress={() => router.push('/buses/browse?busListingType=BUS_RENT' as any)}>
              <View style={[s.catIconBox, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="key" size={24} color="#10b981" />
              </View>
              <Text style={s.catLabel}>حافلات للإيجار</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.catItem} onPress={() => router.push('/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT' as any)}>
              <View style={[s.catIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="document-text" size={24} color="#f59e0b" />
              </View>
              <Text style={s.catLabel}>بيع مع عقد</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.catItem} onPress={() => router.push('/buses/browse?busType=SCHOOL_BUS' as any)}>
              <View style={[s.catIconBox, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="school" size={24} color="#ef4444" />
              </View>
              <Text style={s.catLabel}>حافلات مدرسية</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal Lists */}
        {renderHorizontalList('حافلات للبيع', 'أحدث الحافلات والكوسترات المعروضة', saleBuses, isLoading)}
        {renderHorizontalList('عقود تشغيل مطلوبة', 'فرص نقل موظفين ومدارس', contractBuses, isLoading)}
        {renderHorizontalList('حافلات للإيجار', 'تأجير يومي أو شهري مع/بدون سائق', rentBuses, isLoading)}

      </Animated.ScrollView>
      
      {/* Bottom Post Button */}
      <View style={[s.bottomBar, { bottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={s.postBtn} onPress={() => router.push('/post' as any)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={s.postBtnTxt}>أضف إعلان حافلة</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, overflow: 'hidden' },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.space4 },
  topBarLeft: { width: 40, alignItems: 'flex-start' },
  topBarRight: { width: 40, alignItems: 'flex-end' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  compactTitleWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, alignItems: 'center', justifyContent: 'center' },
  compactTitle: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: '#fff' },
  heroContent: { paddingHorizontal: Spacing.space5, alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: 20 },
  heroIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 24, color: '#fff', textAlign: 'center', marginBottom: 6 },
  heroSubtitle: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 20 },
  
  navSearch: { flex: 1, marginHorizontal: Spacing.space3, justifyContent: 'center' },
  navSearchInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', height: 38, borderRadius: 19, paddingHorizontal: Spacing.space3, gap: Spacing.space2 },
  navSearchTxt: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: '#fff', opacity: 0.9 },

  searchBar: { backgroundColor: '#fff', height: 56, borderRadius: Radius.pill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.space2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  searchInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space3, paddingHorizontal: Spacing.space3 },
  searchPlaceholder: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 15, color: Colors.textMuted },
  searchFilterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  
  gridWrap: { paddingHorizontal: Spacing.space4, marginBottom: Spacing.space6 },
  sectionTitleHeader: { fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 18, color: Colors.text, writingDirection: 'rtl', marginBottom: 4 },
  sectionSubHeader: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 13, color: Colors.textMuted, writingDirection: 'rtl' },
  catsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.space2, marginTop: 12 },
  catItem: { width: '23.5%', backgroundColor: '#fff', borderRadius: Radius.lg, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  catIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  catLabel: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 11, color: Colors.text, textAlign: 'center' },
  
  section: { marginBottom: Spacing.space6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.space4, marginBottom: Spacing.space3 },
  flex1: { flex: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: Radius.pill, backgroundColor: Colors.primary + '15' },
  seeAllTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: Colors.primary },
  
  hList: { paddingHorizontal: Spacing.space4, gap: Spacing.space3 },
  cardWrapper: { width: 260 },
  emptyHList: { padding: 20, alignItems: 'center', justifyContent: 'center', width: 260, backgroundColor: '#fff', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyHTxt: { fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, color: Colors.textMuted },

  bottomBar: { position: 'absolute', left: 0, right: 0, paddingHorizontal: Spacing.space4 },
  postBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: Radius.pill, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  postBtnTxt: { fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4, fontSize: 16, color: '#fff' }
})

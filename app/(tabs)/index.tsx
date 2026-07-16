import React from 'react'
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Gradients } from '../../src/constants/gradients'
import { UnifiedCard, UnifiedCardItem } from '../../src/components/cards/UnifiedCard'
import { JobCard } from '../../src/components/cards/JobCard'
import { EquipCard } from '../../src/components/cards/EquipCard'
import { TransportRequestCard } from '../../src/components/cards/TransportRequestCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { useListings } from '../../src/hooks/useListings'
import { useJobsRaw } from '../../src/hooks/useJobs'
import { useServices } from '../../src/hooks/useServices'
import { useParts } from '../../src/hooks/useParts'
import { useBuses } from '../../src/hooks/useBuses'
import { useEquipment } from '../../src/hooks/useEquipment'
import { useTransport } from '../../src/hooks/useTransport'
import Animated, { interpolate, Extrapolation, useAnimatedStyle } from 'react-native-reanimated'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { useAuthStore } from '../../src/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const { width: SW } = Dimensions.get('window')
const CARD_W = 280
const IMG_H = Math.round(CARD_W * 9 / 16)

const CATEGORIES = [
  { id: 'cars',      label: 'سيارات',   icon: 'car-sport-outline',     route: '/cars',        bg: '#E0F2FE', fg: '#0284C7' },
  { id: 'jobs',      label: 'وظائف',    icon: 'briefcase-outline',     route: '/jobs',        bg: '#FEE2E2', fg: '#DC2626' },
  { id: 'services',  label: 'خدمات',    icon: 'build-outline',         route: '/services',    bg: '#FEF3C7', fg: '#D97706' },
  { id: 'parts',     label: 'قطع غيار', icon: 'construct-outline',     route: '/parts',       bg: '#F3E8FF', fg: '#9333EA' },
  { id: 'buses',     label: 'حافلات',   icon: 'bus-outline',           route: '/buses',       bg: '#DCFCE7', fg: '#16A34A' },
  { id: 'equipment', label: 'معدات',    icon: 'hardware-chip-outline', route: '/equipment',   bg: '#FFEDD5', fg: '#EA580C' },
  { id: 'transport', label: 'نقل',      icon: 'navigate-outline',      route: '/transport',   bg: '#E0E7FF', fg: '#4F46E5' },
  { id: 'auctions',  label: 'مزادات',   icon: 'pricetag-outline',      route: '/listings',    bg: '#FCE7F3', fg: '#DB2777' },
]

const BANNERS = [
  { id: '1', title: 'أضف إعلانك الأول مجاناً!', subtitle: 'ابدأ بالبيع الآن بكل سهولة وسرعة', color1: '#E8781E', color2: '#F9A826', icon: 'megaphone' },
  { id: '2', title: 'أفضل عروض السيارات', subtitle: 'تصفح السيارات المضافة حديثاً', color1: Colors.primary, color2: '#007BFF', icon: 'car-sport' },
]

import { favoritesApi } from '../../src/api/favorites'

interface SectionProps {
  title: string
  icon: string
  iconColor?: string
  seeAllRoute: string
  data: UnifiedCardItem[] | undefined
  isLoading: boolean
  routeBase: string
  CustomCard?: React.FC<{ item: any; onPress: () => void; imageHeight?: number }>
}

function CategorySection({ title, icon, iconColor, seeAllRoute, data, isLoading, routeBase, CustomCard }: SectionProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  if (!isLoading && (!data || data.length === 0)) return null

  const handleFavorite = async (item: UnifiedCardItem) => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    try {
      // Maps routeBase to backend entityType
      const entityMap: Record<string, string> = {
        'listings': 'LISTING',
        'jobs': 'JOB',
        'services': 'CAR_SERVICE',
        'parts': 'SPARE_PART',
        'buses': 'BUS_LISTING',
        'equipment': 'EQUIPMENT_LISTING',
        'transport': 'OPERATOR_LISTING',
      }
      const eType = entityMap[routeBase] || 'LISTING'
      await favoritesApi.add(eType, item.id)
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    } catch (e) {
      console.log('Error toggling fav from home', e)
    }
  }

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.titleRow}>
          <View style={[s.sectionIconWrap, { backgroundColor: (iconColor || Colors.primary) + '15' }]}>
            <Ionicons name={icon as any} size={18} color={iconColor ?? Colors.primary} />
          </View>
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push(seeAllRoute as any)}>
          <Text style={s.seeAll}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hWrap} style={s.hList}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} style={s.cardWrap} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.hWrap}
          keyExtractor={i => i.id}
          style={s.hList}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              {CustomCard ? (
                <CustomCard item={item} onPress={() => router.push(`/${routeBase}/${item.id}` as any)} imageHeight={IMG_H} />
              ) : (
                <UnifiedCard 
                  item={item} 
                  imageHeight={IMG_H} 
                  onPress={() => router.push(`/${routeBase}/${item.id}` as any)} 
                  onFavorite={() => handleFavorite(item)}
                />
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()

  const { data: listings, isLoading: loadingListings } = useListings({ limit: 8 })
  const { data: jobs,      isLoading: loadingJobs      } = useJobsRaw({ limit: 8 })
  const { data: services,  isLoading: loadingServices  } = useServices({ limit: 8 })
  const { data: parts,     isLoading: loadingParts     } = useParts({ limit: 8 })
  const { data: buses,     isLoading: loadingBuses     } = useBuses({ limit: 8 })
  const { data: equipment, isLoading: loadingEquipment } = useEquipment({ limit: 8 })
  const { data: transport, isLoading: loadingTransport } = useTransport({ limit: 8 })

  const { scrollHandler, scrollY } = useScrollAwareNav()
  const { navHidden } = useNavVisibility()

  // Constants
  const COMPACT_HEIGHT = insets.top + 60
  const HERO_HEIGHT    = insets.top + 140
  const THRESHOLD  = 20
  const ANIM_RANGE = 100
  const ANIM_END   = THRESHOLD + ANIM_RANGE

  // Header Animation
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
      [24, 24, 0],
      Extrapolation.CLAMP
    ),
    borderBottomRightRadius: interpolate(
      scrollY.value,
      [0, THRESHOLD, ANIM_END],
      [24, 24, 0],
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

  const navSearchAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, THRESHOLD + ANIM_RANGE * 0.4, ANIM_END],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
  }))

  const userName = user?.displayName || user?.username || 'ضيف'

  return (
    <View style={s.root}>
      {/* ── HEADER ── */}
      <AnimatedLinearGradient
        colors={Gradients.hero as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, headerAnimStyle, { paddingTop: insets.top + 8, paddingHorizontal: 20 }]}
      >
        
        {/* ── TOP BAR (Always Visible) ── */}
        <View style={s.heroTop}>
          <View style={s.heroTopLeft}>
            {/* User Info (Fades Out) */}
            <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'flex-start' }, heroContentAnimStyle]} pointerEvents={scrollY.value > THRESHOLD + ANIM_RANGE * 0.5 ? 'none' : 'auto'}>
              <Text style={s.greeting}>مرحباً بك،</Text>
              <Text style={s.userName}>{userName} 👋</Text>
            </Animated.View>

            {/* Small Search (Fades In) */}
            <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', paddingEnd: 12 }, navSearchAnimStyle]} pointerEvents={scrollY.value < THRESHOLD + ANIM_RANGE * 0.5 ? 'none' : 'auto'}>
              <TouchableOpacity style={s.navSearchInner} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.9}>
                <Ionicons name="search" size={16} color={Colors.white} style={{ opacity: 0.8 }} />
                <Text style={s.navSearchTxt}>بحث...</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Bell Icon (Always Visible) */}
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/profile/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── HERO CENTER (Large Search - Fades Out) ── */}
        <Animated.View style={[s.heroCenter, heroContentAnimStyle]} pointerEvents={scrollY.value > THRESHOLD + ANIM_RANGE * 0.5 ? 'none' : 'auto'}>
          <TouchableOpacity style={s.searchBar} onPress={() => router.push('/(tabs)/search')} activeOpacity={0.9}>
            <View style={s.searchInner}>
              <Ionicons name="search" size={20} color={Colors.textMuted} />
              <Text style={s.searchPlaceholder}>عن ماذا تبحث اليوم؟ (سيارات، وظائف...)</Text>
            </View>
            <View style={s.searchFilterBtn}>
              <Ionicons name="options-outline" size={18} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </AnimatedLinearGradient>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[s.content, { paddingBottom: 100, paddingTop: HERO_HEIGHT + 16 }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* ── HERO BANNERS ── */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={s.bannersList}
          snapToInterval={SW * 0.85 + Spacing.space3}
          decelerationRate="fast"
        >
          {BANNERS.map((banner) => (
            <TouchableOpacity key={banner.id} activeOpacity={0.9} style={s.bannerCard}>
              <LinearGradient
                colors={[banner.color1, banner.color2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.bannerGradient}
              >
                <View style={s.bannerTexts}>
                  <Text style={s.bannerTitle}>{banner.title}</Text>
                  <Text style={s.bannerSub}>{banner.subtitle}</Text>
                </View>
                <Ionicons name={banner.icon as any} size={64} color="rgba(255,255,255,0.2)" style={s.bannerIconBg} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── CATEGORIES ── */}
        <View style={s.catsGrid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.id} style={s.catItem} onPress={() => router.push(c.route as any)}>
              <View style={[s.catIconBox, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon as any} size={28} color={c.fg} />
              </View>
              <Text style={s.catLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SECTIONS ── */}
        <CategorySection title="سيارات مميزة" icon="star" iconColor={Colors.accent} seeAllRoute="/cars/browse" data={listings} isLoading={loadingListings} routeBase="listings" />
        <CategorySection title="وظائف" icon="briefcase" seeAllRoute="/jobs" data={jobs as any} isLoading={loadingJobs} routeBase="jobs" CustomCard={({ item, onPress }) => <JobCard job={item as any} onPress={onPress} />} />
        <CategorySection title="خدمات" icon="build" seeAllRoute="/services" data={services} isLoading={loadingServices} routeBase="services" />
        <CategorySection title="قطع غيار" icon="construct" seeAllRoute="/parts" data={parts} isLoading={loadingParts} routeBase="parts" />
        <CategorySection title="حافلات" icon="bus" seeAllRoute="/buses" data={buses} isLoading={loadingBuses} routeBase="buses" />
        <CategorySection title="معدات" icon="hardware-chip" seeAllRoute="/equipment" data={equipment} isLoading={loadingEquipment} routeBase="equipment" CustomCard={({ item, onPress }) => <EquipCard item={item as any} onPress={onPress} fullWidth />} />
        <CategorySection title="طلبات نقل" icon="navigate" seeAllRoute="/transport" data={transport} isLoading={loadingTransport} routeBase="transport" CustomCard={({ item, onPress }) => <TransportRequestCard item={item as any} onPress={onPress} fullWidth />} />

      </Animated.ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    overflow: 'hidden',
  },
  
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTopLeft: {
    flex: 1, height: 44, justifyContent: 'center'
  },
  
  greeting: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'left' },
  userName: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.white, textAlign: 'left' },
  
  navSearchInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 38, borderRadius: 19,
    paddingHorizontal: Spacing.space3, gap: Spacing.space2,
  },
  navSearchTxt: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13,
    color: 'rgba(255,255,255,0.85)', flex: 1, textAlign: 'left',
  },

  iconBtn: { 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    alignItems: 'center', justifyContent: 'center' 
  },
  
  heroCenter: {
    marginTop: Spacing.space3,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, height: 52, borderRadius: Radius.xl,
    paddingStart: Spacing.space4, paddingEnd: Spacing.space1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, flex: 1 },
  searchPlaceholder: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.textMuted, fontSize: 13, flex: 1, textAlign: 'left' },
  searchFilterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  content: { },

  // Banners
  bannersList: { paddingHorizontal: Spacing.space5, paddingBottom: Spacing.space5, gap: Spacing.space3 },
  bannerCard: { width: SW * 0.85, height: 110, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  bannerGradient: { flex: 1, padding: Spacing.space4, justifyContent: 'center', position: 'relative' },
  bannerTexts: { zIndex: 2, paddingEnd: 40 },
  bannerTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.white, marginBottom: 4, writingDirection: 'rtl' },
  bannerSub: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: 'rgba(255,255,255,0.9)', writingDirection: 'rtl' },
  bannerIconBg: { position: 'absolute', left: -10, bottom: -15, transform: [{ rotate: '-15deg' }] },

  // Categories
  catsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end',
    paddingHorizontal: Spacing.space4, marginBottom: Spacing.space6,
    gap: 12,
  },
  catItem: { alignItems: 'center', width: (SW - 32 - 36) / 4, gap: 8 },
  catIconBox: {
    width: 60, height: 60, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  catLabel: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 12, color: Colors.text, textAlign: 'center' },

  // Section
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.space5, marginBottom: Spacing.space3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.text },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: Colors.primary + '10', borderRadius: Radius.pill },
  seeAll: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.primary },

  // Horizontal list
  hList: { },
  hWrap: { paddingHorizontal: Spacing.space5, paddingVertical: Spacing.space3, gap: Spacing.space4 },
  cardWrap: { width: CARD_W },
})

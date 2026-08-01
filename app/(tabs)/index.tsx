import React from 'react'
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { BlurView } from 'expo-blur'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Gradients } from '../../src/constants/gradients'
import { UnifiedCard, UnifiedCardItem } from '../../src/components/cards/UnifiedCard'
import { JobCard } from '../../src/components/cards/JobCard'
import { EquipCard } from '../../src/components/cards/EquipCard'
import { CarCard } from '../../src/components/cars/CarCard'
import { BusCard } from '../../src/components/buses/BusCard'
import { TransportRequestCard } from '../../src/components/transport/TransportRequestCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { useListings } from '../../src/hooks/useListings'
import { useJobsRaw } from '../../src/hooks/useJobs'
import { useServices } from '../../src/hooks/useServices'
import { useParts } from '../../src/hooks/useParts'
import { useBuses } from '../../src/hooks/useBuses'
import { useEquipment } from '../../src/hooks/useEquipment'
import { useTransport } from '../../src/hooks/useTransport'
import Animated, { interpolate, Extrapolation, useAnimatedStyle, FadeInDown, FadeInRight } from 'react-native-reanimated'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { useAuthStore } from '../../src/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const { width: SW } = Dimensions.get('window')
const CARD_W = 310
const IMG_H = Math.round(CARD_W * 9 / 16)

const CATEGORIES = [
  { id: 'cars',      label: 'سيارات',    image: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png', route: '/cars', isMain: true },
  { id: 'jobs',      label: 'وظائف',     image: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Briefcase/3D/briefcase_3d.png', route: '/jobs', isMain: true },
  { id: 'services',  label: 'خدمات',     image: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrench/3D/wrench_3d.png', route: '/services', isMain: false },
  { id: 'parts',     label: 'قطع غيار',  image: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Nut%20and%20bolt/3D/nut_and_bolt_3d.png', route: '/parts', isMain: false },
  { id: 'equipment', label: 'معدات',     image: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Tractor/3D/tractor_3d.png', route: '/equipment', isMain: false },
  { id: 'buses',     label: 'حافلات',    image: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bus/3D/bus_3d.png', route: '/buses', isMain: false },
  { id: 'transport', label: 'نقل',       image: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Delivery%20truck/3D/delivery_truck_3d.png', route: '/transport', isMain: false },
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
    <Animated.View style={s.section} entering={FadeInDown.duration(400)}>
      <View style={s.sectionHeader}>
        <View style={s.titleRow}>
          <LinearGradient
            colors={[iconColor || Colors.primary, (iconColor || Colors.primary) + '99']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.sectionIconWrap}
          >
            <Ionicons name={icon as any} size={14} color={Colors.white} />
          </LinearGradient>
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push(seeAllRoute as any)} activeOpacity={0.8}>
          <Text style={s.seeAll}>عرض الكل</Text>
          <Ionicons name="arrow-back-outline" size={14} color={Colors.primary} />
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
    </Animated.View>
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
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>
        </View>
        
        {/* ── TOP BAR (Always Visible) ── */}
        <View style={s.heroTop}>
          <View style={s.heroTopLeft}>
            {/* User Info (Fades Out) */}
            <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'flex-start' }, heroContentAnimStyle]} pointerEvents={scrollY.value > THRESHOLD + ANIM_RANGE * 0.5 ? 'none' : 'auto'}>
              <Text style={s.greeting}>
                مرحباً بك في <Text style={{ fontFamily: 'Almarai_800ExtraBold', color: '#FFFFFF' }}>سوق <Text style={{ color: Colors.accent }}>ون</Text></Text>،
              </Text>
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
              <Ionicons name="search" size={20} color={Colors.white} style={{ opacity: 0.8 }} />
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


        {/* ── CATEGORIES (Photographic Premium) ── */}
        <View style={s.catsContainer}>
          {/* Main Categories (Top 2) */}
          <View style={s.mainCatsRow}>
            {CATEGORIES.filter(c => c.isMain).map((cat, index) => (
              <Animated.View key={cat.id} entering={FadeInDown.delay(index * 60).springify()} style={s.mainCatWrap}>
                <TouchableOpacity onPress={() => router.push(cat.route as any)} style={s.mainCatCard} activeOpacity={0.8}>
                  <Text style={s.mainCatLabel}>{cat.label}</Text>
                  <Image source={{ uri: cat.image }} style={s.mainCatImage} contentFit="contain" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Sub Categories (Grid) */}
          <View style={s.subCatsGrid}>
            {CATEGORIES.filter(c => !c.isMain).map((cat, index) => (
              <Animated.View key={cat.id} entering={FadeInDown.delay(120 + index * 40).springify()} style={s.subCatWrap}>
                <TouchableOpacity onPress={() => router.push(cat.route as any)} style={s.subCatCard} activeOpacity={0.8}>
                  <Image source={{ uri: cat.image }} style={s.subCatImage} contentFit="contain" />
                  <Text style={s.subCatLabel} numberOfLines={1}>{cat.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── SECTIONS ── */}
        <CategorySection title="أحدث إعلانات السيارات" icon="star" iconColor={Colors.accent} seeAllRoute="/cars/browse" data={listings} isLoading={loadingListings} routeBase="listings" CustomCard={({ item, onPress }) => <CarCard item={item as any} onPress={onPress} fullWidth maxChips={3} />} />
        <CategorySection title="وظائف" icon="briefcase" seeAllRoute="/jobs" data={jobs as any} isLoading={loadingJobs} routeBase="jobs" CustomCard={({ item, onPress }) => <JobCard job={item as any} onPress={onPress} maxChips={3} />} />
        <CategorySection title="خدمات" icon="build" seeAllRoute="/services" data={services} isLoading={loadingServices} routeBase="services" />
        <CategorySection title="قطع غيار" icon="construct" seeAllRoute="/parts" data={parts} isLoading={loadingParts} routeBase="parts" />
        <CategorySection title="حافلات" icon="bus" seeAllRoute="/buses" data={buses} isLoading={loadingBuses} routeBase="buses" CustomCard={({ item, onPress }) => <BusCard item={item as any} onPress={onPress} fullWidth maxChips={3} />} />
        <CategorySection title="معدات" icon="hardware-chip" seeAllRoute="/equipment" data={equipment} isLoading={loadingEquipment} routeBase="equipment" CustomCard={({ item, onPress }) => <EquipCard item={item as any} onPress={onPress} fullWidth maxChips={3} />} />
        <CategorySection title="طلبات نقل" icon="navigate" seeAllRoute="/transport" data={transport?.items as any} isLoading={loadingTransport} routeBase="transport" CustomCard={({ item, onPress }) => <TransportRequestCard request={item as any} onPress={onPress} />} />

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
  
  greeting: { fontFamily: 'Almarai_400Regular',  fontSize: 18, color: Colors.white, textAlign: 'left', lineHeight: 28, paddingVertical: 2 },
  userName: { fontFamily: 'Almarai_400Regular',  fontSize: 17, color: 'rgba(255,255,255,0.85)', textAlign: 'left', lineHeight: 26, paddingBottom: 4 },
  
  navSearchInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 38, borderRadius: 19,
    paddingHorizontal: Spacing.space4, gap: 10,
  },
  navSearchTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: 'rgba(255,255,255,0.85)', flex: 1, textAlign: 'left', paddingTop: 2,
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
    backgroundColor: 'rgba(255,255,255,0.15)', height: 48, borderRadius: Radius.xl,
    paddingStart: Spacing.space4, paddingEnd: 4,
  },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingHorizontal: 4 },
  searchPlaceholder: { fontFamily: 'Almarai_400Regular',  color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1, textAlign: 'left', paddingTop: 2 },
  searchFilterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },

  content: { },

  // Banners
  bannersList: { paddingHorizontal: Spacing.space5, paddingBottom: Spacing.space5, gap: Spacing.space3 },
  bannerCard: { width: SW * 0.85, height: 110, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  bannerGradient: { flex: 1, padding: Spacing.space4, justifyContent: 'center', position: 'relative' },
  bannerTexts: { zIndex: 2, paddingEnd: 40 },
  bannerTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.white, marginBottom: 4, writingDirection: 'rtl' },
  bannerSub: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: 'rgba(255,255,255,0.9)', writingDirection: 'rtl' },
  bannerIconBgBlur: { position: 'absolute', left: -10, bottom: -15, transform: [{ rotate: '-15deg' }], width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },

  // Categories (3D Talabat Style - Small)
  catsContainer: { paddingHorizontal: Spacing.space4, marginBottom: Spacing.space6, gap: Spacing.space3 },
  
  // Main Cards
  mainCatsRow: { flexDirection: 'row', gap: Spacing.space3 },
  mainCatWrap: { flex: 1 },
  mainCatCard: { 
    backgroundColor: Colors.white, height: 86, borderRadius: 16, 
    padding: 12, justifyContent: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F5F5F5'
  },
  mainCatLabel: { fontFamily: 'Almarai_800ExtraBold', fontSize: 14, color: Colors.text, zIndex: 2 },
  mainCatImage: { width: 56, height: 56, position: 'absolute', bottom: -5, left: -5, zIndex: 1, transform: [{ rotate: '-5deg' }] },

  // Sub Cards
  subCatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  subCatWrap: { width: (SW - 32 - 24) / 4 }, // 4 columns
  subCatCard: { 
    backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: '#F5F5F5'
  },
  subCatImage: { width: 34, height: 34 },
  subCatLabel: { fontFamily: 'Almarai_700Bold', fontSize: 11, color: '#374151', textAlign: 'center' },

  // Section
  section: { marginBottom: 36 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.space5, marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIconWrap: { 
    width: 28, height: 28, borderRadius: 8, 
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3
  },
  sectionTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 16, color: '#1E293B', letterSpacing: -0.2 },
  seeAllBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    paddingVertical: 4, paddingHorizontal: 12, 
    backgroundColor: Colors.primary + '0A', 
    borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.primary + '1A'
  },
  seeAll: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary, paddingTop: 2 },

  // Horizontal list
  hList: { },
  hWrap: { paddingHorizontal: Spacing.space5, paddingVertical: Spacing.space3, gap: Spacing.space4 },
  cardWrap: { width: CARD_W },
})

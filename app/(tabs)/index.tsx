import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { BlurView } from 'expo-blur'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Gradients } from '../../src/constants/gradients'
import { CardSystem } from '../../src/constants/cardSystem'
import { UnifiedCard, UnifiedCardItem } from '../../src/components/cards/UnifiedCard'
import { JobCard } from '../../src/components/cards/JobCard'
import { EquipCard } from '../../src/components/cards/EquipCard'
import { CarCard } from '../../src/components/cars/CarCard'
import { BusCard } from '../../src/components/buses/BusCard'
import { PartCard } from '../../src/components/parts/PartCard'
import { ServiceCard } from '../../src/components/services/ServiceCard'
import { TransportRequestCard } from '../../src/components/transport/TransportRequestCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { HorizontalScrollCard } from '../../src/components/ui/HorizontalScrollCard'
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader'
import { HomeCategoriesGrid } from '../../src/components/home/HomeCategoriesGrid'
import { useListings } from '../../src/hooks/useListings'
import { useJobsRaw } from '../../src/hooks/useJobs'
import { useServices } from '../../src/hooks/useServices'
import { useParts } from '../../src/hooks/useParts'
import { useBuses } from '../../src/hooks/useBuses'
import { useEquipment } from '../../src/hooks/useEquipment'
import { useTransport } from '../../src/hooks/useTransport'
import Animated, { interpolate, Extrapolation, useAnimatedStyle, FadeInDown } from 'react-native-reanimated'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { useAuthStore } from '../../src/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

const { width: SW } = Dimensions.get('window')
const CARD_WIDTH = Math.round(SW * 0.6)
const IMG_H = CardSystem.aspectRatioHeight // 140px

import { favoritesApi } from '../../src/api/favorites'

interface SectionProps {
  title: string
  subTitle?: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor?: string
  seeAllRoute: string
  data: UnifiedCardItem[] | undefined
  isLoading: boolean
  routeBase: string
  CustomCard?: React.FC<{
    item: any
    onPress: () => void
    imageHeight?: number
    disableImageSwipe?: boolean
    fullWidth?: boolean
    maxChips?: number
    titleNumberOfLines?: number
  }>
}

function CategorySection({ title, subTitle, icon, iconColor, seeAllRoute, data, isLoading, routeBase, CustomCard }: SectionProps) {
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
        'cars': 'LISTING',
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
          <View style={s.sectionIconWrap}>
            <MaterialCommunityIcons name={icon} size={16} color={iconColor || Colors.primary} />
          </View>
          <View style={s.titleCol}>
            <Text style={s.sectionTitle}>{title}</Text>
            {subTitle ? <Text style={s.sectionSubTitle}>{subTitle}</Text> : null}
          </View>
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push(seeAllRoute as any)} activeOpacity={0.8}>
          <Text style={s.seeAll}>الكل</Text>
          <Ionicons name="chevron-back" size={13} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <HorizontalScrollCard
          key="loading-skeletons"
          data={[1, 2, 3]}
          cardWidth={CARD_WIDTH}
          gap={Spacing.space3}
          paddingEnd={Spacing.space5}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => <SkeletonCard style={{ width: CARD_WIDTH }} />}
        />
      ) : (
        <HorizontalScrollCard
          key="loaded-cards"
          data={data || []}
          cardWidth={CARD_WIDTH}
          gap={Spacing.space3}
          paddingEnd={Spacing.space5}
          keyExtractor={(item) => item.id}
          onSeeAll={() => router.push(seeAllRoute as any)}
          seeAllTitle="عرض الكل"
          seeAllSubtitle={`تصفح جميع ${title}`}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              {CustomCard ? (
                <CustomCard
                  item={item}
                  onPress={() => router.push(`/${routeBase}/${item.id}` as any)}
                  disableImageSwipe={true}
                  titleNumberOfLines={1}
                />
              ) : (
                <UnifiedCard
                  item={item}
                  imageHeight={IMG_H}
                  disableImageSwipe={true}
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

  // Actions
  const handlePost = () => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    router.push('/(modals)/post-category' as any)
  }

  const userName = user?.displayName || user?.username || 'ضيف'

  return (
    <View style={s.root}>
      {/* ── ANIMATED STICKY HEADER (Unified Glassmorphism matching all landing pages) ── */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        hideBackButton
        rightElement={
          <View style={s.brandIconBtn}>
            <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
          </View>
        }
        title="ســوق ون"
        titleAccent={`أهلاً بك، ${userName} 👋`}
        heroSearchPlaceholder="عن ماذا تبحث اليوم؟ (سيارات، وظائف...)"
        onHeroSearchPress={() => router.push('/(tabs)/search')}
        navSearchPlaceholder="عن ماذا تبحث اليوم؟"
        onNavSearchPress={() => router.push('/(tabs)/search')}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications')}
        primaryCta={{
          label: 'إضافة إعلان',
          icon: 'add',
          onPress: handlePost,
        }}
      />

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[s.content, { 
          paddingTop: insets.top + 114 + Spacing.space4, 
          paddingBottom: 100 
        }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >


        {/* ── CAR DETAIL SANDBOX QUICK ACCESS ── */}
        <Animated.View entering={FadeInDown.duration(300)} style={s.sandboxBannerWrap}>
          <TouchableOpacity
            style={s.sandboxBanner}
            onPress={() => router.push('/dev/car-detail-sandbox' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#0F172A', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.sandboxGradient}
            >
              <View style={s.sandboxContent}>
                <View style={s.sandboxIconCircle}>
                  <Ionicons name="car-sport" size={22} color={Colors.white} />
                </View>
                <View style={s.sandboxTextCol}>
                  <View style={s.sandboxBadgeRow}>
                    <Text style={s.sandboxTitle}>معمل تجارب تفاصيل السيارة</Text>
                    <View style={s.devBadge}>
                      <Text style={s.devBadgeText}>DEV</Text>
                    </View>
                  </View>
                  <Text style={s.sandboxSubtitle}>معاينة كافة مكونات الصفحة والسيناريوهات</Text>
                </View>
                <Ionicons name="chevron-back" size={20} color={Colors.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── OFFICIAL CATEGORIES GRID (Balanced 4x2) ── */}
        <HomeCategoriesGrid />

        {/* ── SECTIONS (Scaled to 60% with Minimal Green Architecture) ── */}
        <CategorySection
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع والإيجار المتاحة"
          icon="car-sports"
          iconColor={Colors.primary}
          seeAllRoute="/cars/browse"
          data={listings}
          isLoading={loadingListings}
          routeBase="cars"
          CustomCard={({ item, onPress }) => (
            <CarCard
              item={item as any}
              onPress={onPress}
              maxChips={3}
              disableImageSwipe={true}
              titleNumberOfLines={1}
            />
          )}
        />

        <CategorySection
          title="وظائف وشواغر"
          subTitle="فرص عمل وكفاءات مهنية جديدة"
          icon="account-tie"
          iconColor={Colors.forestGreen}
          seeAllRoute="/jobs"
          data={jobs as any}
          isLoading={loadingJobs}
          routeBase="jobs"
          CustomCard={({ item, onPress }) => (
            <JobCard
              job={item as any}
              onPress={onPress}
              maxChips={3}
            />
          )}
        />

        <CategorySection
          title="خدمات السيارات"
          subTitle="صيانة وفحص وورش متخصصة"
          icon="car-wrench"
          iconColor={Colors.accent}
          seeAllRoute="/services"
          data={services}
          isLoading={loadingServices}
          routeBase="services"
          CustomCard={({ item, onPress }) => (
            <ServiceCard
              item={item as any}
              onPress={onPress}
              disableImageSwipe={true}
              titleNumberOfLines={1}
            />
          )}
        />

        <CategorySection
          title="قطع الغيار"
          subTitle="قطع أصلية وتجارية وسكراب بأفضل الأسعار"
          icon="car-cog"
          iconColor={Colors.primary}
          seeAllRoute="/parts"
          data={parts}
          isLoading={loadingParts}
          routeBase="parts"
          CustomCard={({ item, onPress }) => (
            <PartCard
              item={item as any}
              onPress={onPress}
              maxChips={3}
              disableImageSwipe={true}
              titleNumberOfLines={1}
            />
          )}
        />

        <CategorySection
          title="حافلات ونقل ركاب"
          subTitle="حافلات للبيع وللإيجار بمختلف السعات"
          icon="bus-side"
          iconColor={Colors.forestGreen}
          seeAllRoute="/buses"
          data={buses}
          isLoading={loadingBuses}
          routeBase="buses"
          CustomCard={({ item, onPress }) => (
            <BusCard
              item={item as any}
              onPress={onPress}
              maxChips={3}
              disableImageSwipe={true}
              titleNumberOfLines={1}
            />
          )}
        />

        <CategorySection
          title="معدات ومشغلون"
          subTitle="معدات ثقيلة وخفيفة ومشغلون معتمدون"
          icon="excavator"
          iconColor={Colors.primary}
          seeAllRoute="/equipment"
          data={equipment}
          isLoading={loadingEquipment}
          routeBase="equipment"
          CustomCard={({ item, onPress }) => (
            <EquipCard
              item={item as any}
              onPress={onPress}
              maxChips={3}
              disableImageSwipe={true}
              titleNumberOfLines={1}
            />
          )}
        />

        <CategorySection
          title="طلبات الشحن والنقل"
          subTitle="شحنات بضائع وطلبات نقل نشطة"
          icon="truck-fast"
          iconColor={Colors.accent}
          seeAllRoute="/transport"
          data={transport?.items as any}
          isLoading={loadingTransport}
          routeBase="transport"
          CustomCard={({ item, onPress }) => (
            <TransportRequestCard
              request={item as any}
              onPress={onPress}
            />
          )}
        />

        {/* Need Help / Support Button */}
        <SupportHelpButton style={{ marginHorizontal: Spacing.space5, marginTop: Spacing.space2, marginBottom: Spacing.space6 }} />
      </Animated.ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },

  // Header & Brand Icon
  brandIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  content: { },

  // Dev Sandbox Quick Access Banner
  sandboxBannerWrap: {
    paddingHorizontal: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  sandboxBanner: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sandboxGradient: {
    padding: Spacing.space3,
  },
  sandboxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  sandboxIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sandboxTextCol: {
    flex: 1,
  },
  sandboxBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sandboxTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.white,
    textAlign: 'left',
  },
  devBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  devBadgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    color: Colors.white,
  },
  sandboxSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'left',
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIconWrap: { 
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  sectionSubTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 1,
  },
  seeAllBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, 
    paddingVertical: 4,
    paddingHorizontal: 11, 
    backgroundColor: Colors.paleMint, 
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  seeAll: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    color: Colors.primary,
    paddingTop: 1,
  },
})

import React, { memo, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Gradients } from '../../src/constants/gradients'
import { CardSystem } from '../../src/constants/cardSystem'
import { UnifiedCardItem } from '../../src/types/unified-card.types'
import { EquipCard } from '../../src/components/cards/EquipCard'
import { CarCard } from '../../src/components/cars/CarCard'
import { BusCard } from '../../src/components/buses/BusCard'
import { PartCard } from '../../src/components/parts/PartCard'
import { ServiceCard } from '../../src/components/services/ServiceCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { StaleDataBanner } from '../../src/components/listing-detail/StaleDataBanner'
import { getListErrorProps } from '../../src/utils/getListErrorProps'
import {
  HorizontalScrollCard,
  SIDE_SCALE,
  SIDE_TRANSLATE_Y,
  SIDE_OPACITY,
  SNAP_DURATION,
  computeCardDepth,
} from '../../src/components/ui/HorizontalScrollCard'
export {
  SIDE_SCALE,
  SIDE_TRANSLATE_Y,
  SIDE_OPACITY,
  SNAP_DURATION,
  computeCardDepth,
}
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader'
import { GlassSurface, useGlassSupport, type GlassSupport } from '../../src/components/navigation/glassSupport'
import { TopBarTokens } from '../../src/constants/topBarTokens'
import { HomeCategoriesGrid } from '../../src/components/home/HomeCategoriesGrid'
import { HomeAddListingBanner } from '../../src/components/home'
import { DeletionScheduledBanner } from '../../src/components/profile/DeletionScheduledBanner'
import { useListings } from '../../src/hooks/useListings'
import { useServices } from '../../src/hooks/useServices'
import { useParts } from '../../src/hooks/useParts'
import { useBuses } from '../../src/hooks/useBuses'
import { useEquipment } from '../../src/hooks/useEquipment'
import Animated, { interpolate, Extrapolation, useAnimatedStyle, FadeInDown } from 'react-native-reanimated'
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav'
import { useNavVisibility } from '../../src/context/NavVisibilityContext'
import { useAuthStore } from '../../src/store/authStore'
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

import {
  CARS_PEEK_WIDTH_RATIO,
  CARS_PEEK_GAP,
  CARS_PEEK_IMAGE_HEIGHT,
  getPeekCardWidth,
  getPeekSideInset,
  getPeekLeadingInset,
  getPeekLeftRemainder,
} from '../../src/constants/peekCarousel'
export {
  CARS_PEEK_WIDTH_RATIO,
  CARS_PEEK_GAP,
  CARS_PEEK_IMAGE_HEIGHT,
  getPeekCardWidth,
  getPeekSideInset,
  getPeekLeadingInset,
  getPeekLeftRemainder,
}

const { width: SW } = Dimensions.get('window')
export const CARD_WIDTH = Math.round(SW * 0.6)
const IMG_H = CardSystem.aspectRatioHeight // 140px

export interface HomeCustomCardProps {
  item: any
  onPress: () => void
  imageHeight?: number
  compactBody?: boolean
  disableImageSwipe?: boolean
  fullWidth?: boolean
  maxChips?: number
  titleNumberOfLines?: number
  glassSupport?: GlassSupport
}

export interface SectionProps {
  title: string
  subTitle?: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor?: string
  seeAllRoute: string
  data: UnifiedCardItem[] | undefined
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void | Promise<unknown>
  isRefetching?: boolean
  routeBase: string
  CustomCard: React.ComponentType<HomeCustomCardProps>
  peek?: boolean
  glassSupport?: GlassSupport
}

export const SECTION_ICON_BOX_SIZE = 32
export const SEE_ALL_PADDING_HORIZONTAL = 10
export const SEE_ALL_PADDING_VERTICAL = 4
export const SEE_ALL_GAP = 4

export const HomeCarCard = memo(function HomeCarCard({
  item,
  onPress,
  fullWidth,
  imageHeight,
  compactBody,
  glassSupport,
}: HomeCustomCardProps) {
  return (
    <CarCard
      item={item as any}
      onPress={onPress}
      fullWidth={fullWidth ?? true}
      imageHeight={imageHeight}
      compactBody={compactBody}
      maxChips={4}
      disableImageSwipe={true}
      titleNumberOfLines={1}
      glassSupport={glassSupport}
    />
  )
})

export const HomeServiceCard = memo(function HomeServiceCard({
  item,
  onPress,
  fullWidth,
  imageHeight,
  compactBody,
  glassSupport,
}: HomeCustomCardProps) {
  return (
    <ServiceCard
      item={item as any}
      onPress={onPress}
      fullWidth={fullWidth ?? true}
      imageHeight={imageHeight}
      compactBody={compactBody}
      maxChips={4}
      disableImageSwipe={true}
      titleNumberOfLines={1}
      glassSupport={glassSupport}
    />
  )
})

export const HomePartCard = memo(function HomePartCard({
  item,
  onPress,
  fullWidth,
  imageHeight,
  compactBody,
  glassSupport,
}: HomeCustomCardProps) {
  return (
    <PartCard
      item={item as any}
      onPress={onPress}
      fullWidth={fullWidth ?? true}
      imageHeight={imageHeight}
      compactBody={compactBody}
      maxChips={4}
      disableImageSwipe={true}
      titleNumberOfLines={1}
      glassSupport={glassSupport}
    />
  )
})

export const HomeBusCard = memo(function HomeBusCard({
  item,
  onPress,
  fullWidth,
  imageHeight,
  compactBody,
  glassSupport,
}: HomeCustomCardProps) {
  return (
    <BusCard
      item={item as any}
      onPress={onPress}
      fullWidth={fullWidth ?? true}
      imageHeight={imageHeight}
      compactBody={compactBody}
      maxChips={4}
      disableImageSwipe={true}
      titleNumberOfLines={1}
      glassSupport={glassSupport}
    />
  )
})

export const HomeEquipCard = memo(function HomeEquipCard({
  item,
  onPress,
  fullWidth,
  imageHeight,
  compactBody,
  glassSupport,
}: HomeCustomCardProps) {
  return (
    <EquipCard
      item={item as any}
      onPress={onPress}
      fullWidth={fullWidth ?? true}
      imageHeight={imageHeight}
      compactBody={compactBody}
      maxChips={4}
      disableImageSwipe={true}
      titleNumberOfLines={1}
      glassSupport={glassSupport}
    />
  )
})

export const CategorySection = memo(function CategorySection({
  title,
  subTitle,
  icon,
  iconColor,
  seeAllRoute,
  data,
  isLoading,
  isError = false,
  error,
  onRetry,
  isRefetching = false,
  routeBase,
  CustomCard,
  peek = false,
  glassSupport,
}: SectionProps) {
  const sectionCardWidth = peek ? getPeekCardWidth(SW) : CARD_WIDTH
  const sectionGap = peek ? CARS_PEEK_GAP : Spacing.space3
  const sectionPaddingEnd = peek ? getPeekLeadingInset() : Spacing.space5
  const sectionPaging = peek
  const sectionShowDots = peek

  const handleSeeAll = useCallback(() => {
    router.push(seeAllRoute as Parameters<typeof router.push>[0])
  }, [seeAllRoute])

  const renderLoadedItem = useCallback(
    ({ item }: { item: UnifiedCardItem }) => (
      <View style={{ width: sectionCardWidth }}>
        <CustomCard
          item={item}
          onPress={() => router.push(`/${routeBase}/${item.id}` as any)}
          disableImageSwipe={true}
          titleNumberOfLines={1}
          fullWidth={peek}
          imageHeight={peek ? CARS_PEEK_IMAGE_HEIGHT : undefined}
          compactBody={peek}
          glassSupport={glassSupport}
        />
      </View>
    ),
    [CustomCard, glassSupport, peek, routeBase, sectionCardWidth]
  )

  const hasData = Array.isArray(data) && data.length > 0
  if (!isLoading && !isError && !hasData) return null

  const errorProps = !hasData && isError ? getListErrorProps(error, `تعذر تحميل ${title}`) : null

  return (
    <Animated.View style={s.section} entering={FadeInDown.duration(400)} testID={`home-section-${routeBase}`}>
      <View style={s.sectionHeader} testID={`home-section-header-${routeBase}`}>
        <View style={s.titleRow} testID={`home-section-title-row-${routeBase}`}>
          <View style={s.sectionIconWrap} testID={`home-section-icon-box-${routeBase}`}>
            <MaterialCommunityIcons
              testID={`home-section-icon-${routeBase}`}
              name={icon}
              size={16}
              color={iconColor || Colors.primary}
            />
          </View>
          <View style={s.titleCol}>
            <Text style={s.sectionTitle}>{title}</Text>
            {subTitle ? <Text style={s.sectionSubTitle}>{subTitle}</Text> : null}
          </View>
        </View>
        <TouchableOpacity
          testID={`home-section-see-all-${routeBase}`}
          style={s.seeAllBtn}
          onPress={handleSeeAll}
          activeOpacity={0.8}
        >
          <Text style={s.seeAll}>الكل</Text>
          <Ionicons name="chevron-back" size={13} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && !hasData ? (
        <HorizontalScrollCard
          key="loading-skeletons"
          data={[1, 2, 3]}
          cardWidth={sectionCardWidth}
          gap={sectionGap}
          paddingEnd={sectionPaddingEnd}
          trackPendingIndex
          paging={sectionPaging}
          depthEffect={peek}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => (
            <SkeletonCard
              fullWidth={peek}
              imageHeight={peek ? CARS_PEEK_IMAGE_HEIGHT : undefined}
              compactBody={peek}
              style={{ width: sectionCardWidth }}
            />
          )}
        />
      ) : errorProps ? (
        <View style={s.sectionErrorCard} testID={`home-section-error-${routeBase}`}>
          <View style={s.sectionErrorInfoRow}>
            <View style={s.sectionErrorIconWrap}>
              <Ionicons
                name={errorProps.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={errorProps.iconColor}
              />
            </View>
            <View style={s.sectionErrorTextWrap}>
              <Text style={s.sectionErrorTitle}>{errorProps.title}</Text>
              <Text style={s.sectionErrorSubtitle}>{errorProps.subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity
            testID={`home-section-retry-${routeBase}`}
            style={[s.sectionRetryBtn, (!onRetry || isRefetching) && s.sectionRetryBtnDisabled]}
            onPress={() => onRetry?.()}
            disabled={!onRetry || isRefetching}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={errorProps.actionLabel}
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="refresh" size={14} color={Colors.white} />
                <Text style={s.sectionRetryBtnText}>{errorProps.actionLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {isError ? (
            <View style={s.sectionStaleWrap} testID={`home-section-stale-${routeBase}`}>
              <StaleDataBanner onRetry={onRetry ?? (() => {})} isRefetching={isRefetching} />
            </View>
          ) : null}
          <HorizontalScrollCard
            key="loaded-cards"
            data={data || []}
            cardWidth={sectionCardWidth}
            gap={sectionGap}
            paddingEnd={sectionPaddingEnd}
            trackPendingIndex
            paging={sectionPaging}
            showDots={sectionShowDots}
            depthEffect={peek}
            keyExtractor={(item) => item.id}
            onSeeAll={handleSeeAll}
            seeAllTitle="عرض الكل"
            seeAllSubtitle={`تصفح جميع ${title}`}
            renderItem={renderLoadedItem}
          />
        </>
      )}
    </Animated.View>
  )
})

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const glassSupport = useGlassSupport()

  const {
    data: listings,
    isLoading: loadingListings,
    isError: errorFlagListings,
    error: errorListings,
    refetch: refetchListings,
    isRefetching: refetchingListings,
  } = useListings({ limit: 8 })
  const {
    data: services,
    isLoading: loadingServices,
    isError: errorFlagServices,
    error: errorServices,
    refetch: refetchServices,
    isRefetching: refetchingServices,
  } = useServices({ limit: 8 })
  const {
    data: parts,
    isLoading: loadingParts,
    isError: errorFlagParts,
    error: errorParts,
    refetch: refetchParts,
    isRefetching: refetchingParts,
  } = useParts({ limit: 8 })
  const {
    data: buses,
    isLoading: loadingBuses,
    isError: errorFlagBuses,
    error: errorBuses,
    refetch: refetchBuses,
    isRefetching: refetchingBuses,
  } = useBuses({ limit: 8 })
  const {
    data: equipment,
    isLoading: loadingEquipment,
    isError: errorFlagEquipment,
    error: errorEquipment,
    refetch: refetchEquipment,
    isRefetching: refetchingEquipment,
  } = useEquipment({ limit: 8 })

  const { scrollHandler, scrollY } = useScrollAwareNav()
  const { navHidden } = useNavVisibility()

  // Actions
  const handlePost = useCallback(() => {
    if (!user) {
      router.push('/(auth)/login' as any)
      return
    }
    router.push('/(modals)/post-category' as any)
  }, [user])

  const handleChat = useCallback(() => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    router.push('/(tabs)/chat')
  }, [user])

  const handleSearch = useCallback(() => {
    router.push('/(tabs)/search')
  }, [])

  const handleNotifications = useCallback(() => {
    router.push('/profile/notifications')
  }, [])

  const brandRightElement = useMemo(
    () => (
      <View style={s.brandIconBtn} testID="home-brand-icon-btn">
        <View
          pointerEvents="none"
          testID="home-brand-icon-btn-backing"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: TopBarTokens.iceGlass, borderRadius: TopBarTokens.buttonRadius },
          ]}
        />
        <GlassSurface
          testID="home-brand-icon-btn"
          borderRadius={TopBarTokens.buttonRadius}
          washColor={TopBarTokens.iceGlass}
          support={glassSupport}
        />
        <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
      </View>
    ),
    [glassSupport]
  )

  const userName = user?.displayName || user?.username || 'ضيف'

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      {/* ── ANIMATED STICKY HEADER (Unified Glassmorphism matching all landing pages) ── */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        hideBackButton
        glassSupport={glassSupport}
        rightElement={brandRightElement}
        title="ســوق ون"
        titleAccent={`أهلاً بك، ${userName} 👋`}
        heroSearchPlaceholder="عن ماذا تبحث اليوم؟ (سيارات، معدات، قطع غيار...)"
        onHeroSearchPress={handleSearch}
        navSearchPlaceholder="عن ماذا تبحث اليوم؟"
        onNavSearchPress={handleSearch}
        headerIcon="notifications-outline"
        onHeaderIconPress={handleNotifications}
        onChatPress={handleChat}
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
        {/* ── Scheduled Deletion Banner ── */}
        <View style={{ paddingHorizontal: 16 }}>
          <DeletionScheduledBanner />
        </View>


        {/* ── OFFICIAL CATEGORIES GRID (Balanced 4x2) ── */}
        <HomeCategoriesGrid support={glassSupport} />

        {/* ── SECTIONS (Scaled to 60% with Minimal Green Architecture, Cars with Peek Carousel D-164) ── */}
        <CategorySection
          peek={true}
          title="أحدث إعلانات السيارات"
          subTitle="أفضل عروض البيع والإيجار المتاحة"
          icon="car-sports"
          iconColor={Colors.primary}
          seeAllRoute="/cars/browse"
          data={listings}
          isLoading={loadingListings}
          isError={errorFlagListings}
          error={errorListings}
          onRetry={refetchListings}
          isRefetching={refetchingListings}
          routeBase="cars"
          CustomCard={HomeCarCard}
          glassSupport={glassSupport}
        />

        <CategorySection
          peek={true}
          title="خدمات السيارات"
          subTitle="صيانة وفحص وورش متخصصة"
          icon="car-wrench"
          iconColor={Colors.accent}
          seeAllRoute="/services"
          data={services}
          isLoading={loadingServices}
          isError={errorFlagServices}
          error={errorServices}
          onRetry={refetchServices}
          isRefetching={refetchingServices}
          routeBase="services"
          CustomCard={HomeServiceCard}
          glassSupport={glassSupport}
        />

        <CategorySection
          peek={true}
          title="قطع الغيار"
          subTitle="قطع أصلية وتجارية وسكراب بأفضل الأسعار"
          icon="car-cog"
          iconColor={Colors.primary}
          seeAllRoute="/parts"
          data={parts}
          isLoading={loadingParts}
          isError={errorFlagParts}
          error={errorParts}
          onRetry={refetchParts}
          isRefetching={refetchingParts}
          routeBase="parts"
          CustomCard={HomePartCard}
          glassSupport={glassSupport}
        />

        <CategorySection
          peek={true}
          title="حافلات ونقل ركاب"
          subTitle="حافلات للبيع وللإيجار بمختلف السعات"
          icon="bus-side"
          iconColor={Colors.forestGreen}
          seeAllRoute="/buses"
          data={buses}
          isLoading={loadingBuses}
          isError={errorFlagBuses}
          error={errorBuses}
          onRetry={refetchBuses}
          isRefetching={refetchingBuses}
          routeBase="buses"
          CustomCard={HomeBusCard}
          glassSupport={glassSupport}
        />

        <CategorySection
          peek={true}
          title="معدات ومشغلون"
          subTitle="معدات ثقيلة وخفيفة ومشغلون معتمدون"
          icon="excavator"
          iconColor={Colors.primary}
          seeAllRoute="/equipment"
          data={equipment}
          isLoading={loadingEquipment}
          isError={errorFlagEquipment}
          error={errorEquipment}
          onRetry={refetchEquipment}
          isRefetching={refetchingEquipment}
          routeBase="equipment"
          CustomCard={HomeEquipCard}
          glassSupport={glassSupport}
        />

        <HomeAddListingBanner onPress={handlePost} support={glassSupport} />

        {/* Need Help / Support Button */}
        <SupportHelpButton style={{ marginHorizontal: Spacing.space5, marginTop: Spacing.space2, marginBottom: Spacing.space6 }} />
      </Animated.ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.homeBg },

  // Header & Brand Icon
  brandIconBtn: {
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...TopBarTokens.buttonShadow,
  },

  content: { },


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
    width: SECTION_ICON_BOX_SIZE,
    height: SECTION_ICON_BOX_SIZE,
    borderRadius: 10,
    backgroundColor: TopBarTokens.iceGlass,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
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
    justifyContent: 'center',
    gap: SEE_ALL_GAP,
    paddingVertical: SEE_ALL_PADDING_VERTICAL,
    paddingHorizontal: SEE_ALL_PADDING_HORIZONTAL,
    paddingStart: SEE_ALL_PADDING_HORIZONTAL,
    paddingEnd: SEE_ALL_PADDING_HORIZONTAL,
    backgroundColor: TopBarTokens.iceGlass, 
    borderRadius: Radius.pill,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
  },
  seeAll: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.primary,
    paddingTop: 1,
  },
  sectionStaleWrap: {
    marginHorizontal: Spacing.space5,
    marginBottom: Spacing.space2,
  },
  sectionErrorCard: {
    marginHorizontal: Spacing.space5,
    padding: Spacing.space4,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.space3,
  },
  sectionErrorInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.space3,
  },
  sectionErrorIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionErrorTextWrap: {
    flex: 1,
    gap: 2,
  },
  sectionErrorTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  sectionErrorSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  sectionRetryBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: Spacing.space4,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  sectionRetryBtnDisabled: {
    opacity: 0.65,
  },
  sectionRetryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.white,
  },
})

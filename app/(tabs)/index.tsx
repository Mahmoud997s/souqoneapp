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
import { UnifiedCardItem } from '../../src/types/unified-card.types'
import { EquipCard } from '../../src/components/cards/EquipCard'
import { CarCard } from '../../src/components/cars/CarCard'
import { BusCard } from '../../src/components/buses/BusCard'
import { PartCard } from '../../src/components/parts/PartCard'
import { ServiceCard } from '../../src/components/services/ServiceCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
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
import { GlassSurface } from '../../src/components/navigation/glassSupport'
import { TopBarTokens } from '../../src/constants/topBarTokens'
import { HomeCategoriesGrid } from '../../src/components/home/HomeCategoriesGrid'
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

const { width: SW } = Dimensions.get('window')
export const CARD_WIDTH = Math.round(SW * 0.6)
export const CARS_PEEK_WIDTH_RATIO = 0.80
export const CARS_PEEK_GAP = 6
export const CARS_PEEK_IMAGE_HEIGHT = 133
export const getPeekCardWidth = (screenWidth: number = SW) => Math.round(screenWidth * CARS_PEEK_WIDTH_RATIO)
export const getPeekSideInset = (screenWidth: number = SW) => Math.round((screenWidth - getPeekCardWidth(screenWidth)) / 2)
const IMG_H = CardSystem.aspectRatioHeight // 140px

export interface SectionProps {
  title: string
  subTitle?: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor?: string
  seeAllRoute: string
  data: UnifiedCardItem[] | undefined
  isLoading: boolean
  routeBase: string
  CustomCard: React.FC<{
    item: any
    onPress: () => void
    imageHeight?: number
    compactBody?: boolean
    disableImageSwipe?: boolean
    fullWidth?: boolean
    maxChips?: number
    titleNumberOfLines?: number
  }>
  peek?: boolean
}

export function CategorySection({
  title,
  subTitle,
  icon,
  iconColor,
  seeAllRoute,
  data,
  isLoading,
  routeBase,
  CustomCard,
  peek = false,
}: SectionProps) {
  if (!isLoading && (!data || data.length === 0)) return null

  const sectionCardWidth = peek ? getPeekCardWidth(SW) : CARD_WIDTH
  const sectionGap = peek ? CARS_PEEK_GAP : Spacing.space3
  const sectionPaddingEnd = peek ? getPeekSideInset(SW) : Spacing.space5
  const sectionPaging = peek
  const sectionShowDots = peek

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
          cardWidth={sectionCardWidth}
          gap={sectionGap}
          paddingEnd={sectionPaddingEnd}
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
      ) : (
        <HorizontalScrollCard
          key="loaded-cards"
          data={data || []}
          cardWidth={sectionCardWidth}
          gap={sectionGap}
          paddingEnd={sectionPaddingEnd}
          paging={sectionPaging}
          showDots={sectionShowDots}
          depthEffect={peek}
          keyExtractor={(item) => item.id}
          onSeeAll={() => router.push(seeAllRoute as any)}
          seeAllTitle="عرض الكل"
          seeAllSubtitle={`تصفح جميع ${title}`}
          renderItem={({ item }) => (
            <View style={{ width: sectionCardWidth }}>
              <CustomCard
                item={item}
                onPress={() => router.push(`/${routeBase}/${item.id}` as any)}
                disableImageSwipe={true}
                titleNumberOfLines={1}
                fullWidth={peek}
                imageHeight={peek ? CARS_PEEK_IMAGE_HEIGHT : undefined}
                compactBody={peek}
              />
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
  const { data: services,  isLoading: loadingServices  } = useServices({ limit: 8 })
  const { data: parts,     isLoading: loadingParts     } = useParts({ limit: 8 })
  const { data: buses,     isLoading: loadingBuses     } = useBuses({ limit: 8 })
  const { data: equipment, isLoading: loadingEquipment } = useEquipment({ limit: 8 })

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

  const handleChat = () => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    router.push('/(tabs)/chat')
  }

  const userName = user?.displayName || user?.username || 'ضيف'

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      {/* ── ANIMATED STICKY HEADER (Unified Glassmorphism matching all landing pages) ── */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        hideBackButton
        rightElement={
          <View style={s.brandIconBtn} testID="home-brand-icon-btn">
            <GlassSurface testID="home-brand-icon-btn" borderRadius={TopBarTokens.buttonRadius} />
            <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
          </View>
        }
        title="ســوق ون"
        titleAccent={`أهلاً بك، ${userName} 👋`}
        heroSearchPlaceholder="عن ماذا تبحث اليوم؟ (سيارات، معدات، قطع غيار...)"
        onHeroSearchPress={() => router.push('/(tabs)/search')}
        navSearchPlaceholder="عن ماذا تبحث اليوم؟"
        onNavSearchPress={() => router.push('/(tabs)/search')}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications')}
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
        <HomeCategoriesGrid />

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
          routeBase="cars"
          CustomCard={({ item, onPress, fullWidth, imageHeight, compactBody }) => (
            <CarCard
              item={item as any}
              onPress={onPress}
              fullWidth={fullWidth ?? true}
              imageHeight={imageHeight}
              compactBody={compactBody}
              maxChips={3}
              disableImageSwipe={true}
              titleNumberOfLines={1}
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

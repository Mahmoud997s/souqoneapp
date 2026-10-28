import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Linking,
  InteractionManager,
  RefreshControl,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  FadeInDown,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { RTLText } from '../../constants/rtl'
import { lineHeightFor } from '../../constants/typography'
import { SUPPORT_MAILTO } from '../../constants/support'
import MapView, { Marker } from '../../components/ui/Map'
import { useAuthStore } from '../../store/authStore'
import { useCarWizardStore } from '../../store/carWizardStore'
import { dialogService } from '../../store/dialogStore'

// Hooks & Utilities
import { useCarDetail } from '../../hooks/listing-detail/useCarDetail'
import { useDetailRefresh } from '../../hooks/listing-detail/useDetailRefresh'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useShareListing } from '../../hooks/listing-detail/useShareListing'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import {
  useOwnerActions,
  isOptimisticLockError,
} from '../../hooks/listing-detail/useOwnerActions'
import {
  useSimilarListings,
  type SimilarCarItem,
} from '../../hooks/listing-detail/useSimilarListings'
import { carListingToFormData } from '../../utils/listing-detail/carListingToFormData'
import { OWNER_ACTION_SUCCESS_MESSAGE } from '../../utils/listing-detail/ownerActionMatrix'
import { formatSimilarListingPrice } from '../../utils/listing-detail/formatSimilarListingPrice'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import {
  BUYER_SAFETY_TIPS_TITLE,
  BUYER_SAFETY_TIPS,
  SELLER_SAFETY_TIPS_TITLE,
  SELLER_SAFETY_TIPS,
} from '../../constants/listing-detail/safetyTips'

// Presentational Components
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { ImageGallery } from '../../components/listing-detail/ImageGallery'
import { ImageViewerModal } from '../../components/listing-detail/ImageViewerModal'
import { ListingHeaderBlock } from '../../components/listing-detail/ListingHeaderBlock'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import {
  ContactActions,
  type ContactAvailability,
} from '../../components/listing-detail/ContactActions'
import {
  OwnerManageBar,
  type OwnerActionId,
} from '../../components/listing-detail/OwnerManageBar'
import { ListingDescription } from '../../components/listing-detail/ListingDescription'
import { SpecsSections } from '../../components/listing-detail/SpecsSections'
import { SimilarListingsGrid } from '../../components/listing-detail/SimilarListingsGrid'
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import { DetailStates } from '../../components/listing-detail/DetailStates'
import { filterSpecsSections } from '../../utils/listing-detail/filterSpecsSections'

import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'

const DUMMY_VM: CarDetailViewModel = {
  id: '',
  version: 1,
  status: 'ACTIVE',
  title: '',
  description: '',
  listingType: 'SALE',
  price: {
    amount: 0,
    formattedAmount: '0',
    currency: 'ر.ع',
    fullPriceLabel: '0 ر.ع',
    isNegotiable: false,
    listingType: 'SALE',
  },
  images: [],
  location: { fullLocationText: '', hasCoordinates: false },
  seller: { id: '', name: '', username: '', isVerified: false, memberSinceLabel: '' },
  whatsappEnabled: true,
  postedAtLabel: '',
  viewCount: 0,
  make: '',
  model: '',
  keySpecs: [],
  specsSections: [],
  features: [],
}

export interface CarDetailScreenProps {
  id: string
}

/**
 * CarDetailScreen
 * Real-data container screen for vehicle details.
 * Connects useCarDetail and foundation hooks to listing-detail presentational components.
 */
export function CarDetailScreen({ id }: CarDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()

  // 1. Data Query
  const { state, vm, raw, refetch } = useCarDetail(id)
  const { refreshing, onRefresh } = useDetailRefresh(refetch)

  // 2. Viewer & Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. Foundation Hooks (called unconditionally at top level)
  const currentVm = vm ?? DUMMY_VM
  const favoriteToggle = useFavoriteToggle('LISTING', id, false, { redirectPath: `/cars/${id}` })
  const shareListing = useShareListing(currentVm, { shareTitle: vm?.title ?? 'إعلان سيارة' })
  const contact = useListingContact('LISTING', id, `/cars/${id}`, vm?.title)
  const ownerActions = useOwnerActions(currentVm)
  const similarListings = useSimilarListings(id)

  // 4. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [similarPage, setSimilarPage] = useState<number>(1)
  const [isMapMounted, setIsMapMounted] = useState<boolean>(false)

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsMapMounted(true)
    })
    return () => task.cancel()
  }, [])

  // 5. Scroll Tracker for glassmorphism and sticky bars
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // 6. Reduced Motion & Animations (Phase 10)
  const shouldReduceMotion = useAppReducedMotion()

  const heroParallaxStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) return {}
    const translateY = interpolate(
      scrollY.value,
      [-150, 0, 250],
      [-40, 0, 60],
      Extrapolation.CLAMP
    )
    const scale = interpolate(
      scrollY.value,
      [-150, 0],
      [1.1, 1],
      Extrapolation.CLAMP
    )
    return {
      transform: [{ translateY }, { scale }],
    }
  })

  const getEnteringAnimation = (index: number) => {
    if (shouldReduceMotion) return undefined
    return FadeInDown.delay(index * 60).springify()
  }

  // Handlers
  const goBackSafely = () => {
    if (router.canGoBack()) router.back()
    else router.push('/')
  }

  const handleSearchSubmit = (text: string) => {
    router.push({
      pathname: '/cars/browse' as any,
      params: { search: text },
    })
  }

  const handleProfilePress = (sellerId: string) => {
    router.push(`/profile/${sellerId}` as any)
  }

  const handleSupportPress = () => {
    Linking.openURL(SUPPORT_MAILTO).catch(() => {})
  }

  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      if (raw) {
        const formData = carListingToFormData(raw)
        useCarWizardStore.getState().setEditMode(raw.id, formData)
        router.push('/cars/new' as any)
      }
      return
    }

    const action = ownerActions.actions.find((a) => a.id === actionId)
    if (!action) return

    const execute = async () => {
      try {
        await ownerActions.run(actionId)
        if (actionId === 'delete') {
          goBackSafely()
          return
        }
        await refetch()
        const msg = OWNER_ACTION_SUCCESS_MESSAGE[actionId] ?? 'تم تغيير حالة الإعلان بنجاح'
        dialogService.alert('تم بنجاح', msg, 'success')
      } catch (err: unknown) {
        if (isOptimisticLockError(err)) {
          dialogService.alert(
            'تعارض في البيانات',
            'تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
          )
        } else {
          const responseMsg =
            typeof err === 'object' && err !== null && 'response' in err
              ? (err as { response?: { data?: { message?: unknown } } }).response?.data?.message
              : undefined
          const errorMsg =
            typeof responseMsg === 'string' && responseMsg.trim().length > 0
              ? responseMsg
              : 'تعذر إتمام الإجراء المطلوب. يرجى المحاولة لاحقاً.'
          dialogService.alert('خطأ', errorMsg)
        }
      }
    }

    if (action.requiresConfirm) {
      dialogService.confirm(
        action.confirmTitle ?? 'تأكيد الإجراء',
        action.confirmMessage ?? 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
        execute,
        action.confirmLabel ?? 'تأكيد',
        'إلغاء',
        action.tone === 'danger'
      )
    } else {
      await execute()
    }
  }

  // Contact availability mode (optimistic display respecting whatsappEnabled & status)
  const getContactAvailability = (): ContactAvailability => {
    if (!vm || isOwner || vm.status === 'SOLD' || vm.status === 'ARCHIVED' || vm.status === 'SUSPENDED') {
      return { mode: 'hidden' }
    }
    if (!vm.whatsappEnabled) {
      return { mode: 'noWhatsapp' }
    }
    return { mode: 'full' }
  }

  const contactAvailability = getContactAvailability()

  // Filter specs sections by in-page search query (D-093 Item 3)
  const filteredSpecsSections = useMemo(() => {
    if (!vm) return []
    return filterSpecsSections(vm.specsSections, searchQuery)
  }, [vm, searchQuery])

  // Non-ready states render DetailStates directly
  if (state !== 'ready' || !vm) {
    return (
      <View style={s.rootContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} translucent />
        <DetailStates
          kind={state === 'ready' ? 'loading' : state}
          onRetry={refetch}
          onBack={goBackSafely}
        />
      </View>
    )
  }

  return (
    <View style={s.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} translucent />

      {/* Fixed Top Bar in normal layout flow */}
      <DetailTopBar
        onBack={goBackSafely}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        onShare={shareListing.share}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        placeholder="ابحث في تفاصيل السيارة..."
      />

      {/* Main Content ScrollView */}
      <Animated.ScrollView
        testID="car-detail-scroll-view"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingBottom:
              (!isOwner && contactAvailability.mode !== 'hidden') || isOwner ? 90 : 40,
          },
        ]}
      >
        {/* 1. Image Gallery */}
        <Animated.View style={heroParallaxStyle}>
          <ImageGallery
            images={vm.images}
            index={galleryIndex}
            onIndexChange={setGalleryIndex}
            onPressImage={(idx) => {
              setGalleryIndex(idx)
              setIsViewerOpen(true)
            }}
          />
        </Animated.View>

        {/* 2. Listing Header Block */}
        <Animated.View entering={getEnteringAnimation(1)}>
          <ListingHeaderBlock
            title={vm.title}
            kindLabel={
              vm.listingType === 'SALE'
                ? 'للبيع'
                : vm.listingType === 'RENTAL'
                ? 'للإيجار'
                : 'مطلوب للشراء'
            }
            conditionLabel={vm.conditionLabel}
            price={vm.price}
            locationText={vm.location.fullLocationText}
            postedAtLabel={vm.postedAtLabel}
            statusBadge={
              vm.status === 'SOLD'
                ? { label: 'تم البيع', tone: 'danger' }
                : vm.status === 'RENTED'
                ? { label: 'تم التأجير', tone: 'warning' }
                : vm.status === 'ARCHIVED'
                ? { label: 'مؤرشف', tone: 'neutral' }
                : undefined
            }
          />
        </Animated.View>

        {/* Inline Contact Actions (when not owner) */}
        {!isOwner && contactAvailability.mode !== 'hidden' ? (
          <Animated.View entering={getEnteringAnimation(2)}>
            <ContactActions
              variant="inline"
              availability={contactAvailability}
              busy={contact.busy}
              onCall={contact.call}
              onWhatsApp={contact.whatsApp}
              onChat={contact.chat}
            />
          </Animated.View>
        ) : null}

        {/* 5. Seller Card (when not owner) */}
        {!isOwner ? (
          <Animated.View entering={getEnteringAnimation(3)}>
            <SellerCard seller={vm.seller} onPressProfile={handleProfilePress} />
          </Animated.View>
        ) : null}

        {/* 6. Listing Description */}
        <Animated.View entering={getEnteringAnimation(4)}>
          <ListingDescription text={vm.description} collapsedLines={5} />
        </Animated.View>

        {/* 7. Specs Sections (filtered by section search, D-093 Item 3) */}
        <Animated.View entering={getEnteringAnimation(5)}>
          {searchQuery.trim() && filteredSpecsSections.length === 0 ? (
            <View style={s.noMatchContainer} testID="specs-no-match">
              <Text style={s.noMatchText}>لا توجد نتائج مطابقة</Text>
            </View>
          ) : (
            <SpecsSections sections={filteredSpecsSections} />
          )}
        </Animated.View>

        {/* 7b. Location Map (only when the listing has coordinates, D-29) */}
        {vm.location.hasCoordinates &&
        vm.location.latitude !== undefined &&
        vm.location.longitude !== undefined ? (
          <Animated.View entering={getEnteringAnimation(6)} style={s.mapSection}>
            <Text style={s.mapSectionTitle}>الموقع والعنوان</Text>
            <View style={s.mapContainer}>
              {isMapMounted ? (
                <>
                  <MapView
                    style={{ width: '100%', height: '100%' }}
                    initialRegion={{
                      latitude: vm.location.latitude,
                      longitude: vm.location.longitude,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: vm.location.latitude,
                        longitude: vm.location.longitude,
                      }}
                    />
                  </MapView>
                  {/* Overlay to prevent accidental touches capturing scroll */}
                  <View style={StyleSheet.absoluteFill} />
                </>
              ) : (
                <View style={s.mapPlaceholder}>
                  <Ionicons name="location-outline" size={32} color={Colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={s.directionsBtn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="الحصول على الاتجاهات"
              onPress={() => {
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${vm.location.latitude},${vm.location.longitude}`
                )
              }}
            >
              <Ionicons name="navigate-circle-outline" size={24} color={Colors.primary} />
              <Text style={s.directionsTxt}>الحصول على الاتجاهات</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {/* 8. Similar Listings Grid (paginated vertical grid, RTL-safe) */}
        <Animated.View entering={getEnteringAnimation(7)}>
          <SimilarListingsGrid<SimilarCarItem>
            items={similarListings.items}
            isLoading={similarListings.isLoading}
            isError={similarListings.isError}
            onRetry={similarListings.refetch}
            page={similarPage}
            pageCount={1}
            onPageChange={setSimilarPage}
            renderItem={(car) => (
              <TouchableOpacity
                key={car.id}
                style={s.similarCard}
                onPress={() => router.push(`/cars/${car.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={s.similarCardImagePlaceholder}>
                  {car.images?.[0]?.url ? (
                    <Image
                      source={{ uri: car.images[0].url }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons
                      name="car-sport"
                      size={28}
                      color={Colors.primaryLight}
                    />
                  )}
                </View>
                <Text style={s.similarCardTitle} numberOfLines={2}>
                  {car.title}
                </Text>
                <Text style={s.similarCardPrice}>
                  {formatSimilarListingPrice(car)}
                </Text>
                <Text style={s.similarCardMeta}>
                  {car.governorate ?? car.city ?? ''}
                </Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>

        {/* 9. Safety Tips */}
        <Animated.View entering={getEnteringAnimation(8)}>
          <SafetyTips
            role={isOwner ? 'seller' : 'buyer'}
            title={isOwner ? SELLER_SAFETY_TIPS_TITLE : BUYER_SAFETY_TIPS_TITLE}
            tips={isOwner ? SELLER_SAFETY_TIPS : BUYER_SAFETY_TIPS}
          />
        </Animated.View>

        {/* 10. Support Button */}
        <Animated.View entering={getEnteringAnimation(9)}>
          <SupportButton onPress={handleSupportPress} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Sticky Contact Actions Bar (when buyer & contact available, scroll-aware) */}
      {!isOwner && contactAvailability.mode !== 'hidden' ? (
        <ContactActions
          variant="sticky"
          availability={contactAvailability}
          busy={contact.busy}
          onCall={contact.call}
          onWhatsApp={contact.whatsApp}
          onChat={contact.chat}
          scrollY={scrollY}
          threshold={320}
        />
      ) : null}

      {/* Sticky Owner Manage Bar (when owner, scroll-aware) */}
      {isOwner ? (
        <OwnerManageBar
          variant="sticky"
          viewCount={ownerActions.viewCount}
          busy={ownerActions.busy}
          actions={ownerActions.actions}
          onAction={handleOwnerAction}
          scrollY={scrollY}
          threshold={320}
        />
      ) : null}

      {/* Fullscreen Photo Viewer Modal */}
      <ImageViewerModal
        visible={isViewerOpen}
        images={vm.images}
        initialIndex={galleryIndex}
        onClose={() => setIsViewerOpen(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    gap: Spacing.space2,
  },
  mapSection: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  mapSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space3,
  },
  mapContainer: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.paleMint,
    paddingVertical: Spacing.space3,
    minHeight: Spacing.touch,
    borderRadius: Radius.md,
    marginTop: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directionsTxt: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    fontSize: 14,
    lineHeight: lineHeightFor(14),
  },
  similarCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  similarCardImagePlaceholder: {
    height: 88,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
    overflow: 'hidden',
  },
  similarCardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space1,
  },
  similarCardPrice: {
    ...RTLText,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.primary,
    textAlign: 'left',
  },
  similarCardMeta: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'left',
    marginTop: 2,
  },
  noMatchContainer: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space3,
    padding: Spacing.space4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  noMatchText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})

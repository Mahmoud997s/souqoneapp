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
import { useAuthStore } from '../../store/authStore'
import { useBusWizardStore } from '../../store/busWizardStore'
import { dialogService } from '../../store/dialogStore'

// Hooks & Utilities
import { useBusDetail } from '../../hooks/listing-detail/useBusDetail'
import { useDetailRefresh } from '../../hooks/listing-detail/useDetailRefresh'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useShareListing } from '../../hooks/listing-detail/useShareListing'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { useRequireAuth } from '../../hooks/listing-detail/useRequireAuth'
import {
  useBusOwnerActions,
  isOptimisticLockError,
} from '../../hooks/listing-detail/useBusOwnerActions'
import {
  useBusSimilarListings,
  type SimilarBusItem,
} from '../../hooks/listing-detail/useBusSimilarListings'
import { busListingToFormData } from '../../utils/listing-detail/busListingToFormData'
import { translateBusOwnerError } from '../../utils/listing-detail/busOwnerErrors'
import { OWNER_ACTION_SUCCESS_MESSAGE } from '../../utils/listing-detail/ownerActionMatrix'
import { formatSimilarListingPrice } from '../../utils/listing-detail/formatSimilarListingPrice'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import {
  BUYER_SAFETY_TIPS_TITLE,
  SELLER_SAFETY_TIPS_TITLE,
  BUS_BUYER_SAFETY_TIPS,
  BUS_SELLER_SAFETY_TIPS,
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
import { BusContractSection } from '../../components/buses/detail/BusContractSection'
import { BusLocationMapSection } from '../../components/buses/detail/BusLocationMapSection'
import { SimilarListingsGrid } from '../../components/listing-detail/SimilarListingsGrid'
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import { DetailStates } from '../../components/listing-detail/DetailStates'
import { StaleDataBanner } from '../../components/listing-detail/StaleDataBanner'
import { getDetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'

import type { BusDetailViewModel } from '../../types/busDetailViewModel.types'

const DUMMY_VM: BusDetailViewModel = {
  id: '',
  version: 1,
  status: 'ACTIVE',
  title: '',
  description: '',
  listingType: 'SALE',
  busListingType: 'BUS_SALE',
  busTypeLabel: '',
  price: {
    amount: 0,
    formattedAmount: '0',
    currency: 'ر.ع',
    fullPriceLabel: '0 ر.ع',
    isNegotiable: false,
    listingType: 'BUS_SALE',
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
  contract: { access: 'hidden' },
}

export interface BusDetailScreenProps {
  id: string
}

/**
 * BusDetailScreen
 * Real-data container screen for bus and transport listings.
 * Connects useBusDetail and bus foundation hooks to listing-detail presentational components.
 */
export function BusDetailScreen({ id }: BusDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()
  const { requireAuth } = useRequireAuth()

  // 1. Data Query
  const { state, vm, raw, refetch, isRefetchError, error } = useBusDetail(id)
  const { refreshing, onRefresh } = useDetailRefresh(refetch)

  // 2. Viewer & Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. Foundation Hooks (called unconditionally at top level)
  const currentVm = vm ?? DUMMY_VM
  const favoriteToggle = useFavoriteToggle('BUS_LISTING', id, false, { redirectPath: `/buses/${id}` })
  const shareListing = useShareListing(currentVm, { shareTitle: vm?.title ?? 'إعلان حافلة' })
  const contact = useListingContact('BUS_LISTING', id, `/buses/${id}`, vm?.title)
  const ownerActions = useBusOwnerActions(currentVm)
  const similarListings = useBusSimilarListings(id)

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
      pathname: '/buses/browse' as any,
      params: { search: text },
    })
  }

  const handleProfilePress = (sellerId: string) => {
    router.push(`/profile/${sellerId}` as any)
  }

  const handleSupportPress = () => {
    Linking.openURL(SUPPORT_MAILTO).catch(() => {})
  }

  const handleRequireLogin = () => {
    requireAuth(`/buses/${id}`, () => {})
  }

  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      if (raw) {
        const formData = busListingToFormData(raw)
        useBusWizardStore.getState().setEditMode(raw.id, formData, raw.version)
        router.push('/buses/new' as any)
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
          dialogService.alert('تعارض في البيانات', translateBusOwnerError(err))
        } else {
          dialogService.alert('خطأ', translateBusOwnerError(err))
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

  // Filter specs sections by search query if present
  const filteredSpecsSections = useMemo(() => {
    if (!vm) return []
    if (!searchQuery.trim()) return vm.specsSections
    const q = searchQuery.trim().toLowerCase()
    return vm.specsSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.value.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [vm, searchQuery])

  // Non-ready states render DetailStates directly
  if (state !== 'ready' || !vm) {
    const errorKind = getDetailErrorKind(error)
    const kind =
      state === 'loading'
        ? 'loading'
        : state === 'notFound' || errorKind === 'notFound'
        ? 'notFound'
        : errorKind === 'unknown'
        ? 'error'
        : errorKind

    return (
      <View style={s.rootContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} translucent />
        <DetailStates
          kind={kind}
          onRetry={refetch}
          onBack={goBackSafely}
        />
      </View>
    )
  }

  const kindLabel =
    vm.busListingType === 'BUS_SALE'
      ? 'للبيع'
      : vm.busListingType === 'BUS_RENT'
      ? 'للإيجار'
      : 'بيع مع عقد'

  return (
    <View style={s.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} translucent />

      {/* Fixed Top Bar in normal layout flow */}
      <DetailTopBar
        onBack={goBackSafely}
        onShare={shareListing.share}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        placeholder="ابحث في تفاصيل الحافلة..."
      />

      {/* Pinned Stale Data Banner directly below top bar */}
      {isRefetchError && (
        <StaleDataBanner
          onRetry={refetch}
          isRefetching={refreshing}
        />
      )}

      {/* Main Content ScrollView */}
      <Animated.ScrollView
        testID="bus-detail-scroll-view"
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
            category="buses"
          />
        </Animated.View>

        {/* 2. Listing Header Block */}
        <Animated.View entering={getEnteringAnimation(1)}>
          <ListingHeaderBlock
            title={vm.title}
            kindLabel={kindLabel}
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

        {/* 3. Inline Contact Actions (when not owner) */}
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

        {/* 7. Specs Sections (filtered by section search) */}
        <Animated.View entering={getEnteringAnimation(5)}>
          <SpecsSections sections={filteredSpecsSections} />
        </Animated.View>

        {/* 8. Bus Commercial Contract Section */}
        <Animated.View entering={getEnteringAnimation(6)}>
          <BusContractSection
            contract={vm.contract}
            price={vm.price}
            busListingType={vm.busListingType}
            onRequireLogin={handleRequireLogin}
          />
        </Animated.View>

        {/* 9. Location Map (only when the listing has coordinates) */}
        {vm.location.hasCoordinates &&
        vm.location.latitude !== undefined &&
        vm.location.longitude !== undefined ? (
          <Animated.View entering={getEnteringAnimation(7)}>
            <BusLocationMapSection
              latitude={vm.location.latitude}
              longitude={vm.location.longitude}
              isMapMounted={isMapMounted}
            />
          </Animated.View>
        ) : null}

        {/* 10. Similar Listings Grid */}
        <Animated.View entering={getEnteringAnimation(8)}>
          <SimilarListingsGrid<SimilarBusItem>
            items={similarListings.items}
            isLoading={similarListings.isLoading}
            isError={similarListings.isError}
            onRetry={similarListings.refetch}
            page={similarPage}
            pageCount={1}
            onPageChange={setSimilarPage}
            renderItem={(bus) => {
              const rawImg = bus.images?.[0]
              const imgUri = typeof rawImg === 'string' ? rawImg : rawImg?.url
              return (
                <TouchableOpacity
                  key={bus.id}
                  style={s.similarCard}
                  onPress={() => router.push(`/buses/${bus.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={s.similarCardImagePlaceholder}>
                    {imgUri ? (
                      <Image
                        source={{ uri: imgUri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons
                        name="bus-outline"
                        size={28}
                        color={Colors.primaryLight}
                      />
                    )}
                  </View>
                  <Text style={s.similarCardTitle} numberOfLines={2}>
                    {bus.title}
                  </Text>
                  <Text style={s.similarCardPrice}>
                    {formatSimilarListingPrice(bus)}
                  </Text>
                  <Text style={s.similarCardMeta}>
                    {bus.governorateNameAr ?? ''}
                  </Text>
                </TouchableOpacity>
              )
            }}
          />
        </Animated.View>

        {/* 11. Safety Tips */}
        <Animated.View entering={getEnteringAnimation(9)}>
          <SafetyTips
            role={isOwner ? 'seller' : 'buyer'}
            title={isOwner ? SELLER_SAFETY_TIPS_TITLE : BUYER_SAFETY_TIPS_TITLE}
            tips={isOwner ? BUS_SELLER_SAFETY_TIPS : BUS_BUYER_SAFETY_TIPS}
          />
        </Animated.View>

        {/* 12. Support Button */}
        <Animated.View entering={getEnteringAnimation(10)}>
          <SupportButton onPress={handleSupportPress} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Sticky Contact Actions Bar (when buyer & contact available) */}
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

      {/* Sticky Owner Manage Bar (when owner) */}
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
        category="buses"
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
})
